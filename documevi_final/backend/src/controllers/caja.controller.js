const pool = require('../config/db');

/**
 * Crea una nueva caja/paquete.
 */
exports.createCaja = async (req, res) => {
    try {
        const { id_oficina, codigo_caja, descripcion, capacidad_carpetas, ubicacion_estante, ubicacion_entrepaño, ubicacion_modulo } = req.body;

        if (!id_oficina || !codigo_caja) {
            return res.status(400).json({ msg: 'Oficina y Código son obligatorios.' });
        }

        const [result] = await pool.query(
            `INSERT INTO cajas (
                id_oficina, codigo_caja, descripcion, capacidad_carpetas, 
                ubicacion_estante, ubicacion_entrepaño, ubicacion_modulo
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id_oficina, codigo_caja, descripcion, capacidad_carpetas || 10,
                ubicacion_estante, ubicacion_entrepaño, ubicacion_modulo
            ]
        );

        res.status(201).json({
            msg: 'Caja creada con éxito.',
            id: result.insertId,
            codigo_caja,
            capacidad_carpetas: capacidad_carpetas || 10
        });

    } catch (error) {
        console.error("Error al crear caja:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'Ya existe una caja con ese código en esta oficina.' });
        }
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * Obtiene todas las cajas, filtro opcional por oficina.
 */
exports.getCajas = async (req, res) => {
    try {
        const { id_oficina, estado } = req.query;
        let query = `
            SELECT c.*, o.nombre_oficina 
            FROM cajas c
            JOIN oficinas_productoras o ON c.id_oficina = o.id
        `;
        const params = [];
        const conditions = [];

        if (id_oficina) {
            conditions.push('c.id_oficina = ?');
            params.push(id_oficina);
        }
        if (estado) {
            conditions.push('c.estado = ?');
            params.push(estado);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY c.codigo_caja ASC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener cajas:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * Obtiene una caja por ID.
 */
exports.getCajaById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM cajas WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Caja no encontrada.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener caja:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * Actualiza una caja.
 */
exports.updateCaja = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, capacidad_carpetas, ubicacion_estante, ubicacion_entrepaño, ubicacion_modulo, estado } = req.body;

        await pool.query(
            `UPDATE cajas SET 
                descripcion = ?, capacidad_carpetas = ?, 
                ubicacion_estante = ?, ubicacion_entrepaño = ?, ubicacion_modulo = ?, 
                estado = ? 
            WHERE id = ?`,
            [descripcion, capacidad_carpetas, ubicacion_estante, ubicacion_entrepaño, ubicacion_modulo, estado, id]
        );

        res.json({ msg: 'Caja actualizada con éxito.' });
    } catch (error) {
        console.error("Error al actualizar caja:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};
