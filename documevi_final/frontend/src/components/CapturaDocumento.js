import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const CapturaDocumento = () => {
    // 1. Definimos el estado inicial para poder reiniciar el formulario
    const initialFormData = {
        asunto: '',
        id_oficina_productora: '',
        id_serie: '',
        id_subserie: '',
        remitente_nombre: '',
        remitente_identificacion: '',
        remitente_direccion: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [dependencias, setDependencias] = useState([]);
    const [oficinas, setOficinas] = useState([]);
    const [series, setSeries] = useState([]);
    const [subseries, setSubseries] = useState([]);
    const [filteredOficinas, setFilteredOficinas] = useState([]);
    const [filteredSeries, setFilteredSeries] = useState([]);
    const [filteredSubseries, setFilteredSubseries] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [error, setError] = useState('');
    const [customFields, setCustomFields] = useState([]);
    const [customData, setCustomData] = useState({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resDep, resOfi, resSer, resSub] = await Promise.all([
                    api.get('/dependencias'),
                    api.get('/oficinas'),
                    api.get('/series'),
                    api.get('/subseries')
                ]);
                setDependencias(resDep.data);
                setOficinas(resOfi.data);
                setSeries(resSer.data);
                setSubseries(resSub.data);
            } catch (err) {
                setError('Error al cargar datos iniciales.');
            }
        };
        fetchInitialData();
    }, []);

    const handleDependenciaChange = (e) => {
        const depId = e.target.value;
        // Reiniciamos los estados dependientes
        setFormData({ ...initialFormData, id_dependencia: depId });
        setFilteredOficinas(oficinas.filter(o => o.id_dependencia === parseInt(depId)));
        setFilteredSeries([]);
        setFilteredSubseries([]);
        setCustomFields([]);
        setCustomData({});
    };

    const handleOficinaChange = async (e) => {
        const ofiId = e.target.value;
        setFormData(prev => ({ ...prev, id_oficina_productora: ofiId, id_serie: '', id_subserie: '' }));
        setFilteredSeries(series.filter(s => s.id_oficina_productora === parseInt(ofiId)));
        setFilteredSubseries([]);
        setCustomFields([]);
        setCustomData({});

        if (ofiId) {
            try {
                const res = await api.get(`/campos-personalizados/oficina/${ofiId}`);
                setCustomFields(res.data);
            } catch (err) {
                toast.error("No se pudieron cargar los campos personalizados para esta oficina.");
            }
        }
    };
    
    const handleSerieChange = (e) => {
        const serId = e.target.value;
        setFormData({ ...formData, id_serie: serId, id_subserie: '' });
        setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(serId)));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setArchivo(e.target.files[0]);
    };

    const handleCustomDataChange = (e) => {
        const { name, value } = e.target;
        setCustomData(prev => ({ ...prev, [name]: value }));
    };
    
    // 2. La función de reinicio que faltaba
    const resetForm = () => {
        setFormData(initialFormData);
        setArchivo(null);
        setCustomFields([]);
        setCustomData({});
        setFilteredOficinas([]);
        setFilteredSeries([]);
        setFilteredSubseries([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!archivo) {
            toast.warn('Debe seleccionar un archivo para subir.');
            return;
        }

        const formDataConArchivo = new FormData();
        for (const key in formData) {
            formDataConArchivo.append(key, formData[key]);
        }
        formDataConArchivo.append('archivo', archivo);
        formDataConArchivo.append('customData', JSON.stringify(customData));

        try {
            const res = await api.post('/documentos', formDataConArchivo, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Documento radicado con éxito. Radicado: ${res.data.radicado}`);
            resetForm(); 
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al radicar el documento.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Captura y Radicación de Documentos</h1>
            <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
                <h3>Datos del Documento</h3>
                <textarea name="asunto" placeholder="Asunto del documento" value={formData.asunto} onChange={handleChange} required style={{width: '100%', minHeight: '60px'}} />
                
                <h3 style={{marginTop: '20px'}}>Clasificación TRD</h3>
                <select onChange={handleDependenciaChange} required>
                    <option value="">-- Seleccione Dependencia --</option>
                    {dependencias.map(d => <option key={d.id} value={d.id}>{d.nombre_dependencia}</option>)}
                </select>
                <select name="id_oficina_productora" value={formData.id_oficina_productora} onChange={handleOficinaChange} required style={{marginLeft: '10px'}}>
                    <option value="">-- Seleccione Oficina --</option>
                    {filteredOficinas.map(o => <option key={o.id} value={o.id}>{o.nombre_oficina}</option>)}
                </select>
                <br/><br/>
                <select name="id_serie" value={formData.id_serie} onChange={handleSerieChange} required>
                    <option value="">-- Seleccione Serie --</option>
                    {filteredSeries.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
                </select>
                <select name="id_subserie" value={formData.id_subserie} onChange={handleChange} required style={{marginLeft: '10px'}}>
                    <option value="">-- Seleccione Subserie --</option>
                    {filteredSubseries.map(ss => <option key={ss.id} value={ss.id}>{ss.nombre_subserie}</option>)}
                </select>

                {customFields.length > 0 && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
                        <h3>Metadatos Adicionales</h3>
                        {customFields.map(field => (
                            <div key={field.id} style={{ marginBottom: '10px' }}>
                                <label>
                                    {field.nombre_campo}{field.es_obligatorio ? ' *' : ''}:
                                    <input
                                        type={field.tipo_campo}
                                        name={field.id}
                                        value={customData[field.id] || ''}
                                        onChange={handleCustomDataChange}
                                        required={field.es_obligatorio}
                                        style={{ marginLeft: '10px' }}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                <h3 style={{marginTop: '20px'}}>Datos del Remitente</h3>
                <input type="text" name="remitente_nombre" placeholder="Nombre del Remitente" value={formData.remitente_nombre} onChange={handleChange} required />
                <input type="text" name="remitente_identificacion" placeholder="Identificación" value={formData.remitente_identificacion} onChange={handleChange} style={{marginLeft: '10px'}} />
                <input type="text" name="remitente_direccion" placeholder="Dirección" value={formData.remitente_direccion} onChange={handleChange} style={{marginLeft: '10px'}} />

                <h3 style={{marginTop: '20px'}}>Adjuntar Archivo</h3>
                <input type="file" onChange={handleFileChange} ref={fileInputRef} required />

                <br/><br/>
                <button type="submit">Radicar Documento</button>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </form>
        </div>
    );
};

export default CapturaDocumento;