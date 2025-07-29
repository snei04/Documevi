import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const GestionPrestamos = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [error, setError] = useState('');

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

  const handleUpdateStatus = async (id, estado) => {
    try {
      await api.put(`/prestamos/${id}/status`, { estado });
      toast.success(`Préstamo actualizado a: ${estado}`);
      fetchPrestamos(); // Recargar la lista
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al actualizar el estado.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Préstamos y Consultas</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Expediente</th>
            <th>Solicitante</th>
            <th>Fecha Solicitud</th>
            <th>Devolución Prevista</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {prestamos.map(p => (
            <tr key={p.id}>
              <td>{p.nombre_expediente}</td>
              <td>{p.nombre_solicitante}</td>
              <td>{new Date(p.fecha_solicitud).toLocaleDateString()}</td>
              <td>{new Date(p.fecha_devolucion_prevista).toLocaleDateString()}</td>
              <td>{p.estado}</td>
              <td>
                {p.estado === 'Solicitado' && (
                  <button onClick={() => handleUpdateStatus(p.id, 'Prestado')}>
                    Aprobar Préstamo
                  </button>
                )}
                {p.estado === 'Prestado' && (
                  <button onClick={() => handleUpdateStatus(p.id, 'Devuelto')}>
                    Marcar como Devuelto
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionPrestamos;