const pool = require('../config/db');

// Obtener todos los roles
exports.getAllRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM roles ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};


// Crear un nuevo rol
exports.createRole = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ msg: 'El nombre del rol es obligatorio.' });
  }
  try {
    const [result] = await pool.query('INSERT INTO roles (nombre) VALUES (?)', [nombre]);
    res.status(201).json({ id: result.insertId, nombre });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Ya existe un rol con ese nombre.' });
    }
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Actualizar un rol
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ msg: 'El nombre del rol es obligatorio.' });
  }
  try {
    const [result] = await pool.query('UPDATE roles SET nombre = ? WHERE id = ?', [nombre, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Rol no encontrado.' });
    }
    res.json({ msg: 'Rol actualizado con éxito.' });
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Eliminar un rol
exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    // Verificamos si algún usuario tiene este rol asignado
    const [users] = await pool.query('SELECT COUNT(*) as count FROM usuarios WHERE rol_id = ?', [id]);
    if (users[0].count > 0) {
      return res.status(400).json({ msg: 'No se puede eliminar el rol porque está asignado a uno o más usuarios.' });
    }
    
    const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: 'Rol no encontrado.' });
    }
    res.json({ msg: 'Rol eliminado con éxito.' });
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};