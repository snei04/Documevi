const pool = require('../config/db');

// --- GESTIÓN DE PERMISOS INDIVIDUALES ---

exports.getAllPermissions = async (req, res) => {
    try {
        const [permissions] = await pool.query('SELECT id, nombre_permiso, descripcion, grupo FROM permisos ORDER BY grupo, nombre_permiso ASC');
        res.json(permissions);
    } catch (error) {
        console.error("Error en getAllPermissions:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.createPermiso = async (req, res) => {
    const { nombre_permiso, descripcion } = req.body;
    if (!nombre_permiso) {
        return res.status(400).json({ msg: 'El nombre del permiso es obligatorio.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO permisos (nombre_permiso, descripcion) VALUES (?, ?)',
            [nombre_permiso, descripcion || null]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error("Error en createPermiso:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

exports.updatePermiso = async (req, res) => {
    const { id } = req.params;
    const { nombre_permiso, descripcion } = req.body;
    if (!nombre_permiso) {
        return res.status(400).json({ msg: 'El nombre del permiso es obligatorio.' });
    }
    try {
        const [result] = await pool.query(
            'UPDATE permisos SET nombre_permiso = ?, descripcion = ? WHERE id = ?',
            [nombre_permiso, descripcion || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Permiso no encontrado.' });
        }
        res.json({ msg: 'Permiso actualizado con éxito.' });
    } catch (error) {
        console.error("Error en updatePermiso:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};


// --- GESTIÓN DE PERMISOS POR ROL ---

exports.getRolePermissions = async (req, res) => {
    const { id_rol } = req.params;
    try {
        const [permissions] = await pool.query(
            `SELECT p.id FROM rol_permisos rp JOIN permisos p ON rp.id_permiso = p.id WHERE rp.id_rol = ?`,
            [id_rol]
        );
        res.json(permissions.map(p => p.id));
    } catch (error) {
        console.error("Error en getRolePermissions:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.updateRolePermissions = async (req, res) => {
    const { id_rol } = req.params;
    const { permisosIds } = req.body;
    if (!Array.isArray(permisosIds)) {
        return res.status(400).json({ msg: 'Se esperaba un array de IDs de permisos.' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM rol_permisos WHERE id_rol = ?', [id_rol]);
        if (permisosIds.length > 0) {
            const values = permisosIds.map(id_permiso => [id_rol, id_permiso]);
            await connection.query('INSERT INTO rol_permisos (id_rol, id_permiso) VALUES ?', [values]);
        }
        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [req.user.id, 'ACTUALIZACION_PERMISOS', `Se modificaron los permisos para el rol con ID: ${id_rol}`]
        );
        await connection.commit();
        res.json({ msg: 'Permisos del rol actualizados con éxito.' });
    } catch (error) {
        await connection.rollback();
        console.error("Error al actualizar permisos:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        connection.release();
    }
};


// --- CONSTRUCCIÓN DE ÁRBOL DE PERMISOS ---
exports.getPermissionsTree = async (req, res) => {
    try {
        const [permisos] = await pool.query('SELECT id, nombre_permiso, descripcion, grupo FROM permisos ORDER BY grupo, id');

        // 1. Agrupamos todos los permisos por su 'grupo'
        const grupos = permisos.reduce((acc, permiso) => {
            const grupo = permiso.grupo || 'General';
            if (!acc[grupo]) {
                acc[grupo] = [];
            }
            acc[grupo].push(permiso);
            return acc;
        }, {});

        // 2. Transformamos cada grupo a la estructura de árbol
        const treeChildren = Object.entries(grupos).map(([nombreGrupo, permisosDelGrupo]) => {
            
            // Dentro de cada grupo, agrupamos por 'módulo' (ej: 'usuarios' de 'usuarios_ver')
            const modulos = permisosDelGrupo.reduce((acc, p) => {
                const [modulo, ...accionArray] = p.nombre_permiso.split('_');
                const accion = accionArray.join('_');

                if (!acc[modulo]) {
                    acc[modulo] = {
                        id: modulo,
                        name: modulo.charAt(0).toUpperCase() + modulo.slice(1),
                        icon: '📄',
                        permissions: {} // Objeto para las acciones (ver, crear, editar...)
                    };
                }
                
                // Añadimos cada acción al objeto de permisos del módulo
                acc[modulo].permissions[accion] = { id: p.id, enabled: false, descripcion: p.descripcion };
                return acc;
            }, {});

            // Devolvemos el nodo "padre" del grupo (ej: 'Administración')
            return {
                id: nombreGrupo.toLowerCase().replace(/ /g, '_'),
                name: nombreGrupo,
                icon: '📁',
                expanded: false,
                children: Object.values(modulos) // Los hijos de un grupo son los módulos
            };
        });

        // 3. Creamos la estructura raíz final
        const treeStructure = {
            id: 'root',
            name: 'Sistema Documental',
            children: treeChildren
        };

        res.json(treeStructure);

    } catch (error) {
        console.error("Error al construir el árbol de permisos:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};