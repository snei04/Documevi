/**
 * @fileoverview Capa de servicio para la lógica de negocio de los documentos.
 * Maneja la interacción con la base de datos y el procesamiento de archivos.
 */

const pool = require('../config/db');
const fs = require('fs/promises');
const crypto = require('crypto');
const path = require('path');
const puppeteer = require('puppeteer');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { generarRadicado } = require('../utils/radicado.util');

/**
 * Extrae el texto de un archivo (PDF o Imagen) de forma asíncrona.
 * @param {object} file - El objeto de archivo de multer.
 * @returns {Promise<string|null>} El texto extraído.
 */
const extraerContenidoArchivo = async (file) => {
    if (!file) return null;

    if (file.mimetype === 'application/pdf') {
        const dataBuffer = await fs.readFile(file.path);
        const data = await pdfParse(dataBuffer);
        return data.text;
    }

    if (file.mimetype.startsWith('image/')) {
        const { data: { text } } = await Tesseract.recognize(file.path, 'spa');
        return text;
    }

    return null;
};

/**
 * Crea un nuevo documento en la base de datos usando una transacción.
 * @param {object} data - Datos del documento.
 * @param {object} file - Archivo adjunto (opcional).
 * @param {number} id_usuario_radicador - ID del usuario que radica.
 * @returns {Promise<object>} El nuevo documento con su ID y radicado.
 */
exports.crearNuevoDocumento = async (data, file, id_usuario_radicador) => {
    const { customData, ...documentoData } = data;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const contenido_extraido = await extraerContenidoArchivo(file);
        const radicado = await generarRadicado();

        // Construcción del objeto a insertar para evitar SQL Injection y manejar campos opcionales.
        const docToInsert = {
            radicado,
            asunto: documentoData.asunto,
            tipo_soporte: documentoData.tipo_soporte,
            id_oficina_productora: documentoData.id_oficina_productora,
            id_serie: documentoData.id_serie,
            id_subserie: documentoData.id_subserie,
            remitente_nombre: documentoData.remitente_nombre,
            remitente_identificacion: documentoData.remitente_identificacion,
            remitente_direccion: documentoData.remitente_direccion,
            nombre_archivo_original: file?.originalname || null,
            path_archivo: file?.path || null,
            ubicacion_fisica: documentoData.ubicacion_fisica || null,
            id_carpeta: documentoData.id_carpeta || null,
            paquete: documentoData.paquete || null,
            tomo: documentoData.tomo || null,
            modulo: documentoData.modulo || null,
            entrepaño: documentoData.entrepaño || null,
            estante: documentoData.estante || null,
            otro: documentoData.otro || null,
            contenido_extraido,
            id_usuario_radicador,
        };

        // Verificación de capacidad de carpeta
        if (documentoData.id_carpeta) {
            const [carpetaRows] = await connection.query('SELECT cantidad_actual, capacidad_maxima, estado FROM carpetas WHERE id = ? FOR UPDATE', [documentoData.id_carpeta]);

            if (carpetaRows.length === 0) {
                throw new Error('La carpeta especificada no existe.');
            }
            const carpeta = carpetaRows[0];

            if (carpeta.estado === 'Cerrada') {
                throw new Error('La carpeta especificada está cerrada.');
            }

            if (carpeta.cantidad_actual >= carpeta.capacidad_maxima) {
                throw new Error(`La carpeta ha alcanzado su capacidad máxima (${carpeta.capacidad_maxima}).`);
            }

            await connection.query('UPDATE carpetas SET cantidad_actual = cantidad_actual + 1 WHERE id = ?', [documentoData.id_carpeta]);
        }

        const [result] = await connection.query('INSERT INTO documentos SET ?', docToInsert);
        const newDocumentId = result.insertId;

        if (customData && Object.keys(customData).length > 0) {
            const customDataValues = Object.entries(customData).map(([id_campo, valor]) =>
                [newDocumentId, parseInt(id_campo, 10), valor]
            );
            await connection.query('INSERT INTO documento_datos_personalizados (id_documento, id_campo, valor) VALUES ?', [customDataValues]);
        }

        await connection.commit();
        return { id: newDocumentId, radicado };

    } catch (error) {
        await connection.rollback();
        throw error; // Re-lanza el error para que el controlador lo capture
    } finally {
        connection.release();
    }
};

/**
 * Genera un documento PDF a partir de una plantilla HTML/CSS.
 * @param {object} data - Datos para la plantilla.
 * @param {number} id_usuario_radicador - ID del usuario.
 * @returns {Promise<object>} El documento generado.
 */
exports.generarDocumentoDesdePlantilla = async (data, id_usuario_radicador, connection = pool) => {
    const { id_plantilla, datos_rellenados, id_serie, id_subserie } = data;

    const [plantillas] = await connection.query('SELECT nombre, diseño_json FROM plantillas WHERE id = ?', [id_plantilla]);
    if (plantillas.length === 0) {
        throw new CustomError('Plantilla no encontrada.', 404);
    }

    // Find id_oficina_productora from the database
    const [series] = await connection.query('SELECT id_oficina_productora FROM trd_series WHERE id = ?', [id_serie]);
    if (series.length === 0) {
        throw new CustomError('La Serie especificada no existe.', 400);
    }
    const id_oficina_productora = series[0].id_oficina_productora;

    // Reemplazamos los placeholders en el HTML con los datos proporcionados
    const { nombre, diseño_json } = plantillas[0];
    const diseno = JSON.parse(diseño_json || '{}');
    let html = diseno.html || '';
    const css = diseno.css || '';
    for (const key in datos_rellenados) {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), datos_rellenados[key]);
    }
    const radicado = await generarRadicado();
    const asunto = `${nombre} - Generado desde plantilla`;
    const fileName = `${radicado}.pdf`;
    const filePath = path.join(process.env.UPLOADS_DIR || 'uploads', fileName);
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(`<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}</body></html>`);
    const pdfBytes = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    await fs.writeFile(filePath, pdfBytes);

    const [docResult] = await connection.query(
        `INSERT INTO documentos (radicado, asunto, id_oficina_productora, id_serie, id_subserie, remitente_nombre, id_usuario_radicador, path_archivo, nombre_archivo_original, tipo_soporte) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Electrónico')`,
        [radicado, asunto, id_oficina_productora, id_serie, id_subserie, 'Generado Internamente', id_usuario_radicador, filePath, fileName]
    );

    return { msg: 'Documento generado con éxito.', radicado, id: docResult.insertId };
};

/**
 * Firma un documento calculando su hash SHA256 de forma asíncrona.
 * @param {number} id_documento - ID del documento a firmar.
 * @param {string} firma_imagen - La imagen de la firma en base64.
 */
exports.firmarDocumentoDigitalmente = async (id_documento, firma_imagen) => {
    const [docs] = await pool.query('SELECT path_archivo FROM documentos WHERE id = ?', [id_documento]);
    if (docs.length === 0 || !docs[0].path_archivo) {
        throw new Error('El documento no tiene un archivo físico asociado para firmar.');
    }

    const filePath = docs[0].path_archivo;

    try {
        await fs.access(filePath);
    } catch {
        throw new Error('El archivo físico del documento no fue encontrado.');
    }

    const fileBuffer = await fs.readFile(filePath);
    const firma_hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    await pool.query(
        'UPDATE documentos SET firma_imagen = ?, firma_hash = ?, fecha_firma = NOW() WHERE id = ?',
        [firma_imagen, firma_hash, id_documento]
    );
};

/**
 * Asigna un workflow a un documento.
 * @param {number} id_documento 
 * @param {number} id_workflow 
 * @param {number} id_usuario 
 */
exports.iniciarWorkflow = async (id_documento, id_workflow, id_usuario) => {
    try {
        const [pasos] = await pool.query('SELECT id FROM workflow_pasos WHERE id_workflow = ? ORDER BY orden ASC LIMIT 1', [id_workflow]);

        if (pasos.length === 0) {
            throw new Error('El workflow no tiene pasos definidos.');
        }

        const id_primer_paso = pasos[0].id;
        await pool.query(
            'INSERT INTO documento_workflows (id_documento, id_workflow, id_paso_actual, id_usuario_actual) VALUES (?, ?, ?, ?)',
            [id_documento, id_workflow, id_primer_paso, id_usuario]
        );
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Este documento ya tiene un workflow activo.');
        }
        throw error; // Lanza otros errores
    }
};

/**
 * Mueve el workflow de un documento al siguiente paso.
 * @param {number} id_documento 
 * @param {number} id_usuario 
 * @returns {Promise<string>} Mensaje con el resultado.
 */
