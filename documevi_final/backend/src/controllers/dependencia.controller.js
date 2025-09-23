const pool = require('../config/db');

// Obtener todas las dependencias
exports.getAllDependencias = async (req, res) => {
    try {
        // La consulta ahora trae todas las dependencias pero las ordena por estado y nombre
        const [rows] = await pool.query('SELECT * FROM dependencias ORDER BY activo DESC, nombre_dependencia ASC');
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

// Función para editar una dependencia
exports.updateDependencia = async (req, res) => {
    const { id } = req.params;
    const { nombre_dependencia, codigo_dependencia } = req.body;

    if (!nombre_dependencia || !codigo_dependencia) {
        return res.status(400).json({ msg: 'El nombre y el código son obligatorios.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE dependencias SET nombre_dependencia = ?, codigo_dependencia = ? WHERE id = ?',
            [nombre_dependencia, codigo_dependencia, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Dependencia no encontrada.' });
        }
        res.json({ msg: 'Dependencia actualizada con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Función para activar/desactivar una dependencia
exports.toggleDependenciaStatus = async (req, res) => {
    const { id } = req.params;
    try {
        // Cambia el estado de activo a inactivo o viceversa
        const [result] = await pool.query(
            'UPDATE dependencias SET activo = NOT activo WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Dependencia no encontrada.' });
        }
        res.json({ msg: 'Estado de la dependencia actualizado con éxito.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};