import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

// Componente para gestionar la eliminación de expedientes
const GestionEliminacion = () => {
  const [elegibles, setElegibles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [motivo, setMotivo] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Función para cargar los expedientes elegibles para eliminación
  const fetchElegibles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/eliminacion/elegibles');
      setElegibles(res.data);
    } catch (err) {
      toast.error('No se pudieron cargar los expedientes elegibles para eliminación.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar los expedientes elegibles al montar el componente
  useEffect(() => {
    fetchElegibles();
  }, [fetchElegibles]);

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Función para manejar la eliminación de los expedientes seleccionados
  const handleEliminar = async () => {
    if (selectedIds.length === 0) {
      return toast.warn('Por favor, seleccione al menos un expediente para eliminar.');
    }
    if (!motivo.trim()) {
      return toast.warn('Por favor, ingrese un motivo o justificación para la eliminación.');
    }
    if (window.confirm(`¿Está seguro de que desea ELIMINAR PERMANENTEMENTE ${selectedIds.length} expedientes? Esta acción no se puede deshacer.`)) {
      try {
        const res = await api.post('/eliminacion/ejecutar', { 
            expedientesIds: selectedIds,
            motivo: motivo 
        });
        toast.success(res.data.msg);
        setSelectedIds([]);
        setMotivo('');
        fetchElegibles();
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Error al ejecutar la eliminación.');
      }
    }
  };

  if (isLoading) return <div>Cargando expedientes para disposición final...</div>;

  return (
    <div>
        <div className="page-header">
            <h1>Disposición Final: Eliminación de Expedientes</h1>
            <p>
                Esta sección muestra los expedientes que han cumplido su tiempo de retención y cuya disposición final en la TRD es "Eliminación".
            </p>
        </div>
      
        <div className="content-box">
            <h3>Acción de Eliminación</h3>
            <div className="action-bar">
                <input 
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo de la eliminación (requerido)"
                    style={{ minWidth: '300px', padding: '0.5rem' }}
                />
                <button 
                    onClick={handleEliminar} 
                    disabled={selectedIds.length === 0 || !motivo}
                    className="button button-danger"
                >
                    Eliminar {selectedIds.length} Expediente(s)
                </button>
            </div>
        </div>

      <h3>Expedientes Elegibles para Eliminación</h3>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Seleccionar</th>
            <th>Nombre Expediente</th>
            <th>Serie / Subserie</th>
            <th>Fecha de Cierre</th>
            <th>Retención Total (Años)</th>
          </tr>
        </thead>
        <tbody>
          {elegibles.length > 0 ? elegibles.map(exp => (
            <tr key={exp.id}>
              <td style={{ textAlign: 'center' }}>
                <input 
                  type="checkbox"
                  checked={selectedIds.includes(exp.id)}
                  onChange={() => handleSelect(exp.id)}
                />
              </td>
              <td>{exp.nombre_expediente}</td>
              <td>{`${exp.nombre_serie} / ${exp.nombre_subserie}`}</td>
              <td>{new Date(exp.fecha_cierre).toLocaleDateString()}</td>
              <td>{exp.retencion_total}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                No hay expedientes que cumplan los criterios para eliminación en este momento.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GestionEliminacion;