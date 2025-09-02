import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; 

const GestionTransferencias = () => {
  const [expedientes, setExpedientes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpedientes = async () => {
      try {
        const res = await api.get('/expedientes');
        setExpedientes(res.data);
      } catch (err) {
        toast.error('No se pudieron cargar los expedientes.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpedientes();
  }, []);
  
  const expedientesElegibles = useMemo(() => 
    expedientes.filter(exp => exp.estado === 'Cerrado en Gestión'),
    [expedientes]
  );

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleTransfer = async () => {
    if (selectedIds.length === 0) {
      return toast.warn('Por favor, seleccione al menos un expediente para transferir.');
    }
    if (window.confirm(`¿Está seguro de que desea transferir ${selectedIds.length} expedientes al Archivo Central?`)) {
      try {
        const res = await api.post('/transferencias', { expedientesIds: selectedIds });
        toast.success(res.data.msg);
        const updatedExpedientes = await api.get('/expedientes');
        setExpedientes(updatedExpedientes.data);
        setSelectedIds([]);
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Error al realizar la transferencia.');
      }
    }
  };

  if (isLoading) return <div>Cargando expedientes...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Transferencias Documentales Primarias</h1>
        <p>Seleccione los expedientes en estado "Cerrado en Gestión" que desea transferir al Archivo Central.</p>
      </div>
      
      <div className="action-bar" style={{ justifyContent: 'start' }}>
        <button 
          onClick={handleTransfer} 
          disabled={selectedIds.length === 0}
          className="button button-primary"
        >
          Transferir {selectedIds.length} Expediente(s)
        </button>
      </div>

      <table className="styled-table">
        <thead>
          <tr>
            <th>Seleccionar</th>
            <th>Nombre Expediente</th>
            <th>Serie</th>
            <th>Fecha de Cierre</th>
          </tr>
        </thead>
        <tbody>
          {expedientesElegibles.length > 0 ? expedientesElegibles.map(exp => (
            <tr key={exp.id}>
              <td style={{ textAlign: 'center' }}>
                <input 
                  type="checkbox"
                  checked={selectedIds.includes(exp.id)}
                  onChange={() => handleSelect(exp.id)}
                />
              </td>
              <td>{exp.nombre_expediente}</td>
              <td>{exp.nombre_serie}</td>
              <td>{exp.fecha_cierre ? new Date(exp.fecha_cierre).toLocaleDateString() : 'N/A'}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                No hay expedientes listos para transferir.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GestionTransferencias;