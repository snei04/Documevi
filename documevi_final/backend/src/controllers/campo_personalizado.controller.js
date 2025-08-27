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

// (Aquí irían funciones para actualizar y eliminar campos)