// Archivo: backend/src/controllers/documento.controller.js
const pool = require('../config/db');

// Función para generar un número de radicado único (Ej: 20250721-0001)
const generarRadicado = async () => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaPrefix = `${yyyy}${mm}${dd}`;

    // Contamos cuántos radicados existen para el día de hoy
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM documentos WHERE radicado LIKE ?", 
      [`${fechaPrefix}%`]
    );
    
    const nuevoConsecutivo = rows[0].count + 1;
    const consecutivoStr = String(nuevoConsecutivo).padStart(4, '0');

    return `${fechaPrefix}-${consecutivoStr}`;
};


// Radicar un nuevo documento
exports.createDocumento = async (req, res) => {
    const { 
        asunto,
        id_oficina_productora,
        id_serie,
        id_subserie,
        remitente_nombre,
        remitente_identificacion,
        remitente_direccion
    } = req.body;

    // El ID del usuario que está radicando lo tomamos del token
    const id_usuario_radicador = req.user.id;

    if (!asunto || !id_oficina_productora || !id_serie || !id_subserie || !remitente_nombre) {
        return res.status(400).json({ msg: 'Los campos principales son obligatorios.' });
    }

    try {
        const radicado = await generarRadicado();

        const [result] = await pool.query(
            `INSERT INTO documentos (radicado, asunto, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion, id_usuario_radicador)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [radicado, asunto, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion, id_usuario_radicador]
        );

        res.status(201).json({
            id: result.insertId,
            radicado: radicado,
            ...req.body
        });

    } catch (error) {
        console.error("Error al radicar documento:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};