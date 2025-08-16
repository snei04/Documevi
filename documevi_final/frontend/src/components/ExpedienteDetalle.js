import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import SignaturePad from 'react-signature-pad-wrapper';
import './Dashboard.css';

const ExpedienteDetalle = () => {
    // --- ESTADOS DEL COMPONENTE ---
    const { id } = useParams();
    const [expediente, setExpediente] = useState(null);
    const [documentosDisponibles, setDocumentosDisponibles] = useState([]);
    const [selectedDocumento, setSelectedDocumento] = useState('');
    const [error, setError] = useState('');

    // Estados para Préstamo
    const [showPrestamoForm, setShowPrestamoForm] = useState(false);
    const [fechaDevolucion, setFechaDevolucion] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // Estados para Workflow
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState('');
    const [targetDocumentoId, setTargetDocumentoId] = useState(null);

    // Estados para Visor Modal
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [viewingFileUrl, setViewingFileUrl] = useState('');

    // Estados para Firma en Pantalla
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureTargetId, setSignatureTargetId] = useState(null);
    const sigPad = useRef(null);

    // Estados para Campos Personalizados
    const [customFields, setCustomFields] = useState([]);
    const [customData, setCustomData] = useState({});
    const [requiereFirma, setRequiereFirma] = useState(false);


    // --- CARGA DE DATOS ---
    const fetchExpediente = useCallback(async () => {
        try {
            const resExpediente = await api.get(`/expedientes/${id}`);
            setExpediente(resExpediente.data);

            if (resExpediente.data && resExpediente.data.id_serie) {
                const resSeries = await api.get('/series');
                const serieDelExpediente = resSeries.data.find(s => s.id === resExpediente.data.id_serie);
                
                if(serieDelExpediente) {
                    const idOficina = serieDelExpediente.id_oficina_productora;
                    const resCampos = await api.get(`/campos-personalizados/oficina/${idOficina}`);
                    setCustomFields(resCampos.data);
                    
                    const resCustomData = await api.get(`/expedientes/${id}/custom-data`);
                    setCustomData(resCustomData.data);
                }
            }
        } catch (err) {
            setError('No se pudo cargar la información del expediente.');
        }
    }, [id]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [resDocs, resWfs] = await Promise.all([
                    api.get('/documentos'),
                    api.get('/workflows')
                ]);
                setDocumentosDisponibles(resDocs.data);
                setWorkflows(resWfs.data);
            } catch (err) {
                setError('Error al cargar datos de la página.');
            }
        };
        fetchExpediente();
        fetchDropdownData();
    }, [fetchExpediente]);

    // --- MANEJADORES DE EVENTOS ---
    const handleAddDocumento = async (e) => {
        e.preventDefault();
        if (!selectedDocumento) return toast.warn('Por favor, seleccione un documento.');
        try {
            await api.post(`/expedientes/${id}/documentos`, { 
                id_documento: selectedDocumento,
                requiere_firma: requiereFirma
            });
            toast.success('Documento añadido con éxito.');
            setSelectedDocumento('');
            setRequiereFirma(false);
            fetchExpediente();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al añadir el documento.');
        }
    };
    const handleCloseExpediente = async () => { if (window.confirm('¿Estás seguro?')) { try { await api.put(`/expedientes/${id}/cerrar`); toast.success('Expediente cerrado con éxito.'); fetchExpediente(); } catch (err) { toast.error(err.response?.data?.msg || 'Error al cerrar el expediente.'); } } };
    const handleRequestPrestamo = async (e) => { e.preventDefault(); if (!fechaDevolucion) return toast.warn('Por favor, seleccione una fecha.'); try { await api.post('/prestamos', { id_expediente: id, fecha_devolucion_prevista: fechaDevolucion, observaciones }); toast.success('Solicitud de préstamo enviada.'); setShowPrestamoForm(false); setFechaDevolucion(''); setObservaciones(''); } catch (err) { toast.error(err.response?.data?.msg || 'Error al solicitar el préstamo.'); } };
    const handleStartWorkflow = async (e) => { e.preventDefault(); if (!selectedWorkflow) return toast.warn('Por favor, seleccione un workflow.'); try { await api.post(`/documentos/${targetDocumentoId}/start-workflow`, { id_workflow: selectedWorkflow }); toast.success('Workflow iniciado con éxito.'); setTargetDocumentoId(null); setSelectedWorkflow(''); } catch (err) { toast.error(err.response?.data?.msg || 'Error al iniciar el workflow.'); } };
    const openModal = (fileUrl) => { setViewingFileUrl(fileUrl); setModalIsOpen(true); };
    const closeModal = () => { setModalIsOpen(false); setViewingFileUrl(''); };
    const openSignatureModal = (docId) => { setSignatureTargetId(docId); setShowSignatureModal(true); };
    const closeSignatureModal = () => { setShowSignatureModal(false); setSignatureTargetId(null); };
    const clearSignature = () => { sigPad.current.clear(); };
    const handleSignatureSubmit = async () => { if (sigPad.current.isEmpty()) { return toast.warn('Por favor, dibuje su firma.'); } const firma_imagen = sigPad.current.toDataURL('image/png'); try { await api.post(`/documentos/${signatureTargetId}/firmar`, { firma_imagen }); toast.success('Documento firmado con éxito.'); closeSignatureModal(); fetchExpediente(); } catch (err) { toast.error(err.response?.data?.msg || 'Error al firmar el documento.'); } };
    const handleCustomDataChange = (e) => { const { name, value } = e.target; setCustomData(prev => ({ ...prev, [name]: value })); };
    const handleSaveCustomData = async () => { try { await api.put(`/expedientes/${id}/custom-data`, customData); toast.success('Metadatos personalizados guardados con éxito.'); } catch (err) { toast.error(err.response?.data?.msg || 'Error al guardar los metadatos.'); } };

    if (!expediente) return <div>Cargando...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Expediente: {expediente.nombre_expediente}</h1>
                <p><strong>Estado:</strong> {expediente.estado}</p>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>

            <div className="action-bar">
                {expediente.estado === 'En trámite' && <button onClick={handleCloseExpediente} className="button button-danger">Cerrar Expediente</button>}
                <button onClick={() => setShowPrestamoForm(!showPrestamoForm)} className="button button-primary">{showPrestamoForm ? 'Cancelar Préstamo' : 'Solicitar Préstamo'}</button>
            </div>

            {showPrestamoForm && (
                <div className="content-box">
                    <h4>Nueva Solicitud de Préstamo</h4>
                    <form onSubmit={handleRequestPrestamo}>
                        <label>Fecha Devolución:</label>
                        <input type="date" value={fechaDevolucion} onChange={(e) => setFechaDevolucion(e.target.value)} required />
                        <input type="text" placeholder="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ marginLeft: '10px' }}/>
                        <button type="submit" style={{ marginLeft: '10px' }} className="button button-primary">Confirmar</button>
                    </form>
                </div>
            )}
            
            {customFields.length > 0 && (
                <div className="content-box">
                    <h3>Metadatos Personalizados del Expediente</h3>
                    {customFields.map(field => (
                        <div key={field.id} style={{ marginBottom: '10px' }}>
                            <label>{field.nombre_campo}{field.es_obligatorio ? ' *' : ''}:
                                <input type={field.tipo_campo} name={field.id} value={customData[field.id] || ''} onChange={handleCustomDataChange} required={field.es_obligatorio} style={{ marginLeft: '10px' }}/>
                            </label>
                        </div>
                    ))}
                    <button onClick={handleSaveCustomData} style={{ marginTop: '10px' }} className="button">Guardar Metadatos</button>
                </div>
            )}

            {expediente.estado === 'En trámite' && (
                <div className="content-box">
                    <h3>Añadir Documento al Expediente</h3>
                    <form onSubmit={handleAddDocumento}>
                        <select value={selectedDocumento} onChange={(e) => setSelectedDocumento(e.target.value)}>
                            <option value="">-- Seleccione un documento --</option>
                            {documentosDisponibles.map(doc => <option key={doc.id} value={doc.id}>{doc.radicado} - {doc.asunto}</option>)}
                        </select>
                         <label style={{ marginLeft: '10px' }}>
                            <input
                                type="checkbox"
                                checked={requiereFirma}
                                onChange={(e) => setRequiereFirma(e.target.checked)}
                            />
                            ¿Requiere Firma?
                        </label>
                        <button type="submit" style={{ marginLeft: '10px' }} className="button">Añadir</button>
                    </form>
                </div>
            )}

            <h3>Índice Electrónico</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Foliado</th>
                        <th>Radicado</th>
                        <th>Asunto</th>
                        <th>Firma Requerida</th>
                        <th>Estado Firma</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {expediente.documentos.map(doc => (
                        <tr key={doc.id}>
                            <td>{doc.orden_foliado}</td>
                            <td>
                                {doc.path_archivo ? <button onClick={() => openModal(`http://localhost:4000/${doc.path_archivo}`)} className="link-button">{doc.radicado}</button> : doc.radicado}
                            </td>
                            <td>{doc.asunto}</td>
                            <td style={{ textAlign: 'center' }}>
                                {doc.requiere_firma ? 'Sí' : 'No'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                {doc.firma_hash ? <span style={{ color: 'green' }}>✅ Firmado</span> : <span style={{ color: 'orange' }}>Pendiente</span>}
                            </td>
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