import React from 'react';
import { Link } from 'react-router-dom'; // <-- Usar Link para navegar
import './Dashboard.css';

// Aceptamos la propiedad "isOpen"
const Sidebar = ({ isOpen }) => {
  // Aplicamos la clase 'collapsed' si isOpen es false
  const sidebarClassName = isOpen ? "sidebar" : "sidebar collapsed";

  return (
    <div className={sidebarClassName}>
      <ul>
        <li><Link to="/dashboard">Inicio</Link></li>
        <li><Link to="/dashboard/captura">Captura de documentos</Link></li>
        <li><Link to="/dashboard/expedientes">Gestión de expedientes</Link></li>
        <li><Link to="/dashboard/dependencias">Gestión de Dependencias</Link></li>
        <li><Link to="/dashboard/oficinas">Gestión de Oficinas</Link></li>
        <li><Link to="/dashboard/series">Gestión de Series (TRD)</Link></li>
        <li><Link to="/dashboard/subseries">Gestión de Subseries (TRD)</Link></li>
        
      </ul>
    </div>
  );
};

export default Sidebar;