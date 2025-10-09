const pool = require('../config/db');

// Genera un nuevo número de radicado basado en la fecha actual y el conteo diario
const generarRadicado = async () => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaPrefix = `${yyyy}${mm}${dd}`;
    // Consulta para contar documentos con el mismo prefijo de fecha
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM documentos WHERE radicado LIKE ?", 
      [`${fechaPrefix}%`]
    );
    // Nuevo consecutivo basado en el conteo diario
    const nuevoConsecutivo = rows[0].count + 1;
    const consecutivoStr = String(nuevoConsecutivo).padStart(4, '0');

    return `${fechaPrefix}-${consecutivoStr}`;
};

module.exports = { generarRadicado };