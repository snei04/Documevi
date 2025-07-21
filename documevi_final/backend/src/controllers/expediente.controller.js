// Archivo: backend/src/controllers/expediente.controller.js
const pool = require('../config/db');

// Obtener todos los expedientes
exports.getAllExpedientes = async (req, res) => {
  try {
    // Unimos con otras tablas para obtener más contexto
    const [rows] = await pool.query(`
      SELECT 
        e.*, 
        s.nombre_serie, 
        ss.nombre_subserie,
        u.nombre_completo as nombre_responsable
      FROM expedientes e
      JOIN trd_series s ON e.id_serie = s.id
      JOIN trd_subseries ss ON e.id_subserie = ss.id
      JOIN usuarios u ON e.id_usuario_responsable = u.id
      ORDER BY e.fecha_apertura DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear un nuevo expediente
exports.createExpediente = async (req, res) => {
  const {
    nombre_expediente,
    id_serie,
    id_subserie,
    descriptor_1,
    descriptor_2
  } = req.body;

  // El usuario responsable es el que está logueado
  const id_usuario_responsable = req.user.id;

  if (!nombre_expediente || !id_serie || !id_subserie) {
    return res.status(400).json({ msg: 'Nombre, serie y subserie son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO expedientes (nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, id_usuario_responsable)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, id_usuario_responsable]
    );
    res.status(201).json({
      id: result.insertId,
      ...req.body,
      id_usuario_responsable
    });
  } catch (error) {
    console.error("Error al crear expediente:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};