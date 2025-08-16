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

    // 👇 AQUÍ ESTÁ EL CAMBIO: Añadimos 'd.firma_hash' y 'd.fecha_firma' a la consulta
    const [documentosRows] = await pool.query(`
      SELECT d.id, d.radicado, d.asunto, d.path_archivo, d.firma_hash, d.fecha_firma, 
             ed.orden_foliado, ed.fecha_incorporacion
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
  // Recibimos el nuevo campo 'requiere_firma' desde el frontend
  const { id_documento, requiere_firma } = req.body;

  if (!id_documento) {
    return res.status(400).json({ msg: 'El ID del documento es obligatorio.' });
  }

  try {
    const [folioRows] = await pool.query(
      'SELECT MAX(orden_foliado) as max_folio FROM expediente_documentos WHERE id_expediente = ?',
      [id_expediente]
    );
    const nuevoFolio = (folioRows[0].max_folio || 0) + 1;

    // Actualizamos la consulta para incluir el nuevo campo
    const [result] = await pool.query(
      'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado, requiere_firma) VALUES (?, ?, ?, ?)',
      [id_expediente, id_documento, nuevoFolio, requiere_firma || false]
    );

    res.status(201).json({ 
      id: result.insertId,
      id_expediente,
      id_documento,
      orden_foliado: nuevoFolio,
      requiere_firma
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

exports.getExpedienteCustomData = async (req, res) => {
  const { id } = req.params;
  try {
    // Asegúrate de que el nombre de la tabla ('expediente_datos_personalizados')
    // y de la columna ('id_expediente') sean correctos en tu base de datos.
    const [rows] = await pool.query(
      'SELECT id_campo, valor FROM expediente_datos_personalizados WHERE id_expediente = ?',
      [id]
    );

    const data = rows.reduce((acc, row) => {
      acc[row.id_campo] = row.valor;
      return acc;
    }, {});

    res.json(data);

  } catch (error) {
    // Este log es crucial para ver el error exacto de SQL
    console.error("Error al obtener datos personalizados:", error); 
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Guardar o actualizar los datos personalizados de un expediente
exports.updateExpedienteCustomData = async (req, res) => {
  const { id: id_expediente } = req.params;
  const customData = req.body; // Esperamos un objeto: { campoId: valor, ... }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // 1. Borramos los datos antiguos para este expediente
    await connection.query('DELETE FROM expediente_datos_personalizados WHERE id_expediente = ?', [id_expediente]);

    // 2. Insertamos los nuevos datos
    const values = Object.entries(customData).map(([id_campo, valor]) => [id_expediente, id_campo, valor]);
    if (values.length > 0) {
      await connection.query('INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES ?', [values]);
    }

    await connection.commit();
    res.json({ msg: 'Datos personalizados guardados con éxito.' });
  } catch (error) {
    await connection.rollback();
    console.error("Error al guardar datos personalizados:", error);
    res.status(500).json({ msg: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};