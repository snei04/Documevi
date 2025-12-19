/**
 * @fileoverview Componente de Gestión de Usuarios para el sistema Documevi.
 * Permite administrar usuarios del sistema: listar, invitar, cambiar roles y activar/desactivar.
 * 
 * @module components/GestionUsuarios
 * @requires react
 * @requires ../api/axios
 * @requires react-toastify
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './GestionUsuarios.css';

import PermissionGuard from './auth/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';


/**
 * Componente principal para la gestión de usuarios del sistema.
 * Proporciona funcionalidades CRUD para administrar usuarios.
 * 
 * @component
 * @returns {JSX.Element} Interfaz de gestión de usuarios
 * 
 * @example
 * <GestionUsuarios />
 */
const GestionUsuarios = () => {
    // ============================================
    // HOOKS Y ESTADO
    // ============================================
    
    /** Hook para verificar permisos del usuario actual */
    const { hasPermission } = usePermissions();

    /** Lista de usuarios del sistema */
    const [users, setUsers] = useState([]);
    
    /** Lista de roles disponibles para asignar */
    const [roles, setRoles] = useState([]);
    
    /** Controla la visibilidad del formulario de invitación */
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    /** Estado de carga para mostrar indicadores visuales */
    const [loading, setLoading] = useState(true);
    
    /** Datos del nuevo usuario a invitar */
    const [newUser, setNewUser] = useState({
        nombre_completo: '',
        email: '',
        documento: '',
        rol_id: ''
    });

    // ============================================
    // FUNCIONES DE CARGA DE DATOS
    // ============================================

    /**
     * Obtiene la lista de usuarios desde el servidor.
     * Usa useCallback para evitar recreaciones innecesarias.
     */
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/usuarios');
            setUsers(res.data);
        } catch (err) {
            toast.error('No se pudo cargar la lista de usuarios.');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Efecto inicial: carga usuarios y roles al montar el componente.
     */
    useEffect(() => {
        fetchUsers();
        
        // Cargar roles disponibles para los selectores
        const fetchRoles = async () => {
            try {
                const res = await api.get('/roles');
                setRoles(res.data);
            } catch (err) {
                // Fallo silencioso si no tiene permisos para ver roles
                console.error('No se pudieron cargar los roles:', err.message);
            }
        };
        fetchRoles();
    }, [fetchUsers]);

    // ============================================
    // MANEJADORES DE EVENTOS
    // ============================================

    /**
     * Actualiza un usuario existente (rol o estado activo).
     * @param {number} userId - ID del usuario a actualizar
     * @param {Object} dataToUpdate - Datos a actualizar { rol_id?, activo? }
     */
    const handleUpdate = async (userId, dataToUpdate) => {
        try {
            await api.put(`/usuarios/${userId}`, dataToUpdate);
            toast.success('Usuario actualizado con éxito.');
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar el usuario.');
        }
    };

    /**
     * Maneja cambios en el formulario de nuevo usuario.
     * @param {Event} e - Evento del input
     */
    const handleNewUserChange = (e) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };

    /**
     * Envía la invitación a un nuevo usuario.
     * Valida que se haya seleccionado un rol antes de enviar.
     * @param {Event} e - Evento del formulario
     */
    const handleInviteUser = async (e) => {
        e.preventDefault();
        
        // Validar selección de rol
        if (!newUser.rol_id) {
            return toast.warn("Por favor, seleccione un rol para el nuevo usuario.");
        }
        
        try {
            await api.post('/usuarios/invite', newUser);
            toast.success('Invitación enviada con éxito. El usuario recibirá un correo.');
            
            // Resetear formulario y recargar lista
            setShowCreateForm(false);
            setNewUser({ nombre_completo: '', email: '', documento: '', rol_id: '' });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al enviar la invitación.');
        }
    };

    // ============================================
    // RENDERIZADO
    // ============================================

    return (
        <div className="gestion-usuarios-container">
            {/* Encabezado de la página */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">👥</div>
                    <div className="header-text">
                        <h1>Gestión de Usuarios</h1>
                        <p className="header-subtitle">Administra los usuarios del sistema, sus roles y permisos</p>
                    </div>
                </div>
                
                {/* Estadísticas rápidas */}
                <div className="stats-cards">
                    <div className="stat-card">
                        <span className="stat-number">{users.length}</span>
                        <span className="stat-label">Total Usuarios</span>
                    </div>
                    <div className="stat-card stat-active">
                        <span className="stat-number">{users.filter(u => u.activo).length}</span>
                        <span className="stat-label">Activos</span>
                    </div>
                    <div className="stat-card stat-inactive">
                        <span className="stat-number">{users.filter(u => !u.activo).length}</span>
                        <span className="stat-label">Inactivos</span>
                    </div>
                </div>
            </div>
            
            {/* Barra de acciones */}
            <div className="action-bar">
                <PermissionGuard permission="gestionar_usuarios">
                    <button 
                        onClick={() => setShowCreateForm(!showCreateForm)} 
                        className={`button ${showCreateForm ? 'button-secondary' : 'button-primary'}`}
                    >
                        {showCreateForm ? '✕ Cancelar' : '+ Invitar Nuevo Usuario'}
                    </button>
                </PermissionGuard>
            </div>

            {/* Formulario de invitación (colapsable) */}
            {showCreateForm && (
                <PermissionGuard permission="gestionar_usuarios">
                    <div className="invite-form-card">
                        <div className="form-header">
                            <h3>📧 Invitar Nuevo Usuario</h3>
                            <p>El usuario recibirá un correo con instrucciones para activar su cuenta</p>
                        </div>
                        
                        <form onSubmit={handleInviteUser} className="invite-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="nombre_completo">Nombre Completo</label>
                                    <input 
                                        type="text" 
                                        id="nombre_completo"
                                        name="nombre_completo" 
                                        placeholder="Ej: Juan Pérez García" 
                                        value={newUser.nombre_completo} 
                                        onChange={handleNewUserChange} 
                                        required 
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="email">Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        id="email"
                                        name="email" 
                                        placeholder="correo@ejemplo.com" 
                                        value={newUser.email} 
                                        onChange={handleNewUserChange} 
                                        required 
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="documento">Documento de Identidad</label>
                                    <input 
                                        type="text" 
                                        id="documento"
                                        name="documento" 
                                        placeholder="Ej: 12345678" 
                                        value={newUser.documento} 
                                        onChange={handleNewUserChange} 
                                        required 
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="rol_id">Rol a Asignar</label>
                                    <select 
                                        id="rol_id"
                                        name="rol_id" 
                                        value={newUser.rol_id} 
                                        onChange={handleNewUserChange} 
                                        required
                                    >
                                        <option value="">-- Seleccione un Rol --</option>
                                        {roles.map(rol => (
                                            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-actions">
                                <button type="submit" className="button button-primary button-lg">
                                    📤 Enviar Invitación
                                </button>
                            </div>
                        </form>
                    </div>
                </PermissionGuard>
            )}

            {/* Tabla de usuarios */}
            <div className="users-table-container">
                <div className="table-header">
                    <h3>📋 Usuarios Registrados</h3>
                    <span className="table-count">{users.length} usuarios</span>
                </div>
                
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Cargando usuarios...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">👤</span>
                        <p>No hay usuarios registrados</p>
                    </div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Documento</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className={!user.activo ? 'row-inactive' : ''}>
                                    {/* Columna de usuario con avatar */}
                                    <td className="user-cell">
                                        <div className="user-avatar">
                                            {user.nombre_completo.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">{user.nombre_completo}</span>
                                            <span className="user-email">{user.email}</span>
                                        </div>
                                    </td>
                                    
                                    {/* Documento */}
                                    <td className="documento-cell">
                                        <span className="documento-badge">{user.documento}</span>
                                    </td>
                                    
                                    {/* Selector de rol (editable si tiene permisos) */}
                                    <td className="rol-cell">
                                        {hasPermission('gestionar_usuarios') ? (
                                            <select 
                                                className="rol-select"
                                                value={roles.find(r => r.nombre === user.rol)?.id || ''}
                                                onChange={(e) => handleUpdate(user.id, { rol_id: e.target.value })}
                                            >
                                                {roles.map(rol => (
                                                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="rol-badge">{user.rol}</span>
                                        )}
                                    </td>
                                    
                                    {/* Estado activo/inactivo */}
                                    <td className="estado-cell">
                                        <span className={`status-badge ${user.activo ? 'status-active' : 'status-inactive'}`}>
                                            <span className="status-dot"></span>
                                            {user.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    
                                    {/* Acciones */}
                                    <td className="actions-cell">
                                        <PermissionGuard permission="gestionar_usuarios">
                                            <button 
                                                onClick={() => handleUpdate(user.id, { activo: !user.activo })} 
                                                className={`action-button ${user.activo ? 'btn-deactivate' : 'btn-activate'}`}
                                                title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                                            >
                                                {user.activo ? '🚫 Desactivar' : '✅ Activar'}
                                            </button>
                                        </PermissionGuard>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default GestionUsuarios;