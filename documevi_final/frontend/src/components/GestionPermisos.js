// En: src/components/GestionPermisos.js (NUEVA VERSIÓN COMPLETA)

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import PermissionGuard from './auth/PermissionGuard';
import { usePermissionTree } from '../hooks/usePermissionTree'; // El nuevo hook
import './PermissionTree.css'; // Los nuevos estilos

// Componente recursivo para renderizar los nodos del árbol
const PermissionNode = ({ node, level = 0, onToggle, onPermissionChange, onGroupChange }) => {
    
    // Calcula si el checkbox de un grupo debe estar marcado, indeterminado o desmarcado
    const groupCheckState = useMemo(() => {
        if (!node.children || node.children.length === 0) return 'unchecked';
        const permissions = node.children.map(c => c.permissions.enabled);
        if (permissions.every(p => p)) return 'checked';
        if (permissions.some(p => p)) return 'indeterminate';
        return 'unchecked';
    }, [node.children]);

    // Renderiza un NODO DE GRUPO (ej. 'Expedientes')
    if (level === 0) {
        return (
            <li className={`permission-tree__node permission-tree__node--${node.expanded ? 'expanded' : 'collapsed'}`}>
                <div className="permission-tree__node-content" onClick={() => onToggle(node.id)}>
                    <span className="permission-tree__toggle">{node.expanded ? '[-]' : '[+]'}</span>
                    <span className="permission-tree__icon">{node.icon}</span>
                    <span className="permission-tree__name">{node.name}</span>
                    <label className="permission-tree__action-label" style={{ marginLeft: 'auto' }} onClick={(e) => { e.stopPropagation(); onGroupChange(node.id) }}>
                        <span className="permission-tree__checkbox" data-state={groupCheckState}></span>
                        <strong>(Marcar Todo)</strong>
                    </label>
                </div>
                {node.children && (
                    <ul className="permission-tree__children-list">
                        {node.children.map(child => <PermissionNode key={child.id} node={child} level={level + 1} {...{ onToggle, onPermissionChange, onGroupChange }} />)}
                    </ul>
                )}
            </li>
        );
    }

    // Renderiza un NODO DE PERMISO (ej. 'crear_expedientes')
    return (
        <li>
            <div className="permission-tree__node-content" style={{ paddingLeft: `calc(var(--pt-spacing) * 4 * ${level})` }}>
                <span className="permission-tree__icon">{node.icon}</span>
                <label className="permission-tree__action-label" onClick={() => onPermissionChange(node.id)}>
                    <span className="permission-tree__checkbox" data-state={node.permissions.enabled ? 'checked' : 'unchecked'}></span>
                    <span className="permission-tree__name">{node.name}</span>
                </label>
            </div>
        </li>
    );
};

// Componente Principal que exportamos
const GestionPermisos = () => {
    const { id_rol } = useParams();
    const navigate = useNavigate();
    
    // Estados para cargar los datos iniciales
    const [initialData, setInitialData] = useState(null);
    const [initialRolePerms, setInitialRolePerms] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Carga de datos
    useEffect(() => {
        const loadData = async () => {
            try {
                const [resTree, resRolePerms, resRoles] = await Promise.all([
                    api.get('/permisos/tree'), // Llamamos al nuevo endpoint del árbol
                    api.get(`/permisos/rol/${id_rol}`),
                    api.get('/roles')
                ]);
                
                setInitialData(resTree.data);
                setInitialRolePerms(resRolePerms.data);
                
                const currentRole = resRoles.data.find(r => r.id === parseInt(id_rol));
                if (currentRole) setRoleName(currentRole.nombre);

            } catch (err) {
                toast.error("Error al cargar la estructura de permisos.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id_rol]);
    
    // Si los datos iniciales no han cargado, mostramos un loader
    if (isLoading || !initialData || !initialRolePerms) {
        return <div>Cargando permisos...</div>;
    }

    return <PermissionTreeEditor initialData={initialData} initialRolePerms={initialRolePerms} roleName={roleName} />;
};

// Componente interno para separar la lógica de carga de la lógica del árbol
const PermissionTreeEditor = ({ initialData, initialRolePerms, roleName }) => {
    const { id_rol } = useParams();
    const navigate = useNavigate();

    const { 
        tree, setSearchTerm, handleToggle, handlePermissionChange, handleGroupChange, getSelectedPermissionIds 
    } = usePermissionTree(initialData, initialRolePerms);
    
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

    return (
        <div>
            <div className="page-header">
                <h1>Gestionar Permisos para el Rol: "{roleName}"</h1>
            </div>
            
            <div className="permission-tree">
                <input 
                    className="permission-tree__search" 
                    type="text" 
                    placeholder="🔍 Buscar permisos..." 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
                <ul className="permission-tree__list">
                    {tree.children?.map(node => (
                        <PermissionNode 
                            key={node.id} 
                            node={node}
                            onToggle={handleToggle}
                            onPermissionChange={handlePermissionChange}
                            onGroupChange={handleGroupChange}
                        />
                    ))}
                </ul>
            </div>
            
            <div className="action-bar" style={{justifyContent: 'start', marginTop: '20px'}}>
                <PermissionGuard permission="gestionar_roles_permisos">
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