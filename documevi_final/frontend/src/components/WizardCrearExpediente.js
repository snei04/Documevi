import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import './Dashboard.css';

/**
 * WizardCrearExpediente - Wizard de 4 pasos para crear expediente + documento
 * Paso 1: Datos del expediente + campos personalizados
 * Paso 2: Selección de opción de documento
 * Paso 3: Formulario de documento o búsqueda de existentes
 * Paso 4: Resumen y confirmación
 */
const WizardCrearExpediente = ({ isOpen, onClose, onSuccess, series, subseries, userPermissions = [] }) => {
    // Estado del wizard
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Paso 1: Datos del expediente
    const [expedienteData, setExpedienteData] = useState({
        id_serie: '',
        id_subserie: '',
        descriptor_1: '',
        descriptor_2: ''
    });
    const [filteredSubseries, setFilteredSubseries] = useState([]);
    const [camposPersonalizados, setCamposPersonalizados] = useState([]);
    const [customData, setCustomData] = useState({});

    // Paso 2: Opción de documento
    const [documentOption, setDocumentOption] = useState('ninguno'); // 'crear', 'relacionar', 'ninguno'

    // Paso 3: Datos del documento
    const [documentoData, setDocumentoData] = useState({
        tipo_soporte: 'Electrónico',
        asunto: '',
        ubicacion_fisica: '',
        remitente_nombre: '',
        remitente_identificacion: '',
        remitente_direccion: ''
    });
    const [archivo, setArchivo] = useState(null);
    const [documentosExistentes, setDocumentosExistentes] = useState([]);
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState([]);
    const [searchDocumento, setSearchDocumento] = useState('');

    // Permisos - Coherentes con el nuevo flujo unificado
    // Si puede crear expedientes, puede crear documentos dentro del wizard
    // Para relacionar existentes, necesita expedientes_agregar_documentos
    const canCreateDocument = userPermissions.includes('expedientes_crear');
    const canLinkDocument = userPermissions.includes('expedientes_agregar_documentos');

    // Reset al abrir
    useEffect(() => {
        if (isOpen) {
            resetWizard();
        }
    }, [isOpen]);

    const resetWizard = () => {
        setCurrentStep(1);
        setExpedienteData({
            id_serie: '',
            id_subserie: '',
            descriptor_1: '',
            descriptor_2: ''
        });
        setFilteredSubseries([]);
        setCamposPersonalizados([]);
        setCustomData({});
        setDocumentOption('ninguno');
        setDocumentoData({
            tipo_soporte: 'Electrónico',
            asunto: '',
            ubicacion_fisica: '',
            remitente_nombre: '',
            remitente_identificacion: '',
            remitente_direccion: ''
        });
        setArchivo(null);
        setDocumentosExistentes([]);
        setDocumentosSeleccionados([]);
        setSearchDocumento('');
    };

    // Cargar campos personalizados cuando cambia la serie
    const fetchCamposPersonalizados = useCallback(async (idOficina) => {
        if (!idOficina) {
            setCamposPersonalizados([]);
            return;
        }
        try {
            const res = await api.get(`/campos-personalizados/oficina/${idOficina}`);
            setCamposPersonalizados(res.data);
        } catch (err) {
            console.error('Error al cargar campos personalizados:', err);
            setCamposPersonalizados([]);
        }
    }, []);

    // Manejar cambio de serie
    const handleSerieChange = (e) => {
        const serieId = e.target.value;
        setExpedienteData(prev => ({ ...prev, id_serie: serieId, id_subserie: '' }));
        setCustomData({});

        const serieSeleccionada = series.find(s => s.id === parseInt(serieId));
        if (serieSeleccionada && !serieSeleccionada.requiere_subserie) {
            setFilteredSubseries([]);
        } else {
            setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(serieId)));
        }

        if (serieSeleccionada) {
            fetchCamposPersonalizados(serieSeleccionada.id_oficina_productora);
        } else {
            setCamposPersonalizados([]);
        }
    };

    // Buscar documentos existentes
    const buscarDocumentos = useCallback(async () => {
        if (!searchDocumento.trim()) return;
        try {
            const res = await api.get('/documentos', { params: { search: searchDocumento } });
            setDocumentosExistentes(res.data.slice(0, 20)); // Limitar a 20 resultados
        } catch (err) {
            console.error('Error al buscar documentos:', err);
            toast.error('Error al buscar documentos.');
        }
    }, [searchDocumento]);

    // Validar paso actual
    const validateStep = () => {
        switch (currentStep) {
            case 1:
                if (!expedienteData.id_serie) {
                    toast.error('Debe seleccionar una serie.');
                    return false;
                }
                const serieReqSubserie = series.find(s => s.id === parseInt(expedienteData.id_serie))?.requiere_subserie;
                if (serieReqSubserie && !expedienteData.id_subserie) {
                    toast.error('Debe seleccionar una subserie.');
                    return false;
                }
                // Validar campos obligatorios
                for (const campo of camposPersonalizados) {
                    if (campo.es_obligatorio && !customData[campo.id]?.trim()) {
                        toast.error(`El campo "${campo.nombre_campo}" es obligatorio.`);
                        return false;
                    }
                }
                return true;
            case 2:
                return true; // Siempre válido
            case 3:
                if (documentOption === 'crear') {
                    if (!documentoData.asunto.trim()) {
                        toast.error('El asunto del documento es obligatorio.');
                        return false;
                    }
                    const tipoSoporte = documentoData.tipo_soporte;
                    if ((tipoSoporte === 'Electrónico' || tipoSoporte === 'Híbrido') && !archivo) {
                        toast.error('Debe adjuntar un archivo.');
                        return false;
                    }
                    if ((tipoSoporte === 'Físico' || tipoSoporte === 'Híbrido') && !documentoData.ubicacion_fisica.trim()) {
                        toast.error('Debe especificar la ubicación física.');
                        return false;
                    }
                }
                if (documentOption === 'relacionar' && documentosSeleccionados.length === 0) {
                    toast.error('Debe seleccionar al menos un documento.');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    // Navegación
    const nextStep = () => {
        if (validateStep()) {
            // Si es ninguno en paso 2, saltar al resumen
            if (currentStep === 2 && documentOption === 'ninguno') {
                setCurrentStep(4);
            } else {
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const prevStep = () => {
        if (currentStep === 4 && documentOption === 'ninguno') {
            setCurrentStep(2);
        } else {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Enviar formulario
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const formData = new FormData();

            const payload = {
                expediente: expedienteData,
                customData: customData,
                documento: {
                    opcion: documentOption,
                    ...(documentOption === 'crear' ? documentoData : {}),
                    ...(documentOption === 'relacionar' ? { id_documento_existente: documentosSeleccionados } : {})
                }
            };

            formData.append('data', JSON.stringify(payload));

            if (archivo) {
                formData.append('archivo', archivo);
            }

            const res = await api.post('/expedientes/crear-completo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(res.data.msg || 'Expediente creado con éxito!');
            onSuccess?.(res.data);
            onClose();

        } catch (err) {
            console.error('Error al crear expediente:', err);
            toast.error(err.response?.data?.msg || 'Error al crear el expediente.');
        } finally {
            setSubmitting(false);
        }
    };

    // Obtener nombre de serie seleccionada
    const getSerieNombre = () => series.find(s => s.id === parseInt(expedienteData.id_serie))?.nombre_serie || '-';
    const getSubserieNombre = () => subseries.find(s => s.id === parseInt(expedienteData.id_subserie))?.nombre_subserie || '-';

    // Renderizar indicador de pasos
    const renderStepIndicator = () => (
        <div className="wizard-steps">
            {[1, 2, 3, 4].map(step => (
                <div
                    key={step}
                    className={`wizard-step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                >
                    <div className="step-number">{currentStep > step ? '✓' : step}</div>
                    <div className="step-label">
                        {step === 1 && 'Expediente'}
                        {step === 2 && 'Documento'}
                        {step === 3 && 'Detalles'}
                        {step === 4 && 'Confirmar'}
                    </div>
                </div>
            ))}
        </div>
    );

    // Renderizar paso 1
    const renderStep1 = () => (
        <div className="wizard-content">
            <h3>Datos del Expediente</h3>
            <p className="text-muted" style={{ marginBottom: '20px' }}>El radicado del expediente se generará automáticamente.</p>

            <div className="form-row">
                <div className="form-group">
                    <label>Serie Documental *</label>
                    <select value={expedienteData.id_serie} onChange={handleSerieChange}>
                        <option value="">-- Seleccione --</option>
                        {series.map(s => (
                            <option key={s.id} value={s.id}>{s.codigo_serie} - {s.nombre_serie}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Subserie {filteredSubseries.length > 0 ? '*' : '(No aplica)'}</label>
                    <select
                        value={expedienteData.id_subserie}
                        onChange={(e) => setExpedienteData(prev => ({ ...prev, id_subserie: e.target.value }))}
                        disabled={filteredSubseries.length === 0}
                    >
                        <option value="">-- Seleccione --</option>
                        {filteredSubseries.map(ss => (
                            <option key={ss.id} value={ss.id}>{ss.codigo_subserie} - {ss.nombre_subserie}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Descriptor 1 (Opcional)</label>
                    <input
                        type="text"
                        value={expedienteData.descriptor_1}
                        onChange={(e) => setExpedienteData(prev => ({ ...prev, descriptor_1: e.target.value }))}
                        placeholder="Ej: Número de contrato"
                    />
                </div>
                <div className="form-group">
                    <label>Descriptor 2 (Opcional)</label>
                    <input
                        type="text"
                        value={expedienteData.descriptor_2}
                        onChange={(e) => setExpedienteData(prev => ({ ...prev, descriptor_2: e.target.value }))}
                        placeholder="Ej: Año"
                    />
                </div>
            </div>

            {/* Campos personalizados */}
            {camposPersonalizados.length > 0 && (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                    <h4>Campos Personalizados</h4>
                    <div className="form-row" style={{ flexWrap: 'wrap' }}>
                        {camposPersonalizados.map(campo => (
                            <div className="form-group" key={campo.id} style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                <label>
                                    {campo.nombre_campo}
                                    {campo.es_obligatorio && ' *'}
                                    {campo.validar_duplicidad && ' 🔍'}
                                </label>
                                <input
                                    type={campo.tipo_campo === 'fecha' ? 'date' : campo.tipo_campo === 'numero' ? 'number' : 'text'}
                                    value={customData[campo.id] || ''}
                                    onChange={(e) => setCustomData(prev => ({ ...prev, [campo.id]: e.target.value }))}
                                    placeholder={campo.validar_duplicidad ? 'Se validará si ya existe...' : ''}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // Renderizar paso 2
    const renderStep2 = () => (
        <div className="wizard-content">
            <h3>¿Desea agregar un documento?</h3>
            <p className="text-muted">Puede crear un documento nuevo, relacionar uno existente, o dejar el expediente vacío.</p>

            <div className="option-cards">
                {canCreateDocument && (
                    <div
                        className={`option-card ${documentOption === 'crear' ? 'selected' : ''}`}
                        onClick={() => setDocumentOption('crear')}
                    >
                        <div className="option-icon">📄</div>
                        <div className="option-title">Crear Documento Nuevo</div>
                        <div className="option-description">Radicar un nuevo documento y vincularlo al expediente</div>
                    </div>
                )}

                {canLinkDocument && (
                    <div
                        className={`option-card ${documentOption === 'relacionar' ? 'selected' : ''}`}
                        onClick={() => setDocumentOption('relacionar')}
                    >
                        <div className="option-icon">🔗</div>
                        <div className="option-title">Relacionar Documento Existente</div>
                        <div className="option-description">Buscar y vincular documentos ya radicados</div>
                    </div>
                )}

                <div
                    className={`option-card ${documentOption === 'ninguno' ? 'selected' : ''}`}
                    onClick={() => setDocumentOption('ninguno')}
                >
                    <div className="option-icon">📁</div>
                    <div className="option-title">Sin Documento</div>
                    <div className="option-description">Crear expediente vacío, agregar documentos después</div>
                </div>
            </div>
        </div>
    );

    // Renderizar paso 3
    const renderStep3 = () => (
        <div className="wizard-content">
            {documentOption === 'crear' && (
                <>
                    <h3>Datos del Documento</h3>

                    <div className="form-group">
                        <label>Tipo de Soporte *</label>
                        <div className="radio-group">
                            {['Electrónico', 'Físico', 'Híbrido'].map(tipo => (
                                <label key={tipo} className="radio-label">
                                    <input
                                        type="radio"
                                        name="tipo_soporte"
                                        value={tipo}
                                        checked={documentoData.tipo_soporte === tipo}
                                        onChange={(e) => setDocumentoData(prev => ({ ...prev, tipo_soporte: e.target.value }))}
                                    />
                                    {tipo}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Asunto *</label>
                        <input
                            type="text"
                            value={documentoData.asunto}
                            onChange={(e) => setDocumentoData(prev => ({ ...prev, asunto: e.target.value }))}
                            placeholder="Descripción breve del documento"
                        />
                    </div>

                    {(documentoData.tipo_soporte === 'Electrónico' || documentoData.tipo_soporte === 'Híbrido') && (
                        <div className="form-group">
                            <label>Archivo * {archivo && `(${archivo.name})`}</label>
                            <input
                                type="file"
                                onChange={(e) => setArchivo(e.target.files[0])}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                            />
                        </div>
                    )}

                    {(documentoData.tipo_soporte === 'Físico' || documentoData.tipo_soporte === 'Híbrido') && (
                        <div className="form-group">
                            <label>Ubicación Física *</label>
                            <input
                                type="text"
                                value={documentoData.ubicacion_fisica}
                                onChange={(e) => setDocumentoData(prev => ({ ...prev, ubicacion_fisica: e.target.value }))}
                                placeholder="Ej: Archivo Central, Estante 3, Caja 12"
                            />
                        </div>
                    )}

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                        <h4>Datos del Remitente (Opcional)</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    value={documentoData.remitente_nombre}
                                    onChange={(e) => setDocumentoData(prev => ({ ...prev, remitente_nombre: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Identificación</label>
                                <input
                                    type="text"
                                    value={documentoData.remitente_identificacion}
                                    onChange={(e) => setDocumentoData(prev => ({ ...prev, remitente_identificacion: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Dirección</label>
                            <input
                                type="text"
                                value={documentoData.remitente_direccion}
                                onChange={(e) => setDocumentoData(prev => ({ ...prev, remitente_direccion: e.target.value }))}
                            />
                        </div>
                    </div>
                </>
            )}

            {documentOption === 'relacionar' && (
                <>
                    <h3>Buscar Documentos Existentes</h3>

                    <div className="form-group">
                        <label>Buscar por radicado o asunto</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={searchDocumento}
                                onChange={(e) => setSearchDocumento(e.target.value)}
                                placeholder="Ej: 20260209-0001 o Contrato..."
                                style={{ flex: 1 }}
                            />
                            <button type="button" className="button" onClick={buscarDocumentos}>
                                Buscar
                            </button>
                        </div>
                    </div>

                    {documentosExistentes.length > 0 && (
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>Sel.</th>
                                        <th>Radicado</th>
                                        <th>Asunto</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documentosExistentes.map(doc => (
                                        <tr key={doc.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={documentosSeleccionados.includes(doc.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setDocumentosSeleccionados(prev => [...prev, doc.id]);
                                                        } else {
                                                            setDocumentosSeleccionados(prev => prev.filter(id => id !== doc.id));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td>{doc.radicado}</td>
                                            <td>{doc.asunto}</td>
                                            <td>{new Date(doc.fecha_radicado).toLocaleDateString('es-CO')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {documentosSeleccionados.length > 0 && (
                        <p className="text-muted" style={{ marginTop: '10px' }}>
                            {documentosSeleccionados.length} documento(s) seleccionado(s)
                        </p>
                    )}
                </>
            )}
        </div>
    );

    // Renderizar paso 4 (Resumen)
    const renderStep4 = () => (
        <div className="wizard-content">
            <h3>Resumen</h3>

            <div className="summary-section">
                <h4>📁 Expediente</h4>
                <table className="summary-table">
                    <tbody>
                        <tr><td>Radicado:</td><td><strong><em>Se generará automáticamente</em></strong></td></tr>
                        <tr><td>Serie:</td><td>{getSerieNombre()}</td></tr>
                        {expedienteData.id_subserie && <tr><td>Subserie:</td><td>{getSubserieNombre()}</td></tr>}
                        {expedienteData.descriptor_1 && <tr><td>Descriptor 1:</td><td>{expedienteData.descriptor_1}</td></tr>}
                        {expedienteData.descriptor_2 && <tr><td>Descriptor 2:</td><td>{expedienteData.descriptor_2}</td></tr>}
                    </tbody>
                </table>

                {Object.keys(customData).length > 0 && (
                    <>
                        <h5>Campos Personalizados</h5>
                        <table className="summary-table">
                            <tbody>
                                {camposPersonalizados.filter(c => customData[c.id]).map(campo => (
                                    <tr key={campo.id}><td>{campo.nombre_campo}:</td><td>{customData[campo.id]}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            <div className="summary-section">
                <h4>📄 Documento</h4>
                {documentOption === 'ninguno' && <p>Sin documento adjunto</p>}
                {documentOption === 'crear' && (
                    <table className="summary-table">
                        <tbody>
                            <tr><td>Tipo:</td><td>Nuevo documento</td></tr>
                            <tr><td>Soporte:</td><td>{documentoData.tipo_soporte}</td></tr>
                            <tr><td>Asunto:</td><td>{documentoData.asunto}</td></tr>
                            {archivo && <tr><td>Archivo:</td><td>{archivo.name}</td></tr>}
                            {documentoData.ubicacion_fisica && <tr><td>Ubicación:</td><td>{documentoData.ubicacion_fisica}</td></tr>}
                        </tbody>
                    </table>
                )}
                {documentOption === 'relacionar' && (
                    <p>{documentosSeleccionados.length} documento(s) a relacionar</p>
                )}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Crear Expediente"
            className="modal modal-large"
            overlayClassName="modal-overlay"
        >
            <div className="wizard-container">
                <div className="wizard-header">
                    <h2>Crear Expediente</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                {renderStepIndicator()}

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}

                <div className="wizard-footer">
                    {currentStep > 1 && (
                        <button type="button" className="button" onClick={prevStep} disabled={submitting}>
                            ← Anterior
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    {currentStep < 4 && (
                        <button type="button" className="button button-primary" onClick={nextStep}>
                            Siguiente →
                        </button>
                    )}
                    {currentStep === 4 && (
                        <button
                            type="button"
                            className="button button-primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Creando...' : '✓ Crear Expediente'}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default WizardCrearExpediente;
