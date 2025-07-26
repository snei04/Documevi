// Archivo: backend/src/controllers/reporte.controller.js
const pool = require('../config/db');

exports.generateFUID = async (req, res) => {
  const { oficinaId } = req.query;

  if (!oficinaId) {
    return res.status(400).json({ msg: 'El ID de la oficina es obligatorio.' });
  }

  try {
    // Esta consulta compleja une todas las tablas necesarias para recolectar la información del FUID
    const [rows] = await pool.query(`
      SELECT
        dep.codigo_dependencia,
        dep.nombre_dependencia,
        ofi.codigo_oficina,
        ofi.nombre_oficina,
        ser.codigo_serie,
        ser.nombre_serie,
        sub.codigo_subserie,
        sub.nombre_subserie,
        exp.id as numero_orden,
        exp.nombre_expediente,
        exp.fecha_apertura,
        exp.fecha_cierre,
        (SELECT COUNT(*) FROM expediente_documentos WHERE id_expediente = exp.id) as numero_folios,
        'Electrónico' as soporte, -- Asumimos que todos son electrónicos por ahora
        sub.retencion_gestion,
        sub.retencion_central,
        sub.disposicion_final,
        sub.procedimientos
      FROM expedientes exp
      JOIN trd_subseries sub ON exp.id_subserie = sub.id
      JOIN trd_series ser ON sub.id_serie = ser.id
      JOIN oficinas_productoras ofi ON ser.id_oficina_productora = ofi.id
      JOIN dependencias dep ON ofi.id_dependencia = dep.id
      WHERE ofi.id = ?
      ORDER BY ser.codigo_serie, sub.codigo_subserie, exp.fecha_apertura;
    `, [oficinaId]);

    res.json(rows);

  } catch (error) {
    console.error("Error al generar el reporte FUID:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};