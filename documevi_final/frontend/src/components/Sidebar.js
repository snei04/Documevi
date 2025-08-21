import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; // 1. Usamos NavLink para el estilo 'activo'
import './Dashboard.css';

const Sidebar = ({ isOpen }) => {
  const sidebarClassName = isOpen ? "sidebar" : "sidebar collapsed";
  
  const [openMenu, setOpenMenu] = useState(null);

  const handleMenuClick = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  return (
    <aside className={sidebarClassName}>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" end>Inicio</NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/mis-tareas">Mis Tareas</NavLink>
            
          </li>
          <li>
            <NavLink to="/dashboard/mis-prestamos">Mis Préstamos</NavLink>
          </li>

          {/* --- Menú Desplegable: Gestión Documental --- */}
          <li>
            <div onClick={() => handleMenuClick('gestion')} className="menu-title">
              <span>Gestión Documental</span>
              <span>{openMenu === 'gestion' ? '▲' : '▼'}</span>
            </div>
            <ul className={`submenu ${openMenu === 'gestion' ? 'open' : ''}`}>
              <li><NavLink to="/dashboard/captura">Captura de documentos</NavLink></li>
              <li><NavLink to="/dashboard/expedientes">Gestión de expedientes</NavLink></li>
              <li><NavLink to="/dashboard/prestamos">Préstamo de documentos</NavLink></li>
              <li><NavLink to="/dashboard/search">Búsqueda</NavLink></li>
            </ul>
          </li>

          {/* --- Menú Desplegable: Parametrización --- */}
          <li>
            <div onClick={() => handleMenuClick('parametros')} className="menu-title">
              <span>Parametrización</span>
              <span>{openMenu === 'parametros' ? '▲' : '▼'}</span>
            </div>
            <ul className={`submenu ${openMenu === 'parametros' ? 'open' : ''}`}>
              <li><NavLink to="/dashboard/dependencias">Dependencias</NavLink></li>
              <li><NavLink to="/dashboard/oficinas">Oficinas</NavLink></li>
              <li><NavLink to="/dashboard/series">Series (TRD)</NavLink></li>
              <li><NavLink to="/dashboard/subseries">Subseries (TRD)</NavLink></li>
              <li><NavLink to="/dashboard/campos-personalizados">Campos Personalizados</NavLink></li>
              <li><NavLink to="/dashboard/workflows">Flujos de Trabajo</NavLink></li>
              <li><NavLink to="/dashboard/plantillas">Gestión de Plantillas</NavLink></li>
            </ul>
          </li>

          {/* --- Menú Desplegable: Administración --- */}
          <li>
            <div onClick={() => handleMenuClick('admin')} className="menu-title">
              <span>Administración</span>
              <span>{openMenu === 'admin' ? '▲' : '▼'}</span>
            </div>
            <ul className={`submenu ${openMenu === 'admin' ? 'open' : ''}`}>
                <li><NavLink to="/dashboard/transferencias">Transferencias</NavLink></li>
                <li><NavLink to="/dashboard/eliminacion">Eliminación</NavLink></li>
                <li><NavLink to="/dashboard/roles">Gestión de Roles</NavLink></li>
                <li><NavLink to="/dashboard/usuarios">Gestión de Usuarios</NavLink></li>
                <li><NavLink to="/dashboard/auditoria">Auditoría</NavLink></li>
                <li><NavLink to="/dashboard/reportes-fuid">Reporte FUID</NavLink></li>
                <li><NavLink to="/dashboard/estadisticas">Estadísticas</NavLink></li>
            </ul>
          </li>

        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;