const pool = require('../config/db');
const path = require('path');
const fs = require('fs/promises');
const puppeteer = require('puppeteer');

const { withTransaction } = require('../utils/transaction.util');
const { generarRadicado } = require('../utils/radicado.util');
const CustomError = require('../utils/CustomError');
const documentoService = require('./documento.service');

/**
 * Marks an expediente as closed if it is currently 'En trámite'.
 */
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

/**
 * Overwrites the custom data for a given expediente.
 */
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

/**
 * Generates a PDF document from a template and saves it.
 */

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