exports.avanzarWorkflow = async (id_documento, id_usuario) => {
    const [currentStatus] = await pool.query(
        `SELECT dw.id as tracking_id, dw.id_workflow, wp.orden as orden_actual
         FROM documento_workflows dw
         JOIN workflow_pasos wp ON dw.id_paso_actual = wp.id
         WHERE dw.id_documento = ? AND dw.estado = 'Activo'`,
        [id_documento]
    );

    if (currentStatus.length === 0) {
        throw new Error('El documento no está en ningún workflow activo.');
    }

    const { tracking_id, id_workflow, orden_actual } = currentStatus[0];
    const [nextStep] = await pool.query(
        'SELECT id FROM workflow_pasos WHERE id_workflow = ? AND orden > ? ORDER BY orden ASC LIMIT 1',
        [id_workflow, orden_actual]
    );

    if (nextStep.length > 0) {
        const id_siguiente_paso = nextStep[0].id;
        await pool.query('UPDATE documento_workflows SET id_paso_actual = ?, id_usuario_actual = ? WHERE id = ?', [id_siguiente_paso, id_usuario, tracking_id]);
        return 'Documento avanzado al siguiente paso.';
    } else {
        await pool.query("UPDATE documento_workflows SET estado = 'Completado', fecha_fin = NOW(), id_usuario_actual = ? WHERE id = ?", [id_usuario, tracking_id]);
        return 'Workflow completado con éxito.';
    }
};

/**
 * Actualiza la ubicación física de un documento.
 */
exports.actualizarUbicacionDocumento = async (id_documento, data, id_usuario) => {
    const { id_carpeta, paquete, tomo, modulo, estante, entrepaño, otro, ubicacion_fisica } = data;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Validar si el documento existe
        const [docs] = await connection.query('SELECT tipo_soporte, id_carpeta FROM documentos WHERE id = ? FOR UPDATE', [id_documento]);
        if (docs.length === 0) {
            throw new CustomError('Documento no encontrado.', 404);
        }

        // Validar que sea Físico o Híbrido (opcional, pero recomendado)
        // if (docs[0].tipo_soporte === 'Electrónico' && !ubicacion_fisica && !id_carpeta) { ... }

        let id_carpeta_final = id_carpeta || null;

        // Si se cambia de carpeta, validar la nueva
        if (id_carpeta_final && id_carpeta_final !== docs[0].id_carpeta) {
            const [carpetaRows] = await connection.query('SELECT cantidad_actual, capacidad_maxima, estado FROM carpetas WHERE id = ? FOR UPDATE', [id_carpeta_final]);
            if (carpetaRows.length === 0) throw new CustomError('La carpeta especificada no existe.', 404);
            if (carpetaRows[0].estado === 'Cerrada') throw new CustomError('La carpeta está cerrada.', 400);
            if (carpetaRows[0].cantidad_actual >= carpetaRows[0].capacidad_maxima) throw new CustomError('Carpeta llena.', 400);

            // Incrementar nueva carpeta
            await connection.query('UPDATE carpetas SET cantidad_actual = cantidad_actual + 1 WHERE id = ?', [id_carpeta_final]);
            // Decrementar antigua carpeta si existía
            if (docs[0].id_carpeta) {
                await connection.query('UPDATE carpetas SET cantidad_actual = GREATEST(cantidad_actual - 1, 0) WHERE id = ?', [docs[0].id_carpeta]);
            }
        } else if (!id_carpeta_final && docs[0].id_carpeta) {
            // Si se quita la carpeta
            await connection.query('UPDATE carpetas SET cantidad_actual = GREATEST(cantidad_actual - 1, 0) WHERE id = ?', [docs[0].id_carpeta]);
        }

        // Si se provee una ubicación física en texto, usarla, si no, construirla desde carpeta si aplica
        let ubicacion_final = ubicacion_fisica;
        if (!ubicacion_final && id_carpeta_final) {
            const [c] = await connection.query('SELECT codigo_carpeta FROM carpetas WHERE id = ?', [id_carpeta_final]);
            if (c.length > 0) ubicacion_final = `Carpeta ${c[0].codigo_carpeta}`;
        }

        await connection.query(
            `UPDATE documentos SET 
                id_carpeta = ?, paquete = ?, tomo = ?, modulo = ?, estante = ?, entrepaño = ?, otro = ?, ubicacion_fisica = ?
             WHERE id = ?`,
            [id_carpeta_final, paquete, tomo, modulo, estante, entrepaño, otro, ubicacion_final, id_documento]
        );

        // Auditoría
        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [id_usuario, 'EDICION_UBICACION_FISICA', `Se actualizó la ubicación del documento ID ${id_documento}`]
        );

        await connection.commit();
        return { msg: 'Ubicación actualizada correctamente.' };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};