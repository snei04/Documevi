import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import FileUpload from './FileUpload';
import './Dashboard.css';

// Esto asegura que el objeto se cree una sola vez y tenga una referencia estable.
const initialFormData = {
    asunto: '',
    tipo_soporte: 'Electrónico',
    ubicacion_fisica: '',
    id_dependencia: '',
    id_oficina_productora: '',
    id_serie: '',
    id_subserie: '',
    remitente_nombre: '',
    remitente_identificacion: '',
    remitente_direccion: ''
};

// Campos de ubicación física estructurada
const initialUbicacionFisica = {
    carpeta: '',
    paquete: '',
    tomo: '',
    otro: '',
    modulo: '',
    estante: '',
    entrepano: '',
    ubicacion: ''
};

const CapturaDocumento = () => {
    // El estado ahora se inicializa desde la constante estable
    const [formData, setFormData] = useState(initialFormData);
    const [modo, setModo] = useState('manual');
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
    
    // Estados para el modo plantilla
    const [plantillas, setPlantillas] = useState([]);
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
    const [camposPlantilla, setCamposPlantilla] = useState([]);
    const [datosPlantilla, setDatosPlantilla] = useState({});

    // Estado para el respaldo físico
    const [tieneRespaldoFisico, setTieneRespaldoFisico] = useState(false);
    
    // Estado para ubicación física estructurada
    const [ubicacionFisica, setUbicacionFisica] = useState(initialUbicacionFisica);

    // Lógica de carga de datos
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resDep, resOfi, resSer, resSub, resPlan] = await Promise.all([
                    api.get('/dependencias'),
                    api.get('/oficinas'),
                    api.get('/series'),
                    api.get('/subseries'),
                    api.get('/plantillas')
                ]);
                setDependencias(resDep.data);
                setOficinas(resOfi.data);
                setSeries(resSer.data);
                setSubseries(resSub.data);
                setPlantillas(resPlan.data);
            } catch (err) {
                toast.error('Error al cargar datos iniciales.');
            }
        };
        fetchInitialData();
    }, []);
    

    // Ya no necesita 'initialFormData' porque es una constante externa y estable.
    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setArchivo(null);
        setCustomFields([]);
        setCustomData({});
        setFilteredOficinas([]);
        setFilteredSeries([]);
        setFilteredSubseries([]);
        setTieneRespaldoFisico(false);
        setUbicacionFisica(initialUbicacionFisica);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []); // El array vacío es ahora correcto y la advertencia desaparecerá.
    
    // Manejar cambios en ubicación física
    const handleUbicacionChange = (e) => {
        const { name, value } = e.target;
        setUbicacionFisica(prev => ({ ...prev, [name]: value }));
    };
    
    // Construir string de ubicación física
    const buildUbicacionString = () => {
        const parts = [];
        if (ubicacionFisica.carpeta) parts.push(`Carpeta: ${ubicacionFisica.carpeta}`);
        if (ubicacionFisica.paquete) parts.push(`Paquete: ${ubicacionFisica.paquete}`);
        if (ubicacionFisica.tomo) parts.push(`Tomo: ${ubicacionFisica.tomo}`);
        if (ubicacionFisica.otro) parts.push(`Otro: ${ubicacionFisica.otro}`);
        if (ubicacionFisica.modulo) parts.push(`Módulo: ${ubicacionFisica.modulo}`);
        if (ubicacionFisica.estante) parts.push(`Estante: ${ubicacionFisica.estante}`);
        if (ubicacionFisica.entrepano) parts.push(`Entrepaño: ${ubicacionFisica.entrepano}`);
        if (ubicacionFisica.ubicacion) parts.push(`Ubicación: ${ubicacionFisica.ubicacion}`);
        return parts.join(' | ');
    };

    // --- El resto de tus funciones se mantienen igual ---
    const handleTemplateChange = async (e) => {
        const id = e.target.value;
        if (id) {
            const plantilla = plantillas.find(p => p.id === parseInt(id));
            setPlantillaSeleccionada(plantilla);
            try {
                const res = await api.get(`/plantillas/${id}`);
                setCamposPlantilla(res.data.campos || []);
                setDatosPlantilla({});
            } catch (error) {
                toast.error('No se pudieron cargar los campos de la plantilla.');
            }
        } else {
            setPlantillaSeleccionada(null);
            setCamposPlantilla([]);
        }
    };
    
    const handleDatosPlantillaChange = (e) => setDatosPlantilla(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmitPlantilla = async (e) => {
        e.preventDefault();
        if (!plantillaSeleccionada) return toast.error("Por favor, selecciona una plantilla.");
        const payload = {
            id_plantilla: plantillaSeleccionada.id,
            datos_rellenados: datosPlantilla,
            id_serie: plantillaSeleccionada.id_serie, 
            id_subserie: plantillaSeleccionada.id_subserie,
            id_oficina_productora: plantillaSeleccionada.id_oficina_productora,
        };
        try {
            const res = await api.post('/documentos/desde-plantilla', payload);
            toast.success(`Documento generado con éxito. Radicado: ${res.data.radicado}`);
            setModo('manual');
            setPlantillaSeleccionada(null);
            setCamposPlantilla([]);
            setDatosPlantilla({});
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al generar el documento.');
        }
    };

    const handleDependenciaChange = (e) => {
        const depId = e.target.value;
        setFormData({ ...initialFormData, id_dependencia: depId });
        setFilteredOficinas(oficinas.filter(o => o.id_dependencia === parseInt(depId)));
        setFilteredSeries([]);
        setFilteredSubseries([]);
        setCustomFields([]);
    };

    const handleOficinaChange = async (e) => {
        const ofiId = e.target.value;
        setFormData(prev => ({ ...prev, id_oficina_productora: ofiId, id_serie: '', id_subserie: '' }));
        setFilteredSeries(series.filter(s => s.id_oficina_productora === parseInt(ofiId)));
        setFilteredSubseries([]);
        setCustomFields([]);
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
        setFormData(prev => ({ ...prev, id_serie: serId, id_subserie: '' }));
        setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(serId)));
    };
    
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (file) => setArchivo(file);
    const handleCustomDataChange = (e) => {
        const { name, value } = e.target;
        setCustomData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.tipo_soporte === 'Electrónico' && !archivo) {
            return toast.warn('Debe seleccionar un archivo electrónico.');
        }
        
        // Validación para documentos físicos o híbridos
        const requiereUbicacion = formData.tipo_soporte === 'Físico' || 
                                  (formData.tipo_soporte === 'Electrónico' && tieneRespaldoFisico);
        
        if (requiereUbicacion) {
            // Carpeta y Paquete son obligatorios
            if (!ubicacionFisica.carpeta.trim()) {
                return toast.warn('Debe especificar la Carpeta.');
            }
            if (!ubicacionFisica.paquete.trim()) {
                return toast.warn('Debe especificar el Paquete.');
            }
        }

        // Construir ubicación física como string
        const ubicacionString = buildUbicacionString();

        let datosParaEnviar = { ...formData, ubicacion_fisica: ubicacionString };
        if (datosParaEnviar.tipo_soporte === 'Electrónico' && tieneRespaldoFisico) {
            datosParaEnviar.tipo_soporte = 'Híbrido';
        }

        const formDataConDatos = new FormData();
        for (const key in datosParaEnviar) {
            formDataConDatos.append(key, datosParaEnviar[key]);
        }
        if (archivo) formDataConDatos.append('archivo', archivo);
        formDataConDatos.append('customData', JSON.stringify(customData));

        try {
            const res = await api.post('/documentos', formDataConDatos, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(`Documento radicado con éxito. Radicado: ${res.data.radicado}`);
            resetForm();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al radicar.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Captura y Radicación de Documentos</h1>
                <button type="button" onClick={() => setModo(modo === 'manual' ? 'plantilla' : 'manual')} className="button">
                    {modo === 'manual' ? 'Generar desde Plantilla' : 'Capturar Manualmente'}
                </button>
            </div>

            {modo === 'manual' ? (
                <form onSubmit={handleSubmit}>
                    <div className="content-box">
                        <h3>Datos del Documento</h3>
                        <div className="form-grid-2" style={{ marginBottom: '15px' }}>
                            <div className="form-group">
                                <label>Tipo de Soporte *</label>
                                <select name="tipo_soporte" value={formData.tipo_soporte} onChange={handleChange}>
                                    <option value="Electrónico">Electrónico</option>
                                    <option value="Físico">Físico</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Asunto o Descripción *</label>
                            <textarea 
                                name="asunto" 
                                placeholder="Describa brevemente el contenido del documento..." 
                                value={formData.asunto} 
                                onChange={handleChange} 
                                required 
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="content-box">
                        <h3>Clasificación TRD</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>Dependencia *</label>
                                <select value={formData.id_dependencia} onChange={handleDependenciaChange} required>
                                    <option value="">-- Seleccione Dependencia --</option>
                                    {dependencias.filter(d => d.activo).map(d => (
                                        <option key={d.id} value={d.id}>{d.codigo_dependencia} - {d.nombre_dependencia}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Oficina Productora *</label>
                                <select name="id_oficina_productora" value={formData.id_oficina_productora} onChange={handleOficinaChange} required disabled={!formData.id_dependencia}>
                                    <option value="">{formData.id_dependencia ? '-- Seleccione Oficina --' : '-- Primero seleccione Dependencia --'}</option>
                                    {filteredOficinas.filter(o => o.activo).map(o => (
                                        <option key={o.id} value={o.id}>{o.codigo_oficina} - {o.nombre_oficina}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Serie Documental *</label>
                                <select name="id_serie" value={formData.id_serie} onChange={handleSerieChange} required disabled={!formData.id_oficina_productora}>
                                    <option value="">{formData.id_oficina_productora ? '-- Seleccione Serie --' : '-- Primero seleccione Oficina --'}</option>
                                    {filteredSeries.filter(s => s.activo).map(s => (
                                        <option key={s.id} value={s.id}>{s.codigo_serie} - {s.nombre_serie}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subserie Documental *</label>
                                <select name="id_subserie" value={formData.id_subserie} onChange={handleChange} required disabled={!formData.id_serie}>
                                    <option value="">{formData.id_serie ? '-- Seleccione Subserie --' : '-- Primero seleccione Serie --'}</option>
                                    {filteredSubseries.filter(ss => ss.activo).map(ss => (
                                        <option key={ss.id} value={ss.id}>{ss.codigo_subserie} - {ss.nombre_subserie}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {customFields.length > 0 && (
                        <div className="content-box">
                            <h3>Metadatos Adicionales</h3>
                            <div className="form-grid-3">
                                {customFields.map(field => (
                                    <div key={field.id} className="form-group">
                                        <label>{field.nombre_campo}{field.es_obligatorio ? ' *' : ''}</label>
                                        <input
                                            type={field.tipo_campo === 'fecha' ? 'date' : field.tipo_campo === 'numero' ? 'number' : 'text'}
                                            name={String(field.id)}
                                            value={customData[field.id] || ''}
                                            onChange={handleCustomDataChange}
                                            required={field.es_obligatorio}
                                            placeholder={`Ingrese ${field.nombre_campo.toLowerCase()}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="content-box">
                        <h3>Datos del Remitente</h3>
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label>Nombre del Remitente *</label>
                                <input type="text" name="remitente_nombre" placeholder="Ej: Juan Pérez García" value={formData.remitente_nombre} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Identificación</label>
                                <input type="text" name="remitente_identificacion" placeholder="Ej: 123456789" value={formData.remitente_identificacion} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Dirección</label>
                                <input type="text" name="remitente_direccion" placeholder="Ej: Calle 123 #45-67" value={formData.remitente_direccion} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="content-box">
                        <h3>Ubicación y Archivo</h3>
                        {formData.tipo_soporte === 'Electrónico' ? (
                            <div>
                                <label>Adjuntar Archivo Digital *</label><br/>
                                <FileUpload onFileChange={handleFileChange} ref={fileInputRef} />
                                
                                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={tieneRespaldoFisico} 
                                            onChange={(e) => setTieneRespaldoFisico(e.target.checked)}
                                        />
                                        ¿Existe un respaldo o copia física de este documento?
                                    </label>
                                    
                                    {tieneRespaldoFisico && (
                                        <div style={{ marginTop: '15px' }}>
                                            <h4>Ubicación Física del Respaldo</h4>
                                            <div className="form-grid-4">
                                                <div className="form-group">
                                                    <label>Carpeta *</label>
                                                    <input type="text" name="carpeta" value={ubicacionFisica.carpeta} onChange={handleUbicacionChange} placeholder="Ej: 001" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Paquete *</label>
                                                    <input type="text" name="paquete" value={ubicacionFisica.paquete} onChange={handleUbicacionChange} placeholder="Ej: 01" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Tomo</label>
                                                    <input type="text" name="tomo" value={ubicacionFisica.tomo} onChange={handleUbicacionChange} placeholder="Opcional" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Otro</label>
                                                    <input type="text" name="otro" value={ubicacionFisica.otro} onChange={handleUbicacionChange} placeholder="Opcional" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Módulo</label>
                                                    <input type="text" name="modulo" value={ubicacionFisica.modulo} onChange={handleUbicacionChange} placeholder="Opcional" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Estante</label>
                                                    <input type="text" name="estante" value={ubicacionFisica.estante} onChange={handleUbicacionChange} placeholder="Opcional" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Entrepaño</label>
                                                    <input type="text" name="entrepano" value={ubicacionFisica.entrepano} onChange={handleUbicacionChange} placeholder="Opcional" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Ubicación</label>
                                                    <input type="text" name="ubicacion" value={ubicacionFisica.ubicacion} onChange={handleUbicacionChange} placeholder="Opcional" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h4>Ubicación Física del Documento</h4>
                                <div className="form-grid-4">
                                    <div className="form-group">
                                        <label>Carpeta *</label>
                                        <input type="text" name="carpeta" value={ubicacionFisica.carpeta} onChange={handleUbicacionChange} placeholder="Ej: 001" />
                                    </div>
                                    <div className="form-group">
                                        <label>Paquete *</label>
                                        <input type="text" name="paquete" value={ubicacionFisica.paquete} onChange={handleUbicacionChange} placeholder="Ej: 01" />
                                    </div>
                                    <div className="form-group">
                                        <label>Tomo</label>
                                        <input type="text" name="tomo" value={ubicacionFisica.tomo} onChange={handleUbicacionChange} placeholder="Opcional" />
                                    </div>
                                    <div className="form-group">
                                        <label>Otro</label>
                                        <input type="text" name="otro" value={ubicacionFisica.otro} onChange={handleUbicacionChange} placeholder="Opcional" />
                                    </div>
                                    <div className="form-group">
                                        <label>Módulo</label>
                                        <input type="text" name="modulo" value={ubicacionFisica.modulo} onChange={handleUbicacionChange} placeholder="Opcional" />
                                    </div>
                                    <div className="form-group">
                                        <label>Estante</label>
                                        <input type="text" name="estante" value={ubicacionFisica.estante} onChange={handleUbicacionChange} placeholder="Opcional" />
                                    </div>
                                    <div className="form-group">
                                        <label>Entrepaño</label>
                                        <input type="text" name="entrepano" value={ubicacionFisica.entrepano} onChange={handleUbicacionChange} placeholder="Opcional" />
                                    </div>
                                    <div className="form-group">
                                        <label>Ubicación</label>
                                        <input type="text" name="ubicacion" value={ubicacionFisica.ubicacion} onChange={handleUbicacionChange} placeholder="Opcional" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{marginTop: '20px'}}>
                        <button type="submit" className="button button-primary">Radicar Documento</button>
                    </div>
                </form>
            ) : (
                <div className="content-box">
                    <h3>Generar Documento desde Plantilla</h3>
                    <form onSubmit={handleSubmitPlantilla}>
                        <select onChange={handleTemplateChange} required>
                            <option value="">-- Elige una plantilla --</option>
                            {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                        <hr/>
                        {camposPlantilla.map(campo => (
                            <div key={campo.id} style={{ margin: '10px 0' }}>
                                <label>{campo.nombre_campo}:</label><br/>
                                <input type={campo.tipo_campo === 'fecha' ? 'date' : campo.tipo_campo === 'numero' ? 'number' : 'text'} 
                                name={campo.nombre_campo} 
                                onChange={handleDatosPlantillaChange} required 
                                style={{ width: '100%' }} />
                            </div>
                        ))}
                        {plantillaSeleccionada && (
                            <button type="submit" className="button button-primary" style={{marginTop: '10px'}}>Generar y Radicar</button>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
};

export default CapturaDocumento;