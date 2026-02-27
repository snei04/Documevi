const pool = require('../config/db');
const carpetaService = require('../services/carpeta.service');

/**
 * Crea una nueva carpeta con numeración automática incremental por oficina y año.
 * Formato: OFC-{id_oficina}-{año}-{consecutivo}
 */
exports.createCarpeta = async (req, res) => {
    try {
        const resultado = await carpetaService.crearCarpeta(req.body);
        res.status(201).json(resultado);
    } catch (error) {
        console.error("Error al crear carpeta:", error);
        res.status(error.statusCode || 500).json({ msg: error.message || 'Error en el servidor al crear la carpeta.' });
    }
};

/**
 * Obtiene todas las carpetas, opcionalmente filtradas por oficina.
 */
exports.getCarpetas = async (req, res) => {
    try {
        const { id_oficina, estado } = req.query;
        let query = `
            SELECT c.*, o.nombre_oficina
            FROM carpetas c
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

        query += ' ORDER BY c.año DESC, c.consecutivo DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener carpetas:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * Obtiene una carpeta por su ID.
 */
exports.getCarpetaById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT c.*
            FROM carpetas c
            WHERE c.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Carpeta no encontrada.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener carpeta:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};

/**
 * Cierra una carpeta (no permite más documentos).
 */
exports.closeCarpeta = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE carpetas SET estado = ?, fecha_cierre = NOW() WHERE id = ?', ['Cerrada', id]);
        res.json({ msg: 'Carpeta cerrada con éxito.' });
    } catch (error) {
        console.error("Error al cerrar carpeta:", error);
        res.status(500).json({ msg: 'Error en el servidor.' });
    }
};
