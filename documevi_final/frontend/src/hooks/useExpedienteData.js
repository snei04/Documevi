import { useEffect } from 'react';
import api from '../api/axios';

/**
 * Hook personalizado para cargar los datos completos de un expediente.
 * Gestiona la carga de datos del expediente y recursos relacionados según los permisos del usuario.
 * 
 * @param {number|string} id - ID del expediente a cargar
 * @param {Function} dispatch - Función dispatch del reducer para actualizar el estado
 * 
 * @dispatches {Object} FETCH_START - Indica inicio de carga
 * @dispatches {Object} FETCH_SUCCESS - Carga exitosa con payload de datos
 * @dispatches {Object} FETCH_ERROR - Error con mensaje descriptivo
 * 
 * @example
 * const [state, dispatch] = useReducer(expedienteReducer, initialState);
 * useExpedienteData(expedienteId, dispatch);
 */
export function useExpedienteData(id, dispatch) {
    useEffect(() => {
        /**
         * Función asíncrona que obtiene todos los datos del expediente.
         * Carga datos adicionales solo si el usuario tiene permisos suficientes.
         */
        const fetchExpediente = async () => {
            // Notificar inicio de carga al reducer
            dispatch({ type: 'FETCH_START' });
            try {
                // Obtener datos básicos del expediente
                const res = await api.get(`/expedientes/${id}`);
                const expediente = res.data;
                let payload = { expediente };

                // Si el usuario no tiene vista restringida, cargar recursos adicionales
                if (expediente.vista !== 'solicitante_restringido') {
                    // Cargar en paralelo: documentos, workflows y plantillas
                    const [resDocs, resWfs, resPlantillas] = await Promise.all([
                        api.get('/documentos'),
                        api.get('/workflows'),
                        api.get('/plantillas')
                    ]);
                    payload.documentosDisponibles = resDocs.data;
                    payload.workflows = resWfs.data;
                    payload.plantillas = resPlantillas.data;

                    // Si el expediente tiene serie asignada, cargar campos personalizados
                    if (expediente.id_serie) {
                        const resSeries = await api.get('/series');
                        const serieDelExpediente = resSeries.data.find(s => s.id === expediente.id_serie);
                        if (serieDelExpediente) {
                            // Obtener campos personalizados de la oficina productora y datos custom
                            const [resCampos, resCustomData] = await Promise.all([
                                api.get(`/campos-personalizados/oficina/${serieDelExpediente.id_oficina_productora}`),
                                api.get(`/expedientes/${id}/custom-data`)
                            ]);
                            payload.customFields = resCampos.data;
                            payload.customData = resCustomData.data;
                        }
                    }
                }
                
                // Notificar carga exitosa con todos los datos
                dispatch({ type: 'FETCH_SUCCESS', payload });
            } catch (err) {
                // Extraer mensaje de error de la respuesta o usar mensaje por defecto
                const errorMsg = err.response?.data?.msg || 'No se pudo cargar la información del expediente o no tienes permiso para verlo.';
                dispatch({ type: 'FETCH_ERROR', payload: errorMsg });
            }
        };

        // Solo ejecutar si hay un ID válido
        if (id) {
            fetchExpediente();
        }
    }, [id, dispatch]); // Re-ejecutar cuando cambie el ID o el dispatch
}