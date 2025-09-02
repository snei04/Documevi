import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import SignaturePad from 'react-signature-pad-wrapper';
import './Dashboard.css';

const ExpedienteDetalle = () => {
    // --- ESTADOS ---
    const { id } = useParams();
    const [expediente, setExpediente] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [documentosDisponibles, setDocumentosDisponibles] = useState([]);
    const [selectedDocumento, setSelectedDocumento] = useState('');
    const [showPrestamoForm, setShowPrestamoForm] = useState(false);
    const [observaciones, setObservaciones] = useState('');
    const [tipoPrestamo, setTipoPrestamo] = useState('Electrónico');
    const [requiereFirma, setRequiereFirma] = useState(false);
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState('');
    const [targetDocumentoId, setTargetDocumentoId] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [viewingFileUrl, setViewingFileUrl] = useState('');
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureTargetId, setSignatureTargetId] = useState(null);
    const sigPad = useRef(null);
    const [customFields, setCustomFields] = useState([]);
    const [customData, setCustomData] = useState({});
    const [plantillas, setPlantillas] = useState([]);
    const [selectedPlantilla, setSelectedPlantilla] = useState(null);
    const [plantillaData, setPlantillaData] = useState({});

    // --- CARGA DE DATOS ---
    const fetchExpediente = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await api.get(`/expedientes/${id}`);
            setExpediente(res.data);

            // Si la vista no es restringida, cargamos los datos adicionales necesarios para los formularios
            if (res.data.vista !== 'solicitante_restringido') {
                const [resDocs, resWfs, resPlantillas] = await Promise.all([
                    api.get('/documentos'),
                    api.get('/workflows'),
                    api.get('/plantillas')
                ]);
                setDocumentosDisponibles(resDocs.data);
                setWorkflows(resWfs.data);
                setPlantillas(resPlantillas.data);

                if (res.data.id_serie) {
                    const resSeries = await api.get('/series');
                    const serieDelExpediente = resSeries.data.find(s => s.id === res.data.id_serie);
                    if (serieDelExpediente) {
                        const idOficina = serieDelExpediente.id_oficina_productora;
                        const resCampos = await api.get(`/campos-personalizados/oficina/${idOficina}`);
                        setCustomFields(resCampos.data);
                        const resCustomData = await api.get(`/expedientes/${id}/custom-data`);
                        setCustomData(resCustomData.data);
                    }
                }
            }
        } catch (err) {
            setError('No se pudo cargar la información del expediente o no tienes permiso para verlo.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchExpediente();
    }, [fetchExpediente]);

    // --- MANEJADORES DE EVENTOS ---
    const handleAddDocumento = async (e) => { e.preventDefault(); if (!selectedDocumento) return toast.warn('Por favor, seleccione un documento.'); try { await api.post(`/expedientes/${id}/documentos`, { id_documento: selectedDocumento, requiere_firma: requiereFirma }); toast.success('Documento añadido con éxito.'); setSelectedDocumento(''); setRequiereFirma(false); fetchExpediente(); } catch (err) { toast.error(err.response?.data?.msg || 'Error al añadir el documento.'); } };
    const handleCloseExpediente = async () => { if (window.confirm('¿Estás seguro?')) { try { await api.put(`/expedientes/${id}/cerrar`); toast.success('Expediente cerrado con éxito.'); fetchExpediente(); } catch (err) { toast.error(err.response?.data?.msg || 'Error al cerrar el expediente.'); } } };
    const handleRequestPrestamo = async (e) => {
        e.preventDefault();
        try {
            // Ahora la variable 'tipoPrestamo' existe y se puede enviar
            await api.post('/prestamos', {
                id_expediente: id,
                observaciones: observaciones,
                tipo_prestamo: tipoPrestamo 
            });
            toast.success('Solicitud de préstamo enviada con éxito.');
            setShowPrestamoForm(false);
            setObservaciones('');
            setTipoPrestamo('Electrónico');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al solicitar el préstamo.');
        }
    };
    const handleStartWorkflow = async (e) => { e.preventDefault(); if (!selectedWorkflow) return toast.warn('Por favor, seleccione un workflow.'); try { await api.post(`/documentos/${targetDocumentoId}/start-workflow`, { id_workflow: selectedWorkflow }); toast.success('Workflow iniciado con éxito.'); setTargetDocumentoId(null); setSelectedWorkflow(''); } catch (err) { toast.error(err.response?.data?.msg || 'Error al iniciar el workflow.'); } };
    const openModal = (fileUrl) => { setViewingFileUrl(fileUrl); setModalIsOpen(true); };
    const closeModal = () => { setModalIsOpen(false); setViewingFileUrl(''); };
    const openSignatureModal = (docId) => { setSignatureTargetId(docId); setShowSignatureModal(true); };
    const closeSignatureModal = () => { setShowSignatureModal(false); setSignatureTargetId(null); };
    const clearSignature = () => { sigPad.current.clear(); };
    const handleSignatureSubmit = async () => { if (sigPad.current.isEmpty()) { return toast.warn('Por favor, dibuje su firma.'); } const firma_imagen = sigPad.current.toDataURL('image/png'); try { await api.post(`/documentos/${signatureTargetId}/firmar`, { firma_imagen }); toast.success('Documento firmado con éxito.'); closeSignatureModal(); fetchExpediente(); } catch (err) { toast.error(err.response?.data?.msg || 'Error al firmar el documento.'); } };
    const handleCustomDataChange = (e) => { const { name, value } = e.target; setCustomData(prev => ({ ...prev, [name]: value })); };
    const handleSaveCustomData = async () => { try { await api.put(`/expedientes/${id}/custom-data`, customData); toast.success('Metadatos personalizados guardados con éxito.'); } catch (err) { toast.error(err.response?.data?.msg || 'Error al guardar los metadatos.'); } };
    const handleSelectPlantilla = async (plantillaId) => { if (!plantillaId) { setSelectedPlantilla(null); setPlantillaData({}); return; } try { const res = await api.get(`/plantillas/${plantillaId}`); setSelectedPlantilla(res.data); setPlantillaData({}); } catch (err) { toast.error('Error al cargar los campos de la plantilla.'); } };
    const handlePlantillaDataChange = (e) => { setPlantillaData({ ...plantillaData, [e.target.name]: e.target.value }); };
    const handleGenerateDocument = async (e) => { e.preventDefault(); if (!expediente || !expediente.id_serie) return toast.error("No se puede determinar la serie del expediente."); try { const resSeries = await api.get('/series'); const serieDelExpediente = resSeries.data.find(s => s.id === expediente.id_serie); if (!serieDelExpediente) return toast.error("No se encontró la oficina productora del expediente."); await api.post(`/expedientes/${id}/documentos-desde-plantilla`, { id_plantilla: selectedPlantilla.id, datos_rellenados: plantillaData, id_serie: expediente.id_serie, id_subserie: expediente.id_subserie, id_oficina_productora: serieDelExpediente.id_oficina_productora }); toast.success('Documento generado y añadido al expediente.'); setSelectedPlantilla(null); setPlantillaData({}); fetchExpediente(); } catch (err) { toast.error(err.response?.data?.msg || 'Error al generar el documento.'); } };

    // --- RENDERIZADO ---
    if (isLoading) return <div style={{ padding: '20px' }}>Cargando expediente...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
    if (!expediente) return <div style={{ padding: '20px' }}>No se encontró la información del expediente.</div>;

    // --- VISTA RESTRINGIDA (SOLICITANTE SIN PRÉSTAMO) ---
    if (expediente.vista === 'solicitante_restringido') {
        return (
            <div>
                <div className="page-header">
                    <h1>{expediente.nombre_expediente}</h1>
                    <p><strong>Estado:</strong> {expediente.estado}</p>
                </div>
                <div className="content-box">
                    <h3>Acceso Restringido</h3>
                    <p>No tienes acceso a los documentos de este expediente. Para verlos, debes solicitar un préstamo.</p>
                    <div className="action-bar" style={{ justifyContent: 'start', marginTop: '1rem' }}>
                         <button onClick={() => setShowPrestamoForm(!showPrestamoForm)} className="button button-primary">{showPrestamoForm ? 'Cancelar' : 'Solicitar Préstamo'}</button>
                    </div>
                    {showPrestamoForm && (
                        <div style={{ marginTop: '1rem' }}>
                            <h4>Nueva Solicitud de Préstamo</h4>
                            <form onSubmit={handleRequestPrestamo} className="action-bar">
                                <select value={tipoPrestamo} onChange={(e) => setTipoPrestamo(e.target.value)}>
                                    <option value="Electrónico">Electrónico</option>
                                    <option value="Físico">Físico</option>
                                </select>
                                <input type="text" placeholder="Observaciones (opcional)" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                                <button type="submit" className="button button-primary">Confirmar</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    // --- VISTA COMPLETA (PRODUCTOR O SOLICITANTE CON PRÉSTAMO) ---
    return (
        <div>
            <div className="page-header">
                <h1>Expediente: {expediente.nombre_expediente}</h1>
                <p><strong>Estado:</strong> {expediente.estado}</p>
            </div>

            <div className="action-bar">
                {expediente.vista === 'productor' && expediente.estado === 'En trámite' && <button onClick={handleCloseExpediente} className="button button-danger">Cerrar Expediente</button>}
                <button onClick={() => setShowPrestamoForm(!showPrestamoForm)} className="button button-primary">{showPrestamoForm ? 'Cancelar Préstamo' : 'Solicitar Préstamo'}</button>
            </div>

            {showPrestamoForm && (
                <div className="content-box">
                    <h4>Nueva Solicitud de Préstamo</h4>
                    <form onSubmit={handleRequestPrestamo}>
                        <label>Tipo de Préstamo: </label>
                        <select value={tipoPrestamo} onChange={(e) => setTipoPrestamo(e.target.value)}>
                            <option value="Electrónico">Electrónico</option>
                            <option value="Físico">Físico</option>
                        </select>
                        <input type="text" placeholder="Observaciones (opcional)" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ marginLeft: '10px' }}/>
                        <button type="submit" style={{ marginLeft: '10px' }} className="button button-primary">Confirmar</button>
                    </form>
                </div>
            )}
            
            {expediente.vista === 'productor' && customFields.length > 0 && (
                <div className="content-box">
                    <h3>Metadatos Personalizados del Expediente</h3>
                    {customFields.map(field => (
                        <div key={field.id} style={{ marginBottom: '10px' }}>
                            <label>{field.nombre_campo}{field.es_obligatorio ? ' *' : ''}:
                                <input type={field.tipo_campo === 'fecha' ? 'date' : field.tipo_campo} name={field.id} value={customData[field.id] || ''} onChange={handleCustomDataChange} required={field.es_obligatorio} style={{ marginLeft: '10px' }}/>
                            </label>
                        </div>
                    ))}
                    <button onClick={handleSaveCustomData} style={{ marginTop: '10px' }} className="button">Guardar Metadatos</button>
                </div>
            )}

            {expediente.vista === 'productor' && expediente.estado === 'En trámite' && (
                <div className="content-box">
                    <h3>Añadir Documento al Expediente</h3>
                    <form onSubmit={handleAddDocumento}>
                        <select value={selectedDocumento} onChange={(e) => setSelectedDocumento(e.target.value)}>
                            <option value="">-- Seleccione un documento --</option>
                            {documentosDisponibles.map(doc => <option key={doc.id} value={doc.id}>{doc.radicado} - {doc.asunto}</option>)}
                        </select>
                         <label style={{ marginLeft: '10px' }}>
                            <input type="checkbox" checked={requiereFirma} onChange={(e) => setRequiereFirma(e.target.checked)} />
                            ¿Requiere Firma?
                        </label>
                        <button type="submit" style={{ marginLeft: '10px' }} className="button">Añadir</button>
                    </form>
                </div>
            )}

            {expediente.vista === 'productor' && (
                <div className="content-box">
                    <h3>Generar Documento desde Plantilla</h3>
                    <select onChange={(e) => handleSelectPlantilla(e.target.value)} style={{marginBottom: '15px'}}>
                        <option value="">-- Seleccione una Plantilla --</option>
                        {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    {selectedPlantilla && (
                        <form onSubmit={handleGenerateDocument}>
                            {selectedPlantilla.campos.sort((a, b) => a.orden - b.orden).map(campo => (
                                <div key={campo.id} style={{marginBottom: '10px'}}>
                                    <label>{campo.nombre_campo}:
                                        <input type={campo.tipo_campo} name={campo.nombre_campo} value={plantillaData[campo.nombre_campo] || ''} onChange={handlePlantillaDataChange} required style={{marginLeft: '10px', width: '300px'}}/>
                                    </label>
                                </div>
                            ))}
                            <button type="submit" className="button button-primary" style={{marginTop: '10px'}}>Generar y Añadir</button>
                        </form>
                    )}
                </div>
            )}

            <h3>Índice Electrónico</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Foliado</th>
                        <th>Radicado</th>
                        <th>Asunto</th>
                        <th>Firma Req.</th>
                        <th>Estado Firma</th>
                        {expediente.vista === 'productor' && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {expediente.documentos.map(doc => (
                        <tr key={doc.id}>
                            <td>{doc.orden_foliado}</td>
                            <td>{doc.path_archivo ? <button onClick={() => openModal(`http://localhost:4000/${doc.path_archivo}`)} className="link-button">{doc.radicado}</button> : doc.radicado}</td>
                            <td>{doc.asunto}</td>
                            <td style={{ textAlign: 'center' }}>{doc.requiere_firma ? 'Sí' : 'No'}</td>
                            <td style={{ textAlign: 'center' }}>{doc.firma_hash ? <span style={{ color: 'green' }}>✅ Firmado</span> : <span style={{ color: 'orange' }}>Pendiente</span>}</td>
                            {expediente.vista === 'productor' && (
                                <td className="action-cell">
                                    {doc.requiere_firma && !doc.firma_hash && <button onClick={() => openSignatureModal(doc.id)} className="button" style={{backgroundColor: 'green', color: 'white'}}>Firmar</button>}
                                    {targetDocumentoId === doc.id ? (
                                        <form onSubmit={handleStartWorkflow} className="action-cell">
                                            <select value={selectedWorkflow} onChange={(e) => setSelectedWorkflow(e.target.value)} required>
                                                <option value="">-- Workflow --</option>
                                                {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.nombre}</option>)}
                                            </select>
                                            <button type="submit" className="button">OK</button>
                                            <button type="button" onClick={() => setTargetDocumentoId(null)}>X</button>
                                        </form>
                                    ) : (
                                        <button onClick={() => setTargetDocumentoId(doc.id)} className="button">Iniciar Workflow</button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Visor de Documento" style={{ content: { inset: '5%' }, overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } }}>
                <button onClick={closeModal} style={{ float: 'right' }} className="button">Cerrar</button>
                <h2>Visor de Documento</h2>
                <iframe src={viewingFileUrl} title="Visor" width="100%" height="90%" style={{ border: 'none', marginTop: '10px' }}></iframe>
            </Modal>

            <Modal isOpen={showSignatureModal} onRequestClose={closeSignatureModal} contentLabel="Firmar Documento" style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)', width: '550px' } }}>
                <h2>Firmar Documento</h2>
                <p>Por favor, dibuje su firma.</p>
                <div style={{ border: '1px solid black', borderRadius: '5px' }}>
                    <SignaturePad ref={sigPad} options={{ penColor: 'black' }} canvasProps={{width: 500, height: 200, className: 'sigCanvas'}} />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <button onClick={handleSignatureSubmit} className="button button-primary">Guardar Firma</button>
                    <button onClick={clearSignature} style={{ marginLeft: '10px' }} className="button">Limpiar</button>
                    <button onClick={closeSignatureModal} style={{ float: 'right' }} className="button">Cancelar</button>
                </div>
            </Modal>
        </div>
    );
};

export default ExpedienteDetalle;