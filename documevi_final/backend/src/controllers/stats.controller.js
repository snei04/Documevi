// Archivo: backend/src/controllers/stats.controller.js
const pool = require('../config/db');

// Obtener estadísticas generales para el dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Ejecutamos todas las consultas de conteo en paralelo
    const [
      [documentosResult],
      [expedientesResult],
      [prestamosResult],
      [usuariosResult]
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as total FROM documentos"),
      pool.query("SELECT COUNT(*) as total FROM expedientes"),
      pool.query("SELECT COUNT(*) as total FROM prestamos WHERE estado = 'Prestado'"),
      pool.query("SELECT COUNT(*) as total FROM usuarios WHERE activo = true")
    ]);

    res.json({
      totalDocumentos: documentosResult[0].total,
      totalExpedientes: expedientesResult[0].total,
      prestamosActivos: prestamosResult[0].total,
      usuariosActivos: usuariosResult[0].total
    });

  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};