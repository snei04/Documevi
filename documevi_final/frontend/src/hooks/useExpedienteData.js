import { useEffect } from 'react';
import api from '../api/axios';

export function useExpedienteData(id, dispatch) {
    useEffect(() => {
        const fetchExpediente = async () => {
            dispatch({ type: 'FETCH_START' });
            try {
                const res = await api.get(`/expedientes/${id}`);
                const expediente = res.data;
                let payload = { expediente };

                if (expediente.vista !== 'solicitante_restringido') {
                    const [resDocs, resWfs, resPlantillas] = await Promise.all([
                        api.get('/documentos'),
                        api.get('/workflows'),
                        api.get('/plantillas')
                    ]);
                    payload.documentosDisponibles = resDocs.data;
                    payload.workflows = resWfs.data;
                    payload.plantillas = resPlantillas.data;

                    if (expediente.id_serie) {
                        const resSeries = await api.get('/series');
                        const serieDelExpediente = resSeries.data.find(s => s.id === expediente.id_serie);
                        if (serieDelExpediente) {
                            const [resCampos, resCustomData] = await Promise.all([
                                api.get(`/campos-personalizados/oficina/${serieDelExpediente.id_oficina_productora}`),
                                api.get(`/expedientes/${id}/custom-data`)
                            ]);
                            payload.customFields = resCampos.data;
                            payload.customData = resCustomData.data;
                        }
                    }
                }
                
                dispatch({ type: 'FETCH_SUCCESS', payload });
            } catch (err) {
                const errorMsg = err.response?.data?.msg || 'No se pudo cargar la información del expediente o no tienes permiso para verlo.';
                dispatch({ type: 'FETCH_ERROR', payload: errorMsg });
            }
        };

        if (id) {
            fetchExpediente();
        }
    }, [id, dispatch]);
}