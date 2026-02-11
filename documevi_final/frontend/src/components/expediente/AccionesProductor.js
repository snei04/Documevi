import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import PermissionGuard from '../auth/PermissionGuard';
import FileUpload from '../FileUpload';

const AccionesProductor = ({ state, expediente, onDataChange }) => {
    // --- ESTADO LOCAL PARA LOS FORMULARIOS ---

    // Estado para "Añadir Documento" con búsqueda
    const [selectedDocumento, setSelectedDocumento] = useState('');
    const [requiereFirma, setRequiereFirma] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedDocInfo, setSelectedDocInfo] = useState(null);

    // Estado para modal de vista previa
    const [previewDoc, setPreviewDoc] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Estado para "Generar desde Plantilla"
    const [selectedPlantilla, setSelectedPlantilla] = useState(null);
    const [plantillaData, setPlantillaData] = useState({});

    // Estado para "Metadatos Personalizados"
    const [customData, setCustomData] = useState({});

    // Estado para "Crear Documento Nuevo"
    const [showCrearDocForm, setShowCrearDocForm] = useState(false);
    const [nuevoDocData, setNuevoDocData] = useState({
        tipo_soporte: 'Electrónico',
        asunto: '',
        // Campos de ubicación estructurados
        id_carpeta: '',
        tomo: '',
        modulo: '',
        estante: '',
        entrepaño: '',
        otro: '',
        remitente_nombre: '',
        remitente_identificacion: '',
        remitente_direccion: ''
    });
    const [carpetasDisponibles, setCarpetasDisponibles] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [creandoDoc, setCreandoDoc] = useState(false);
    const fileInputRef = useRef(null);

    // Sincroniza los metadatos del estado global al estado local cuando se cargan
    useEffect(() => {
        setCustomData(state.customData || {});
    }, [state.customData]);

    // Cargar carpetas cuando se abre el formulario de crear doc o cambia la oficina
    useEffect(() => {
        if (showCrearDocForm && expediente?.id_oficina_productora) {
            const fetchCarpetas = async () => {
                try {
                    // Obtener carpetas de la oficina (y serie/subserie si aplica, aunque la ubicación física es más de la oficina)
                    // Podríamos filtrar por año del expediente si fuera necesario, pero mejor mostrar todas las abiertas
                    const res = await api.get('/carpetas', {
                        params: {
                            id_oficina: expediente.id_oficina_productora,
                            estado: 'Abierta'
                        }
                    });
                    // El endpoint devuelve { data: [...], meta: ... } o [...] según la implementación
                    setCarpetasDisponibles(Array.isArray(res.data) ? res.data : (res.data.data || []));
                } catch (err) {
                    console.error("Error cargando carpetas", err);
                }
            };
            fetchCarpetas();
        }
    }, [showCrearDocForm, expediente]);

    // Manejar cambio en selección de carpeta para auto-completar ubicación
    const handleCarpetaChange = (e) => {
        const carpetaId = e.target.value;
        const carpeta = carpetasDisponibles.find(c => c.id === parseInt(carpetaId));

        if (carpeta) {
            setNuevoDocData(prev => ({
                ...prev,
                id_carpeta: carpetaId,
                modulo: carpeta.ubicacion_modulo || '',
                estante: carpeta.ubicacion_estante || '',
                entrepaño: carpeta.ubicacion_entrepaño || '',
                otro: '' // Limpiar 'otro' si se selecciona carpeta
            }));
        } else {
            // Si se deselecciona, limpiar o mantener? Mejor solo actualizar el ID
            setNuevoDocData(prev => ({ ...prev, id_carpeta: '' }));
        }
    };


    // Filtrar documentos según término de búsqueda
    const filteredDocumentos = state.documentosDisponibles.filter(doc =>
        doc.radicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.asunto.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectDoc = (doc) => {
        setSelectedDocumento(doc.id);
        setSelectedDocInfo(doc);
        setSearchTerm(doc.radicado);
        setShowDropdown(false);
    };

    const handleClearSelection = () => {
        setSelectedDocumento('');
        setSelectedDocInfo(null);
        setSearchTerm('');
    };

    const handlePreviewDoc = (doc, e) => {
        e.stopPropagation(); // Evitar que se seleccione el documento
        setPreviewDoc(doc);
        setShowPreviewModal(true);
    };

    const closePreviewModal = () => {
        setPreviewDoc(null);
        setShowPreviewModal(false);
    };

    // --- MANEJADORES DE EVENTOS ---

    const handleAddDocumento = async (e) => {
        e.preventDefault();
        if (!selectedDocumento) return toast.warn('Por favor, seleccione un documento.');
        try {
            await api.post(`/expedientes/${expediente.id}/documentos`, { id_documento: selectedDocumento, requiere_firma: requiereFirma });
            toast.success('Documento añadido con éxito.');
            handleClearSelection();
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



    // Handler para crear documento nuevo
    const handleCrearDocumento = async (e) => {
        e.preventDefault();
        if (!nuevoDocData.asunto.trim()) {
            return toast.error('El asunto del documento es obligatorio.');
        }
        if (nuevoDocData.tipo_soporte === 'Electrónico' && !archivo) {
            return toast.error('Debe adjuntar un archivo para documentos electrónicos.');
        }
        if (nuevoDocData.tipo_soporte === 'Electrónico' && !archivo) {
            return toast.error('Debe adjuntar un archivo para documentos electrónicos.');
        }

        // Validación para físico/híbrido: Requiere al menos carpeta O ubicación manual
        if ((nuevoDocData.tipo_soporte === 'Físico' || nuevoDocData.tipo_soporte === 'Híbrido')) {
            const hasLocation = nuevoDocData.id_carpeta ||
                nuevoDocData.ubicacion_fisica ||
                (nuevoDocData.otro && nuevoDocData.otro.trim()) ||
                (nuevoDocData.tomo && nuevoDocData.tomo.trim()) ||
                (nuevoDocData.modulo && nuevoDocData.modulo.trim()) ||
                (nuevoDocData.estante && nuevoDocData.estante.trim()) ||
                (nuevoDocData.entrepaño && nuevoDocData.entrepaño.trim());

            if (!hasLocation) {
                return toast.error('Para documentos físicos, debe especificar una Carpeta o detalles de Ubicación.');
            }
        }

        setCreandoDoc(true);
        try {
            const formData = new FormData();
            formData.append('asunto', nuevoDocData.asunto);
            formData.append('tipo_soporte', nuevoDocData.tipo_soporte);
            formData.append('id_serie', expediente.id_serie);
            formData.append('id_subserie', expediente.id_subserie || '');
            formData.append('id_oficina_productora', expediente.id_oficina_productora);
            formData.append('id_expediente', expediente.id); // Para vincular automáticamente

            if (nuevoDocData.id_carpeta) formData.append('id_carpeta', nuevoDocData.id_carpeta);
            if (nuevoDocData.tomo) formData.append('tomo', nuevoDocData.tomo);
            if (nuevoDocData.modulo) formData.append('modulo', nuevoDocData.modulo);
            if (nuevoDocData.estante) formData.append('estante', nuevoDocData.estante);
            if (nuevoDocData.entrepaño) formData.append('entrepaño', nuevoDocData.entrepaño);
            if (nuevoDocData.otro) formData.append('otro', nuevoDocData.otro);

            // Mantenemos ubicacion_fisica como string concatenado para compatibilidad o display simple si se desea
            // Opcional: construirlo si no viene
            // if (nuevoDocData.ubicacion_fisica) {
            //     formData.append('ubicacion_fisica', nuevoDocData.ubicacion_fisica);
            // }
            if (nuevoDocData.remitente_nombre) {
                formData.append('remitente_nombre', nuevoDocData.remitente_nombre);
                formData.append('remitente_identificacion', nuevoDocData.remitente_identificacion || '');
                formData.append('remitente_direccion', nuevoDocData.remitente_direccion || '');
            }
            if (archivo) {
                formData.append('archivo', archivo);
            }

            await api.post('/documentos/con-expediente', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Documento creado y añadido al expediente.');
            setNuevoDocData({
                tipo_soporte: 'Electrónico',
                asunto: '',
                id_carpeta: '',
                tomo: '',
                modulo: '',
                estante: '',
                entrepaño: '',
                otro: '',
                remitente_nombre: '',
                remitente_identificacion: '',
                remitente_direccion: ''
            });
            setArchivo(null);
            setShowCrearDocForm(false);
            onDataChange();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear el documento.');
        } finally {
            setCreandoDoc(false);
        }
    };

    // --- RENDERIZADO DE FORMULARIOS ---
    console.log('Datos de plantillas disponibles:', state.plantillas);
    return (
        <>
            {/* Formulario para añadir documento existente con búsqueda */}
            {expediente.estado === 'En trámite' && (
                <div className="content-box">
                    <h3>Añadir Documento al Expediente</h3>
                    <form onSubmit={handleAddDocumento}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar por radicado o asunto..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowDropdown(true);
                                        if (!e.target.value) handleClearSelection();
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: selectedDocInfo ? '2px solid #38a169' : '1px solid #ccc',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                />
                                {selectedDocInfo && (
                                    <button
                                        type="button"
                                        onClick={handleClearSelection}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            color: '#666'
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                                {showDropdown && searchTerm && !selectedDocInfo && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        backgroundColor: '#fff',
                                        border: '1px solid #ccc',
                                        borderRadius: '0 0 6px 6px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        zIndex: 1000
                                    }}>
                                        {filteredDocumentos.length > 0 ? (
                                            filteredDocumentos.slice(0, 10).map(doc => (
                                                <div
                                                    key={doc.id}
                                                    onClick={() => handleSelectDoc(doc)}
                                                    style={{
                                                        padding: '10px 12px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #eee',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                                >
                                                    <div>
                                                        <strong style={{ color: '#2c5282' }}>{doc.radicado}</strong>
                                                        <span style={{ color: '#666', marginLeft: '10px' }}>
                                                            {doc.asunto.length > 40 ? doc.asunto.substring(0, 40) + '...' : doc.asunto}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handlePreviewDoc(doc, e)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            backgroundColor: '#3182ce',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Ver detalles"
                                                    >
                                                        👁️ Ver
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '10px 12px', color: '#999', textAlign: 'center' }}>
                                                No se encontraron documentos
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input type="checkbox" checked={requiereFirma} onChange={(e) => setRequiereFirma(e.target.checked)} />
                                ¿Requiere Firma?
                            </label>

                            <button type="submit" className="button" disabled={!selectedDocumento}>
                                Añadir
                            </button>
                        </div>

                        {selectedDocInfo && (
                            <div style={{
                                marginTop: '10px',
                                padding: '10px',
                                backgroundColor: '#f0fff4',
                                borderRadius: '6px',
                                border: '1px solid #9ae6b4'
                            }}>
                                <strong>Documento seleccionado:</strong> {selectedDocInfo.radicado} - {selectedDocInfo.asunto}
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* Formulario para generar documento desde plantilla */}
            {expediente.estado === 'En trámite' && state.plantillas && state.plantillas.length > 0 && (
                <div className="content-box">
                    <h3>Generar Documento desde Plantilla</h3>
                    <select onChange={(e) => handleSelectPlantilla(e.target.value)} style={{ marginBottom: '15px' }} value={selectedPlantilla?.id || ''}>
                        <option value="">-- Seleccione una Plantilla --</option>
                        {state.plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>

                    {/* Renderizado dinámico de campos según la plantilla seleccionada */}
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
            )}



            {/* Formulario para crear documento nuevo - Con permiso expedientes_crear */}
            {expediente.estado === 'En trámite' && (
                <PermissionGuard permission="expedientes_crear">
                    <div className="content-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>📄 Crear Documento Nuevo</h3>
                            <button
                                type="button"
                                onClick={() => setShowCrearDocForm(!showCrearDocForm)}
                                className="button"
                                style={{ backgroundColor: showCrearDocForm ? '#e2e8f0' : '#3182ce', color: showCrearDocForm ? '#4a5568' : '#fff' }}
                            >
                                {showCrearDocForm ? '✕ Cerrar' : '+ Nuevo Documento'}
                            </button>
                        </div>

                        {showCrearDocForm && (
                            <form onSubmit={handleCrearDocumento}>
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    <div className="form-group">
                                        <label>Tipo de Soporte *</label>
                                        <select
                                            value={nuevoDocData.tipo_soporte}
                                            onChange={(e) => setNuevoDocData(prev => ({ ...prev, tipo_soporte: e.target.value }))}
                                        >
                                            <option value="Electrónico">Electrónico</option>
                                            <option value="Físico">Físico</option>
                                            <option value="Híbrido">Híbrido</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Asunto *</label>
                                        <input
                                            type="text"
                                            value={nuevoDocData.asunto}
                                            onChange={(e) => setNuevoDocData(prev => ({ ...prev, asunto: e.target.value }))}
                                            placeholder="Descripción del documento"
                                        />
                                    </div>

                                    {(nuevoDocData.tipo_soporte === 'Físico' || nuevoDocData.tipo_soporte === 'Híbrido') && (
                                        <div style={{ padding: '15px', backgroundColor: '#fffaf0', borderRadius: '6px', border: '1px solid #fae6b8' }}>
                                            <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#c05621' }}>📍 Ubicación Física</h4>

                                            <div className="form-group">
                                                <label>Carpeta (Opcional - Autocompleta ubicación)</label>
                                                <select
                                                    value={nuevoDocData.id_carpeta}
                                                    onChange={handleCarpetaChange}
                                                    style={{ width: '100%' }}
                                                >
                                                    <option value="">-- Seleccione Carpeta (o ingrese manualmente abajo) --</option>
                                                    {carpetasDisponibles.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.codigo_carpeta ? `${c.codigo_carpeta} - ` : ''}{c.nombre_carpeta || `Carpeta #${c.consecutivo} (${c.año})`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                                <div className="form-group">
                                                    <label>Tomo / Legajo</label>
                                                    <input
                                                        type="text"
                                                        name="tomo"
                                                        className="form-control"
                                                        value={nuevoDocData.tomo}
                                                        onChange={(e) => setNuevoDocData(prev => ({ ...prev, tomo: e.target.value }))}
                                                        placeholder="Tomo 1"
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                <div className="form-group">
                                                    <label>Estante</label>
                                                    <input
                                                        type="text"
                                                        value={nuevoDocData.estante}
                                                        onChange={(e) => setNuevoDocData(prev => ({ ...prev, estante: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Entrepaño</label>
                                                    <input
                                                        type="text"
                                                        value={nuevoDocData.entrepaño}
                                                        onChange={(e) => setNuevoDocData(prev => ({ ...prev, entrepaño: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Módulo</label>
                                                    <input
                                                        type="text"
                                                        value={nuevoDocData.modulo}
                                                        onChange={(e) => setNuevoDocData(prev => ({ ...prev, modulo: e.target.value }))}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Otro (Notas adicionales)</label>
                                                <input
                                                    type="text"
                                                    value={nuevoDocData.otro}
                                                    onChange={(e) => setNuevoDocData(prev => ({ ...prev, otro: e.target.value }))}
                                                    placeholder="Ej: Archivo de gestión temporal, gaveta 2..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(nuevoDocData.tipo_soporte === 'Electrónico' || nuevoDocData.tipo_soporte === 'Híbrido') && (
                                        <div className="form-group">
                                            <label>Adjuntar Archivo {nuevoDocData.tipo_soporte === 'Electrónico' ? '*' : '(Opcional)'}</label>
                                            <FileUpload
                                                onFileChange={(file) => setArchivo(file)}
                                                ref={fileInputRef}
                                            />
                                        </div>
                                    )}

                                    <details style={{ marginTop: '10px' }}>
                                        <summary style={{ cursor: 'pointer', color: '#3182ce' }}>+ Datos del Remitente (Opcional)</summary>
                                        <div style={{ padding: '15px', backgroundColor: '#f7fafc', borderRadius: '6px', marginTop: '10px' }}>
                                            <div className="form-group">
                                                <label>Nombre del Remitente</label>
                                                <input
                                                    type="text"
                                                    value={nuevoDocData.remitente_nombre}
                                                    onChange={(e) => setNuevoDocData(prev => ({ ...prev, remitente_nombre: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Identificación</label>
                                                <input
                                                    type="text"
                                                    value={nuevoDocData.remitente_identificacion}
                                                    onChange={(e) => setNuevoDocData(prev => ({ ...prev, remitente_identificacion: e.target.value }))}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Dirección</label>
                                                <input
                                                    type="text"
                                                    value={nuevoDocData.remitente_direccion}
                                                    onChange={(e) => setNuevoDocData(prev => ({ ...prev, remitente_direccion: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </details>

                                    <div style={{ marginTop: '15px' }}>
                                        <button type="submit" className="button button-primary" disabled={creandoDoc}>
                                            {creandoDoc ? '⏳ Creando...' : '✓ Crear y Añadir al Expediente'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </PermissionGuard>
            )}

            {/* Modal de Vista Previa del Documento */}
            {showPreviewModal && previewDoc && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}
                    onClick={closePreviewModal}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '0',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header del Modal */}
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#f7fafc'
                        }}>
                            <h3 style={{ margin: 0, color: '#2d3748' }}>📄 Detalle del Documento</h3>
                            <button
                                onClick={closePreviewModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#718096'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(80vh - 140px)' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    backgroundColor: previewDoc.tipo_soporte === 'Físico' ? '#feebc8' : previewDoc.tipo_soporte === 'Híbrido' ? '#bee3f8' : '#c6f6d5',
                                    color: previewDoc.tipo_soporte === 'Físico' ? '#c05621' : previewDoc.tipo_soporte === 'Híbrido' ? '#2b6cb0' : '#276749',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {previewDoc.tipo_soporte || 'Electrónico'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Radicado</label>
                                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 'bold', color: '#2c5282' }}>{previewDoc.radicado}</p>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Asunto</label>
                                    <p style={{ margin: '5px 0 0', color: '#2d3748' }}>{previewDoc.asunto}</p>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Fecha de Radicado</label>
                                    <p style={{ margin: '5px 0 0', color: '#2d3748' }}>
                                        {previewDoc.fecha_radicado ? new Date(previewDoc.fecha_radicado).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>

                                {(previewDoc.tipo_soporte === 'Físico' || previewDoc.tipo_soporte === 'Híbrido') && (
                                    <div style={{
                                        backgroundColor: '#e8f4fd',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        border: '1px solid #bee3f8'
                                    }}>
                                        <label style={{ fontSize: '12px', color: '#2b6cb0', textTransform: 'uppercase', fontWeight: '600' }}>
                                            📍 Ubicación Física
                                        </label>
                                        <p style={{ margin: '5px 0 0', color: '#2c5282', fontWeight: '500' }}>
                                            {previewDoc.ubicacion_fisica || 'Sin ubicación registrada'}
                                        </p>
                                    </div>
                                )}

                                {previewDoc.remitente_nombre && (
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Remitente</label>
                                        <p style={{ margin: '5px 0 0', color: '#2d3748' }}>{previewDoc.remitente_nombre}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer del Modal */}
                        <div style={{
                            padding: '15px 20px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            backgroundColor: '#f7fafc'
                        }}>
                            <button
                                onClick={() => {
                                    handleSelectDoc(previewDoc);
                                    closePreviewModal();
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#38a169',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                ✓ Seleccionar este documento
                            </button>
                            <button
                                onClick={closePreviewModal}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#e2e8f0',
                                    color: '#4a5568',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AccionesProductor;