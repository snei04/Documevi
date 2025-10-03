import React, { useReducer, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Modal from 'react-modal';

// Importaciones de la nueva estructura
import * as expedienteAPI from '../api/expedienteAPI';
import { initialState, expedienteReducer } from '../state/expedienteReducer';
import IndiceDocumentos from './expediente/IndiceDocumentos';
import AccionesProductor from './expediente/AccionesProductor';
import VistaRestringida from './expediente/VistaRestringida';
import FirmaModal from './expediente/FirmaModal';
import PermissionGuard from './auth/PermissionGuard';

// Estilos
import './Dashboard.css';

const ExpedienteDetalle = () => {
    const { id } = useParams();
    const [state, dispatch] = useReducer(expedienteReducer, initialState);

    const fetchData = useCallback(async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const payload = await expedienteAPI.getExpedienteDetallado(id);
            dispatch({ type: 'FETCH_SUCCESS', payload });
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al cargar el expediente.';
            dispatch({ type: 'FETCH_ERROR', payload: errorMsg });
        }
    }, [id, dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const { expediente, isLoading, error, ui, workflows } = state;

    // --- MANEJADORES DE EVENTOS ---
    const handleOpenFile = (url) => dispatch({ type: 'OPEN_VIEWER_MODAL', payload: url });
    const handleOpenSignatureModal = (docId) => dispatch({ type: 'OPEN_SIGNATURE_MODAL', payload: docId });
    const handleCloseModals = () => dispatch({ type: 'CLOSE_MODALS' });

    const handleSignatureSubmit = async (firma_imagen) => {
        try {
            await expedienteAPI.firmarDocumento(ui.targetDocumentoIdFirma, firma_imagen);
            toast.success('Documento firmado con éxito.');
            handleCloseModals();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al firmar el documento.');
        }
    };

    const handleRequestPrestamo = async (formData) => {
        try {
            await expedienteAPI.solicitarPrestamo(id, formData);
            toast.success('Solicitud de préstamo enviada.');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al solicitar préstamo.');
        }
    };

    const handleCloseExpediente = async () => {
        if (window.confirm('¿Está seguro de que desea cerrar este expediente? Esta acción no se puede deshacer.')) {
            try {
                await expedienteAPI.cerrarExpediente(id);
                toast.success('Expediente cerrado con éxito.');
                fetchData();
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cerrar el expediente.');
            }
        }
    };

    const handleStartWorkflow = async (docId, workflowId) => {
        if (!workflowId) return toast.warn('Por favor, seleccione un workflow.');
        try {
            // Asumiendo que existe una función en expedienteAPI para esto
            // await expedienteAPI.iniciarWorkflow(docId, workflowId);
            toast.success('Workflow iniciado con éxito.');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al iniciar el workflow.');
        }
    };

    // --- RENDERIZADO ---
    if (isLoading) return <div style={{ padding: '20px' }}>Cargando expediente...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
    if (!expediente) return null; // No renderiza nada si el expediente no se ha cargado

    if (expediente.vista === 'solicitante_restringido') {
        return <VistaRestringida expediente={expediente} onSolicitarPrestamo={handleRequestPrestamo} />;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Expediente: {expediente.nombre_expediente}</h1>
                <p><strong>Estado:</strong> {expediente.estado}</p>
            </div>
            
            <div className="action-bar">
                {expediente.vista === 'productor' && expediente.estado === 'En trámite' && (
                    <PermissionGuard permission="cerrar_expedientes">
                    <button onClick={handleCloseExpediente} className="button button-danger">Cerrar Expediente</button>
                    </PermissionGuard>
                )}
            </div>

            {expediente.vista === 'productor' && (
                <AccionesProductor 
                    state={state} 
                    expediente={expediente} 
                    onDataChange={fetchData}
                />
            )}

            <IndiceDocumentos 
                expediente={expediente}
                workflows={workflows}
                onOpenFile={handleOpenFile}
                onSign={handleOpenSignatureModal}
                onStartWorkflow={handleStartWorkflow}
            />

            {/* MODALES */}
            <FirmaModal
                isOpen={ui.isSignatureModalOpen}
                onRequestClose={handleCloseModals}
                onSubmit={handleSignatureSubmit}
            />

            <Modal 
                isOpen={ui.isViewerModalOpen} 
                onRequestClose={handleCloseModals} 
                contentLabel="Visor de Documento"
                style={{ content: { inset: '5%' }, overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } }}
            >
                <button onClick={handleCloseModals} style={{ float: 'right' }} className="button">Cerrar</button>
                <h2>Visor de Documento</h2>
                <iframe src={ui.viewingFileUrl} title="Visor" width="100%" height="90%" style={{ border: 'none', marginTop: '10px' }}></iframe>
            </Modal>
        </div>
    );
};

export default ExpedienteDetalle;