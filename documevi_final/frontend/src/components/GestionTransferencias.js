import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

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
  
  // Filtramos los expedientes que están listos para transferir
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
      toast.warn('Por favor, seleccione al menos un expediente para transferir.');
      return;
    }
    if (window.confirm(`¿Está seguro de que desea transferir ${selectedIds.length} expedientes al Archivo Central?`)) {
      try {
        const res = await api.post('/transferencias', { expedientesIds: selectedIds });
        toast.success(res.data.msg);
        // Recargar la lista de expedientes para que se actualice la vista
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
    <div style={{ padding: '20px' }}>
      <h1>Transferencias Documentales Primarias</h1>
      <p>Seleccione los expedientes en estado "Cerrado en Gestión" que desea transferir al Archivo Central.</p>
      
      <button 
        onClick={handleTransfer} 
        disabled={selectedIds.length === 0}
        style={{ marginBottom: '20px' }}
      >
        Transferir {selectedIds.length} Expediente(s)
      </button>

      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
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