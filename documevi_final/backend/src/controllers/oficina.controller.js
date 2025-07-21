const pool = require('../config/db');

// Obtener todas las oficinas
exports.getAllOficinas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, d.nombre_dependencia 
      FROM oficinas_productoras o
      JOIN dependencias d ON o.id_dependencia = d.id
      ORDER BY d.nombre_dependencia, o.nombre_oficina ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear una nueva oficina
exports.createOficina = async (req, res) => {
  const { id_dependencia, codigo_oficina, nombre_oficina } = req.body;

  if (!id_dependencia || !codigo_oficina || !nombre_oficina) {
    return res.status(400).json({ msg: 'Todos los campos son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO oficinas_productoras (id_dependencia, codigo_oficina, nombre_oficina) VALUES (?, ?, ?)',
      [id_dependencia, codigo_oficina, nombre_oficina]
    );
    res.status(201).json({
      id: result.insertId,
      id_dependencia,
      codigo_oficina,
      nombre_oficina
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'El código de la oficina ya existe.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};