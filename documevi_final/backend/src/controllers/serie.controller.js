// En src/controllers/serie.controller.js
const pool = require('../config/db');

// Obtiene todas las series y las ordena por estado
exports.getAllSeries = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, o.nombre_oficina 
            FROM trd_series s
            LEFT JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
            ORDER BY s.activo DESC, s.nombre_serie ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Crea una nueva serie
exports.createSerie = async (req, res) => {
    // Añadimos 'requiere_subserie'
    const { nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie } = req.body;
    
    if (!nombre_serie || !codigo_serie || !id_oficina_productora) {
        return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            // Añadimos la nueva columna a la consulta
            'INSERT INTO trd_series (nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie) VALUES (?, ?, ?, ?)',
            [nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Edita una serie existente
exports.updateSerie = async (req, res) => {
    const { id } = req.params;
    // Añadimos 'requiere_subserie'
    const { nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie } = req.body;

    if (!nombre_serie || !codigo_serie || !id_oficina_productora) {
        return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            // Añadimos la nueva columna a la consulta
            'UPDATE trd_series SET nombre_serie = ?, codigo_serie = ?, id_oficina_productora = ?, requiere_subserie = ? WHERE id = ?',
            [nombre_serie, codigo_serie, id_oficina_productora, requiere_subserie, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Serie no encontrada.' });
        }
        res.json({ msg: 'Serie actualizada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Activa o desactiva una serie
exports.toggleSerieStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE trd_series SET activo = NOT activo WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Serie no encontrada.' });
        }
        res.json({ msg: 'Estado de la serie actualizado con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};