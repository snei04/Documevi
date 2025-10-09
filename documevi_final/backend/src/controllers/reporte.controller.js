const pool = require('../config/db');

exports.generateFUID = async (req, res) => {
  const { oficinaId } = req.query;

  if (!oficinaId) {
    return res.status(400).json({ msg: 'El ID de la oficina es obligatorio.' });
  }

  try {
    // Consulta SQL para obtener los datos necesarios
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
  (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('nombre', ocp.nombre_campo, 'valor', edp.valor)), ']')
  FROM expediente_datos_personalizados edp
  JOIN oficina_campos_personalizados ocp ON edp.id_campo = ocp.id
  WHERE edp.id_expediente = exp.id
  ) as metadatos_personalizados
FROM expedientes exp
JOIN trd_subseries sub ON exp.id_subserie = sub.id
JOIN trd_series ser ON sub.id_serie = ser.id
JOIN oficinas_productoras ofi ON ser.id_oficina_productora = ofi.id -- This line is now fixed
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