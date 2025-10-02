import api from './axios';

export const getExpedienteDetallado = async (id) => {
    const res = await api.get(`/expedientes/${id}`);
    const expediente = res.data;
    let payload = { expediente };

    if (expediente.vista !== 'solicitante_restringido') {
        const [docs, wfs, plantillas] = await Promise.all([
            api.get('/documentos'),
            api.get('/workflows'),
            api.get('/plantillas')
        ]);
        payload.documentosDisponibles = docs.data;
        payload.workflows = wfs.data;
        payload.plantillas = plantillas.data;

        if (expediente.id_serie) {
            const resSeries = await api.get('/series');
            const serie = resSeries.data.find(s => s.id === expediente.id_serie);
            if (serie) {
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

export const cerrarExpediente = (id) => {
    return api.put(`/expedientes/${id}/cerrar`);
};

export const firmarDocumento = (docId, firma_imagen) => {
    return api.post(`/documentos/${docId}/firmar`, { firma_imagen });
};

export const solicitarPrestamo = (id_expediente, formData) => {
    return api.post('/prestamos', { id_expediente, ...formData });
};