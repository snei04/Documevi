// Archivo: backend/src/controllers/serie.controller.js
const pool = require('../config/db');

// Obtener todas las series documentales
exports.getAllSeries = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, o.nombre_oficina 
      FROM trd_series s
      JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
      ORDER BY o.nombre_oficina, s.nombre_serie ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear una nueva serie documental
exports.createSerie = async (req, res) => {
  const { id_oficina_productora, codigo_serie, nombre_serie } = req.body;

  if (!id_oficina_productora || !codigo_serie || !nombre_serie) {
    return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO trd_series (id_oficina_productora, codigo_serie, nombre_serie) VALUES (?, ?, ?)',
      [id_oficina_productora, codigo_serie, nombre_serie]
    );
    res.status(201).json({
      id: result.insertId,
      ...req.body
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El código de la serie ya existe para esa oficina.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};