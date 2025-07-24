const pool = require('../config/db');

// Obtener todos los expedientes
exports.getAllExpedientes = async (req, res) => {
  try {
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

exports.getExpedienteById = async (req, res) => {
  try {
    const { id } = req.params;
    // Buscamos los datos del expediente
    const [expedienteRows] = await pool.query('SELECT * FROM expedientes WHERE id = ?', [id]);
    if (expedienteRows.length === 0) {
      return res.status(404).json({ msg: 'Expediente no encontrado.' });
    }

    // Buscamos los documentos asociados en el índice electrónico
    const [documentosRows] = await pool.query(`
      SELECT d.*, ed.orden_foliado, ed.fecha_incorporacion
      FROM expediente_documentos ed
      JOIN documentos d ON ed.id_documento = d.id
      WHERE ed.id_expediente = ?
      ORDER BY ed.orden_foliado ASC
    `, [id]);

    res.json({
      ...expedienteRows[0],
      documentos: documentosRows
    });

  } catch (error) {
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Añadir un documento a un expediente (Índice Electrónico)
exports.addDocumentoToExpediente = async (req, res) => {
  const { id_expediente } = req.params;
  const { id_documento } = req.body;

  if (!id_documento) {
    return res.status(400).json({ msg: 'El ID del documento es obligatorio.' });
  }

  try {
    // Calculamos el siguiente número de foliado
    const [folioRows] = await pool.query(
      'SELECT MAX(orden_foliado) as max_folio FROM expediente_documentos WHERE id_expediente = ?',
      [id_expediente]
    );
    const nuevoFolio = (folioRows[0].max_folio || 0) + 1;

    // Insertamos el registro en la tabla pivote (el índice)
    const [result] = await pool.query(
      'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado) VALUES (?, ?, ?)',
      [id_expediente, id_documento, nuevoFolio]
    );

    res.status(201).json({ 
      id: result.insertId,
      id_expediente,
      id_documento,
      orden_foliado: nuevoFolio
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: 'Este documento ya existe en el expediente.' });
    }
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};

// Cerrar un expediente
exports.closeExpediente = async (req, res) => {
  const { id } = req.params;
  const id_usuario_accion = req.user.id; // Usuario que realiza la acción

  try {
    // Primero, verificamos que el expediente exista y esté en el estado correcto
    const [expedientes] = await pool.query("SELECT estado FROM expedientes WHERE id = ?", [id]);

    if (expedientes.length === 0) {
      return res.status(404).json({ msg: 'Expediente no encontrado.' });
    }
    if (expedientes[0].estado !== 'En trámite') {
      return res.status(400).json({ msg: 'Solo se pueden cerrar expedientes que están "En trámite".' });
    }

    // Actualizamos el estado y la fecha de cierre
    await pool.query(
      "UPDATE expedientes SET estado = 'Cerrado en Gestión', fecha_cierre = NOW() WHERE id = ?",
      [id]
    );

    // Registramos la acción en la auditoría, como lo requieren tus documentos
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
      [id_usuario_accion, 'CIERRE_EXPEDIENTE', `El usuario cerró el expediente con ID ${id}`]
    );

    res.json({ msg: 'Expediente cerrado con éxito.' });

  } catch (error) {
    console.error("Error al cerrar el expediente:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};