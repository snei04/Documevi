// Archivo: backend/src/controllers/subserie.controller.js
const pool = require('../config/db');

// Obtener todas las subseries
exports.getAllSubseries = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ss.*, s.nombre_serie 
      FROM trd_subseries ss
      JOIN trd_series s ON ss.id_serie = s.id
      ORDER BY s.nombre_serie, ss.nombre_subserie ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear una nueva subserie
exports.createSubserie = async (req, res) => {
  const { 
    id_serie, 
    codigo_subserie, 
    nombre_subserie,
    retencion_gestion,
    retencion_central,
    disposicion_final,
    procedimientos 
  } = req.body;

  if (!id_serie || !codigo_subserie || !nombre_subserie) {
    return res.status(400).json({ msg: 'Serie, código y nombre son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO trd_subseries (id_serie, codigo_subserie, nombre_subserie, retencion_gestion, retencion_central, disposicion_final, procedimientos) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_serie, codigo_subserie, nombre_subserie, retencion_gestion, retencion_central, disposicion_final, procedimientos]
    );
    res.status(201).json({
      id: result.insertId,
      ...req.body
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El código de la subserie ya existe para esa serie.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};