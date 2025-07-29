import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import Modal from 'react-modal';
import { toast } from 'react-toastify';

const ExpedienteDetalle = () => {
  const { id } = useParams(); // Obtiene el ID del expediente desde la URL
  const [expediente, setExpediente] = useState(null);
  const [documentosDisponibles, setDocumentosDisponibles] = useState([]);
  const [selectedDocumento, setSelectedDocumento] = useState('');
  const [error, setError] = useState('');

  const [showPrestamoForm, setShowPrestamoForm] = useState(false);
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [targetDocumentoId, setTargetDocumentoId] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [viewingFileUrl, setViewingFileUrl] = useState('');

  const fetchExpediente = useCallback(async () => {
    try {
      const res = await api.get(`/expedientes/${id}`);
      setExpediente(res.data);
    } catch (err) {
      setError('No se pudo cargar el expediente.');
    }
  }, [id]);

  useEffect(() => {
    fetchExpediente();
    
    // Cargar todos los documentos para el menú desplegable
    const fetchAllDocumentos = async () => {
      try {
        const res = await api.get('/documentos'); // Suponiendo que tienes esta ruta
        setDocumentosDisponibles(res.data);
      } catch (err) {
        console.error("Error cargando la lista de documentos", err);
      }
    };

    const fetchAllWorkflows = async () => {
      try {
        const res = await api.get('/workflows');
        setWorkflows(res.data);
      } catch (err) {
        console.error("Error cargando la lista de workflows", err);
      }
    };

    fetchAllDocumentos();
    fetchAllWorkflows();
  }, [id, fetchExpediente]);

  const handleAddDocumento = async (e) => {
    e.preventDefault();
    if (!selectedDocumento) {
      toast.success('Por favor, seleccione un documento.');
      return;
    }
    try {
      await api.post(`/expedientes/${id}/documentos`, { id_documento: selectedDocumento });
      toast.success('Documento añadido al expediente con éxito.');
      setSelectedDocumento('');
      fetchExpediente(); // Recargar los datos del expediente para ver el cambio
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al añadir el documento.');
    }
  };

  // 👇 ESTA ES LA FUNCIÓN QUE FALTA EN TU CÓDIGO
  const handleCloseExpediente = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar este expediente? Esta acción no se puede deshacer.')) {
      try {
        await api.put(`/expedientes/${id}/cerrar`);
        toast.success('Expediente cerrado con éxito.');
        fetchExpediente(); // Recargar los datos para ver el nuevo estado
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Error al cerrar el expediente.');
      }
    }
  };

  const handleRequestPrestamo = async (e) => {
    e.preventDefault();
    if (!fechaDevolucion) {
      toast.success('Por favor, seleccione una fecha de devolución prevista.');
      return;
    }
    try {
      await api.post('/prestamos', {
        id_expediente: id,
        fecha_devolucion_prevista: fechaDevolucion,
        observaciones: observaciones
      });
      toast.success('Solicitud de préstamo enviada con éxito.');
      setShowPrestamoForm(false); // Ocultar el formulario
      setFechaDevolucion('');
      setObservaciones('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al solicitar el préstamo.');
    }
  };

  const handleStartWorkflow = async (e) => {
    e.preventDefault();
    if (!selectedWorkflow) {
      toast.success('Por favor, seleccione un flujo de trabajo.');
      return;
    }
    try {
      await api.post(`/documentos/${targetDocumentoId}/start-workflow`, { id_workflow: selectedWorkflow });
      toast.success('Workflow iniciado con éxito para el documento.');
      setTargetDocumentoId(null);
      setSelectedWorkflow('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al iniciar el workflow.');
    }
  };

  const openModal = (fileUrl) => {
    setViewingFileUrl(fileUrl);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setViewingFileUrl('');
  };


  if (!expediente) return <div>Cargando...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Expediente: {expediente.nombre_expediente}</h1>
      <p><strong>Estado:</strong> {expediente.estado}</p>

      {/* Este botón usa la función que acabamos de añadir */}
      {expediente.estado === 'En trámite' && (
        <button 
          onClick={handleCloseExpediente} 
          style={{ backgroundColor: 'darkred', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}
        >
          Cerrar Expediente
        </button>
      )}

      <button 
        onClick={() => setShowPrestamoForm(!showPrestamoForm)}
        style={{ backgroundColor: 'darkblue', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px', marginLeft: '10px' }}
      >
        Solicitar Préstamo
      </button>

      {showPrestamoForm && (
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4>Nueva Solicitud de Préstamo</h4>
          <form onSubmit={handleRequestPrestamo}>
            <label htmlFor="fechaDevolucion">Fecha de Devolución Prevista: </label>
            <input 
              type="date" 
              id="fechaDevolucion"
              value={fechaDevolucion}
              onChange={(e) => setFechaDevolucion(e.target.value)}
              required 
            />
            <input 
              type="text"
              placeholder="Observaciones (opcional)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ marginLeft: '10px' }}
            />
            <button type="submit" style={{ marginLeft: '10px' }}>Confirmar Solicitud</button>
          </form>
        </div>
      )}

      {/* Formulario para añadir documentos */}
      {expediente.estado === 'En trámite' && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
          <h3>Añadir Documento al Expediente (Índice)</h3>
          <form onSubmit={handleAddDocumento}>
            <select value={selectedDocumento} onChange={(e) => setSelectedDocumento(e.target.value)}>
              <option value="">-- Seleccione un documento para añadir --</option>
              {documentosDisponibles.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.radicado} - {doc.asunto}</option>
              ))}
            </select>
            <button type="submit" style={{ marginLeft: '10px' }}>Añadir</button>
          </form>
        </div>
      )}

      {/* Índice Electrónico */}
      <h3>Índice Electrónico (Documentos en el Expediente)</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            <th>Foliado</th>
            <th>Radicado</th>
            <th>Asunto</th>
            <th>Fecha de Incorporación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
  {expediente.documentos.map(doc => (
    <tr key={doc.id}>
      <td>{doc.orden_foliado}</td>
      
      <td>
        {doc.path_archivo ? (<button 
                    onClick={() => openModal(`http://localhost:4000/${doc.path_archivo}`)}
                    style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {doc.radicado}
                  </button>
                ) : (
                  doc.radicado
                )}
      </td>
      
      <td>{doc.asunto}</td>
      <td>{new Date(doc.fecha_incorporacion).toLocaleString()}</td>
      <td style={{ padding: '8px' }}>
        {targetDocumentoId === doc.id ? (
          <form onSubmit={handleStartWorkflow}>
            <select value={selectedWorkflow} onChange={(e) => setSelectedWorkflow(e.target.value)} required>
              <option value="">-- Seleccionar Workflow --</option>
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>{wf.nombre}</option>
              ))}
            </select>
            <button type="submit" style={{ marginLeft: '5px' }}>Confirmar</button>
            <button type="button" onClick={() => setTargetDocumentoId(null)} style={{ marginLeft: '5px' }}>Cancelar</button>
          </form>
        ) : (
          <button onClick={() => setTargetDocumentoId(doc.id)}>
            Iniciar Workflow
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>
      </table>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Visor de Documento"
        style={{
          content: {
            top: '50%', left: '50%', right: 'auto', bottom: 'auto',
            marginRight: '-50%', transform: 'translate(-50%, -50%)',
            width: '80%', height: '90%'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }
        }}
      >
        <button onClick={closeModal} style={{ float: 'right' }}>Cerrar</button>
        <h2>Visor de Documento</h2>
        <iframe 
          src={viewingFileUrl} 
          title="Visor de PDF" 
          width="100%" 
          height="90%" 
          style={{ border: 'none', marginTop: '10px' }}
        ></iframe>
      </Modal>
    </div>
  );
};

export default ExpedienteDetalle;