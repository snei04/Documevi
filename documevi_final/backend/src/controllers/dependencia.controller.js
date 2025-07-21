// Archivo: backend/src/controllers/dependencia.controller.js
const pool = require('../config/db');

// Obtener todas las dependencias
exports.getAllDependencias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dependencias ORDER BY nombre_dependencia ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear una nueva dependencia
exports.createDependencia = async (req, res) => {
  const { codigo_dependencia, nombre_dependencia } = req.body;

  if (!codigo_dependencia || !nombre_dependencia) {
    return res.status(400).json({ msg: 'El código y el nombre son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO dependencias (codigo_dependencia, nombre_dependencia) VALUES (?, ?)',
      [codigo_dependencia, nombre_dependencia]
    );
    res.status(201).json({
      id: result.insertId,
      codigo_dependencia,
      nombre_dependencia
    });
  } catch (error) {
    // Manejar error de código duplicado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El código de la dependencia ya existe.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};