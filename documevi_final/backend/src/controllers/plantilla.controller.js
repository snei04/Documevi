const pool = require('../config/db');

// Obtener todas las plantillas
exports.getAllPlantillas = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                COALESCE(
                    (SELECT 
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', pc.id,
                                'nombre_campo', pc.nombre_campo,
                                'tipo_campo', pc.tipo_campo,
                                'orden', pc.orden
                            )
                        )
                    FROM plantilla_campos pc
                    WHERE pc.id_plantilla = p.id),
                    JSON_ARRAY()
                ) AS campos
            FROM 
                plantillas p
            ORDER BY 
                p.nombre ASC;
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener plantillas con campos:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Crear una nueva plantilla
exports.createPlantilla = async (req, res) => {
    const { nombre, descripcion, id_oficina_productora, id_serie, id_subserie } = req.body;

    if (!nombre || !id_oficina_productora || !id_serie || !id_subserie) {
        return res.status(400).json({ msg: 'Todos los campos son obligatorios: nombre, oficina, serie y subserie.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO plantillas (nombre, descripcion, id_oficina_productora, id_serie, id_subserie) VALUES (?, ?, ?, ?, ?)',
            [nombre, descripcion, id_oficina_productora, id_serie, id_subserie]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'Ya existe una plantilla con ese nombre.' });
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Obtener una plantilla específica con todos sus campos
exports.getPlantillaWithCampos = async (req, res) => {
    const { id } = req.params;
    try {
        const [plantillas] = await pool.query('SELECT * FROM plantillas WHERE id = ?', [id]);
        if (plantillas.length === 0) {
            return res.status(404).json({ msg: 'Plantilla no encontrada.' });
        }
        const [campos] = await pool.query('SELECT * FROM plantilla_campos WHERE id_plantilla = ? ORDER BY orden ASC', [id]);

        res.json({
            ...plantillas[0],
            campos: campos
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Añadir un nuevo campo a una plantilla
exports.addCampoToPlantilla = async (req, res) => {
    const { id: id_plantilla } = req.params;
    const { nombre_campo, tipo_campo, orden } = req.body;
    if (!nombre_campo || !tipo_campo || !orden) {
        return res.status(400).json({ msg: 'Nombre, tipo y orden del campo son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO plantilla_campos (id_plantilla, nombre_campo, tipo_campo, orden) VALUES (?, ?, ?, ?)',
            [id_plantilla, nombre_campo, tipo_campo, orden]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ msg: 'Error al añadir el campo a la plantilla' });
    }
};

exports.uploadBackgroundImage = async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).send({ msg: 'No se subió ningún archivo.' });
    }

    // req.file.path es la ruta donde multer guardó el archivo (ej: 'uploads/imagen.png')
    const imagePath = req.file.path;

    try {
        await pool.query(
            'UPDATE plantillas SET background_image_path = ? WHERE id = ?',
            [imagePath, id]
        );
        res.json({ msg: 'Imagen de fondo actualizada.', filePath: imagePath });
    } catch (error) {
        console.error("Error al guardar la ruta de la imagen:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

// Obtener una plantilla por su ID (sin campos)
exports.getPlantillaById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM plantillas WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Plantilla no encontrada.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener la plantilla:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

// Obtener las variables (campos) disponibles para una plantilla
exports.getVariablesDisponibles = async (req, res) => {
    // Obtenemos el ID de la plantilla desde los parámetros de la URL
    const { id: id_plantilla } = req.params;

    try {
        // Buscamos en la tabla `plantilla_campos` todos los campos de esa plantilla
        const [campos] = await pool.query(
            // Seleccionamos el nombre del campo y lo devolvemos con los alias "id" y "label"
            // para que el frontend no necesite cambios.
            'SELECT nombre_campo as id, nombre_campo as label FROM plantilla_campos WHERE id_plantilla = ?',
            [id_plantilla]
        );

        // Devolvemos los campos encontrados
        res.json(campos);

    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor al obtener variables', error: error.message });
    }
};

// Actualizar el diseño JSON de una plantilla
exports.updateDisenoPlantilla = async (req, res) => {
    const { id } = req.params;
    const disenoData = req.body;

    if (!disenoData || Object.keys(disenoData).length === 0) {
        return res.status(400).json({ msg: 'No se proporcionó un diseño.' });
    }

    try {
        console.log('💾 Guardando diseño para plantilla:', id);
        console.log('📊 Estructura recibida:', Object.keys(disenoData));
        console.log('🧩 Components count:', disenoData.components?.length || 0);

        const disenoString = JSON.stringify(disenoData);
        const [result] = await pool.query(
            'UPDATE plantillas SET diseño_json = ? WHERE id = ?',
            [disenoString, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'No se encontró la plantilla con ese ID.' });
        }

        res.json({
            msg: 'Diseño de la plantilla guardado con éxito.',
            components_saved: disenoData.components?.length || 0
        });
    } catch (error) {
        console.error("❌ Error al guardar diseño en la BD:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};


// ============================================
// EDICIÓN Y ELIMINACIÓN DE PLANTILLAS
// ============================================

/**
 * Actualiza nombre y descripción de una plantilla.
 */
exports.updatePlantilla = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ msg: 'El nombre de la plantilla es obligatorio.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE plantillas SET nombre = ?, descripcion = ? WHERE id = ?',
            [nombre, descripcion || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Plantilla no encontrada.' });
        }
        res.json({ id: parseInt(id), nombre, descripcion });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'Ya existe una plantilla con ese nombre.' });
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Elimina una plantilla y todos sus campos (CASCADE).
 */
exports.deletePlantilla = async (req, res) => {
    const { id } = req.params;
    try {
        // Eliminar campos primero, luego la plantilla
        await pool.query('DELETE FROM plantilla_campos WHERE id_plantilla = ?', [id]);
        const [result] = await pool.query('DELETE FROM plantillas WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Plantilla no encontrada.' });
        }
        res.json({ msg: 'Plantilla eliminada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};


// ============================================
// EDICIÓN Y ELIMINACIÓN DE CAMPOS DE PLANTILLA
// ============================================

/**
 * Actualiza un campo de una plantilla.
 */
exports.updateCampoPlantilla = async (req, res) => {
    const { id, id_campo } = req.params;
    const { nombre_campo, tipo_campo, orden } = req.body;

    if (!nombre_campo || !tipo_campo || !orden) {
        return res.status(400).json({ msg: 'Nombre, tipo y orden del campo son obligatorios.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE plantilla_campos SET nombre_campo = ?, tipo_campo = ?, orden = ? WHERE id = ? AND id_plantilla = ?',
            [nombre_campo, tipo_campo, orden, id_campo, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Campo no encontrado.' });
        }
        res.json({ id: parseInt(id_campo), nombre_campo, tipo_campo, orden });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Elimina un campo de una plantilla.
 */
exports.deleteCampoPlantilla = async (req, res) => {
    const { id, id_campo } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM plantilla_campos WHERE id = ? AND id_plantilla = ?',
            [id_campo, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Campo no encontrado.' });
        }
        res.json({ msg: 'Campo eliminado con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};