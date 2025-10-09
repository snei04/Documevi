const pool = require('../config/db');

exports.getAuditLog = async (req, res) => {
  // Obtenemos las fechas desde los query params de la URL
  const { startDate, endDate } = req.query;

  try {
    let query = `
      SELECT a.id, a.accion, a.detalles, a.fecha, u.nombre_completo as usuario
      FROM auditoria a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
    `;
    const params = [];

  // Si se proporcionan ambas fechas, añadimos la cláusula WHERE
    if (startDate && endDate) {
      query += ` WHERE DATE(a.fecha) BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    query += ` ORDER BY a.fecha DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);

  } catch (error) {
    console.error("Error al obtener el log de auditoría:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};