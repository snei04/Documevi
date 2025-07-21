import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Usaremos un CSS compartido
import logoCircular from '../assets/logo-circular.png'; // Reutilizamos el logo

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Limpiamos el token
    navigate('/login'); // Redirigimos al login
  };

  return (
    <div className="header">
      <div className="header-left" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
        ☰ MENU
      </div>
      <div className="header-center">
        <img src={logoCircular} alt="Logo" className="header-logo" />
      </div>
      <div className="header-right">
        <span>Sneider Fuquen Bernal</span> {/* Reemplazaremos esto por datos reales */}
        <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
      </div>
    </div>
  );
};

export default Header;