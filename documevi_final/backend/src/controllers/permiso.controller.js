const pool = require('../config/db');

// --- GESTIÓN DE PERMISOS INDIVIDUALES ---

// Obtiene todos los permisos, incluyendo la descripción
exports.getAllPermissions = async (req, res) => {
    try {
        // Modificamos la consulta para que también traiga la descripción
        const [permissions] = await pool.query('SELECT id, nombre_permiso, descripcion FROM permisos ORDER BY nombre_permiso ASC');
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Crea un nuevo permiso con su descripción
exports.createPermiso = async (req, res) => {
    const { nombre_permiso, descripcion } = req.body;
    if (!nombre_permiso) {
        return res.status(400).json({ msg: 'El nombre del permiso es obligatorio.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO permisos (nombre_permiso, descripcion) VALUES (?, ?)',
            [nombre_permiso, descripcion || null] // Guarda null si la descripción viene vacía
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Edita un permiso existente, incluyendo su descripción
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
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};


// --- GESTIÓN DE PERMISOS POR ROL (Tus funciones existentes) ---

// Obtener los permisos de un rol específico
exports.getRolePermissions = async (req, res) => {
    const { id_rol } = req.params;
    try {
        const [permissions] = await pool.query(
            `SELECT p.id, p.nombre_permiso 
             FROM rol_permisos rp 
             JOIN permisos p ON rp.id_permiso = p.id 
             WHERE rp.id_rol = ?`,
            [id_rol]
        );
        res.json(permissions.map(p => p.id));
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Actualizar los permisos de un rol
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


// --- ✅ FUNCIÓN AÑADIDA PARA LA NUEVA INTERFAZ DE ÁRBOL ---
exports.getPermissionsTree = async (req, res) => {
    try {
        const [permisos] = await pool.query('SELECT id, nombre_permiso, descripcion, grupo FROM permisos ORDER BY grupo, nombre_permiso');

        const grupos = permisos.reduce((acc, permiso) => {
            const grupo = permiso.grupo || 'General';
            
            if (!acc[grupo]) {
                acc[grupo] = {
                    id: grupo.toLowerCase().replace(/ /g, '_'),
                    name: grupo,
                    icon: '📁',
                    expanded: false,
                    children: [],
                };
            }

            acc[grupo].children.push({
                id: permiso.id,
                name: permiso.nombre_permiso,
                icon: '📄',
                permissions: { enabled: false }
            });

            return acc;
        }, {});

        const treeStructure = {
            id: 'root',
            name: 'Sistema Documental',
            children: Object.values(grupos)
        };

        res.json(treeStructure);

    } catch (error) {
        console.error("Error al construir el árbol de permisos:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};