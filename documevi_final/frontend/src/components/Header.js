import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios'; // Importamos nuestra instancia de axios
import './Dashboard.css';
import logoCircular from '../assets/logo-circular.png';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Función para obtener los datos del usuario
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Llamamos al nuevo endpoint '/me'
          const res = await api.get('/auth/me');
          // Guardamos el nombre completo en el estado
          setUserName(res.data.nombre_completo);
        } catch (error) {
          console.error('Error al obtener los datos del usuario', error);
          // Si hay un error (ej. token inválido), cerramos sesión
          handleLogout();
        }
      }
    };

    fetchUserData();
  }, []); // El array vacío asegura que se ejecute solo una vez

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
        {/* Mostramos el nombre del estado en lugar de texto fijo */}
        <span>{userName}</span>
        <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
      </div>
    </div>
  );
};

export default Header;