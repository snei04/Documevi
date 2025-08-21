import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const MisPrestamos = () => {
  const [prestamos, setPrestamos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMisPrestamos = useCallback(async () => {
    try {
      const res = await api.get('/prestamos/mis-prestamos');
      setPrestamos(res.data);
    } catch (err) {
      toast.error('No se pudieron cargar tus préstamos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMisPrestamos();
  }, [fetchMisPrestamos]);

  const handleRequestProrroga = async (id) => {
    if (window.confirm('¿Deseas solicitar una prórroga de 5 días hábiles para este préstamo?')) {
        try {
            await api.put(`/prestamos/${id}/request-prorroga`);
            toast.success('Solicitud de prórroga enviada con éxito.');
            fetchMisPrestamos(); // Recargar para ver el cambio
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al solicitar la prórroga.');
        }
    }
  };

  if (isLoading) return <div>Cargando tus préstamos...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Mis Solicitudes de Préstamo</h1>
      </div>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Expediente</th>
            <th>Fecha Solicitud</th>
            <th>Devolución Prevista</th>
            <th>Estado</th>
            <th>Prórrogas Solicitadas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {prestamos.length > 0 ? prestamos.map(p => (
            <tr key={p.id}>
              <td>{p.nombre_expediente}</td>
              <td>{new Date(p.fecha_solicitud).toLocaleDateString()}</td>
              <td>{new Date(p.fecha_devolucion_prevista).toLocaleDateString()}</td>
              <td>{p.estado}</td>
              <td>{p.prorrogas_solicitadas}</td>
              <td>
                {p.estado === 'Prestado' && (
                  <button onClick={() => handleRequestProrroga(p.id)} className="button">
                    Solicitar Prórroga
                  </button>
                )}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                No tienes solicitudes de préstamo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MisPrestamos;