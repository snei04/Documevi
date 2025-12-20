/**
 * @fileoverview Componente para gestionar permisos de un rol específico.
 * Muestra un árbol interactivo de permisos organizados por grupos y módulos.
 * Solo muestra los permisos que el usuario actual tiene asignados.
 * 
 * @module components/GestionPermisos
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import PermissionGuard from './auth/PermissionGuard';
import { usePermissionTree } from '../hooks/usePermissionTree';
import './PermissionTree.css';

// ============================================
// COMPONENTE INTERNO RECURSIVO
// ============================================

/**
 * Componente recursivo que renderiza cada nodo del árbol de permisos.
 * Puede ser un grupo (nivel 0) o un módulo con acciones (nivel 1).
 * 
 * @param {Object} props
 * @param {Object} props.node - Nodo del árbol a renderizar
 * @param {number} props.level - Nivel de profundidad (0 = grupo, 1 = módulo)
 * @param {Function} props.onToggle - Handler para expandir/colapsar
 * @param {Function} props.onPermissionChange - Handler para cambiar un permiso
 * @param {Function} props.onModuleChange - Handler para cambiar todos los permisos de un módulo
 * @param {Array} props.userPermissions - Lista de permisos del usuario actual
 */
const PermissionNode = ({ node, level = 0, onToggle, onPermissionChange, onModuleChange, userPermissions = [] }) => {
    
    /**
     * Calcula el estado del checkbox de un MÓDULO.
     * - 'checked': todos los permisos habilitados
     * - 'indeterminate': algunos habilitados
     * - 'unchecked': ninguno habilitado
     */
    const moduleCheckState = useMemo(() => {
        if (!node.permissions) return 'unchecked';
        const actions = Object.values(node.permissions).map(p => p.enabled);
        if (actions.length === 0) return 'unchecked';
        if (actions.every(p => p)) return 'checked';
        if (actions.some(p => p)) return 'indeterminate';
        return 'unchecked';
    }, [node.permissions]);

    /**
     * Filtra los hijos del nodo según los permisos del usuario.
     * Solo muestra módulos cuyos permisos el usuario actual posee.
     */
    const filteredChildren = useMemo(() => {
        if (!node.children) return [];
        
        return node.children.filter(child => {
            // Si el hijo tiene permisos, verificar que el usuario tenga al menos uno
            if (child.permissions) {
                const modulePermissions = Object.keys(child.permissions).map(
                    action => `${child.id}_${action}`
                );
                // Mostrar el módulo si el usuario tiene al menos un permiso de este módulo
                return modulePermissions.some(perm => userPermissions.includes(perm));
            }
            // Si es un grupo con hijos, verificar recursivamente
            if (child.children) {
                return child.children.some(grandChild => {
                    if (grandChild.permissions) {
                        const perms = Object.keys(grandChild.permissions).map(
                            action => `${grandChild.id}_${action}`
                        );
                        return perms.some(perm => userPermissions.includes(perm));
                    }
                    return false;
                });
            }
            return true;
        });
    }, [node.children, userPermissions]);

    /**
     * Filtra las acciones de un módulo según los permisos del usuario.
     * Solo muestra las acciones que el usuario actual tiene.
     */
    const filteredPermissions = useMemo(() => {
        if (!node.permissions) return {};
        
        return Object.fromEntries(
            Object.entries(node.permissions).filter(([action]) => {
                const permissionName = `${node.id}_${action}`;
                return userPermissions.includes(permissionName);
            })
        );
    }, [node.permissions, node.id, userPermissions]);

    // No renderizar si no hay hijos filtrados (para grupos)
    if (level === 0 && filteredChildren.length === 0) {
        return null;
    }

    // No renderizar si no hay permisos filtrados (para módulos)
    if (level === 1 && Object.keys(filteredPermissions).length === 0) {
        return null;
    }

    // Renderiza un NODO DE GRUPO (Nivel 0, ej. 'Parametrización')
    if (level === 0) {
        return (
            <li className={`permission-tree__node permission-tree__node--${node.expanded ? 'expanded' : 'collapsed'}`}>
                <div className="permission-tree__node-content" onClick={() => onToggle(node.id)}>
                    <span className="permission-tree__toggle">{node.expanded ? '[-]' : '[+]'}</span>
                    <span className="permission-tree__icon">{node.icon}</span>
                    <span className="permission-tree__name">{node.name}</span>
                    <span className="permission-tree__count">({filteredChildren.length})</span>
                </div>
                {node.expanded && filteredChildren.length > 0 && (
                    <ul className="permission-tree__children-list">
                        {filteredChildren.map(child => (
                            <PermissionNode 
                                key={child.id} 
                                node={child} 
                                level={level + 1} 
                                onToggle={onToggle}
                                onPermissionChange={onPermissionChange}
                                onModuleChange={onModuleChange}
                                userPermissions={userPermissions}
                            />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    // Renderiza un NODO DE MÓDULO (Nivel 1, ej. 'Dependencias', 'Oficinas')
    return (
        <li>
            <div className="permission-tree__node-content" style={{ paddingLeft: `calc(var(--pt-spacing) * 4 * ${level})` }}>
                <span className="permission-tree__icon">{node.icon}</span>
                <label className="permission-tree__action-label" onClick={() => onModuleChange(node.id)} title={`Marcar/Desmarcar todo en ${node.name}`}>
                    <span className="permission-tree__checkbox" data-state={moduleCheckState}></span>
                    <span className="permission-tree__name">{node.name}</span>
                </label>
            </div>
            <div className="permission-tree__module-actions">
                {Object.entries(filteredPermissions).map(([action, { id, enabled, descripcion }]) => (
                    <label key={id} className="permission-tree__action-label" onClick={() => onPermissionChange(node.id, action)} title={descripcion || action}>
                        <span className="permission-tree__checkbox" data-state={enabled ? 'checked' : 'unchecked'}></span>
                        <span>{action}</span>
                    </label>
                ))}
            </div>
        </li>
    );
};


// ============================================
// COMPONENTE PRINCIPAL (CARGA DE DATOS)
// ============================================

/**
 * Componente principal que carga los datos necesarios para el editor de permisos.
 * Obtiene el árbol de permisos, los permisos del rol a editar y los permisos del usuario actual.
 */
const GestionPermisos = () => {
    const { id_rol } = useParams();
    
    // Estados para los datos cargados
    const [initialData, setInitialData] = useState(null);
    const [initialRolePerms, setInitialRolePerms] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [userPermissions, setUserPermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Cargar en paralelo: árbol de permisos, permisos del rol, roles y perfil del usuario
                const [resTree, resRolePerms, resRoles, resProfile] = await Promise.all([
                    api.get('/permisos/tree'),
                    api.get(`/permisos/rol/${id_rol}`),
                    api.get('/roles'),
                    api.get('/usuarios/perfil')
                ]);
                
                setInitialData(resTree.data);
                setInitialRolePerms(resRolePerms.data);
                
                // Obtener nombre del rol
                const currentRole = resRoles.data.find(r => r.id === parseInt(id_rol));
                if (currentRole) setRoleName(currentRole.nombre);
                
                // Obtener permisos del usuario actual
                if (resProfile.data.permissions) {
                    setUserPermissions(resProfile.data.permissions);
                }

            } catch (err) {
                toast.error("Error al cargar la estructura de permisos.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id_rol]);
    
    if (isLoading || !initialData || !initialRolePerms) {
        return <div className="loading-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p>Cargando permisos...</p>
        </div>;
    }

    return (
        <PermissionTreeEditor 
            initialData={initialData} 
            initialRolePerms={initialRolePerms} 
            roleName={roleName}
            userPermissions={userPermissions}
        />
    );
};


// ============================================
// COMPONENTE EDITOR (MANEJO DE LA UI)
// ============================================

/**
 * Editor del árbol de permisos con filtrado según permisos del usuario actual.
 * Solo muestra los permisos que el usuario logueado tiene asignados.
 * 
 * @param {Object} props
 * @param {Object} props.initialData - Estructura del árbol de permisos
 * @param {Array} props.initialRolePerms - IDs de permisos del rol a editar
 * @param {string} props.roleName - Nombre del rol
 * @param {Array} props.userPermissions - Lista de permisos del usuario actual
 */
const PermissionTreeEditor = ({ initialData, initialRolePerms, roleName, userPermissions }) => {
    const { id_rol } = useParams();
    const navigate = useNavigate();

    const { 
        tree, setSearchTerm, handleToggle, handlePermissionChange, handleModuleChange, getSelectedPermissionIds 
    } = usePermissionTree(initialData, initialRolePerms);
    
    /**
     * Guarda los cambios de permisos del rol en el backend.
     */
    const handleSaveChanges = async () => {
        const selectedIds = getSelectedPermissionIds();
        try {
            await api.put(`/permisos/rol/${id_rol}`, { permisosIds: selectedIds });
            toast.success('Permisos actualizados con éxito.');
            navigate('/dashboard/roles');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al guardar los cambios.');
        }
    };

    // Filtrar grupos que tengan al menos un módulo visible para el usuario
    const visibleGroups = useMemo(() => {
        if (!tree.children) return [];
        
        return tree.children.filter(group => {
            if (!group.children) return false;
            
            // Verificar si algún módulo del grupo tiene permisos que el usuario posee
            return group.children.some(module => {
                if (!module.permissions) return false;
                const modulePerms = Object.keys(module.permissions).map(
                    action => `${module.id}_${action}`
                );
                return modulePerms.some(perm => userPermissions.includes(perm));
            });
        });
    }, [tree.children, userPermissions]);

    return (
        <div>
            <div className="page-header">
                <h1>Gestionar Permisos para el Rol: "{roleName}"</h1>
                <p className="header-subtitle">
                    Solo puedes asignar permisos que tú mismo posees ({userPermissions.length} permisos disponibles)
                </p>
            </div>
            
            <div className="permission-tree">
                <input 
                    className="permission-tree__search" 
                    type="text" 
                    placeholder="🔍 Buscar permisos..." 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
                
                {visibleGroups.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                        <p>No tienes permisos disponibles para asignar.</p>
                    </div>
                ) : (
                    <ul className="permission-tree__list">
                        {visibleGroups.map(node => (
                            <PermissionNode 
                                key={node.id} 
                                node={node}
                                onToggle={handleToggle}
                                onPermissionChange={handlePermissionChange}
                                onModuleChange={handleModuleChange}
                                userPermissions={userPermissions}
                            />
                        ))}
                    </ul>
                )}
            </div>
            
            <div className="action-bar" style={{justifyContent: 'start', marginTop: '20px'}}>
                <PermissionGuard permission="permisos_asignar">
                    <button onClick={handleSaveChanges} className="button button-primary">
                        Guardar Cambios
                    </button>
                </PermissionGuard>
                <button onClick={() => navigate('/dashboard/roles')} className="button">
                    Cancelar
                </button>
            </div>
        </div>
    );
}

export default GestionPermisos;