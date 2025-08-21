import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const CapturaDocumento = () => {
    const initialFormData = {
        asunto: '',
        tipo_soporte: 'Electrónico', // Valor por defecto
        ubicacion_fisica: '',
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
                toast.error('Error al cargar datos iniciales.');
            }
        };
        fetchInitialData();
    }, []);

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

    const handleDependenciaChange = (e) => {
        const depId = e.target.value;
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
                toast.error("No se pudieron cargar los campos personalizados.");
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Verificación condicional
        if (formData.tipo_soporte === 'Electrónico' && !archivo) {
            return toast.warn('Debe seleccionar un archivo para el soporte electrónico.');
        }
        if (formData.tipo_soporte === 'Físico' && !formData.ubicacion_fisica.trim()) {
            return toast.warn('Debe especificar la ubicación física del documento.');
        }

        const formDataConDatos = new FormData();
        for (const key in formData) {
            formDataConDatos.append(key, formData[key]);
        }
        if (archivo) {
            formDataConDatos.append('archivo', archivo);
        }
        formDataConDatos.append('customData', JSON.stringify(customData));

        try {
            const res = await api.post('/documentos', formDataConDatos, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`Documento radicado con éxito. Radicado: ${res.data.radicado}`);
            resetForm(); 
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al radicar el documento.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Captura y Radicación de Documentos</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="content-box">
                    <h3>Datos del Documento</h3>
                    <div style={{marginBottom: '1rem'}}>
                        <label>Tipo de Soporte: </label>
                        <select name="tipo_soporte" value={formData.tipo_soporte} onChange={handleChange}>
                            <option value="Electrónico">Electrónico</option>
                            <option value="Físico">Físico</option>
                        </select>
                    </div>
                    <textarea 
                        name="asunto" 
                        placeholder="Asunto o descripción del documento..." 
                        value={formData.asunto} 
                        onChange={handleChange} 
                        required 
                        style={{width: '100%', minHeight: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '6px'}} 
                    />
                </div>

                <div className="content-box">
                    <h3>Clasificación TRD</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <select onChange={handleDependenciaChange} required>
                            <option value="">-- Seleccione Dependencia --</option>
                            {dependencias.map(d => <option key={d.id} value={d.id}>{d.nombre_dependencia}</option>)}
                        </select>
                        <select name="id_oficina_productora" value={formData.id_oficina_productora} onChange={handleOficinaChange} required>
                            <option value="">-- Seleccione Oficina --</option>
                            {filteredOficinas.map(o => <option key={o.id} value={o.id}>{o.nombre_oficina}</option>)}
                        </select>
                        <select name="id_serie" value={formData.id_serie} onChange={handleSerieChange} required>
                            <option value="">-- Seleccione Serie --</option>
                            {filteredSeries.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
                        </select>
                        <select name="id_subserie" value={formData.id_subserie} onChange={handleChange} required>
                            <option value="">-- Seleccione Subserie --</option>
                            {filteredSubseries.map(ss => <option key={ss.id} value={ss.id}>{ss.nombre_subserie}</option>)}
                        </select>
                    </div>
                </div>

                {customFields.length > 0 && (
                    <div className="content-box">
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

                <div className="content-box">
                    <h3>Datos del Remitente</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <input type="text" name="remitente_nombre" placeholder="Nombre del Remitente" value={formData.remitente_nombre} onChange={handleChange} required />
                        <input type="text" name="remitente_identificacion" placeholder="Identificación" value={formData.remitente_identificacion} onChange={handleChange} />
                        <input type="text" name="remitente_direccion" placeholder="Dirección" value={formData.remitente_direccion} onChange={handleChange} />
                    </div>
                </div>

                <div className="content-box">
                    <h3>Ubicación y Archivo</h3>
                    {formData.tipo_soporte === 'Electrónico' ? (
                        <div>
                            <label>Adjuntar Archivo Digital *</label><br/>
                            <input type="file" onChange={handleFileChange} ref={fileInputRef} />
                        </div>
                    ) : (
                        <div>
                            <label>Ubicación Física del Documento *</label><br/>
                            <input 
                                type="text" 
                                name="ubicacion_fisica"
                                placeholder="Ej: Estante A, Caja 3, Carpeta 5"
                                value={formData.ubicacion_fisica} 
                                onChange={handleChange}
                                style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px'}}
                            />
                        </div>
                    )}
                </div>

                <div style={{marginTop: '20px'}}>
                    <button type="submit" className="button button-primary">Radicar Documento</button>
                </div>
            </form>
        </div>
    );
};

export default CapturaDocumento;