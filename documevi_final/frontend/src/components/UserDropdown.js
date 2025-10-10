import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePermissionsContext } from '../context/PermissionsContext';
import api from '../api/axios';
import './UserDropdown.css';

const UserDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { clearPermissions } = usePermissionsContext();

    // Cargar información del usuario al montar el componente
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await api.get('/usuarios/perfil');
                setUserInfo({
                    nombre: response.data.nombre_completo || response.data.nombre,
                    email: response.data.email,
                    documento: response.data.documento
                });
            } catch (error) {
                console.error('Error al cargar información del usuario:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = () => {
        clearPermissions();
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        navigate('/dashboard/mi-perfil');
    };

    // Función para obtener las iniciales del nombre
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    if (isLoading) {
        return (
            <div className="user-dropdown-container">
                <div className="user-avatar loading">
                    <span>...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="user-dropdown-container" ref={dropdownRef}>
            {/* Avatar/Botón principal */}
            <button 
                className="user-avatar-button" 
                onClick={toggleDropdown}
                aria-label="Menú de usuario"
            >
                <div className="user-avatar">
                    <span>{getInitials(userInfo?.nombre)}</span>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="user-dropdown-menu">
                    {/* Header del dropdown con info del usuario */}
                    <div className="dropdown-header">
                        <div className="user-info">
                            <div className="user-avatar large">
                                <span>{getInitials(userInfo?.nombre)}</span>
                            </div>
                            <div className="user-details">
                                <h4 className="user-name">{userInfo?.nombre || 'Usuario'}</h4>
                                <p className="user-email">{userInfo?.email || ''}</p>
                            </div>
                        </div>
                        <button 
                            className="close-dropdown"
                            onClick={() => setIsOpen(false)}
                            aria-label="Cerrar menú"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Separador */}
                    <div className="dropdown-divider"></div>

                    {/* Opciones del menú */}
                    <div className="dropdown-options">
                        <button 
                            className="dropdown-option"
                            onClick={handleProfileClick}
                        >
                            <span className="option-icon">👤</span>
                            <span className="option-text">Perfil</span>
                        </button>

                        <button 
                            className="dropdown-option logout"
                            onClick={handleLogout}
                        >
                            <span className="option-icon">🚪</span>
                            <span className="option-text">Finalizar la sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
