const pool = require('../config/db');

// Obtener los campos personalizados de una oficina
exports.getCamposPorOficina = async (req, res) => {
    const { id_oficina } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM oficina_campos_personalizados WHERE id_oficina = ?', [id_oficina]);
        res.json(rows);
    } catch (error) {
        // CAMBIO 1: Se añade un console.error para ver errores en el backend.
        console.error("Error al obtener campos personalizados:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Crear un nuevo campo personalizado para una oficina
exports.createCampo = async (req, res) => {
    const { id_oficina } = req.params;
    const { nombre_campo, tipo_campo, es_obligatorio } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO oficina_campos_personalizados (id_oficina, nombre_campo, tipo_campo, es_obligatorio) VALUES (?, ?, ?, ?)',
            // CAMBIO 2: Nos aseguramos de que 'es_obligatorio' siempre tenga un valor.
            // Si el frontend no envía nada, se guardará como 'false'.
            [id_oficina, nombre_campo, tipo_campo, es_obligatorio || false]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        // CAMBIO 1 (repetido): Se añade un console.error para ver errores.
        console.error("Error al crear el campo personalizado:", error);
        res.status(500).json({ msg: 'Error al crear el campo' });
    }
};
// Actualizar un campo personalizado
exports.updateCampo = async (req, res) => {
    const { id } = req.params;
    const { nombre_campo, tipo_campo, es_obligatorio } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE oficina_campos_personalizados SET nombre_campo = ?, tipo_campo = ?, es_obligatorio = ? WHERE id = ?',
            [nombre_campo, tipo_campo, es_obligatorio || false, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Campo no encontrado' });
        }
        res.json({ id, ...req.body });
    } catch (error) {
        console.error("Error al actualizar el campo personalizado:", error);
        res.status(500).json({ msg: 'Error al actualizar el campo' });
    }

};
// Eliminar un campo personalizado
exports.deleteCampo = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM oficina_campos_personalizados WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Campo no encontrado' });
        }
        res.json({ msg: 'Campo eliminado' });
    } catch (error) {
        console.error("Error al eliminar el campo personalizado:", error);
        res.status(500).json({ msg: 'Error al eliminar el campo' });
    }
};
