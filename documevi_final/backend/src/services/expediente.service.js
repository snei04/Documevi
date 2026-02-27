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
 * Crea un expediente con el nuevo flujo optimizado de 3 pasos.
 * Opcionalmente crea un documento vinculado al expediente (para soporte Físico).
 * 
 * Reglas de negocio:
 * BR-01: Display Name = [Serie] - [Subserie] - [CampoPersonalizado]
 * BR-02: Fechas según tipo de soporte (Físico=libre, Electrónico=CURRENT_TIMESTAMP + auditoría)
 * BR-03: Carpeta/Paquete solo para tipo Físico
 * 
 * @param {Object} data - Datos del expediente + customData + documento (opcional)
 * @param {number} userId - ID del usuario creador
 * @param {Object|null} archivo - Archivo subido (req.file), null si no aplica
 * @returns {Object} - Resultado con IDs creados
 */
exports.crearExpedienteCompleto = async (data, userId, archivo = null) => {
    const carpetaService = require('./carpeta.service');

    return withTransaction(pool, async (connection) => {
        const { expediente, customData, documento } = data;
        const tipo_soporte = expediente.tipo_soporte || 'Electrónico';

        // === PASO 1: Validar duplicados (segunda capa de seguridad en backend) ===
        if (customData && Object.keys(customData).length > 0) {
            const [serieData] = await connection.query(
                'SELECT id_oficina_productora FROM trd_series WHERE id = ?',
                [expediente.id_serie]
            );

            if (serieData.length > 0) {
                const id_oficina = serieData[0].id_oficina_productora;

                const [camposValidacion] = await connection.query(
                    'SELECT id, nombre_campo FROM oficina_campos_personalizados WHERE id_oficina = ? AND validar_duplicidad = 1',
                    [id_oficina]
                );

                for (const campo of camposValidacion) {
                    const valorIngresado = customData[campo.id];
                    if (!valorIngresado || String(valorIngresado).trim() === '') continue;

                    const [duplicados] = await connection.query(
                        `SELECT e.id, e.nombre_expediente 
                         FROM expedientes e
                         INNER JOIN expediente_datos_personalizados edp ON e.id = edp.id_expediente
                         INNER JOIN trd_series s ON e.id_serie = s.id
                         WHERE edp.id_campo = ? AND edp.valor = ? AND s.id_oficina_productora = ?
                         AND e.estado != 'Cerrado en Central'
                         LIMIT 1`,
                        [campo.id, valorIngresado, id_oficina]
                    );

                    if (duplicados.length > 0 && !expediente.forzar_creacion) {
                        throw new CustomError(
                            `Ya existe un expediente con el valor "${valorIngresado}" en el campo "${campo.nombre_campo}": ${duplicados[0].nombre_expediente}`,
                            409
                        );
                    }
                }
            }
        }

        // === PASO 2: Generar radicado (BR-01) ===
        const codigoExpediente = await generarRadicadoExpediente(connection);

        // BR-01: Display Name = [Serie] - [Subserie] - [CampoPersonalizado]
        let displayName = codigoExpediente; // Fallback
        const [serieInfo] = await connection.query(
            'SELECT nombre_serie FROM trd_series WHERE id = ?', [expediente.id_serie]
        );
        const serieName = serieInfo.length > 0 ? serieInfo[0].nombre_serie : '';

        let subserieName = '';
        if (expediente.id_subserie) {
            const [subserieInfo] = await connection.query(
                'SELECT nombre_subserie FROM trd_subseries WHERE id = ?', [expediente.id_subserie]
            );
            subserieName = subserieInfo.length > 0 ? subserieInfo[0].nombre_subserie : '';
        }

        // Obtener el primer campo personalizado con valor para el display name
        let campoPersonalizadoValor = '';
        if (customData && Object.keys(customData).length > 0) {
            const primerCampoId = Object.keys(customData)[0];
            campoPersonalizadoValor = customData[primerCampoId] || '';
        }

        // Construir display name: [Serie] - [Subserie] - [CampoPersonalizado]
        const partes = [serieName, subserieName, campoPersonalizadoValor].filter(p => p.trim());
        displayName = partes.length > 0 ? partes.join(' - ') : codigoExpediente;

        // === PASO 3: BR-02 — Resolver fechas según tipo de soporte ===
        let fechaApertura = null;
        let fechaCierre = null;
        let registrarAuditoriaFecha = false;
        let fechaOriginalServidor = null;

        if (tipo_soporte === 'Físico') {
            fechaApertura = expediente.fecha_apertura || null;
            fechaCierre = expediente.fecha_cierre || null;
        } else {
            fechaOriginalServidor = new Date();

            if (expediente.fecha_apertura) {
                const fechaUsuario = new Date(expediente.fecha_apertura);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fechaUsuario.setHours(0, 0, 0, 0);

                if (fechaUsuario.getTime() !== hoy.getTime()) {
                    registrarAuditoriaFecha = true;
                    fechaApertura = expediente.fecha_apertura;
                } else {
                    fechaApertura = null;
                }
            }
        }

        // === PASO 4: Crear el expediente ===
        let insertQuery, insertParams;

        if (fechaApertura) {
            insertQuery = `INSERT INTO expedientes 
                (nombre_expediente, codigo_expediente, id_serie, id_subserie, 
                 descriptor_1, descriptor_2, tipo_soporte, asunto, 
                 fecha_apertura, fecha_cierre, observaciones, id_usuario_responsable)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            insertParams = [
                displayName, codigoExpediente,
                expediente.id_serie, expediente.id_subserie || null,
                expediente.descriptor_1 || null, expediente.descriptor_2 || null,
                tipo_soporte, expediente.asunto || null,
                fechaApertura, fechaCierre,
                expediente.observaciones || null, userId
            ];
        } else {
            insertQuery = `INSERT INTO expedientes 
                (nombre_expediente, codigo_expediente, id_serie, id_subserie, 
                 descriptor_1, descriptor_2, tipo_soporte, asunto, 
                 fecha_cierre, observaciones, id_usuario_responsable)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            insertParams = [
                displayName, codigoExpediente,
                expediente.id_serie, expediente.id_subserie || null,
                expediente.descriptor_1 || null, expediente.descriptor_2 || null,
                tipo_soporte, expediente.asunto || null,
                fechaCierre, expediente.observaciones || null, userId
            ];
        }

        const [expedienteResult] = await connection.query(insertQuery, insertParams);
        const nuevoExpedienteId = expedienteResult.insertId;

        // === PASO 5: Guardar datos personalizados del expediente ===
        if (customData && Object.keys(customData).length > 0) {
            const values = Object.entries(customData).map(([id_campo, valor]) => [nuevoExpedienteId, id_campo, valor]);
            await connection.query(
                'INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES ?',
                [values]
            );
        }

        // === PASO 6: BR-03 — Ubicación física solo para soporte Físico ===
        let carpetaGeneradaInfo = null;
        let paqueteAsignado = null;

        if (tipo_soporte === 'Físico') {
            let id_oficina = null;
            const [serieDoc] = await connection.query(
                'SELECT id_oficina_productora FROM trd_series WHERE id = ?',
                [expediente.id_serie]
            );
            if (serieDoc.length > 0) id_oficina = serieDoc[0].id_oficina_productora;

            // Crear carpeta automática
            if (id_oficina) {
                const carpetaData = {
                    id_oficina: id_oficina,
                    descripcion: `Carpeta del expediente ${codigoExpediente}`,
                    capacidad_maxima: 200,
                    id_expediente: nuevoExpedienteId
                };

                try {
                    carpetaGeneradaInfo = await carpetaService.crearCarpeta(carpetaData, connection);
                } catch (err) {
                    console.error('Error al crear carpeta automática:', err.message);
                }
            }

            // Asignar al paquete activo automáticamente
            try {
                const paqueteService = require('./paquete.service');
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
                    paqueteAsignado = paqueteActivo;
                }
            } catch (err) {
                console.error('Error al asignar paquete automáticamente:', err.message);
            }
        }

        // === PASO 7: Crear documento si se incluyó ===
        let documentoCreado = null;

        if (documento && documento.asunto) {
            const radicadoDoc = await generarRadicado();

            let pathArchivo = null;
            let nombreArchivoOriginal = null;

            if (archivo) {
                pathArchivo = archivo.path;
                nombreArchivoOriginal = archivo.originalname;
            }

            // Obtener id_oficina para el documento
            const [serieOficina] = await connection.query(
                'SELECT id_oficina_productora FROM trd_series WHERE id = ?',
                [expediente.id_serie]
            );
            const idOficinaDoc = serieOficina.length > 0 ? serieOficina[0].id_oficina_productora : null;

            // Insertar documento
            const [docResult] = await connection.query(
                `INSERT INTO documentos 
                (radicado, asunto, tipo_soporte, path_archivo, nombre_archivo_original,
                 id_oficina_productora, id_serie, id_subserie, id_usuario_radicador,
                 id_carpeta)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    radicadoDoc,
                    documento.asunto,
                    documento.tipo_soporte || 'Físico',
                    pathArchivo,
                    nombreArchivoOriginal,
                    idOficinaDoc,
                    expediente.id_serie,
                    expediente.id_subserie || null,
                    userId,
                    carpetaGeneradaInfo ? carpetaGeneradaInfo.id : null
                ]
            );

            const nuevoDocId = docResult.insertId;

            // Vincular documento al expediente con folio #1
            await connection.query(
                'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado) VALUES (?, ?, ?)',
                [nuevoExpedienteId, nuevoDocId, 1]
            );

            // Incrementar cantidad de la carpeta si existe
            if (carpetaGeneradaInfo) {
                await connection.query(
                    'UPDATE carpetas SET cantidad_actual = cantidad_actual + 1 WHERE id = ?',
                    [carpetaGeneradaInfo.id]
                );
            }

            documentoCreado = {
                id: nuevoDocId,
                radicado: radicadoDoc,
                asunto: documento.asunto,
                tipo_soporte: documento.tipo_soporte || 'Físico'
            };
        }

        // === PASO 8: Auditoría ===
        let detallesAuditoria = `Expediente ${nuevoExpedienteId} (${codigoExpediente}) creado. Tipo: ${tipo_soporte}. Display: ${displayName}`;
        if (documentoCreado) {
            detallesAuditoria += `. Documento ${documentoCreado.radicado} vinculado con folio #1.`;
        }

        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [userId, 'CREACION_EXPEDIENTE_COMPLETO', detallesAuditoria]
        );

        // BR-02: Auditoría si el usuario modificó la fecha de apertura en soporte Electrónico
        if (registrarAuditoriaFecha) {
            await connection.query(
                'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
                [userId, 'MODIFICACION_FECHA_APERTURA',
                    `Usuario modificó fecha de apertura del expediente ${nuevoExpedienteId}. Fecha servidor: ${fechaOriginalServidor.toISOString()}. Fecha ingresada: ${fechaApertura}`]
            );
        }

        return {
            msg: 'Expediente creado con éxito.',
            expediente: {
                id: nuevoExpedienteId,
                nombre: displayName,
                codigo: codigoExpediente,
                tipo_soporte
            },
            carpeta: carpetaGeneradaInfo,
            paquete: paqueteAsignado ? {
                id: paqueteAsignado.id,
                numero_paquete: paqueteAsignado.numero_paquete
            } : null,
            documento: documentoCreado
        };
    });
};