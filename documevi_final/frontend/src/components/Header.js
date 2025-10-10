import React from 'react';
import UserDropdown from './UserDropdown';
import './Dashboard.css';
import logoCircular from '../assets/logo-circular.png';

const Header = ({ toggleSidebar }) => {
  return (
    <div className="header">
      {/* Botón hamburguesa para móvil */}
      <button className="hamburger-button" onClick={toggleSidebar}>
        ☰
      </button>
      
      <div className="header-left" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
        ☰ MENU
      </div>
      
      <div className="header-center">
        <img src={logoCircular} alt="Logo" className="header-logo" />
      </div>
      
      <div className="header-right">
        <UserDropdown />
      </div>
    </div>
  );
};

export default Header;