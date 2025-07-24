const pool = require('../config/db');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

const generarRadicado = async () => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaPrefix = `${yyyy}${mm}${dd}`;

    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM documentos WHERE radicado LIKE ?", 
      [`${fechaPrefix}%`]
    );
    
    const nuevoConsecutivo = rows[0].count + 1;
    const consecutivoStr = String(nuevoConsecutivo).padStart(4, '0');

    return `${fechaPrefix}-${consecutivoStr}`;
};

// 👇 ASEGÚRATE DE QUE ESTA FUNCIÓN ESTÉ EXPORTADA
exports.getAllDocumentos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM documentos ORDER BY fecha_radicado DESC');
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

exports.createDocumento = async (req, res) => {
    const { asunto, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion } = req.body;
    const id_usuario_radicador = req.user.id;

    if (!req.file) {
        return res.status(400).json({ msg: 'No se ha subido ningún archivo.' });
    }

    const nombre_archivo_original = req.file.originalname;
    const path_archivo = req.file.path;
    let contenido_extraido = null;

    // 1. Si el archivo es un PDF, extraemos su texto
    if (req.file.mimetype === 'application/pdf') {
        try {
            const dataBuffer = fs.readFileSync(path_archivo);
            const data = await pdfParse(dataBuffer);
            contenido_extraido = data.text; // Guardamos todo el texto del PDF
        } catch (error) {
            console.error("Error al parsear el PDF:", error);
            // No detenemos el proceso, simplemente no guardamos el contenido
        }
    }

    try {
        const radicado = await generarRadicado();

        // 2. Incluimos el texto extraído en la consulta INSERT
        const [result] = await pool.query(
            `INSERT INTO documentos (radicado, asunto, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion, nombre_archivo_original, path_archivo, contenido_extraido, id_usuario_radicador)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [radicado, asunto, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion, nombre_archivo_original, path_archivo, contenido_extraido, id_usuario_radicador]
        );

        res.status(201).json({ id: result.insertId, radicado: radicado, ...req.body });
    } catch (error) {
        console.error("Error al radicar documento:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};