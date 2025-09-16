const pool = require('../config/db');
const fs = require('fs/promises');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { generarRadicado } = require('../utils/radicado.util');

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
    const { asunto, tipo_soporte, ubicacion_fisica, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion } = req.body;
    const customDataString = req.body.customData;
    const id_usuario_radicador = req.user.id;

    if (tipo_soporte === 'Electrónico' && !req.file) {
        return res.status(400).json({ msg: 'Para un documento electrónico, se requiere adjuntar un archivo.' });
    }
    if (tipo_soporte === 'Físico' && (!ubicacion_fisica || !ubicacion_fisica.trim())) {
        return res.status(400).json({ msg: 'Para un documento físico, se requiere especificar su ubicación.' });
    }

    let path_archivo = null;
    let nombre_archivo_original = null;
    let contenido_extraido = null;
    if (req.file) {
        path_archivo = req.file.path;
        nombre_archivo_original = req.file.originalname;
    }
    
    let customData = {};
    if (customDataString) {
        try {
            customData = JSON.parse(customDataString);
        } catch (e) {
            return res.status(400).json({ msg: 'Los datos personalizados no tienen un formato JSON válido.' });
        }
    }

    // --- INICIO DE LA LÓGICA DE TRANSACCIÓN ---
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction(); // 1. Iniciar la transacción

        if (req.file) {
            if (req.file.mimetype === 'application/pdf') {
                const dataBuffer = fs.readFileSync(path_archivo);
                const data = await pdfParse(dataBuffer);
                contenido_extraido = data.text;
            }
            if (req.file.mimetype.startsWith('image/')) {
                const { data: { text } } = await Tesseract.recognize(path_archivo, 'spa');
                contenido_extraido = text;
            }
        }
        
        const radicado = await generarRadicado();

        const [result] = await connection.query(
            `INSERT INTO documentos (radicado, asunto, tipo_soporte, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion, nombre_archivo_original, path_archivo, ubicacion_fisica, contenido_extraido, id_usuario_radicador)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [radicado, asunto, tipo_soporte, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion, nombre_archivo_original, path_archivo, ubicacion_fisica, contenido_extraido, id_usuario_radicador]
        );
        const newDocumentId = result.insertId;

        if (Object.keys(customData).length > 0) {
            const customDataValues = Object.entries(customData).map(([id_campo, valor]) => {
                return [newDocumentId, parseInt(id_campo), valor];
            });
            await connection.query('INSERT INTO documento_datos_personalizados (id_documento, id_campo, valor) VALUES ?', [customDataValues]);
        }
        
        await connection.commit(); // 2. Si todo sale bien, se confirman los cambios

        res.status(201).json({ id: newDocumentId, radicado: radicado });

    } catch (error) {
        await connection.rollback(); // 3. Si algo falla, se revierten todos los cambios
        console.error("Error al radicar documento:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    } finally {
        connection.release(); // 4. Se libera la conexión
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
    const { firma_imagen } = req.body;

    if (!firma_imagen) {
        return res.status(400).json({ msg: 'No se ha proporcionado una firma.' });
    }

    try {
        
        const [docs] = await pool.query('SELECT path_archivo FROM documentos WHERE id = ?', [id_documento]);
        if (docs.length === 0 || !docs[0].path_archivo || !fs.existsSync(docs[0].path_archivo)) {
            return res.status(404).json({ msg: 'No se puede firmar porque no existe un archivo físico para este documento. Los documentos generados desde plantillas deben tener un archivo asociado antes de ser firmados.' });
        }
        const filePath = docs[0].path_archivo;
        // --- Fin de la Verificación ---

        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const firma_hash = hashSum.digest('hex');

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

exports.createDocumentoFromPlantillaSinExpediente = async (req, res) => {
    const { id_plantilla, datos_rellenados, id_serie, id_subserie, id_oficina_productora } = req.body;
    const id_usuario_radicador = req.user.id;

    if (!id_plantilla || !datos_rellenados) {
        return res.status(400).json({ msg: 'Faltan datos para generar el documento.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [plantillaRows] = await connection.query('SELECT nombre, diseño_json FROM plantillas WHERE id = ?', [id_plantilla]);
        if (plantillaRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ msg: 'Plantilla no encontrada.' });
        }

        const nombrePlantilla = plantillaRows[0].nombre;
        const disenoProyecto = JSON.parse(plantillaRows[0].diseño_json || '{}');
        const disenoComponentes = disenoProyecto.components || [];

        const asunto = `${nombrePlantilla} - Generado desde plantilla`;
        const radicado = await generarRadicado();
        
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { height } = page.getSize();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const drawComponents = (components) => {
            for (const component of components) {
                // ✅ LÓGICA CORREGIDA: Buscamos texto que contenga '{{...}}'
                if (component.type === 'text' && component.content && component.content.includes('{{')) {
                    const style = component.style || {};
                    const variableName = component.content.replace(/{{|}}/g, '').trim();
                    const valor = datos_rellenados[variableName] || '';
                    
                    const x = parseInt(style.left) || 0;
                    const y = parseInt(style.top) || 0;
                    const fontSize = parseInt(style['font-size']) || 12;

                    page.drawText(String(valor), {
                        x: x,
                        y: height - y - fontSize, // Conversión de coordenadas
                        size: fontSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                    });
                }

                // Procesamos los componentes hijos (para las celdas)
                if (component.components && component.components.length > 0) {
                    drawComponents(component.components);
                }
            }
        };
        
        drawComponents(disenoComponentes);

        const pdfBytes = await pdfDoc.save();
        const fileName = `${radicado}.pdf`;
        const filePath = path.join('uploads', fileName);
        await fs.writeFile(filePath, pdfBytes);

        const [docResult] = await connection.query(
            `INSERT INTO documentos (radicado, asunto, id_oficina_productora, id_serie, id_subserie, remitente_nombre, id_usuario_radicador, path_archivo, nombre_archivo_original)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [radicado, asunto, id_oficina_productora, id_serie, id_subserie, 'Generado Internamente', id_usuario_radicador, filePath, fileName]
        );
        
        await connection.commit();
        res.status(201).json({ msg: 'Documento generado con éxito.', radicado, id: docResult.insertId });

    } catch (error) {
        await connection.rollback();
        console.error("Error al generar documento desde plantilla:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        if (connection) connection.release();
    }
};