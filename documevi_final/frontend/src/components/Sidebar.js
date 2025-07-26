import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Sidebar = ({ isOpen }) => {
  const sidebarClassName = isOpen ? "sidebar" : "sidebar collapsed";
  
  // Estado para controlar qué submenú está abierto
  const [openMenu, setOpenMenu] = useState(null);

  // Función para abrir/cerrar los submenús
  const handleMenuClick = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  return (
    <div className={sidebarClassName}>
      <ul>
        {/* --- Menús Principales --- */}
        <li className="sidebar-item"><Link to="/dashboard">Inicio</Link></li>
        <li className="sidebar-item"><Link to="/dashboard/mis-tareas">Mis Tareas</Link></li>

        {/* --- Menú Desplegable: Gestión Documental --- */}
        <li className="sidebar-item">
          <div onClick={() => handleMenuClick('gestion')} className="menu-title">
            Gestión Documental
          </div>
          <ul className={openMenu === 'gestion' ? 'submenu open' : 'submenu'}>
            <li><Link to="/dashboard/captura">Captura de documentos</Link></li>
            <li><Link to="/dashboard/expedientes">Gestión de expedientes</Link></li>
            <li><Link to="/dashboard/prestamos">Préstamo de documentos</Link></li>
            <li><Link to="/dashboard/search">Búsqueda</Link></li>
          </ul>
        </li>

        {/* --- Menú Desplegable: Parametrización --- */}
        <li className="sidebar-item">
          <div onClick={() => handleMenuClick('parametros')} className="menu-title">
            Parametrización
          </div>
          <ul className={openMenu === 'parametros' ? 'submenu open' : 'submenu'}>
            <li><Link to="/dashboard/dependencias">Dependencias</Link></li>
            <li><Link to="/dashboard/oficinas">Oficinas</Link></li>
            <li><Link to="/dashboard/series">Series (TRD)</Link></li>
            <li><Link to="/dashboard/subseries">Subseries (TRD)</Link></li>
            <li><Link to="/dashboard/workflows">Flujos de Trabajo</Link></li>
          </ul>
        </li>

        {/* --- Menú Desplegable: Administración --- */}
        <li className="sidebar-item">
          <div onClick={() => handleMenuClick('admin')} className="menu-title">
            Administración
          </div>
          <ul className={openMenu === 'admin' ? 'submenu open' : 'submenu'}>
            <li><Link to="/dashboard/usuarios">Gestión de Usuarios</Link></li>
            <li><Link to="/dashboard/reportes-fuid">Reporte FUID</Link></li>
            <li><Link to="/dashboard/estadisticas">Estadísticas</Link></li>
          </ul>
        </li>

      </ul>
    </div>
  );
};

export default Sidebar;