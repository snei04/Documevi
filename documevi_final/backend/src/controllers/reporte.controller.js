const pool = require('../config/db');

exports.generateFUID = async (req, res) => {
  const { oficinaId } = req.query;

  if (!oficinaId) {
    return res.status(400).json({ msg: 'El ID de la oficina es obligatorio.' });
  }

  try {
    // Consulta actualizada para incluir los campos personalizados
    const [rows] = await pool.query(`
      SELECT
        exp.id as numero_orden,
        exp.nombre_expediente,
        exp.fecha_apertura,
        exp.fecha_cierre,
        dep.nombre_dependencia,
        ofi.nombre_oficina,
        ser.codigo_serie,
        ser.nombre_serie,
        sub.codigo_subserie,
        sub.nombre_subserie,
        (SELECT COUNT(*) FROM expediente_documentos WHERE id_expediente = exp.id) as numero_folios,
        'Electrónico' as soporte,
        -- Usamos GROUP_CONCAT para agrupar los metadatos personalizados en un solo campo JSON
        (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('nombre', ocp.nombre_campo, 'valor', dcp.valor)), ']')
         FROM documento_datos_personalizados dcp
         JOIN oficina_campos_personalizados ocp ON dcp.id_campo = ocp.id
         WHERE dcp.id_documento = (SELECT id_documento FROM expediente_documentos WHERE id_expediente = exp.id LIMIT 1)
        ) as metadatos_personalizados
      FROM expedientes exp
      JOIN trd_subseries sub ON exp.id_subserie = sub.id
      JOIN trd_series ser ON sub.id_serie = ser.id
      JOIN oficinas_productoras ofi ON ser.id_oficina_productora = ofi.id
      JOIN dependencias dep ON ofi.id_dependencia = dep.id
      WHERE ofi.id = ?
      GROUP BY exp.id
      ORDER BY ser.codigo_serie, sub.codigo_subserie, exp.fecha_apertura;
    `, [oficinaId]);

    res.json(rows);

  } catch (error) {
    console.error("Error al generar el reporte FUID:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};