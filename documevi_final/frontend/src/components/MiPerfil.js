import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const MiPerfil = () => {
    const [profileData, setProfileData] = useState({ 
        nombre_completo: '', 
        email: '', 
        documento: '' 
    });
    const [passwordData, setPasswordData] = useState({ 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/usuarios/perfil');
                setProfileData({
                    nombre_completo: res.data.nombre_completo || res.data.nombre || '',
                    email: res.data.email || '',
                    documento: res.data.documento || ''
                });
            } catch (error) {
                console.error('Error al cargar perfil:', error);
                toast.error('No se pudo cargar la información del perfil.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        
        try {
            const res = await api.put('/usuarios/perfil', {
                nombre_completo: profileData.nombre_completo
            });
            toast.success(res.data.msg);
        } catch (err) {
            console.error('Error al actualizar perfil:', err);
            toast.error(err.response?.data?.msg || 'Error al actualizar el perfil.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error('Las nuevas contraseñas no coinciden.');
        }

        if (passwordData.newPassword.length < 6) {
            return toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
        }

        setIsChangingPassword(true);
        
        try {
            const res = await api.put('/usuarios/cambiar-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success(res.data.msg);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error('Error al cambiar contraseña:', err);
            toast.error(err.response?.data?.msg || 'Error al cambiar la contraseña.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando perfil...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>👤 Mi Perfil</h1>
                <p>Gestiona tu información personal y configuración de cuenta</p>
            </div>

            {/* Sección: Información Personal */}
            <div className="content-box" style={{ marginBottom: '2rem' }}>
                <h3>📝 Información Personal</h3>
                <form onSubmit={handleProfileSubmit}>
                    <div className="form-group">
                        <label htmlFor="nombre_completo">Nombre Completo *</label>
                        <input 
                            type="text" 
                            id="nombre_completo"
                            name="nombre_completo" 
                            value={profileData.nombre_completo} 
                            onChange={handleProfileChange} 
                            required 
                            placeholder="Ingresa tu nombre completo"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email"
                            name="email" 
                            value={profileData.email} 
                            disabled
                            className="input-disabled"
                            title="El email no puede ser modificado por seguridad"
                        />
                        <small className="form-help">
                            🔒 El email no puede ser modificado por razones de seguridad
                        </small>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="documento">Documento</label>
                        <input 
                            type="text" 
                            id="documento"
                            name="documento" 
                            value={profileData.documento} 
                            disabled
                            className="input-disabled"
                            title="El documento no puede ser modificado por seguridad"
                        />
                        <small className="form-help">
                            🔒 El documento no puede ser modificado por razones de seguridad
                        </small>
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="button button-primary"
                            disabled={isUpdatingProfile}
                        >
                            {isUpdatingProfile ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Sección: Cambiar Contraseña */}
            <div className="content-box">
                <h3>🔐 Cambiar Contraseña</h3>
                <form onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                        <label htmlFor="currentPassword">Contraseña Actual *</label>
                        <input 
                            type="password" 
                            id="currentPassword"
                            name="currentPassword" 
                            value={passwordData.currentPassword} 
                            onChange={handlePasswordChange} 
                            required 
                            placeholder="Ingresa tu contraseña actual"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="newPassword">Nueva Contraseña *</label>
                        <input 
                            type="password" 
                            id="newPassword"
                            name="newPassword" 
                            value={passwordData.newPassword} 
                            onChange={handlePasswordChange} 
                            required 
                            placeholder="Ingresa tu nueva contraseña"
                            minLength="6"
                        />
                        <small className="form-help">
                            La contraseña debe tener al menos 6 caracteres
                        </small>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</label>
                        <input 
                            type="password" 
                            id="confirmPassword"
                            name="confirmPassword" 
                            value={passwordData.confirmPassword} 
                            onChange={handlePasswordChange} 
                            required 
                            placeholder="Confirma tu nueva contraseña"
                            minLength="6"
                        />
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="button button-primary"
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? '⏳ Cambiando...' : '🔄 Cambiar Contraseña'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Información adicional */}
            <div className="content-box info-box">
                <h4>ℹ️ Información Importante</h4>
                <ul>
                    <li><strong>Email y Documento:</strong> Estos campos están protegidos y no pueden ser modificados por razones de seguridad.</li>
                    <li><strong>Contraseña:</strong> Asegúrate de usar una contraseña segura con al menos 6 caracteres.</li>
                    <li><strong>Cambios:</strong> Los cambios en tu perfil se aplicarán inmediatamente.</li>
                </ul>
            </div>
        </div>
    );
};

export default MiPerfil;
