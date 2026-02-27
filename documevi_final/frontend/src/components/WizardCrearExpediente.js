import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import DuplicadoAlertModal from './DuplicadoAlertModal';
import FileUpload from './FileUpload';
import './Dashboard.css';

/**
 * WizardCrearExpediente - Flujo optimizado de 3 pasos para crear expediente
 * Paso 1: Clasificación (Serie, Subserie, Campos Personalizados, Tipo de Soporte) + Validación de Duplicidad
 * Paso 2: (Automático) Validación de duplicidad — se resuelve antes de avanzar
 * Paso 3: Detalles del Expediente (Asunto, Fechas, Ubicación Física, Observaciones)
 */
const WizardCrearExpediente = ({ isOpen, onClose, onSuccess, series, subseries, userPermissions = [] }) => {
    // Estado del wizard
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [validating, setValidating] = useState(false);

    // Paso 1: Clasificación
    const [expedienteData, setExpedienteData] = useState({
        id_serie: '',
        id_subserie: '',
        descriptor_1: '',
        descriptor_2: '',
        tipo_soporte: 'Electrónico'
    });
    const [filteredSubseries, setFilteredSubseries] = useState([]);
    const [camposPersonalizados, setCamposPersonalizados] = useState([]);
    const [customData, setCustomData] = useState({});

    // Estado para duplicados
    const [duplicadoModalOpen, setDuplicadoModalOpen] = useState(false);
    const [duplicadoInfo, setDuplicadoInfo] = useState(null);

    // Paso 3: Detalles del expediente
    const [detallesData, setDetallesData] = useState({
        asunto: '',
        fecha_apertura: '',
        fecha_cierre: '',
        observaciones: ''
    });

    // Documento inicial (opcional)
    const [incluirDocumento, setIncluirDocumento] = useState(false);
    const [documentoData, setDocumentoData] = useState({
        asunto_doc: ''
    });
    const [archivoDoc, setArchivoDoc] = useState(null);
    const fileInputRef = useRef(null);

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
            descriptor_2: '',
            tipo_soporte: 'Electrónico'
        });
        setFilteredSubseries([]);
        setCamposPersonalizados([]);
        setCustomData({});
        setDetallesData({
            asunto: '',
            fecha_apertura: '',
            fecha_cierre: '',
            observaciones: ''
        });
        setIncluirDocumento(false);
        setDocumentoData({ asunto_doc: '' });
        setArchivoDoc(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setDuplicadoModalOpen(false);
        setDuplicadoInfo(null);
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
        const serieSeleccionada = series.find(s => s.id === parseInt(serieId));

        setExpedienteData(prev => ({ ...prev, id_serie: serieId, id_subserie: '' }));
        setCustomData({});

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

    // Validar paso 1
    const validateStep1 = () => {
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
        if (!expedienteData.tipo_soporte) {
            toast.error('Debe seleccionar un tipo de soporte.');
            return false;
        }
        return true;
    };

    // Ejecutar validación de duplicidad y avanzar
    const handleValidarYSiguiente = async () => {
        if (!validateStep1()) return;

        setValidating(true);
        try {
            const serieSeleccionada = series.find(s => s.id === parseInt(expedienteData.id_serie));
            const camposConValidacion = camposPersonalizados.filter(c => c.validar_duplicidad);

            if (camposConValidacion.length > 0 && Object.keys(customData).length > 0) {
                const validacionRes = await api.post('/expedientes/validar-duplicados', {
                    id_oficina: serieSeleccionada?.id_oficina_productora,
                    campos_personalizados: customData
                });

                if (validacionRes.data.duplicado) {
                    // Escenario A: Duplicado encontrado
                    setDuplicadoInfo(validacionRes.data);
                    setDuplicadoModalOpen(true);
                    setValidating(false);
                    return;
                }
            }

            // Escenario B: Sin duplicados → avanzar a paso 3
            prepararPaso3();
        } catch (err) {
            console.error('Error en validación de duplicados:', err);
            toast.error(err.response?.data?.msg || 'Error al validar duplicados.');
        } finally {
            setValidating(false);
        }
    };

    // Preparar datos para el paso 3
    const prepararPaso3 = () => {
        // Pre-llenar fecha de apertura si es Electrónico
        if (expedienteData.tipo_soporte === 'Electrónico') {
            const hoy = new Date().toISOString().split('T')[0];
            setDetallesData(prev => ({
                ...prev,
                fecha_apertura: hoy,
                fecha_cierre: '' // No aplica en creación electrónica
            }));
        } else {
            setDetallesData(prev => ({
                ...prev,
                fecha_apertura: '',
                fecha_cierre: ''
            }));
        }
        setCurrentStep(3);
    };

    // Manejar acciones del modal de duplicado
    const handleAnexarDocumento = () => {
        // Redirigir al expediente existente
        const expedienteId = duplicadoInfo.expediente_existente.id;
        toast.info('Redirigiendo al expediente existente...');
        setDuplicadoModalOpen(false);
        onClose();
        window.location.href = `/dashboard/expedientes/${expedienteId}`;
    };

    const handleForzarCreacion = () => {
        // Cerrar modal y avanzar con forzar_creacion=true
        setDuplicadoModalOpen(false);
        setDuplicadoInfo(null);
        prepararPaso3();
    };

    const handleCloseDuplicadoModal = () => {
        setDuplicadoModalOpen(false);
        setDuplicadoInfo(null);
    };

    // Enviar formulario final (Paso 3)
    const handleSubmit = async () => {
        if (!detallesData.asunto?.trim()) {
            toast.error('El asunto del expediente es obligatorio.');
            return;
        }

        // Validar documento si se incluye
        if (incluirDocumento) {
            if (!documentoData.asunto_doc?.trim()) {
                toast.error('El asunto del documento es obligatorio.');
                return;
            }
            if (expedienteData.tipo_soporte === 'Electrónico' && !archivoDoc) {
                toast.error('Debe adjuntar un archivo para el documento electrónico.');
                return;
            }
        }

        setSubmitting(true);
        try {
            const expedientePayload = {
                ...expedienteData,
                asunto: detallesData.asunto,
                fecha_apertura: detallesData.fecha_apertura || null,
                fecha_cierre: detallesData.fecha_cierre || null,
                observaciones: detallesData.observaciones || null,
                forzar_creacion: duplicadoInfo ? true : false
            };

            let res;

            if (incluirDocumento) {
                // Enviar como FormData para incluir el archivo
                const formData = new FormData();
                formData.append('data', JSON.stringify({
                    expediente: expedientePayload,
                    customData: customData,
                    documento: {
                        asunto: documentoData.asunto_doc,
                        tipo_soporte: expedienteData.tipo_soporte
                    }
                }));
                if (archivoDoc) {
                    formData.append('archivo', archivoDoc);
                }
                res = await api.post('/expedientes/crear-completo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Enviar como JSON normal (sin documento)
                const payload = {
                    expediente: expedientePayload,
                    customData: customData
                };
                res = await api.post('/expedientes/crear-completo', payload);
            }

            // Mostrar info de ubicación si aplica
            let successMsg = res.data.msg || 'Expediente creado con éxito!';
            if (res.data.carpeta) {
                successMsg = `Expediente creado. Carpeta: ${res.data.carpeta.codigo_carpeta}` +
                    (res.data.paquete ? ` | Paquete: ${res.data.paquete.numero_paquete}` : '');
            }
            if (res.data.documento) {
                successMsg += ` | Doc: ${res.data.documento.radicado}`;
            }
            toast.success(successMsg, { autoClose: 5000 });

            onSuccess?.(res.data);
            onClose();

        } catch (err) {
            console.error('Error al crear expediente:', err);
            toast.error(err.response?.data?.msg || 'Error al crear el expediente.');
        } finally {
            setSubmitting(false);
        }
    };

    // Obtener nombres para el resumen
    const getSerieNombre = () => series.find(s => s.id === parseInt(expedienteData.id_serie))?.nombre_serie || '-';
    const getSubserieNombre = () => subseries.find(s => s.id === parseInt(expedienteData.id_subserie))?.nombre_subserie || '-';

    // Renderizar indicador de pasos
    const renderStepIndicator = () => (
        <div className="wizard-steps">
            {[
                { num: 1, label: 'Clasificación' },
                { num: 3, label: 'Detalles' }
            ].map(step => (
                <div
                    key={step.num}
                    className={`wizard-step ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}
                >
                    <div className="step-number">{currentStep > step.num ? '✓' : step.num === 3 ? 2 : 1}</div>
                    <div className="step-label">{step.label}</div>
                </div>
            ))}
        </div>
    );

    // Renderizar paso 1: Clasificación
    const renderStep1 = () => (
        <div className="wizard-content">
            <h3>Clasificación y Captura Inicial</h3>
            <p className="text-muted" style={{ marginBottom: '20px' }}>
                Seleccione la clasificación documental y los datos de identificación del expediente.
            </p>

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

            {/* Tipo de Soporte */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                <h4>Tipo de Soporte *</h4>
                <div className="radio-group" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    {['Electrónico', 'Físico'].map(tipo => (
                        <label key={tipo} className="radio-label" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            border: `2px solid ${expedienteData.tipo_soporte === tipo ? '#3498db' : '#ddd'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: expedienteData.tipo_soporte === tipo ? '#ebf5fb' : '#fff',
                            transition: 'all 0.2s ease'
                        }}>
                            <input
                                type="radio"
                                name="tipo_soporte"
                                value={tipo}
                                checked={expedienteData.tipo_soporte === tipo}
                                onChange={(e) => setExpedienteData(prev => ({ ...prev, tipo_soporte: e.target.value }))}
                            />
                            <span style={{ fontSize: '20px' }}>{tipo === 'Electrónico' ? '💻' : '📄'}</span>
                            <span style={{ fontWeight: expedienteData.tipo_soporte === tipo ? 'bold' : 'normal' }}>{tipo}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    // Renderizar paso 3: Detalles
    const renderStep3 = () => (
        <div className="wizard-content">
            <h3>Detalles del Expediente</h3>

            {/* Resumen de clasificación (solo lectura) */}
            <div style={{
                background: '#f0f7ff',
                border: '1px solid #b3d4fc',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c5282' }}>📋 Clasificación (Solo Lectura)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                    <div><strong>Serie:</strong> {getSerieNombre()}</div>
                    {expedienteData.id_subserie && (
                        <div><strong>Subserie:</strong> {getSubserieNombre()}</div>
                    )}
                    <div><strong>Soporte:</strong> {expedienteData.tipo_soporte === 'Electrónico' ? '💻' : '📄'} {expedienteData.tipo_soporte}</div>
                    {Object.keys(customData).length > 0 && camposPersonalizados.filter(c => customData[c.id]).map(campo => (
                        <div key={campo.id}><strong>{campo.nombre_campo}:</strong> {customData[campo.id]}</div>
                    ))}
                </div>
            </div>

            {/* Asunto */}
            <div className="form-group">
                <label>Asunto / Descripción del Expediente *</label>
                <input
                    type="text"
                    value={detallesData.asunto}
                    onChange={(e) => setDetallesData(prev => ({ ...prev, asunto: e.target.value }))}
                    placeholder="Ej: Expediente de contratación directa para..."
                />
            </div>

            {/* Bloque de Fechas */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                <h4>Fechas</h4>

                {expedienteData.tipo_soporte === 'Físico' ? (
                    <>
                        <p className="text-muted" style={{ fontSize: '13px', marginBottom: '10px' }}>
                            📌 Los expedientes físicos permiten fechas manuales (útil para migración de archivos históricos).
                        </p>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Fecha de Apertura</label>
                                <input
                                    type="date"
                                    value={detallesData.fecha_apertura}
                                    onChange={(e) => setDetallesData(prev => ({ ...prev, fecha_apertura: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha de Cierre</label>
                                <input
                                    type="date"
                                    value={detallesData.fecha_cierre}
                                    onChange={(e) => setDetallesData(prev => ({ ...prev, fecha_cierre: e.target.value }))}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="form-group">
                            <label>Fecha de Apertura (Automática)</label>
                            <input
                                type="date"
                                value={detallesData.fecha_apertura}
                                onChange={(e) => {
                                    setDetallesData(prev => ({ ...prev, fecha_apertura: e.target.value }));
                                }}
                            />
                        </div>
                        {detallesData.fecha_apertura !== new Date().toISOString().split('T')[0] && detallesData.fecha_apertura && (
                            <div style={{
                                background: '#fff3cd',
                                border: '1px solid #ffc107',
                                borderRadius: '6px',
                                padding: '10px',
                                fontSize: '13px',
                                marginTop: '-10px',
                                marginBottom: '15px'
                            }}>
                                ⚠️ <strong>Advertencia de Auditoría:</strong> Al modificar la fecha automática, se registrará
                                este cambio en el módulo de auditoría del sistema con su usuario, la fecha original del servidor
                                y la fecha ingresada.
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Ubicación Física (solo para soporte Físico) */}
            {expedienteData.tipo_soporte === 'Físico' && (
                <div style={{
                    borderTop: '1px solid #eee',
                    paddingTop: '15px',
                    marginTop: '15px'
                }}>
                    <h4>📍 Ubicación Física</h4>
                    <div style={{
                        background: '#e6fffa',
                        border: '1px solid #b2f5ea',
                        borderRadius: '8px',
                        padding: '15px'
                    }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#285e61' }}>
                            <strong>Asignación Automática:</strong> El sistema asignará automáticamente este expediente
                            al paquete activo y generará una carpeta con número consecutivo. Podrá ver estos datos
                            una vez creado el expediente.
                        </p>
                    </div>
                </div>
            )}

            {/* Documento inicial */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>
                        {expedienteData.tipo_soporte === 'Físico' ? '📄' : '💻'} Primer Documento
                    </h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                            type="checkbox"
                            checked={incluirDocumento}
                            onChange={(e) => {
                                setIncluirDocumento(e.target.checked);
                                if (!e.target.checked) {
                                    setDocumentoData({ asunto_doc: '' });
                                    setArchivoDoc(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }
                            }}
                        />
                        Incluir documento {expedienteData.tipo_soporte === 'Físico' ? 'físico' : 'electrónico'} al crear
                    </label>
                </div>

                {incluirDocumento && (
                    <div style={{
                        background: '#f7fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '15px'
                    }}>
                        <div style={{
                            background: expedienteData.tipo_soporte === 'Físico' ? '#fef3c7' : '#dbeafe',
                            border: `1px solid ${expedienteData.tipo_soporte === 'Físico' ? '#f59e0b' : '#3b82f6'}`,
                            borderRadius: '6px',
                            padding: '8px 12px',
                            marginBottom: '15px',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {expedienteData.tipo_soporte === 'Físico' ? '📄' : '💻'}
                            <span>Tipo de soporte del documento: <strong>{expedienteData.tipo_soporte}</strong> (heredado del expediente)</span>
                        </div>

                        <div className="form-group">
                            <label>Asunto del Documento *</label>
                            <input
                                type="text"
                                value={documentoData.asunto_doc}
                                onChange={(e) => setDocumentoData(prev => ({ ...prev, asunto_doc: e.target.value }))}
                                placeholder={`Descripción del documento ${expedienteData.tipo_soporte === 'Físico' ? 'físico' : 'electrónico'}...`}
                            />
                        </div>

                        {expedienteData.tipo_soporte === 'Electrónico' && (
                            <div className="form-group">
                                <label>Adjuntar Archivo *</label>
                                <FileUpload
                                    onFileChange={(file) => setArchivoDoc(file)}
                                    ref={fileInputRef}
                                    inputId="wizard-doc-file"
                                />
                            </div>
                        )}

                        <div style={{
                            background: '#e6fffa',
                            border: '1px solid #b2f5ea',
                            borderRadius: '6px',
                            padding: '10px',
                            marginTop: '10px',
                            fontSize: '13px',
                            color: '#285e61'
                        }}>
                            📎 El documento se vinculará automáticamente al expediente con folio #1
                            {expedienteData.tipo_soporte === 'Físico' && ' y se ubicará en la carpeta/paquete asignados'}.
                        </div>
                    </div>
                )}
            </div>

            {/* Observaciones */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                <div className="form-group">
                    <label>Observaciones (Opcional)</label>
                    <textarea
                        value={detallesData.observaciones}
                        onChange={(e) => setDetallesData(prev => ({ ...prev, observaciones: e.target.value }))}
                        rows="3"
                        placeholder="Notas adicionales sobre el expediente..."
                        style={{ width: '100%', resize: 'vertical' }}
                    />
                </div>
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
                {currentStep === 3 && renderStep3()}

                <div className="wizard-footer">
                    {currentStep === 3 && (
                        <button
                            type="button"
                            className="button"
                            onClick={() => {
                                setCurrentStep(1);
                                setDuplicadoInfo(null);
                            }}
                            disabled={submitting}
                        >
                            ← Anterior
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    {currentStep === 1 && (
                        <button
                            type="button"
                            className="button button-primary"
                            onClick={handleValidarYSiguiente}
                            disabled={validating}
                        >
                            {validating ? 'Validando...' : 'Validar / Siguiente →'}
                        </button>
                    )}
                    {currentStep === 3 && (
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

            {/* Modal de Alerta de Duplicado */}
            <DuplicadoAlertModal
                isOpen={duplicadoModalOpen}
                onClose={handleCloseDuplicadoModal}
                duplicadoInfo={duplicadoInfo}
                onConfirmarAnexion={handleAnexarDocumento}
                onForzarCreacion={handleForzarCreacion}
                loading={submitting}
            />
        </Modal>
    );
};

export default WizardCrearExpediente;
