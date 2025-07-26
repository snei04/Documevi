import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const MisTareas = () => {
  const [tareas, setTareas] = useState([]);
  const [error, setError] = useState('');

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
    if (window.confirm('¿Estás seguro de que deseas aprobar y avanzar este documento al siguiente paso?')) {
      try {
        const res = await api.post(`/documentos/${idDocumento}/advance-workflow`);
        alert(res.data.msg);
        fetchTareas(); // Recargar la lista de tareas
      } catch (err) {
        alert(err.response?.data?.msg || 'Error al avanzar el workflow.');
      }
    }
  };

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
                {/* Asumimos que un documento está en un expediente, este enlace podría mejorarse */}
                <Link to={`/dashboard/expedientes/`}>{tarea.radicado}</Link>
              </td>
              <td>{tarea.asunto}</td>
              <td>{tarea.nombre_workflow}</td>
              <td>{tarea.paso_actual}</td>
              <td>
                <button onClick={() => handleAdvance(tarea.id_documento)}>
                  Aprobar y Avanzar
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No tienes tareas pendientes.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MisTareas;