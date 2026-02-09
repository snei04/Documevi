import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import './Dashboard.css';

const GestionPrestamos = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [error, setError] = useState('');

  // --- INICIO: AÑADIDOS PARA EL CHECKLIST DE DEVOLUCIÓN ---
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentPrestamo, setCurrentPrestamo] = useState(null);
  const [checklistData, setChecklistData] = useState({
    folios: '',
    estado_conservacion: 'Bueno',
    inconsistencias: ''
  });
  // --- FIN: AÑADIDOS PARA EL CHECKLIST DE DEVOLUCIÓN ---

  const fetchPrestamos = useCallback(async () => {
    try {
      const res = await api.get('/prestamos');
      setPrestamos(res.data);
    } catch (err) {
      setError('No se pudieron cargar los préstamos.');
    }
  }, []);

  useEffect(() => {
    fetchPrestamos();
  }, [fetchPrestamos]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/prestamos/${id}/approve`);
      toast.success('Préstamo aprobado con éxito.');
      fetchPrestamos();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al aprobar el préstamo.');
    }
  };
  // -- Prorroga --

  const handleApproveProrroga = async (id) => {
    try {
      await api.put(`/prestamos/${id}/approve-prorroga`);
      toast.success('Prórroga aprobada con éxito.');
      fetchPrestamos();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al aprobar la prórroga.');
    }
  };

  // --- INICIO: FUNCIONES PARA EL CHECKLIST Y LA DEVOLUCIÓN ---
  const openReturnModal = (prestamo) => {
    setCurrentPrestamo(prestamo);
    setModalIsOpen(true);
  };

  const closeReturnModal = () => {
    setCurrentPrestamo(null);
    setModalIsOpen(false);
    setChecklistData({ folios: '', estado_conservacion: 'Bueno', inconsistencias: '' });
  };

  const handleChecklistChange = (e) => {
    setChecklistData({ ...checklistData, [e.target.name]: e.target.value });
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/prestamos/${currentPrestamo.id}/return`, checklistData);
      toast.success('Devolución física registrada con éxito.');
      closeReturnModal();
      fetchPrestamos();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al registrar la devolución.');
    }
  };

  // Esta nueva función decide qué hacer al hacer clic en "Registrar Devolución"
  const handleReturn = async (prestamo) => {
    if (prestamo.tipo_prestamo === 'Electrónico') {
      if (window.confirm('¿Confirmar la devolución de este préstamo electrónico?')) {
        try {
          await api.put(`/prestamos/${prestamo.id}/return`, {}); // No se envían datos de checklist
          toast.success('Devolución electrónica registrada.');
          fetchPrestamos();
        } catch (err) {
          toast.error(err.response?.data?.msg || 'Error al registrar la devolución.');
        }
      }
    } else {
      // Si es Físico, abrimos el modal para el checklist
      openReturnModal(prestamo);
    }
  };
  // --- FIN: FUNCIONES PARA EL CHECKLIST Y LA DEVOLUCIÓN ---

  return (
    <div>
      <div className="page-header">
        <h1>Gestión de Préstamos y Consultas</h1>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {prestamos.length === 0 ? (
        <div className="empty-state">
          <h3>No hay préstamos activos</h3>
          <p>Actualmente no tienes préstamos pendientes de gestionar.</p>
          <p className="text-muted">Los préstamos solicitados por los usuarios aparecerán aquí para su aprobación y seguimiento.</p>
        </div>
      ) : (
        <table className="styled-table">
          <thead>
            <tr>
              <th>Expediente</th>
              <th>Tipo</th>
              <th>Solicitante</th>
              <th>Fecha Solicitud</th>
              <th>Devolución Prevista</th>
              <th>Estado</th>
              <th>Prórrogas Solicitadas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamos.map(p => (
              <tr key={p.id}>
                <td>{p.nombre_expediente}</td>
                <td>{p.tipo_prestamo}</td>
                <td>{p.nombre_solicitante}</td>
                <td>{new Date(p.fecha_solicitud).toLocaleDateString()}</td>
                <td>{new Date(p.fecha_devolucion_prevista).toLocaleDateString()}</td>
                <td>{p.estado}</td>
                <td>{p.prorrogas_solicitadas}</td>
                <td className="action-cell">
                  {p.estado === 'Solicitado' && (
                    <button onClick={() => handleApprove(p.id)} className="button button-primary">Aprobar</button>
                  )}
                  {p.estado === 'Prestado' && (
                    <button onClick={() => handleReturn(p)} className="button">Registrar Devolución</button>
                  )}
                  {p.prorrogas_solicitadas > 0 && p.estado === 'Prestado' && (
                    <button onClick={() => handleApproveProrroga(p.id)} className="button" style={{ backgroundColor: 'orange' }}>Aprobar Prórroga</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL PARA EL CHECKLIST DE DEVOLUCIÓN (SOLO PARA FÍSICOS) */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeReturnModal}
        contentLabel="Registrar Devolución de Expediente Físico"
        style={{ content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)', width: '500px' } }}
      >
        <h2>Checklist de Devolución</h2>
        {currentPrestamo && <p><strong>Expediente:</strong> {currentPrestamo.nombre_expediente}</p>}
        <form onSubmit={handleReturnSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Folios Confirmados: </label>
            <input type="number" name="folios" value={checklistData.folios} onChange={handleChecklistChange} required />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Estado de Conservación: </label>
            <select name="estado_conservacion" value={checklistData.estado_conservacion} onChange={handleChecklistChange} required>
              <option>Bueno</option>
              <option>Regular</option>
              <option>Malo</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Inconsistencias Detectadas: </label>
            <textarea name="inconsistencias" value={checklistData.inconsistencias} onChange={handleChecklistChange} style={{ width: '100%' }} />
          </div>
          <button type="submit" className="button button-primary">Confirmar Devolución</button>
          <button type="button" onClick={closeReturnModal} style={{ marginLeft: '10px' }} className="button">Cancelar</button>
        </form>
      </Modal>
    </div>
  );
};

export default GestionPrestamos;