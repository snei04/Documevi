import api from './axios';

/**
 * Obtiene los datos detallados de un expediente junto con información relacionada.
 * @param {number|string} id - ID del expediente a consultar
 * @returns {Object} payload - Objeto con el expediente y datos adicionales
 * @returns {Object} payload.expediente - Datos del expediente
 * @returns {Array} [payload.documentosDisponibles] - Lista de documentos (si tiene permisos)
 * @returns {Array} [payload.workflows] - Lista de workflows disponibles
 * @returns {Array} [payload.plantillas] - Lista de plantillas disponibles
 * @returns {Array} [payload.customFields] - Campos personalizados de la oficina
 * @returns {Object} [payload.customData] - Datos personalizados del expediente
 */
export const getExpedienteDetallado = async (id) => {
    // Obtener datos básicos del expediente
    const res = await api.get(`/expedientes/${id}`);
    const expediente = res.data;
    let payload = { expediente };

    // Si el usuario no tiene vista restringida, cargar datos adicionales
    if (expediente.vista !== 'solicitante_restringido') {
        // Cargar en paralelo: documentos, workflows y plantillas
        const [docs, wfs, plantillas] = await Promise.all([
            api.get('/documentos'),
            api.get('/workflows'),
            api.get('/plantillas')
        ]);
        payload.documentosDisponibles = docs.data;
        payload.workflows = wfs.data;
        payload.plantillas = plantillas.data;

        // Si el expediente tiene serie asignada, cargar campos personalizados
        if (expediente.id_serie) {
            const resSeries = await api.get('/series');
            const serie = resSeries.data.find(s => s.id === expediente.id_serie);
            if (serie) {
                // Obtener campos personalizados de la oficina y datos custom del expediente
                const [campos, customData] = await Promise.all([
                    api.get(`/campos-personalizados/oficina/${serie.id_oficina_productora}`),
                    api.get(`/expedientes/${id}/custom-data`)
                ]);
                payload.customFields = campos.data;
                payload.customData = customData.data;
            }
        }
    }
    return payload;
};

/**
 * Cierra un expediente cambiando su estado a cerrado.
 * @param {number|string} id - ID del expediente a cerrar
 * @returns {Promise} Respuesta de la API
 */
export const cerrarExpediente = (id) => {
    return api.put(`/expedientes/${id}/cerrar`);
};

/**
 * Firma digitalmente un documento con una imagen de firma.
 * @param {number|string} docId - ID del documento a firmar
 * @param {string} firma_imagen - Imagen de la firma en formato base64
 * @returns {Promise} Respuesta de la API con el documento firmado
 */
export const firmarDocumento = (docId, firma_imagen) => {
    return api.post(`/documentos/${docId}/firmar`, { firma_imagen });
};

/**
 * Solicita el préstamo de un expediente.
 * @param {number|string} id_expediente - ID del expediente a solicitar en préstamo
 * @param {Object} formData - Datos adicionales del formulario de solicitud
 * @returns {Promise} Respuesta de la API con la solicitud creada
 */
export const solicitarPrestamo = (id_expediente, formData) => {
    return api.post('/prestamos', { id_expediente, ...formData });
};