const pool = require('../config/db');

exports.getAllRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM roles ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};