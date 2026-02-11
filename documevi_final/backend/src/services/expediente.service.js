const pool = require('../config/db');
const path = require('path');
const fs = require('fs/promises');
const puppeteer = require('puppeteer');

const { withTransaction } = require('../utils/transaction.util');
const { generarRadicado, generarRadicadoExpediente } = require('../utils/radicado.util');
const CustomError = require('../utils/CustomError');
const documentoService = require('./documento.service');

// Crear un nuevo expediente
exports.cerrarExpediente = async (id_expediente, id_usuario_accion) => {
    return withTransaction(pool, async (connection) => {
        const [expedientes] = await connection.query("SELECT estado FROM expedientes WHERE id = ?", [id_expediente]);

        if (expedientes.length === 0) {
            throw new CustomError('Expediente no encontrado.', 404);
        }
        if (expedientes[0].estado !== 'En trámite') {
            throw new CustomError('Solo se pueden cerrar expedientes que están "En trámite".', 400);
        }

        await connection.query(
            "UPDATE expedientes SET estado = 'Cerrado en Gestión', fecha_cierre = NOW() WHERE id = ?",
            [id_expediente]
        );

        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [id_usuario_accion, 'CIERRE_EXPEDIENTE', `El usuario cerró el expediente con ID ${id_expediente}`]
        );

        return { msg: 'Expediente cerrado con éxito.' };
    });
};

// Guardar datos personalizados de un expediente
exports.guardarDatosPersonalizados = async (id_expediente, customData) => {
    return withTransaction(pool, async (connection) => {
        await connection.query('DELETE FROM expediente_datos_personalizados WHERE id_expediente = ?', [id_expediente]);

        const values = Object.entries(customData).map(([id_campo, valor]) => [id_expediente, id_campo, valor]);
        if (values.length > 0) {
            await connection.query('INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES ?', [values]);
        }

        return { msg: 'Datos personalizados guardados con éxito.' };
    });
};

// Actualizar fechas de un expediente
exports.actualizarFechasExpediente = async (id_expediente, fechas, id_usuario_accion) => {
    return withTransaction(pool, async (connection) => {
        const { fecha_apertura, fecha_cierre } = fechas;

        // Validaciones
        if (!fecha_apertura) {
            throw new CustomError('La fecha de apertura es obligatoria.', 400);
        }

        const fechaInicio = new Date(fecha_apertura);
        const fechaFin = fecha_cierre ? new Date(fecha_cierre) : null;

        if (fechaFin && fechaFin < fechaInicio) {
            throw new CustomError('La fecha de cierre no puede ser anterior a la fecha de apertura.', 400);
        }

        // Obtener datos actuales para historial
        const [actuales] = await connection.query(
            "SELECT fecha_apertura, fecha_cierre FROM expedientes WHERE id = ?",
            [id_expediente]
        );

        if (actuales.length === 0) {
            throw new CustomError('Expediente no encontrado.', 404);
        }

        // Actualizar fechas
        await connection.query(
            "UPDATE expedientes SET fecha_apertura = ?, fecha_cierre = ? WHERE id = ?",
            [fecha_apertura, fecha_cierre || null, id_expediente]
        );

        // Auditoría
        const detalles = `Modificación de fechas. Anterior: Inicio=${actuales[0].fecha_apertura}, Cierre=${actuales[0].fecha_cierre}. Nuevo: Inicio=${fecha_apertura}, Cierre=${fecha_cierre}`;

        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [id_usuario_accion, 'EDICION_FECHAS_EXPEDIENTE', detalles]
        );

        return { msg: 'Fechas actualizadas con éxito.' };
    });
};
// Generar un documento desde una plantilla y añadirlo a un expediente
exports.generarYAnadirDocumentoAExpediente = async (expedienteId, data, id_usuario_radicador) => {
    return withTransaction(pool, async (connection) => {

        const nuevoDocumento = await documentoService.generarDocumentoDesdePlantilla(data, id_usuario_radicador, connection);


        const [folioRows] = await connection.query(
            'SELECT MAX(orden_foliado) as max_folio FROM expediente_documentos WHERE id_expediente = ?',
            [expedienteId]
        );
        const nuevoFolio = (folioRows[0].max_folio || 0) + 1;

        await connection.query(
            'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado) VALUES (?, ?, ?)',
            [expedienteId, nuevoDocumento.id, nuevoFolio]
        );

        return { msg: 'Documento generado y añadido al expediente con éxito.', radicado: nuevoDocumento.radicado };
    });
};

/**
 * Crea un expediente completo con documento (opcional) en una transacción atómica.
 * @param {Object} data - Datos del expediente y documento
 * @param {Object} archivo - Archivo subido (multer) si aplica
 * @param {number} userId - ID del usuario creador
 * @returns {Object} - Resultado con IDs creados
 */
