import React, { useState, useEffect, useCallback } from 'react'; // 1. Importar useCallback
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';
import logoCircular from '../assets/logo-circular.png';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  // 2. Envolver la función en useCallback
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUserName(res.data.nombre_completo);
        } catch (error) {
          console.error('Error al obtener los datos del usuario', error);
          handleLogout();
        }
      } else {
        handleLogout();
      }
    };

    fetchUserData();
  }, [handleLogout]); // 3. Añadir handleLogout como dependencia

  return (
    <div className="header">
      <div className="header-left" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
        ☰ MENU
      </div>
      <div className="header-center">
        <img src={logoCircular} alt="Logo" className="header-logo" />
      </div>
      <div className="header-right">
        <span>{userName}</span>
        <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
      </div>
    </div>
  );
};

export default Header;