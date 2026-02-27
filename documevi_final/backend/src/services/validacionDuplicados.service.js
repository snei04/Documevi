const pool = require('../config/db');

/**
 * Valida si existen expedientes duplicados basandose en campos personalizados
 * @param {Object} params - Parametros de validacion
 * @param {number} params.id_oficina - ID de la oficina productora
 * @param {Object} params.campos_personalizados - {id_campo: valor}
 * @returns {Object} - {duplicado: boolean, expediente_existente: Object|null, campo_duplicado: Object|null}
 */
exports.validarDuplicados = async ({ id_oficina, campos_personalizados }) => {

    const [camposValidacion] = await pool.query(`
        SELECT id, nombre_campo 
        FROM oficina_campos_personalizados 
        WHERE id_oficina = ? 
          AND validar_duplicidad = 1
    `, [id_oficina]);

    if (camposValidacion.length === 0) {
        return { duplicado: false, expediente_existente: null, campo_duplicado: null };
    }

    for (const campo of camposValidacion) {
        const valorIngresado = campos_personalizados[campo.id];

        if (!valorIngresado || String(valorIngresado).trim() === '') continue;

        const [expedientesCoincidentes] = await pool.query(`
            SELECT 
                e.id,
                e.nombre_expediente,
                e.fecha_apertura,
                e.estado,
                e.disponibilidad,
                edp.valor as valor_campo,
                u.nombre_completo as responsable,
                s.nombre_serie,
                ss.nombre_subserie,
                p.numero_paquete,
                c.codigo_carpeta
            FROM expedientes e
            INNER JOIN expediente_datos_personalizados edp 
                ON e.id = edp.id_expediente
            LEFT JOIN usuarios u ON e.id_usuario_responsable = u.id
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN paquetes p ON e.id_paquete = p.id
            LEFT JOIN carpetas c ON c.id_expediente = e.id
            WHERE edp.id_campo = ?
              AND edp.valor = ?
              AND s.id_oficina_productora = ?
            LIMIT 1
        `, [campo.id, valorIngresado, id_oficina]);

        if (expedientesCoincidentes.length > 0) {
            return {
                duplicado: true,
                campo_duplicado: {
                    id: campo.id,
                    nombre: campo.nombre_campo,
                    valor: valorIngresado
                },
                expediente_existente: expedientesCoincidentes[0]
            };
        }
    }

    return { duplicado: false, expediente_existente: null, campo_duplicado: null };
};

/**
 * Anexa un documento a un expediente existente (flujo de duplicados)
 */
exports.anexarDocumentoAExpediente = async ({
    id_expediente,
    id_documento,
    fecha_apertura_documento,
    campo_validacion_id,
    valor_coincidencia,
    tipo_soporte,
    id_usuario,
    observaciones
}) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [expediente] = await connection.query(
            'SELECT id, estado, nombre_expediente, tipo_soporte FROM expedientes WHERE id = ?',
            [id_expediente]
        );

        if (expediente.length === 0) {
            throw { statusCode: 404, message: 'Expediente no encontrado' };
        }

        const estadoExp = expediente[0].estado;
        const soporteExp = expediente[0].tipo_soporte || 'Electrónico';
        const esCerrado = estadoExp === 'Cerrado en Gestión' || estadoExp === 'Cerrado en Central';

        // Expedientes electrónicos cerrados NO permiten anexar
        if (esCerrado && soporteExp !== 'Físico') {
            throw { statusCode: 400, message: 'No se pueden anexar documentos a expedientes electrónicos cerrados.' };
        }

        const [folioRows] = await connection.query(
            'SELECT MAX(orden_foliado) as max_folio FROM expediente_documentos WHERE id_expediente = ?',
            [id_expediente]
        );
        const nuevoFolio = (folioRows[0].max_folio || 0) + 1;

        await connection.query(
            'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado) VALUES (?, ?, ?)',
            [id_expediente, id_documento, nuevoFolio]
        );

        await connection.query(`
            INSERT INTO expediente_anexos_historial 
            (id_expediente, id_documento, fecha_apertura_documento, campo_validacion_id, 
             valor_coincidencia, tipo_soporte, id_usuario_anexo, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [id_expediente, id_documento, fecha_apertura_documento, campo_validacion_id,
            valor_coincidencia, tipo_soporte || 'Electronico', id_usuario, observaciones]);

        // Auditoría estándar de anexo
        await connection.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
            [id_usuario, 'ANEXO_DOCUMENTO_DUPLICADO',
                `Documento ${id_documento} anexado al expediente ${id_expediente} por coincidencia en campo ${campo_validacion_id}`]
        );

        // Auditoría especial si se anexó a un expediente cerrado (solo físico)
        if (esCerrado) {
            await connection.query(
                'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
                [id_usuario, 'ANEXO_EXPEDIENTE_CERRADO',
                    `Documento ${id_documento} anexado al expediente CERRADO ${id_expediente} (${expediente[0].nombre_expediente}). Estado: ${estadoExp}. Soporte: ${soporteExp}. Observaciones: ${observaciones || 'Ninguna'}`]
            );
        }

        await connection.commit();

        return {
            msg: 'Documento anexado exitosamente al expediente existente',
            orden_foliado: nuevoFolio,
            id_expediente,
            nombre_expediente: expediente[0].nombre_expediente
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
