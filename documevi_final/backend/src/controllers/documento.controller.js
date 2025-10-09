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
 * Crea un nuevo documento a partir de datos y un archivo opcional.
 */
exports.createDocumento = async (req, res) => {
    try {
        const { asunto, tipo_soporte, ubicacion_fisica, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion, customData: customDataString } = req.body;
        
        // --- Validaciones de entrada ---
        if (tipo_soporte === 'Electrónico' && !req.file) {
            return res.status(400).json({ msg: 'Para un documento electrónico, se requiere adjuntar un archivo.' });
        }
        if (tipo_soporte === 'Físico' && (!ubicacion_fisica || !ubicacion_fisica.trim())) {
            return res.status(400).json({ msg: 'Para un documento físico, se requiere especificar su ubicación.' });
        }
        
        let customData = {};
        if (customDataString) {
            try {
                customData = JSON.parse(customDataString);
            } catch (e) {
                return res.status(400).json({ msg: 'Los datos personalizados no tienen un formato JSON válido.' });
            }
        }
        
        const documentoData = { asunto, tipo_soporte, ubicacion_fisica, id_oficina_productora, id_serie, id_subserie, remitente_nombre, remitente_identificacion, remitente_direccion, customData };

        // --- Llamada al servicio ---
        const nuevoDocumento = await documentoService.crearNuevoDocumento(documentoData, req.file, req.user.id);
        
        res.status(201).json(nuevoDocumento);

    } catch (error) {
        console.error("Error al radicar documento:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
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