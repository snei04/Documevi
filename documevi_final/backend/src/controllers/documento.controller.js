const documentoService = require('../services/documento.service');
const pool = require('../config/db');

/**
 * Obtiene un documento por su ID con todos sus detalles.
 */
exports.getDocumentoById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                d.*,
                o.nombre_oficina,
                o.codigo_oficina,
                dep.nombre_dependencia,
                dep.codigo_dependencia,
                s.nombre_serie,
                s.codigo_serie,
                ss.nombre_subserie,
                ss.codigo_subserie,
                u.nombre_completo as usuario_radicador,
                e.id as id_expediente,
                e.nombre_expediente,
                ed.orden_foliado,
                COALESCE(car.codigo_carpeta, car_exp.codigo_carpeta) as codigo_carpeta,
                COALESCE(car.descripcion, car_exp.descripcion) as descripcion_carpeta,
                COALESCE(car.id, car_exp.id) as carpeta_id,
                car_exp.paquete as carpeta_paquete,
                car_exp.tomo as carpeta_tomo,
                car_exp.modulo as carpeta_modulo,
                car_exp.estante as carpeta_estante,
                car_exp.entrepaño as carpeta_entrepaño,
                car_exp.otro as carpeta_otro
            FROM documentos d
            LEFT JOIN oficinas_productoras o ON d.id_oficina_productora = o.id
            LEFT JOIN dependencias dep ON o.id_dependencia = dep.id
            LEFT JOIN trd_series s ON d.id_serie = s.id
            LEFT JOIN trd_subseries ss ON d.id_subserie = ss.id
            LEFT JOIN usuarios u ON d.id_usuario_radicador = u.id
            LEFT JOIN expediente_documentos ed ON d.id = ed.id_documento
            LEFT JOIN expedientes e ON ed.id_expediente = e.id
            LEFT JOIN carpetas car ON d.id_carpeta = car.id
            LEFT JOIN carpetas car_exp ON car_exp.id_expediente = e.id
            WHERE d.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Documento no encontrado' });
        }

        const documento = rows[0];

        // Obtener campos personalizados del documento
        const [camposPersonalizados] = await pool.query(`
            SELECT cp.nombre_campo, cp.tipo_campo, ddp.valor
            FROM documento_datos_personalizados ddp
            JOIN oficina_campos_personalizados cp ON ddp.id_campo = cp.id
            WHERE ddp.id_documento = ?
        `, [id]);

        documento.campos_personalizados = camposPersonalizados;

        res.json(documento);
    } catch (error) {
        console.error("Error al obtener documento:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

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
    try {
        const {
            asunto, tipo_soporte, ubicacion_fisica,
            id_oficina_productora, id_serie, id_subserie,
            remitente_nombre, remitente_identificacion, remitente_direccion,
            customData,
            id_carpeta, paquete, tomo, modulo, entrepaño, estante, otro
        } = req.body;

        const archivo = req.file;
        const id_usuario_creador = req.user.id;

        // Validaciones básicas antes de llamar al servicio
        if (tipo_soporte === 'Electrónico' || tipo_soporte === 'Híbrido') {
            if (!archivo) {
                return res.status(400).json({ msg: 'Debe adjuntar un archivo para el soporte electrónico o híbrido.' });
            }
        }

        if ((tipo_soporte === 'Físico' || tipo_soporte === 'Híbrido')) {
            // Validar que se provea AL MENOS UN dato de ubicación
            const hasLocation = id_carpeta ||
                (ubicacion_fisica && ubicacion_fisica.trim() !== '') ||
                (otro && otro.trim() !== '') ||
                (paquete && paquete.trim() !== '') ||
                (estante && estante.trim() !== '');

            if (!hasLocation) {
                return res.status(400).json({ msg: 'Debe especificar la ubicación física (Carpeta, Caja/Paquete, Estante, u Otro).' });
            }
        }

        const data = {
            asunto, tipo_soporte, ubicacion_fisica,
            id_oficina_productora, id_serie, id_subserie,
            remitente_nombre, remitente_identificacion, remitente_direccion,
            customData: JSON.parse(customData || '{}'),
            id_carpeta, paquete, tomo, modulo, entrepaño, estante, otro
        };

        const result = await documentoService.crearNuevoDocumento(data, archivo, id_usuario_creador);

        res.status(201).json({ msg: 'Documento radicado con éxito.', ...result });

    } catch (error) {
        console.error("Error al crear documento:", error);
        res.status(500).json({ msg: error.message || 'Error en el servidor al procesar la solicitud.' });
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
 * Crea un documento y lo vincula automáticamente a un expediente existente.
 * Endpoint: POST /documentos/con-expediente
 */
exports.createDocumentoConExpediente = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            asunto, tipo_soporte, ubicacion_fisica,
            id_oficina_productora, id_serie, id_subserie, id_expediente,
            remitente_nombre, remitente_identificacion, remitente_direccion,
            id_carpeta, paquete, tomo, modulo, entrepaño, estante, otro
        } = req.body;

        const archivo = req.file;
        const id_usuario_creador = req.user.id;

        // Validar que el expediente existe
        if (!id_expediente) {
            return res.status(400).json({ msg: 'El ID del expediente es obligatorio.' });
        }

        await connection.beginTransaction();

        // Verificar expediente
        const [expedienteRows] = await connection.query(
            'SELECT id, estado FROM expedientes WHERE id = ?',
            [id_expediente]
        );
        if (expedienteRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ msg: 'Expediente no encontrado.' });
        }
        if (expedienteRows[0].estado !== 'En trámite') {
            await connection.rollback();
            return res.status(400).json({ msg: 'Solo se pueden añadir documentos a expedientes en trámite.' });
        }

        let path_del_archivo = null;
        let nombre_archivo_original = null;

        if (tipo_soporte === 'Electrónico' || tipo_soporte === 'Híbrido') {
            if (!archivo) {
                await connection.rollback();
                return res.status(400).json({ msg: 'Debe adjuntar un archivo para el soporte electrónico o híbrido.' });
            }
            path_del_archivo = archivo.path;
            nombre_archivo_original = archivo.originalname;
        }

        if ((tipo_soporte === 'Físico' || tipo_soporte === 'Híbrido')) {
            const hasLocation = id_carpeta ||
                (ubicacion_fisica && ubicacion_fisica.trim() !== '') ||
                (otro && otro.trim() !== '') ||
                (paquete && paquete.trim() !== '') ||
                (estante && estante.trim() !== '');

            if (!hasLocation) {
                await connection.rollback();
                return res.status(400).json({ msg: 'Debe especificar la ubicación física.' });
            }
        }

        // === Auto-asignar carpeta del expediente ===
        // Buscar carpeta del expediente; si no existe, crearla automáticamente
        let id_carpeta_final = id_carpeta || null;

        if (!id_carpeta_final) {
            // Buscar carpeta vinculada al expediente
            const [carpetaExp] = await connection.query(
                'SELECT id FROM carpetas WHERE id_expediente = ? AND estado = ? LIMIT 1',
                [id_expediente, 'Abierta']
            );
            if (carpetaExp.length > 0) {
                id_carpeta_final = carpetaExp[0].id;
            } else {
                // No existe carpeta → crearla automáticamente
                const carpetaService = require('../services/carpeta.service');
                const [serieData] = await connection.query(
                    'SELECT s.id_oficina_productora FROM trd_series s JOIN expedientes e ON e.id_serie = s.id WHERE e.id = ?',
                    [id_expediente]
                );
                if (serieData.length > 0) {
                    const [expInfo] = await connection.query('SELECT nombre_expediente FROM expedientes WHERE id = ?', [id_expediente]);
                    try {
                        const nuevaCarpeta = await carpetaService.crearCarpeta({
                            id_oficina: serieData[0].id_oficina_productora,
                            descripcion: `Carpeta del expediente ${expInfo[0].nombre_expediente}`,
                            capacidad_maxima: 200,
                            id_expediente: id_expediente
                        }, connection);
                        id_carpeta_final = nuevaCarpeta.id;
                        console.log(`Carpeta auto-creada: ${nuevaCarpeta.codigo_carpeta} para expediente ${id_expediente}`);
                    } catch (err) {
                        console.error('Error al auto-crear carpeta:', err.message);
                    }
                }
            }
        }

        // Verificación de carpeta (capacidad y estado)
        if (id_carpeta_final) {
            const [carpetaRows] = await connection.query('SELECT cantidad_actual, capacidad_maxima, estado FROM carpetas WHERE id = ? FOR UPDATE', [id_carpeta_final]);

            if (carpetaRows.length === 0) {
                await connection.rollback();
                return res.status(400).json({ msg: 'La carpeta especificada no existe.' });
            }
            const carpeta = carpetaRows[0];

            if (carpeta.estado === 'Cerrada') {
                await connection.rollback();
                return res.status(400).json({ msg: 'La carpeta especificada está cerrada.' });
            }

            if (carpeta.cantidad_actual >= carpeta.capacidad_maxima) {
                await connection.rollback();
                return res.status(400).json({ msg: `La carpeta ha alcanzado su capacidad máxima (${carpeta.capacidad_maxima}).` });
            }

            await connection.query('UPDATE carpetas SET cantidad_actual = cantidad_actual + 1 WHERE id = ?', [id_carpeta_final]);
        }

        // Generar radicado
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

        // Insertar documento
        const [result] = await connection.query(
            `INSERT INTO documentos (
                radicado, asunto, tipo_soporte, ubicacion_fisica, path_archivo,
                nombre_archivo_original, id_oficina_productora, id_serie, id_subserie, 
                remitente_nombre, remitente_identificacion, remitente_direccion, id_usuario_radicador,
                id_carpeta, paquete, tomo, modulo, entrepaño, estante, otro
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                radicado, asunto, tipo_soporte, ubicacion_fisica || null, path_del_archivo,
                nombre_archivo_original, id_oficina_productora, id_serie, id_subserie || null,
                remitente_nombre || null, remitente_identificacion || null, remitente_direccion || null, id_usuario_creador,
                id_carpeta_final || null, paquete || null, tomo || null, modulo || null, entrepaño || null, estante || null, otro || null
            ]
        );
        const newDocumentId = result.insertId;

        // Vincular al expediente
        const [maxFolio] = await connection.query(
            'SELECT COALESCE(MAX(orden_foliado), 0) + 1 as next_folio FROM expediente_documentos WHERE id_expediente = ?',
            [id_expediente]
        );
        await connection.query(
            `INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado, requiere_firma)
             VALUES (?, ?, ?, ?)`,
            [id_expediente, newDocumentId, maxFolio[0].next_folio, false]
        );

        await connection.commit();
        res.status(201).json({
            msg: 'Documento creado y añadido al expediente.',
            radicado: radicado,
            id: newDocumentId,
            folio: maxFolio[0].next_folio
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error al crear documento con expediente:", error);
        res.status(500).json({ msg: 'Error en el servidor al procesar la solicitud.' });
    } finally {
        connection.release();
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

/**
 * Actualiza los datos de ubicación física de un documento.
 */
exports.updateDocumentoLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await documentoService.actualizarUbicacionDocumento(id, req.body, req.user.id);
        res.json(resultado);
    } catch (error) {
        console.error("Error al actualizar ubicación del documento:", error);
        res.status(error.statusCode || 500).json({ msg: error.message || 'Error al actualizar ubicación.' });
    }
};