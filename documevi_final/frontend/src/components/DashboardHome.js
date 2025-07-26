import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalDocumentos: 0,
    totalExpedientes: 0,
    prestamosActivos: 0,
    usuariosActivos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Error al cargar estadísticas", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div>Cargando estadísticas...</div>;
  }

  return (
    <div>
      <h1>Estadísticas Generales</h1>
      <div className="stats-container">
        
        <Link to="/dashboard/captura" className="stat-card-link">
          <div className="stat-card">
            <h3>📄 Documentos Capturados</h3>
            <p className="stat-number">{stats.totalDocumentos}</p>
          </div>
        </Link>

        <Link to="/dashboard/expedientes" className="stat-card-link">
          <div className="stat-card">
            <h3>📂 Expedientes Totales</h3>
            <p className="stat-number">{stats.totalExpedientes}</p>
          </div>
        </Link>

        <Link to="/dashboard/prestamos" className="stat-card-link">
          <div className="stat-card">
            <h3>🔄 Préstamos Activos</h3>
            <p className="stat-number">{stats.prestamosActivos}</p>
          </div>
        </Link>
        
        <Link to="/dashboard/usuarios" className="stat-card-link">
          <div className="stat-card">
            <h3>👤 Usuarios Activos</h3>
            <p className="stat-number">{stats.usuariosActivos}</p>
          </div>
        </Link>

      </div>
    </div>
  );
};

export default DashboardHome;
