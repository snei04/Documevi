const pool = require('../config/db');

// Obtener todas las subseries
exports.getAllSubseries = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ss.*, s.nombre_serie 
            FROM trd_subseries ss
            LEFT JOIN trd_series s ON ss.id_serie = s.id
            ORDER BY ss.activo DESC, ss.nombre_subserie ASC
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
// Actualizar una subserie existente
exports.updateSubserie = async (req, res) => {
    const { id } = req.params;
    const { nombre_subserie, codigo_subserie, id_serie, retencion_gestion, retencion_central, disposicion_final } = req.body;

    if (!nombre_subserie || !codigo_subserie || !id_serie) {
        return res.status(400).json({ msg: 'Nombre, código y serie son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            'UPDATE trd_subseries SET nombre_subserie = ?, codigo_subserie = ?, id_serie = ?, retencion_gestion = ?, retencion_central = ?, disposicion_final = ? WHERE id = ?',
            [nombre_subserie, codigo_subserie, id_serie, retencion_gestion, retencion_central, disposicion_final, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Subserie no encontrada.' });
        }
        res.json({ msg: 'Subserie actualizada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Activa o desactiva una subserie
exports.toggleSubserieStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE trd_subseries SET activo = NOT activo WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Subserie no encontrada.' });
        }
        res.json({ msg: 'Estado de la subserie actualizado con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};