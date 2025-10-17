const documentoService = require('../services/documento.service');
const pool = require('../config/db');

/**
 * Obtiene todos los documentos.
 */
exports.getAllDocumentos = async (req, res) => {
    try {
        // Para operaciones simples, se puede consultar directamente.
        const [rows] = await pool.query('SELECT * FROM documentos ORDER BY fecha_radicado DESC');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener documentos:", error); // Reemplazar con un logger en producción
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

/**
 * Crea un nuevo documento, maneja el archivo adjunto y guarda los metadatos.
 * Acepta tipo_soporte: 'Electrónico', 'Físico', o 'Híbrido'.
 */
exports.createDocumento = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { 
            asunto, tipo_soporte, ubicacion_fisica,
            id_oficina_productora, id_serie, id_subserie,
            remitente_nombre, remitente_identificacion, remitente_direccion,
            customData
        } = req.body;
        
        const archivo = req.file;
        const id_usuario_creador = req.user.id;

        await connection.beginTransaction();

        let path_del_archivo = null; // ✅ CORREGIDO: Usamos el nombre de variable correcto
        let nombre_archivo_original = null;

        if (tipo_soporte === 'Electrónico' || tipo_soporte === 'Híbrido') {
            if (!archivo) {
                await connection.rollback();
                return res.status(400).json({ msg: 'Debe adjuntar un archivo para el soporte electrónico o híbrido.' });
            }
            path_del_archivo = archivo.path; 
            nombre_archivo_original = archivo.originalname;
        }

        if ((tipo_soporte === 'Físico' || tipo_soporte === 'Híbrido') && (!ubicacion_fisica || ubicacion_fisica.trim() === '')) {
            await connection.rollback();
            return res.status(400).json({ msg: 'Debe especificar la ubicación física para el soporte físico o híbrido.' });
        }

        // --- Lógica del Radicado (sin cambios) ---
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const datePrefix = `${yyyy}${mm}${dd}`;
        const [lastRadicado] = await connection.query(
            "SELECT MAX(CAST(SUBSTRING_INDEX(radicado, '-', -1) AS UNSIGNED)) as last_seq FROM documentos WHERE radicado LIKE ?", 
            [`${datePrefix}-%`]
        );
        const newSequence = (lastRadicado[0].last_seq || 0) + 1;
        const radicado = `${datePrefix}-${String(newSequence).padStart(4, '0')}`;

        // --- Inserción Principal del Documento ---
        const [result] = await connection.query(
            `INSERT INTO documentos (
                radicado, asunto, tipo_soporte, ubicacion_fisica, path_archivo, /* ✅ CORREGIDO */
                nombre_archivo_original, id_oficina_productora, id_serie, id_subserie, 
                remitente_nombre, remitente_identificacion, remitente_direccion, id_usuario_radicador /* Asumo que es el nombre correcto */
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                radicado, asunto, tipo_soporte, ubicacion_fisica || null, path_del_archivo,
                nombre_archivo_original, id_oficina_productora, id_serie, id_subserie, 
                remitente_nombre, remitente_identificacion, remitente_direccion, id_usuario_creador
            ]
        );
        const newDocumentId = result.insertId;

        // --- Inserción de Datos Personalizados (sin cambios) ---
        const customDataParsed = JSON.parse(customData || '{}');
        const customDataEntries = Object.entries(customDataParsed);
        if (customDataEntries.length > 0) {
            const customValues = customDataEntries.map(([id_campo, valor]) => [newDocumentId, id_campo, valor]);
            await connection.query(
                'INSERT INTO documento_datos_personalizados (id_documento, id_campo, valor) VALUES ?', // Asegúrate que esta tabla exista
                [customValues]
            );
        }

        await connection.commit();
        res.status(201).json({ msg: 'Documento radicado con éxito.', radicado: radicado, id: newDocumentId });

    } catch (error) {
        await connection.rollback();
        console.error("Error al crear documento:", error);
        res.status(500).json({ msg: 'Error en el servidor al procesar la solicitud.' });
    } finally {
        connection.release();
    }
};

/**
 * Crea un documento a partir de una plantilla predefinida.
 */
exports.createDocumentoFromPlantillaSinExpediente = async (req, res) => {
    try {
        const { id_plantilla, datos_rellenados, id_serie, id_subserie, id_oficina_productora } = req.body;

        if (!id_plantilla || !datos_rellenados) {
            return res.status(400).json({ msg: 'Faltan datos para generar el documento.' });
        }

        const data = { id_plantilla, datos_rellenados, id_serie, id_subserie, id_oficina_productora };
        
        // --- Llamada al servicio ---
        const documentoGenerado = await documentoService.generarDocumentoDesdePlantilla(data, req.user.id);
        
        res.status(201).json(documentoGenerado);
    } catch (error) {
        console.error("Error al generar documento desde plantilla:", error);
        if (error.message === 'Plantilla no encontrada.') {
            return res.status(404).json({ msg: error.message });
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Firma un documento digitalmente.
 */
exports.firmarDocumento = async (req, res) => {
    try {
        const { id: id_documento } = req.params;
        const { firma_imagen } = req.body;

        if (!firma_imagen) {
            return res.status(400).json({ msg: 'No se ha proporcionado una firma.' });
        }

        // --- Llamada al servicio ---
        await documentoService.firmarDocumentoDigitalmente(id_documento, firma_imagen);
        
        res.json({ msg: 'Documento firmado con éxito.' });
    } catch (error) {
        console.error("Error al firmar el documento:", error);
        if (error.message.includes('no fue encontrado') || error.message.includes('no tiene un archivo')) {
             return res.status(404).json({ msg: error.message });
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Inicia un workflow para un documento específico.
 */
exports.startWorkflow = async (req, res) => {
    try {
        const { id: id_documento } = req.params;
        const { id_workflow } = req.body;
        
        if (!id_workflow) {
            return res.status(400).json({ msg: 'El ID del workflow es obligatorio.' });
        }

        // --- Llamada al servicio (asumiendo que la lógica se movió a documentoService) ---
        await documentoService.iniciarWorkflow(id_documento, id_workflow, req.user.id);
        
        res.status(201).json({ msg: 'Workflow iniciado con éxito.' });
    } catch (error) {
        console.error("Error al iniciar workflow:", error);
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('ya tiene un workflow')) {
            return res.status(400).json({ msg: 'Este documento ya tiene un workflow activo.' });
        }
        if (error.message.includes('no tiene pasos')) {
            return res.status(404).json({ msg: error.message });
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Avanza un documento al siguiente paso de su workflow.
 */
exports.advanceWorkflow = async (req, res) => {
    try {
        const { id: id_documento } = req.params;

        // --- Llamada al servicio ---
        const resultado = await documentoService.avanzarWorkflow(id_documento, req.user.id);

        res.json({ msg: resultado });
    } catch (error) {
        console.error("Error al avanzar workflow:", error);
        if (error.message.includes('no está en ningún workflow')) {
            return res.status(404).json({ msg: error.message });
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};