exports.crearExpedienteCompleto = async (data, archivo, userId) => {
    const validacionService = require('./validacionDuplicados.service');
    const carpetaService = require('./carpeta.service');

    return withTransaction(pool, async (connection) => {
        const { expediente, customData, documento } = data;

        // === PASO 1: Validar duplicados si hay campos personalizados ===
        if (customData && Object.keys(customData).length > 0) {
            // Obtener id_oficina desde la serie
            const [serieData] = await connection.query(
                'SELECT id_oficina_productora FROM trd_series WHERE id = ?',
                [expediente.id_serie]
            );

            if (serieData.length > 0) {
                const id_oficina = serieData[0].id_oficina_productora;

                // Obtener campos con validación de duplicidad
                const [camposValidacion] = await connection.query(
                    'SELECT id, nombre_campo FROM oficina_campos_personalizados WHERE id_oficina = ? AND validar_duplicidad = 1',
                    [id_oficina]
                );

                // Validar cada campo
                for (const campo of camposValidacion) {
                    const valorIngresado = customData[campo.id];
                    if (!valorIngresado || String(valorIngresado).trim() === '') continue;

                    const [duplicados] = await connection.query(
                        `SELECT e.id, e.nombre_expediente 
                         FROM expedientes e
                         INNER JOIN expediente_datos_personalizados edp ON e.id = edp.id_expediente
                         INNER JOIN trd_series s ON e.id_serie = s.id
                         WHERE edp.id_campo = ? AND edp.valor = ? AND s.id_oficina_productora = ?
                         LIMIT 1`,
                        [campo.id, valorIngresado, id_oficina]
                    );

                    if (duplicados.length > 0) {
                        throw new CustomError(
                            `Ya existe un expediente con el valor "${valorIngresado}" en el campo "${campo.nombre_campo}": ${duplicados[0].nombre_expediente}`,
                            409
                        );
                    }
                }
            }
        }

        // === PASO 2: Generar radicado y crear el expediente ===
        const radicadoExpediente = await generarRadicadoExpediente(connection);

        const [expedienteResult] = await connection.query(
            `INSERT INTO expedientes (nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, id_usuario_responsable)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                radicadoExpediente, // Radicado auto-generado como nombre único
                expediente.id_serie,
                expediente.id_subserie || null,
                expediente.descriptor_1 || null,
                expediente.descriptor_2 || null,
                userId
            ]
        );
        const nuevoExpedienteId = expedienteResult.insertId;

        // === PASO 3: Guardar datos personalizados del expediente ===
        if (customData && Object.keys(customData).length > 0) {
            const values = Object.entries(customData).map(([id_campo, valor]) => [nuevoExpedienteId, id_campo, valor]);
            await connection.query(
                'INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES ?',
                [values]
            );
        }

        // === PASO 3.5: Crear Carpeta Automática (SIEMPRE) ===
        // Cada expediente DEBE tener exactamente una carpeta con número único.
        // La carpeta es la llave que almacena la ubicación física.
        let idCarpetaGenerada = null;
        let carpetaGeneradaInfo = null;

        {
            let id_oficina = null;
            const [serieDoc] = await connection.query(
                'SELECT id_oficina_productora FROM trd_series WHERE id = ?',
                [expediente.id_serie]
            );
            if (serieDoc.length > 0) id_oficina = serieDoc[0].id_oficina_productora;

            if (id_oficina) {
                const carpetaData = {
                    id_oficina: id_oficina,
                    descripcion: `Carpeta del expediente ${radicadoExpediente}`,
                    capacidad_maxima: 200,
                    id_caja: (documento && documento.id_caja_seleccionada) || null,
                    id_expediente: nuevoExpedienteId
                };

                try {
                    const nuevaCarpeta = await carpetaService.crearCarpeta(carpetaData, connection);
                    idCarpetaGenerada = nuevaCarpeta.id;
                    carpetaGeneradaInfo = nuevaCarpeta;
                } catch (err) {
                    console.error('Error al crear carpeta automática:', err.message);
                }
            }

            // === PASO 3.6: Asignar al paquete activo de la oficina automáticamente ===
            try {
                const paqueteService = require('./paquete.service');
                // Ya no requiere id_oficina, obtiene el paquete activo global
                const paqueteActivo = await paqueteService.obtenerPaqueteActivo();
                if (paqueteActivo) {
                    await connection.query(
                        'UPDATE expedientes SET id_paquete = ? WHERE id = ?',
                        [paqueteActivo.id, nuevoExpedienteId]
                    );
                    await connection.query(
                        'UPDATE paquetes SET expedientes_actuales = expedientes_actuales + 1 WHERE id = ?',
                        [paqueteActivo.id]
                    );
                }
            } catch (err) {
                console.error('Error al asignar paquete automáticamente:', err.message);
            }
        }

        let documentoCreado = null;

        // === PASO 4: Manejo de documento ===
        if (documento && documento.opcion !== 'ninguno') {

            if (documento.opcion === 'crear') {
                // Crear nuevo documento
                const tipo_soporte = documento.tipo_soporte;

                // Validaciones según tipo de soporte
                if ((tipo_soporte === 'Electrónico' || tipo_soporte === 'Híbrido') && !archivo) {
                    throw new CustomError('Debe adjuntar un archivo para el soporte electrónico o híbrido.', 400);
                }

                // Validación de ubicación física: Carpeta o Texto manual
                if ((tipo_soporte === 'Físico' || tipo_soporte === 'Híbrido')) {
                    if (!idCarpetaGenerada && !documento.id_carpeta && !documento.ubicacion_fisica) {
                        throw new CustomError('Debe especificar la ubicación física (o crear carpeta) para el soporte físico o híbrido.', 400);
                    }
                }

                // Generar radicado
                const today = new Date();
                const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
                const [lastRadicado] = await connection.query(
                    "SELECT MAX(CAST(SUBSTRING_INDEX(radicado, '-', -1) AS UNSIGNED)) as last_seq FROM documentos WHERE radicado LIKE ?",
                    [`${datePrefix}-%`]
                );
                const newSequence = (lastRadicado[0].last_seq || 0) + 1;
                const radicado = `${datePrefix}-${String(newSequence).padStart(4, '0')}`;

                // Obtener id_oficina para el documento desde la serie
                const [serieDoc] = await connection.query(
                    'SELECT id_oficina_productora FROM trd_series WHERE id = ?',
                    [expediente.id_serie]
                );
                const id_oficina_productora = serieDoc.length > 0 ? serieDoc[0].id_oficina_productora : null;

                // Insertar documento
                const [docResult] = await connection.query(
                    `INSERT INTO documentos (
                        radicado, asunto, tipo_soporte, ubicacion_fisica, path_archivo,
                        nombre_archivo_original, id_oficina_productora, id_serie, id_subserie,
                        remitente_nombre, remitente_identificacion, remitente_direccion, id_usuario_radicador,
                        id_carpeta, paquete, tomo, modulo, entrepaño, estante, otro
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        radicado,
                        documento.asunto || expediente.nombre_expediente,
                        tipo_soporte,
                        documento.ubicacion_fisica || (carpetaGeneradaInfo ? `Carpeta ${carpetaGeneradaInfo.codigo_carpeta}` : null),
                        archivo ? archivo.path : null,
                        archivo ? archivo.originalname : null,
                        id_oficina_productora,
                        expediente.id_serie,
                        expediente.id_subserie || null,
                        documento.remitente_nombre || null,
                        documento.remitente_identificacion || null,
                        documento.remitente_direccion || null,
                        userId,
                        idCarpetaGenerada || documento.id_carpeta || null,
                        carpetaGeneradaInfo ? carpetaGeneradaInfo.paquete : (documento.paquete || null),
                        documento.tomo || null,
                        carpetaGeneradaInfo ? carpetaGeneradaInfo.modulo : (documento.modulo || null),
                        carpetaGeneradaInfo ? carpetaGeneradaInfo.entrepaño : (documento.entrepaño || null),
                        carpetaGeneradaInfo ? carpetaGeneradaInfo.estante : (documento.estante || null),
                        documento.otro || null
                    ]
                );

                documentoCreado = { id: docResult.insertId, radicado };

            } else if (documento.opcion === 'relacionar' && documento.id_documento_existente) {
                // Relacionar documento existente
                const docIds = Array.isArray(documento.id_documento_existente)
                    ? documento.id_documento_existente
                    : [documento.id_documento_existente];

                for (const docId of docIds) {
                    // Verificar que el documento existe
                    const [docExiste] = await connection.query('SELECT id FROM documentos WHERE id = ?', [docId]);
                    if (docExiste.length === 0) {
                        throw new CustomError(`El documento con ID ${docId} no existe.`, 404);
                    }
                }

                documentoCreado = { ids: docIds, relacionados: true };
            }

            // === PASO 5: Vincular documento(s) al expediente ===
            if (documentoCreado) {
                const docIds = documentoCreado.ids || [documentoCreado.id];

                for (let i = 0; i < docIds.length; i++) {
                    const [folioRows] = await connection.query(
                        'SELECT MAX(orden_foliado) as max_folio FROM expediente_documentos WHERE id_expediente = ?',
                        [nuevoExpedienteId]
                    );
                    const nuevoFolio = (folioRows[0].max_folio || 0) + 1;

                    await connection.query(
                        'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado) VALUES (?, ?, ?)',
                        [nuevoExpedienteId, docIds[i], nuevoFolio]
                    );
                }
            }
        }

        // === PASO 6: Auditoría ===
        const detalles = documentoCreado
            ? `Expediente ${nuevoExpedienteId} creado con documento ${documentoCreado.radicado || JSON.stringify(documentoCreado.ids)}`
            : `Expediente ${nuevoExpedienteId} creado sin documentos`;

        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [userId, 'CREACION_EXPEDIENTE_COMPLETO', detalles]
        );

        return {
            msg: 'Expediente creado con éxito.',
            expediente: { id: nuevoExpedienteId, nombre: expediente.nombre_expediente },
            documento: documentoCreado,
            carpeta: carpetaGeneradaInfo // Devolver info de carpeta si se creó
        };
    });
};