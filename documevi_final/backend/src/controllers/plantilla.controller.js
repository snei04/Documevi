// Archivo: backend/src/controllers/plantilla.controller.js
const pool = require('../config/db');

// Obtener todas las plantillas
exports.getAllPlantillas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM plantillas ORDER BY nombre ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Crear una nueva plantilla
exports.createPlantilla = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) {
    return res.status(400).json({ msg: 'El nombre de la plantilla es obligatorio.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO plantillas (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Ya existe una plantilla con ese nombre.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Obtener una plantilla específica con todos sus campos
exports.getPlantillaWithCampos = async (req, res) => {
    const { id } = req.params;
    try {
        const [plantillas] = await pool.query('SELECT * FROM plantillas WHERE id = ?', [id]);
        if (plantillas.length === 0) {
            return res.status(404).json({ msg: 'Plantilla no encontrada.' });
        }
        const [campos] = await pool.query('SELECT * FROM plantilla_campos WHERE id_plantilla = ? ORDER BY orden ASC', [id]);
        
        res.json({
            ...plantillas[0],
            campos: campos
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Añadir un nuevo campo a una plantilla
exports.addCampoToPlantilla = async (req, res) => {
    const { id: id_plantilla } = req.params;
    const { nombre_campo, tipo_campo, orden } = req.body;
    if (!nombre_campo || !tipo_campo || !orden) {
        return res.status(400).json({ msg: 'Nombre, tipo y orden del campo son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO plantilla_campos (id_plantilla, nombre_campo, tipo_campo, orden) VALUES (?, ?, ?, ?)',
            [id_plantilla, nombre_campo, tipo_campo, orden]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ msg: 'Error al añadir el campo a la plantilla' });
    }
};