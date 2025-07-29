import React, { useState, useEffect } from 'react';
import api from '../api/axios';

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
    <div style={{ padding: '20px' }}>
      <h1>Estadísticas Detalladas</h1>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Documentos Radicados por Oficina</h3>
        <table border="1" style={{ width: '60%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ padding: '8px' }}>Oficina Productora</th>
              <th style={{ padding: '8px' }}>Total de Documentos</th>
            </tr>
          </thead>
          <tbody>
            {docsPorOficina.map((stat, index) => (
              <tr key={index}>
                <td style={{ padding: '8px' }}>{stat.nombre_oficina}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{stat.total_documentos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Estadisticas;