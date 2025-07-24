import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const ExpedienteDetalle = () => {
  const { id } = useParams(); // Obtiene el ID del expediente desde la URL
  const [expediente, setExpediente] = useState(null);
  const [documentosDisponibles, setDocumentosDisponibles] = useState([]);
  const [selectedDocumento, setSelectedDocumento] = useState('');
  const [error, setError] = useState('');

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
    fetchAllDocumentos();
  }, [id, fetchExpediente]);

  const handleAddDocumento = async (e) => {
    e.preventDefault();
    if (!selectedDocumento) {
      alert('Por favor, seleccione un documento.');
      return;
    }
    try {
      await api.post(`/expedientes/${id}/documentos`, { id_documento: selectedDocumento });
      alert('Documento añadido al expediente con éxito.');
      setSelectedDocumento('');
      fetchExpediente(); // Recargar los datos del expediente para ver el cambio
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al añadir el documento.');
    }
  };

  if (!expediente) return <div>Cargando...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Expediente: {expediente.nombre_expediente}</h1>
      <p><strong>Estado:</strong> {expediente.estado}</p>

      {/* Formulario para añadir documentos */}
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

      {/* Índice Electrónico */}
      <h3>Índice Electrónico (Documentos en el Expediente)</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr>
            <th>Foliado</th>
            <th>Radicado</th>
            <th>Asunto</th>
            <th>Fecha de Incorporación</th>
          </tr>
        </thead>
        <tbody>
          {expediente.documentos.map(doc => (
            <tr key={doc.id}>
              <td>{doc.orden_foliado}</td>
              <td>{doc.radicado}</td>
              <td>{doc.asunto}</td>
              <td>{new Date(doc.fecha_incorporacion).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ExpedienteDetalle;