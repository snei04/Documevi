import React from 'react';
import './Dashboard.css'; // Reutilizamos los estilos

const DashboardHome = () => {
  return (
    <div>
      <h1>Estadísticas Generales</h1>
      <div className="stats-container">
        <div className="stat-card">
          <h3>📄 Documentos Capturados</h3>
          <p className="stat-number">1,250</p>
        </div>
        <div className="stat-card">
          <h3>📂 Expedientes Activos</h3>
          <p className="stat-number">340</p>
        </div>
        <div className="stat-card">
          <h3>🔄 Préstamos Vigentes</h3>
          <p className="stat-number">25</p>
        </div>
        <div className="stat-card">
          <h3>👤 Usuarios Activos</h3>
          <p className="stat-number">42</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;