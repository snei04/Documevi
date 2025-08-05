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

exports.startWorkflow = async (req, res) => {
    const { id: id_documento } = req.params;
    const { id_workflow } = req.body;

    if (!id_workflow) {
        return res.status(400).json({ msg: 'El ID del workflow es obligatorio.' });
    }

    try {
        // 1. Buscar el primer paso (orden=1) del workflow seleccionado
        const [pasos] = await pool.query(
            'SELECT id FROM workflow_pasos WHERE id_workflow = ? ORDER BY orden ASC LIMIT 1',
            [id_workflow]
        );

        if (pasos.length === 0) {
            return res.status(404).json({ msg: 'El workflow no tiene pasos definidos.' });
        }
        const id_primer_paso = pasos[0].id;

        // 2. Crear el registro en la tabla de seguimiento
        await pool.query(
            'INSERT INTO documento_workflows (id_documento, id_workflow, id_paso_actual, id_usuario_actual) VALUES (?, ?, ?, ?)',
            [id_documento, id_workflow, id_primer_paso, req.user.id]
        );

        res.status(201).json({ msg: 'Workflow iniciado con éxito.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'Este documento ya tiene un workflow activo.' });
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

exports.advanceWorkflow = async (req, res) => {
    const { id: id_documento } = req.params;

    try {
        // 1. Obtener el estado actual del workflow del documento
        const [currentStatus] = await pool.query(
            `SELECT dw.id as tracking_id, dw.id_workflow, wp.orden as orden_actual
             FROM documento_workflows dw
             JOIN workflow_pasos wp ON dw.id_paso_actual = wp.id
             WHERE dw.id_documento = ?`,
            [id_documento]
        );

        if (currentStatus.length === 0) {
            return res.status(404).json({ msg: 'El documento no está en ningún workflow.' });
        }

        const { tracking_id, id_workflow, orden_actual } = currentStatus[0];

        // 2. Buscar el siguiente paso en la secuencia
        const [nextStep] = await pool.query(
            'SELECT id FROM workflow_pasos WHERE id_workflow = ? AND orden > ? ORDER BY orden ASC LIMIT 1',
            [id_workflow, orden_actual]
        );

        if (nextStep.length > 0) {
            // 3. Si hay un siguiente paso, actualizamos el registro
            const id_siguiente_paso = nextStep[0].id;
            await pool.query(
                'UPDATE documento_workflows SET id_paso_actual = ?, id_usuario_actual = ? WHERE id = ?',
                [id_siguiente_paso, req.user.id, tracking_id]
            );
            res.json({ msg: 'Documento avanzado al siguiente paso.' });
        } else {
            // 4. Si no hay más pasos, completamos el workflow
            await pool.query(
                "UPDATE documento_workflows SET estado = 'Completado', fecha_fin = NOW(), id_usuario_actual = ? WHERE id = ?",
                [req.user.id, tracking_id]
            );
            res.json({ msg: 'Workflow completado con éxito.' });
        }
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

exports.firmarDocumento = async (req, res) => {
  const { id: id_documento } = req.params;
  const { firma_imagen } = req.body; // Recibimos la firma como un string base64

  if (!firma_imagen) {
    return res.status(400).json({ msg: 'No se ha proporcionado una firma.' });
  }

  try {
    // 1. Buscamos el archivo físico del documento
    const [docs] = await pool.query('SELECT path_archivo FROM documentos WHERE id = ?', [id_documento]);
    if (docs.length === 0 || !docs[0].path_archivo || !fs.existsSync(docs[0].path_archivo)) {
      return res.status(404).json({ msg: 'El archivo físico del documento no se encuentra.' });
    }
    const filePath = docs[0].path_archivo;

    // 2. Calculamos el hash (huella digital) del archivo
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const firma_hash = hashSum.digest('hex');

    // 3. Guardamos la firma, el hash y la fecha en la base de datos
    await pool.query(
      'UPDATE documentos SET firma_imagen = ?, firma_hash = ?, fecha_firma = NOW() WHERE id = ?',
      [firma_imagen, firma_hash, id_documento]
    );
    
    res.json({ msg: 'Documento firmado con éxito.' });

  } catch (error) {
    console.error("Error al firmar el documento:", error);
    res.status(500).json({ msg: 'Error en el servidor', error: error.message });
  }
};