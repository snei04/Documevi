// Archivo: backend/src/controllers/permiso.controller.js
const pool = require('../config/db');

// Obtener todos los permisos disponibles
exports.getAllPermissions = async (req, res) => {
  try {
    const [permissions] = await pool.query('SELECT * FROM permisos ORDER BY nombre_permiso ASC');
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Obtener los permisos de un rol específico
exports.getRolePermissions = async (req, res) => {
  const { id_rol } = req.params;
  try {
    const [permissions] = await pool.query(
      `SELECT p.id, p.nombre_permiso 
       FROM rol_permisos rp 
       JOIN permisos p ON rp.id_permiso = p.id 
       WHERE rp.id_rol = ?`,
      [id_rol]
    );
    res.json(permissions.map(p => p.id)); // Devolvemos solo un array de IDs [1, 3, 5]
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Actualizar los permisos de un rol
exports.updateRolePermissions = async (req, res) => {
  const { id_rol } = req.params;
  const { permisosIds } = req.body; // Esperamos un array de IDs de permisos [1, 3, 5]

  if (!Array.isArray(permisosIds)) {
    return res.status(400).json({ msg: 'Se esperaba un array de IDs de permisos.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Borramos todos los permisos actuales del rol
    await connection.query('DELETE FROM rol_permisos WHERE id_rol = ?', [id_rol]);

    // 2. Si hay nuevos permisos, los insertamos
    if (permisosIds.length > 0) {
      const values = permisosIds.map(id_permiso => [id_rol, id_permiso]);
      await connection.query('INSERT INTO rol_permisos (id_rol, id_permiso) VALUES ?', [values]);
    }

    await connection.commit();
    res.json({ msg: 'Permisos del rol actualizados con éxito.' });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar permisos:", error);
    res.status(500).json({ msg: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};