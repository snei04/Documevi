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
    remitente_direccion: '',
    id_expediente: '' // Nuevo campo para vincular expediente
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

    // Estados para gestión de carpetas (Épica 2)
    const [carpetas, setCarpetas] = useState([]);
    const [showNuevaCarpeta, setShowNuevaCarpeta] = useState(false);
    const [nuevaCarpetaData, setNuevaCarpetaData] = useState({
        descripcion: '',
        capacidad_maxima: 200,
        paquete: '',
        estante: '',
        otro: '',
        id_caja: '' // Nuevo campo para seleccionar caja
    });

    // Estado para cajas de la oficina (para crear nueva carpeta)
    const [cajasOficina, setCajasOficina] = useState([]);

    // Estado para sugerencia de expediente
    const [suggestedExpediente, setSuggestedExpediente] = useState(null);
    const [showExpedienteModal, setShowExpedienteModal] = useState(false);
    const searchTimeoutRef = useRef(null);

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
        if (ubicacionFisica.carpeta) {
            const carpetaObj = carpetas.find(c => c.id === parseInt(ubicacionFisica.carpeta));
            parts.push(`Carpeta: ${carpetaObj ? carpetaObj.codigo_carpeta : ubicacionFisica.carpeta}`);
        }
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
        setCarpetas([]); // Reiniciar carpetas
        setCajasOficina([]); // Reiniciar cajas

        if (ofiId) {
            try {
                const res = await api.get(`/campos-personalizados/oficina/${ofiId}`);
                setCustomFields(res.data);
            } catch (err) {
                toast.error("No se pudieron cargar los campos personalizados.");
            }

            // Cargar cajas de la oficina
            try {
                const res = await api.get(`/cajas?id_oficina=${ofiId}&estado=Abierta`);
                setCajasOficina(res.data);
            } catch (err) {
                console.error("Error al cargar cajas", err);
            }

            // Cargar carpetas de la oficina

            // Cargar carpetas de la oficina
            try {
                const res = await api.get(`/carpetas?id_oficina=${ofiId}&estado=Abierta`);
                setCarpetas(res.data);
            } catch (err) {
                console.error("Error al cargar carpetas", err);
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

        // Lógica de búsqueda de expediente
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (value && value.length > 2) {
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const res = await api.get(`/expedientes/search-custom?id_campo=${name}&valor=${value}`);
                    if (res.data && res.data.length > 0) {
                        setSuggestedExpediente(res.data[0]);
                        setShowExpedienteModal(true);
                    }
                } catch (error) {
                    console.error("Error buscando expediente", error);
                }
            }, 500); // 500ms debounce
        }
    };

    const confirmExpedienteAssociation = () => {
        if (suggestedExpediente) {
            setFormData(prev => ({ ...prev, id_expediente: suggestedExpediente.id }));
            toast.success(`Asociado al expediente: ${suggestedExpediente.nombre_expediente}`);
            setShowExpedienteModal(false);
        }
    };

    const handleCreateCarpeta = async () => {
        if (!formData.id_oficina_productora) {
            return toast.warn('Debe seleccionar una oficina primero.');
        }
        try {
            const res = await api.post('/carpetas', {
                id_oficina: formData.id_oficina_productora,
                descripcion: nuevaCarpetaData.descripcion,
                capacidad_maxima: nuevaCarpetaData.capacidad_maxima,
                id_caja: nuevaCarpetaData.id_caja, // Enviar ID de caja seleccionada
                paquete: nuevaCarpetaData.paquete,
                estante: nuevaCarpetaData.estante,
                otro: nuevaCarpetaData.otro
            });
            toast.success(`Carpeta creada: ${res.data.codigo_carpeta}`);
            setCarpetas(prev => [res.data, ...prev]);
            setUbicacionFisica(prev => ({ ...prev, carpeta: res.data.id }));
            setShowNuevaCarpeta(false);
            setNuevaCarpetaData({ descripcion: '', capacidad_maxima: 200, paquete: '', estante: '', otro: '', id_caja: '' });
        } catch (error) {
            toast.error('Error al crear carpeta.');
        }
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
            if (requiereUbicacion) {
                const hasLocation = ubicacionFisica.carpeta.trim() ||
                    ubicacionFisica.paquete.trim() ||
                    ubicacionFisica.tomo.trim() ||
                    ubicacionFisica.estante.trim() ||
                    ubicacionFisica.entrepano.trim() ||
                    ubicacionFisica.ubicacion.trim() ||
                    ubicacionFisica.otro.trim();

                if (!hasLocation) {
                    return toast.warn('Debe especificar al menos un dato de ubicación física (Carpeta, Paquete, Estante, etc).');
                }
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
        // Campos de ubicación estructurada
        if (ubicacionFisica.carpeta) formDataConDatos.append('id_carpeta', ubicacionFisica.carpeta);
        if (ubicacionFisica.paquete) formDataConDatos.append('paquete', ubicacionFisica.paquete);
        if (ubicacionFisica.tomo) formDataConDatos.append('tomo', ubicacionFisica.tomo);
        if (ubicacionFisica.modulo) formDataConDatos.append('modulo', ubicacionFisica.modulo);
        if (ubicacionFisica.estante) formDataConDatos.append('estante', ubicacionFisica.estante);
        if (ubicacionFisica.entrepano) formDataConDatos.append('entrepaño', ubicacionFisica.entrepano);
        if (ubicacionFisica.otro) formDataConDatos.append('otro', ubicacionFisica.otro);

        if (archivo) formDataConDatos.append('archivo', archivo);
        formDataConDatos.append('customData', JSON.stringify(customData));

        try {
            const url = formData.id_expediente ? '/documentos/con-expediente' : '/documentos';
            if (formData.id_expediente) formDataConDatos.append('id_expediente', formData.id_expediente);

            const res = await api.post(url, formDataConDatos, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(`Documento radicado con éxito. Radicado: ${res.data.radicado}`);
            resetForm();
            setSuggestedExpediente(null); // Limpiar sugerencia
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
                                <label>Adjuntar Archivo Digital *</label><br />
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
                                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                    <label>Carpeta (Contenedor Físico) *</label>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <select name="carpeta" value={ubicacionFisica.carpeta} onChange={handleUbicacionChange} style={{ flex: 1 }} required={tieneRespaldoFisico} disabled={showNuevaCarpeta}>
                                                            <option value="">-- Seleccionar Carpeta Existente --</option>
                                                            {carpetas.map(c => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.codigo_carpeta} - {c.descripcion} ({c.cantidad_actual}/{c.capacidad_maxima})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button type="button" onClick={() => setShowNuevaCarpeta(!showNuevaCarpeta)} className="button-small">
                                                            {showNuevaCarpeta ? 'Cancelar' : '+ Nueva Carpeta'}
                                                        </button>
                                                    </div>

                                                    {/* Detalle de la carpeta seleccionada */}
                                                    {ubicacionFisica.carpeta && !showNuevaCarpeta && (() => {
                                                        const c = carpetas.find(x => x.id === parseInt(ubicacionFisica.carpeta));
                                                        if (c) return (
                                                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px', padding: '5px', background: '#eef' }}>
                                                                <strong>Ubicación:</strong> Paquete: {c.paquete || 'N/A'} | Estante: {c.estante || 'N/A'} | Otro: {c.otro || 'N/A'}
                                                            </div>
                                                        );
                                                    })()}

                                                    {showNuevaCarpeta && (
                                                        <div style={{ marginTop: '10px', padding: '15px', background: '#f5f5f5', borderRadius: '5px', border: '1px solid #ddd' }}>
                                                            <h4>Nueva Carpeta</h4>
                                                            <div className="form-grid-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Descripción (Ej: Contratos 2026)"
                                                                    value={nuevaCarpetaData.descripcion}
                                                                    onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, descripcion: e.target.value })}
                                                                />
                                                                <input
                                                                    type="number"
                                                                    placeholder="Capacidad Max (Def: 200)"
                                                                    value={nuevaCarpetaData.capacidad_maxima}
                                                                    onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, capacidad_maxima: e.target.value })}
                                                                />
                                                                {/* Campos de Ubicación Física REAL */}
                                                                <input
                                                                    type="text"
                                                                    placeholder="Paquete (Ej: 1)"
                                                                    value={nuevaCarpetaData.paquete}
                                                                    onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, paquete: e.target.value })}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Estante / Módulo"
                                                                    value={nuevaCarpetaData.estante}
                                                                    onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, estante: e.target.value })}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Otro (Entrepaño, etc.)"
                                                                    value={nuevaCarpetaData.otro}
                                                                    onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, otro: e.target.value })}
                                                                    style={{ gridColumn: '1 / -1' }}
                                                                />
                                                            </div>
                                                            <div style={{ marginTop: '10px', textAlign: 'right' }}>
                                                                <button type="button" onClick={handleCreateCarpeta} className="button button-primary button-small">Crear Carpeta</button>
                                                            </div>
                                                        </div>
                                                    )}
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
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Carpeta (Contenedor Físico) *</label>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <select name="carpeta" value={ubicacionFisica.carpeta} onChange={handleUbicacionChange} style={{ flex: 1 }} required={!tieneRespaldoFisico} disabled={showNuevaCarpeta}>
                                                <option value="">-- Seleccionar Carpeta Existente --</option>
                                                {carpetas.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.codigo_carpeta} - {c.descripcion} ({c.cantidad_actual}/{c.capacidad_maxima})
                                                    </option>
                                                ))}
                                            </select>
                                            <button type="button" onClick={() => setShowNuevaCarpeta(!showNuevaCarpeta)} className="button-small">
                                                {showNuevaCarpeta ? 'Cancelar' : '+ Nueva Carpeta'}
                                            </button>
                                        </div>

                                        {/* Detalle de la carpeta seleccionada */}
                                        {ubicacionFisica.carpeta && !showNuevaCarpeta && (() => {
                                            const c = carpetas.find(x => x.id === parseInt(ubicacionFisica.carpeta));
                                            if (c) return (
                                                <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px', padding: '5px', background: '#eef' }}>
                                                    <strong>Ubicación:</strong> Paquete: {c.paquete || 'N/A'} | Estante: {c.estante || 'N/A'} | Otro: {c.otro || 'N/A'}
                                                </div>
                                            );
                                        })()}

                                        {showNuevaCarpeta && (
                                            <div style={{ marginTop: '10px', padding: '15px', background: '#f5f5f5', borderRadius: '5px', border: '1px solid #ddd' }}>
                                                <h4>Nueva Carpeta</h4>
                                                <div className="form-grid-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Descripción (Ej: Contratos 2026)"
                                                        value={nuevaCarpetaData.descripcion}
                                                        onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, descripcion: e.target.value })}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Capacidad Max (Def: 200)"
                                                        value={nuevaCarpetaData.capacidad_maxima}
                                                        onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, capacidad_maxima: e.target.value })}
                                                    />
                                                    {/* Campos de Ubicación Física REAL */}
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <label>Seleccionar Paquete *</label>
                                                        <select
                                                            value={nuevaCarpetaData.id_caja}
                                                            onChange={(e) => {
                                                                const cajaId = e.target.value;
                                                                const caja = cajasOficina.find(c => c.id === parseInt(cajaId));
                                                                setNuevaCarpetaData({
                                                                    ...nuevaCarpetaData,
                                                                    id_caja: cajaId,
                                                                    // Si selecciona caja, prellenar ubicación (solo visual o para envio si backend lo requiere)
                                                                    paquete: caja ? caja.codigo_caja : '',
                                                                    estante: caja ? caja.ubicacion_estante : '',
                                                                    otro: caja ? `Entrepaño: ${caja.ubicacion_entrepaño}` : ''
                                                                });
                                                            }}
                                                            style={{ width: '100%', padding: '8px' }}
                                                        >
                                                            <option value="">-- Seleccione un Paquete --</option>
                                                            {cajasOficina.map(c => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.codigo_caja} - {c.descripcion} ({c.cantidad_actual}/{c.capacidad_carpetas})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {!nuevaCarpetaData.id_caja && (
                                                        <>
                                                            <input
                                                                type="text"
                                                                placeholder="Paquete (Manual)"
                                                                value={nuevaCarpetaData.paquete}
                                                                onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, paquete: e.target.value })}
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Estante / Módulo"
                                                                value={nuevaCarpetaData.estante}
                                                                onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, estante: e.target.value })}
                                                            />
                                                        </>
                                                    )}

                                                    {/* Mostrar ubicación de la caja seleccionada como info */}
                                                    {nuevaCarpetaData.id_caja && (
                                                        <div style={{ gridColumn: '1 / -1', background: '#eef', padding: '5px', fontSize: '0.9em' }}>
                                                            <strong>Ubicación del Paquete:</strong> {nuevaCarpetaData.estante || 'N/A'} - {nuevaCarpetaData.otro || 'N/A'}
                                                        </div>
                                                    )}

                                                    <input
                                                        type="text"
                                                        placeholder="Otro / Observaciones"
                                                        value={nuevaCarpetaData.otro}
                                                        onChange={(e) => setNuevaCarpetaData({ ...nuevaCarpetaData, otro: e.target.value })}
                                                        style={{ gridColumn: '1 / -1' }}
                                                    />
                                                </div>
                                                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                                                    <button type="button" onClick={handleCreateCarpeta} className="button button-primary button-small">Crear Carpeta</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '20px' }}>
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
                        <hr />
                        {camposPlantilla.map(campo => (
                            <div key={campo.id} style={{ margin: '10px 0' }}>
                                <label>{campo.nombre_campo}:</label><br />
                                <input type={campo.tipo_campo === 'fecha' ? 'date' : campo.tipo_campo === 'numero' ? 'number' : 'text'}
                                    name={campo.nombre_campo}
                                    onChange={handleDatosPlantillaChange} required
                                    style={{ width: '100%' }} />
                            </div>
                        ))}
                        {plantillaSeleccionada && (
                            <button type="submit" className="button button-primary" style={{ marginTop: '10px' }}>Generar y Radicar</button>
                        )}
                    </form>
                </div>
            )}


            {/* Modal de confirmación de expediente */}
            {
                showExpedienteModal && suggestedExpediente && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Expediente Identificado</h3>
                            <p>Se ha encontrado un expediente que coincide con el valor ingresado:</p>
                            <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                <strong>Nombre:</strong> {suggestedExpediente.nombre_expediente}<br />
                                <strong>Código:</strong> {suggestedExpediente.codigo_expediente}<br />
                                <strong>Valor coincidente:</strong> {suggestedExpediente.valor}
                            </div>
                            <p>¿Desea anexar este documento directamente a este expediente?</p>
                            <div className="modal-actions">
                                <button onClick={confirmExpedienteAssociation} className="button button-primary">Sí, Anexar</button>
                                <button onClick={() => setShowExpedienteModal(false)} className="button">No, solo radicar</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CapturaDocumento;