import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
                            <span className="option-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </span>
                            <span className="option-text">Perfil</span>
                        </button>

                        <button
                            className="dropdown-option logout"
                            onClick={handleLogout}
                        >
                            <span className="option-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </span>
                            <span className="option-text">Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
