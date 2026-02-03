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
/**
 * Obtiene la lista de expedientes con paginación y filtros.
 * @param {Object} params - Parámetros de consulta (page, limit, search, estado, serie)
 * @returns {Promise} Respuesta de la API con { data, meta }
 */
export const getExpedientes = (params = {}) => {
    // Convertir objeto de parametros a query string
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/expedientes?${queryParams}`);
};

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

    // Si el usuario tiene vista restringida, solo devolver el expediente básico
    if (expediente.vista === 'solicitante_restringido') {
        return payload;
    }

    // Para otras vistas, intentar cargar datos adicionales con manejo de errores
    try {
        // Cargar en paralelo: documentos, workflows y plantillas
        const results = await Promise.allSettled([
            api.get('/documentos'),
            api.get('/workflows'),
            api.get('/plantillas')
        ]);

        // Solo asignar si la petición fue exitosa
        if (results[0].status === 'fulfilled') payload.documentosDisponibles = results[0].value.data;
        else payload.documentosDisponibles = [];

        if (results[1].status === 'fulfilled') payload.workflows = results[1].value.data;
        else payload.workflows = [];

        if (results[2].status === 'fulfilled') payload.plantillas = results[2].value.data;
        else payload.plantillas = [];

        // Si el expediente tiene serie asignada, cargar campos personalizados
        if (expediente.id_serie) {
            try {
                const resSeries = await api.get('/series');
                const serie = resSeries.data.find(s => s.id === expediente.id_serie);
                if (serie) {
                    const customResults = await Promise.allSettled([
                        api.get(`/campos-personalizados/oficina/${serie.id_oficina_productora}`),
                        api.get(`/expedientes/${id}/custom-data`)
                    ]);

                    if (customResults[0].status === 'fulfilled') payload.customFields = customResults[0].value.data;
                    else payload.customFields = [];

                    if (customResults[1].status === 'fulfilled') payload.customData = customResults[1].value.data;
                    else payload.customData = {};
                }
            } catch (e) {
                payload.customFields = [];
                payload.customData = {};
            }
        }
    } catch (e) {
        // Si falla la carga de datos adicionales, continuar con valores vacíos
        payload.documentosDisponibles = [];
        payload.workflows = [];
        payload.plantillas = [];
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
/**
 * Actualiza las fechas de apertura y cierre de un expediente.
 * @param {number|string} id_expediente - ID del expediente
 * @param {Object} fechas - Objeto con fecha_apertura y fecha_cierre
 * @returns {Promise} Respuesta de la API
 */
export const actualizarFechas = (id_expediente, fechas) => {
    return api.put(`/expedientes/${id_expediente}/fechas`, fechas);
};

export const solicitarPrestamo = (id_expediente, formData) => {
    return api.post('/prestamos', { id_expediente, ...formData });
};