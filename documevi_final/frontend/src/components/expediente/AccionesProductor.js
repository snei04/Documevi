import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const AccionesProductor = ({ state, expediente, onDataChange }) => {
    // --- ESTADO LOCAL PARA LOS FORMULARIOS ---
    
    // Estado para "Añadir Documento"
    const [selectedDocumento, setSelectedDocumento] = useState('');
    const [requiereFirma, setRequiereFirma] = useState(false);

    // Estado para "Generar desde Plantilla"
    const [selectedPlantilla, setSelectedPlantilla] = useState(null);
    const [plantillaData, setPlantillaData] = useState({});

    // Estado para "Metadatos Personalizados"
    const [customData, setCustomData] = useState({});

    // Sincroniza los metadatos del estado global al estado local cuando se cargan
    useEffect(() => {
        setCustomData(state.customData || {});
    }, [state.customData]);


    // --- MANEJADORES DE EVENTOS ---

    const handleAddDocumento = async (e) => {
        e.preventDefault();
        if (!selectedDocumento) return toast.warn('Por favor, seleccione un documento.');
        try {
            await api.post(`/expedientes/${expediente.id}/documentos`, { id_documento: selectedDocumento, requiere_firma: requiereFirma });
            toast.success('Documento añadido con éxito.');
            setSelectedDocumento('');
            setRequiereFirma(false);
            onDataChange(); // Refrescar los datos del expediente
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al añadir el documento.');
        }
    };

    const handleSelectPlantilla = (plantillaId) => {
    console.log('ID de plantilla seleccionado:', plantillaId); // LOG 1

    if (!plantillaId) {
        setSelectedPlantilla(null);
        setPlantillaData({});
        return;
    }
    // Usamos parseInt para evitar errores de tipo string vs number
    const plantilla = state.plantillas.find(p => p.id === parseInt(plantillaId));

    console.log('Plantilla encontrada:', plantilla); // LOG 2

    setSelectedPlantilla(plantilla);
    setPlantillaData({});
};

    const handlePlantillaDataChange = (e) => {
        setPlantillaData({ ...plantillaData, [e.target.name]: e.target.value });
    };

    const handleGenerateDocument = async (e) => {
        e.preventDefault();
        if (!expediente || !expediente.id_serie || !selectedPlantilla) return toast.error("Faltan datos de la plantilla o el expediente.");

        try {
            await api.post(`/expedientes/${expediente.id}/documentos-desde-plantilla`, {
                id_plantilla: selectedPlantilla.id,
                datos_rellenados: plantillaData,
                id_serie: expediente.id_serie,
                id_subserie: expediente.id_subserie,
                id_oficina_productora: expediente.id_oficina_productora
            });
            toast.success('Documento generado y añadido al expediente.');
            setSelectedPlantilla(null);
            setPlantillaData({});
            onDataChange(); // Refrescar los datos
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al generar el documento.');
        }
    };

    const handleCustomDataChange = (e) => {
        const { name, value } = e.target;
        setCustomData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveCustomData = async () => {
        try {
            await api.put(`/expedientes/${expediente.id}/custom-data`, customData);
            toast.success('Metadatos personalizados guardados con éxito.');
            onDataChange();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al guardar los metadatos.');
        }
    };

    // --- RENDERIZADO DE FORMULARIOS ---
    console.log('Datos de plantillas disponibles:', state.plantillas);
    return (
        <>
            {/* Formulario para añadir documento existente */}
            {expediente.estado === 'En trámite' && (
                <div className="content-box">
                    <h3>Añadir Documento al Expediente</h3>
                    <form onSubmit={handleAddDocumento}>
                        <select value={selectedDocumento} onChange={(e) => setSelectedDocumento(e.target.value)}>
                            <option value="">-- Seleccione un documento --</option>
                            {state.documentosDisponibles.map(doc => <option key={doc.id} value={doc.id}>{doc.radicado} - {doc.asunto}</option>)}
                        </select>
                        <label style={{ marginLeft: '10px' }}>
                            <input type="checkbox" checked={requiereFirma} onChange={(e) => setRequiereFirma(e.target.checked)} />
                            ¿Requiere Firma?
                        </label>
                        <button type="submit" style={{ marginLeft: '10px' }} className="button">Añadir</button>
                    </form>
                </div>
            )}

            {/* Formulario para generar documento desde plantilla */}
            <div className="content-box">
                <h3>Generar Documento desde Plantilla</h3>
                <select onChange={(e) => handleSelectPlantilla(e.target.value)} style={{ marginBottom: '15px' }} value={selectedPlantilla?.id || ''}>
                    <option value="">-- Seleccione una Plantilla --</option>
                    {state.plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                
                {/* ✅ CORRECCIÓN: Verifica que .campos sea un array antes de usar .sort() */}
                {selectedPlantilla && Array.isArray(selectedPlantilla.campos) && (
                    <form onSubmit={handleGenerateDocument}>
                        {selectedPlantilla.campos.sort((a, b) => a.orden - b.orden).map(campo => (
                            <div key={campo.id} style={{ marginBottom: '10px' }}>
                                <label>{campo.nombre_campo}:
                                    <input
                                        type={campo.tipo_campo === 'fecha' ? 'date' : campo.tipo_campo === 'numero' ? 'number' : 'text'}
                                        name={campo.nombre_campo}
                                        value={plantillaData[campo.nombre_campo] || ''}
                                        onChange={handlePlantillaDataChange}
                                        required
                                        style={{ marginLeft: '10px', width: '300px' }}
                                    />
                                </label>
                            </div>
                        ))}
                        <button type="submit" className="button button-primary" style={{ marginTop: '10px' }}>Generar y Añadir</button>
                    </form>
                )}
            </div>

            {/* Formulario de metadatos personalizados */}
            {state.customFields && state.customFields.length > 0 && (
                <div className="content-box">
                    <h3>Metadatos Personalizados del Expediente</h3>
                    {state.customFields.map(field => (
                        <div key={field.id} style={{ marginBottom: '10px' }}>
                            <label>{field.nombre_campo}{field.es_obligatorio ? ' *' : ''}:
                                <input
                                    type={field.tipo_campo === 'fecha' ? 'date' : field.tipo_campo}
                                    name={String(field.id)}
                                    value={customData[field.id] || ''}
                                    onChange={handleCustomDataChange}
                                    required={field.es_obligatorio}
                                    style={{ marginLeft: '10px' }}
                                />
                            </label>
                        </div>
                    ))}
                    <button onClick={handleSaveCustomData} style={{ marginTop: '10px' }} className="button">Guardar Metadatos</button>
                </div>
            )}
        </>
    );
};

export default AccionesProductor;