import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const Estadisticas = () => {
  const [docsPorOficina, setDocsPorOficina] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/docs-por-oficina');
        setDocsPorOficina(res.data);
      } catch (err) {
        setError('No se pudieron cargar las estadísticas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div>Cargando estadísticas...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Estadísticas Detalladas</h1>
      </div>
      
      <div className="content-box">
        <h3>Documentos Radicados por Oficina</h3>
        <table className="styled-table" style={{ width: '100%', maxWidth: '600px' }}>
          <thead>
            <tr>
              <th>Oficina Productora</th>
              <th>Total de Documentos</th>
            </tr>
          </thead>
          <tbody>
            {docsPorOficina.map((stat, index) => (
              <tr key={index}>
                <td>{stat.nombre_oficina}</td>
                <td style={{ textAlign: 'center' }}>{stat.total_documentos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Estadisticas;