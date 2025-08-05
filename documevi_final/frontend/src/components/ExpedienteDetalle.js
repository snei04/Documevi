import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import SignatureCanvas from 'react-signature-canvas'; // Importar el lienzo de firma

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
    const sigCanvas = useRef({});

    // --- CARGA DE DATOS ---
    const fetchExpediente = useCallback(async () => {
        try {
            const res = await api.get(`/expedientes/${id}`);
            setExpediente(res.data);
        } catch (err) {
            toast.error('No se pudo cargar el expediente.');
        }
    }, [id]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [resDocs, resWfs] = await Promise.all([
                    api.get('/documentos'),
                    api.get('/workflows')
                ]);
                setDocumentosDisponibles(resDocs.data);
                setWorkflows(resWfs.data);
            } catch (err) {
                toast.error('Error al cargar datos iniciales.');
            }
        };
        fetchExpediente();
        fetchAllData();
    }, [id, fetchExpediente]);

    // --- MANEJADORES DE EVENTOS ---
    const handleAddDocumento = async (e) => { e.preventDefault(); if (!selectedDocumento) { toast.warn('Por favor, seleccione un documento.'); return; } try { await api.post(`/expedientes/${id}/documentos`, { id_documento: selectedDocumento }); toast.success('Documento añadido con éxito.'); setSelectedDocumento(''); fetchExpediente(); } catch (err) { toast.error(err.response?.data?.msg || 'Error al añadir el documento.'); } };
    const handleCloseExpediente = async () => { if (window.confirm('¿Estás seguro?')) { try { await api.put(`/expedientes/${id}/cerrar`); toast.success('Expediente cerrado con éxito.'); fetchExpediente(); } catch (err) { toast.error(err.response?.data?.msg || 'Error al cerrar el expediente.'); } } };
    const handleRequestPrestamo = async (e) => { e.preventDefault(); if (!fechaDevolucion) { toast.warn('Por favor, seleccione una fecha.'); return; } try { await api.post('/prestamos', { id_expediente: id, fecha_devolucion_prevista: fechaDevolucion, observaciones }); toast.success('Solicitud de préstamo enviada.'); setShowPrestamoForm(false); setFechaDevolucion(''); setObservaciones(''); } catch (err) { toast.error(err.response?.data?.msg || 'Error al solicitar el préstamo.'); } };
    const handleStartWorkflow = async (e) => { e.preventDefault(); if (!selectedWorkflow) { toast.warn('Por favor, seleccione un workflow.'); return; } try { await api.post(`/documentos/${targetDocumentoId}/start-workflow`, { id_workflow: selectedWorkflow }); toast.success('Workflow iniciado con éxito.'); setTargetDocumentoId(null); setSelectedWorkflow(''); } catch (err) { toast.error(err.response?.data?.msg || 'Error al iniciar el workflow.'); } };
    const openModal = (fileUrl) => { setViewingFileUrl(fileUrl); setModalIsOpen(true); };
    const closeModal = () => { setModalIsOpen(false); setViewingFileUrl(''); };

    // Funciones para el modal de firma
    const openSignatureModal = (docId) => { setSignatureTargetId(docId); setShowSignatureModal(true); };
    const closeSignatureModal = () => { setShowSignatureModal(false); setSignatureTargetId(null); };
    const clearSignature = () => { sigCanvas.current.clear(); };
    const handleSignatureSubmit = async () => {
        if (sigCanvas.current.isEmpty()) {
            return toast.warn('Por favor, dibuje su firma.');
        }
        const firma_imagen = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        try {
            await api.post(`/documentos/${signatureTargetId}/firmar`, { firma_imagen });
            toast.success('Documento firmado con éxito.');
            closeSignatureModal();
            fetchExpediente();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al firmar el documento.');
        }
    };

    if (!expediente) return <div>Cargando...</div>;

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div style={{ padding: '20px' }}>
            <h1>Expediente: {expediente.nombre_expediente}</h1>
            <p><strong>Estado:</strong> {expediente.estado}</p>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {expediente.estado === 'En trámite' && <button onClick={handleCloseExpediente} style={{ backgroundColor: 'darkred', color: 'white' }}>Cerrar Expediente</button>}
                <button onClick={() => setShowPrestamoForm(!showPrestamoForm)} style={{ backgroundColor: 'darkblue', color: 'white' }}>{showPrestamoForm ? 'Cancelar Préstamo' : 'Solicitar Préstamo'}</button>
            </div>

            {showPrestamoForm && (
                <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h4>Nueva Solicitud de Préstamo</h4>
                    <form onSubmit={handleRequestPrestamo}>
                        <label>Fecha Devolución:</label>
                        <input type="date" value={fechaDevolucion} onChange={(e) => setFechaDevolucion(e.target.value)} required />
                        <input type="text" placeholder="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ marginLeft: '10px' }}/>
                        <button type="submit" style={{ marginLeft: '10px' }}>Confirmar</button>
                    </form>
                </div>
            )}

            {expediente.estado === 'En trámite' && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
                    <h3>Añadir Documento al Expediente</h3>
                    <form onSubmit={handleAddDocumento}>
                        <select value={selectedDocumento} onChange={(e) => setSelectedDocumento(e.target.value)}>
                            <option value="">-- Seleccione un documento --</option>
                            {documentosDisponibles.map(doc => <option key={doc.id} value={doc.id}>{doc.radicado} - {doc.asunto}</option>)}
                        </select>
                        <button type="submit" style={{ marginLeft: '10px' }}>Añadir</button>
                    </form>
                </div>
            )}

            <h3>Índice Electrónico</h3>
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                <thead><tr><th>Foliado</th><th>Radicado</th><th>Asunto</th><th>Fecha Incorporación</th><th>Acciones</th></tr></thead>
                <tbody>
                    {expediente.documentos.map(doc => (
                        <tr key={doc.id}>
                            <td>{doc.orden_foliado}</td>
                            <td>
                                {doc.path_archivo ? <button onClick={() => openModal(`http://localhost:4000/${doc.path_archivo}`)} className="link-button">{doc.radicado}</button> : doc.radicado}
                            </td>
                            <td>{doc.asunto}</td>
                            <td>{new Date(doc.fecha_incorporacion).toLocaleString()}</td>
                            <td style={{ display: 'flex', gap: '5px', padding: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button onClick={() => openSignatureModal(doc.id)} style={{ backgroundColor: 'green', color: 'white' }}>Firmar</button>
                                {targetDocumentoId === doc.id ? (
                                    <form onSubmit={handleStartWorkflow} style={{display: 'flex', gap: '5px'}}>
                                        <select value={selectedWorkflow} onChange={(e) => setSelectedWorkflow(e.target.value)} required>
                                            <option value="">-- Workflow --</option>
                                            {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.nombre}</option>)}
                                        </select>
                                        <button type="submit">OK</button>
                                        <button type="button" onClick={() => setTargetDocumentoId(null)}>X</button>
                                    </form>
                                ) : (
                                    <button onClick={() => setTargetDocumentoId(doc.id)}>Iniciar Workflow</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODALES */}
            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Visor de Documento" style={{ content: { inset: '5%', }, overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } }}>
                <button onClick={closeModal} style={{ float: 'right' }}>Cerrar</button>
                <h2>Visor de Documento</h2>
                <iframe src={viewingFileUrl} title="Visor" width="100%" height="90%" style={{ border: 'none', marginTop: '10px' }}></iframe>
            </Modal>

            <Modal
                isOpen={showSignatureModal}
                onRequestClose={closeSignatureModal}
                contentLabel="Firmar Documento"
                style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '550px' } }}
            >
                <h2>Firmar Documento</h2>
                <p>Por favor, dibuje su firma en el siguiente recuadro.</p>
                <div style={{ border: '1px solid black', borderRadius: '5px' }}>
                    <SignatureCanvas 
                        ref={sigCanvas}
                        penColor='black'
                        canvasProps={{width: 500, height: 200, className: 'sigCanvas'}} 
                    />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <button onClick={handleSignatureSubmit}>Guardar Firma</button>
                    <button onClick={clearSignature} style={{ marginLeft: '10px' }}>Limpiar</button>
                    <button onClick={closeSignatureModal} style={{ float: 'right' }}>Cancelar</button>
                </div>
            </Modal>
        </div>
    );
};

export default ExpedienteDetalle;