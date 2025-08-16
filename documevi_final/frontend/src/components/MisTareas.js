import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import SignaturePad from 'react-signature-pad-wrapper';

const MisTareas = () => {
  const [tareas, setTareas] = useState([]);
  const [error, setError] = useState('');

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingDocumentId, setSigningDocumentId] = useState(null);
  const sigPad = useRef(null);
  
  // --- INICIO: AÑADIDOS PARA EL VISOR ---
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [viewingFileUrl, setViewingFileUrl] = useState('');
  // --- FIN: AÑADIDOS PARA EL VISOR ---

  const fetchTareas = useCallback(async () => {
    try {
      const res = await api.get('/workflows/tareas');
      setTareas(res.data);
    } catch (err) {
      setError('No se pudieron cargar tus tareas pendientes.');
    }
  }, []);

  useEffect(() => {
    fetchTareas();
  }, [fetchTareas]);

  const handleAdvance = async (idDocumento) => {
    if (window.confirm('¿Estás seguro de que deseas aprobar y avanzar este documento?')) {
      try {
        const res = await api.post(`/documentos/${idDocumento}/advance-workflow`);
        toast.success(res.data.msg);
        fetchTareas();
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Error al avanzar el workflow.');
      }
    }
  };

  const openSignatureModal = (docId) => { setSigningDocumentId(docId); setShowSignatureModal(true); };
  const closeSignatureModal = () => { setShowSignatureModal(false); setSigningDocumentId(null); };
  const clearSignature = () => { sigPad.current.clear(); };

  const handleSignAndAdvance = async () => {
    if (sigPad.current.isEmpty()) {
        return toast.warn('Por favor, dibuje su firma.');
    }
    const firma_imagen = sigPad.current.toDataURL('image/png');
    try {
        await api.post(`/documentos/${signingDocumentId}/firmar`, { firma_imagen });
        toast.info('Firma guardada, avanzando al siguiente paso...');
        const res = await api.post(`/documentos/${signingDocumentId}/advance-workflow`);
        toast.success(res.data.msg);
        closeSignatureModal();
        fetchTareas();
    } catch (err) {
        toast.error(err.response?.data?.msg || 'Error durante el proceso de firma y avance.');
    }
  };
  
  // --- INICIO: FUNCIONES PARA EL VISOR ---
  const openModal = (fileUrl) => {
    setViewingFileUrl(fileUrl);
    setModalIsOpen(true);
  };
  const closeModal = () => {
    setModalIsOpen(false);
    setViewingFileUrl('');
  };
  // --- FIN: FUNCIONES PARA EL VISOR ---

  return (
    <div style={{ padding: '20px' }}>
      <h1>Mis Tareas Pendientes</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Radicado</th>
            <th>Asunto del Documento</th>
            <th>Workflow</th>
            <th>Paso Actual</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tareas.length > 0 ? tareas.map(tarea => (
            <tr key={tarea.id_seguimiento}>
              <td>
                {/* Ahora el radicado abre el visor */}
                {tarea.path_archivo ? (
                  <button onClick={() => openModal(`http://localhost:4000/${tarea.path_archivo}`)} className="link-button">
                    {tarea.radicado}
                  </button>
                ) : (
                  tarea.radicado
                )}
              </td>
              <td>{tarea.asunto}</td>
              <td>{tarea.nombre_workflow}</td>
              <td>{tarea.paso_actual}</td>
              <td>
                {tarea.requiere_firma ? (
                  <button onClick={() => openSignatureModal(tarea.id_documento)} style={{ backgroundColor: 'green', color: 'white' }}>
                    Firmar y Avanzar
                  </button>
                ) : (
                  <button onClick={() => handleAdvance(tarea.id_documento)}>
                    Aprobar y Avanzar
                  </button>
                )}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No tienes tareas pendientes.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* MODAL PARA EL VISOR DE DOCUMENTOS */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Visor de Documento"
        style={{ content: { inset: '5%' }, overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } }}
      >
        <button onClick={closeModal} style={{ float: 'right' }}>Cerrar</button>
        <h2>Visor de Documento</h2>
        <iframe src={viewingFileUrl} title="Visor" width="100%" height="90%" style={{ border: 'none', marginTop: '10px' }}></iframe>
      </Modal>

      {/* MODAL PARA LA FIRMA */}
      <Modal
          isOpen={showSignatureModal}
          onRequestClose={closeSignatureModal}
          contentLabel="Firmar Documento para Avanzar"
          style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '550px' } }}
      >
          <h2>Firmar Documento</h2>
          <p>Tu firma es requerida para completar este paso del flujo de trabajo.</p>
          <div style={{ border: '1px solid black', borderRadius: '5px' }}>
              <SignaturePad 
                  ref={sigPad}
                  options={{ penColor: 'black' }}
                  canvasProps={{width: 500, height: 200, className: 'sigCanvas'}} 
              />
          </div>
          <div style={{ marginTop: '10px' }}>
              <button onClick={handleSignAndAdvance}>Guardar Firma y Avanzar</button>
              <button onClick={clearSignature} style={{ marginLeft: '10px' }}>Limpiar</button>
              <button onClick={closeSignatureModal} style={{ float: 'right' }}>Cancelar</button>
          </div>
      </Modal>
    </div>
  );
};

export default MisTareas;