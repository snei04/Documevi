import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import PermissionGuard from './auth/PermissionGuard';
import { usePermissionTree } from '../hooks/usePermissionTree';
import './PermissionTree.css';

// --- COMPONENTE INTERNO RECURSIVO ---
// Se encarga de dibujar cada "fila" del árbol.
const PermissionNode = ({ node, level = 0, onToggle, onPermissionChange, onModuleChange }) => {
    
    // Calcula el estado del checkbox de un MÓDULO (ej. 'Dependencias')
    const moduleCheckState = useMemo(() => {
        if (!node.permissions) return 'unchecked';
        const actions = Object.values(node.permissions).map(p => p.enabled);
        if (actions.length === 0) return 'unchecked';
        if (actions.every(p => p)) return 'checked';
        if (actions.some(p => p)) return 'indeterminate';
        return 'unchecked';
    }, [node.permissions]);

    // Renderiza un NODO DE GRUPO (Nivel 0, ej. 'Parametrización')
    if (level === 0) {
        return (
            <li className={`permission-tree__node permission-tree__node--${node.expanded ? 'expanded' : 'collapsed'}`}>
                <div className="permission-tree__node-content" onClick={() => onToggle(node.id)}>
                    <span className="permission-tree__toggle">{node.expanded ? '[-]' : '[+]'}</span>
                    <span className="permission-tree__icon">{node.icon}</span>
                    <span className="permission-tree__name">{node.name}</span>
                </div>
                {node.children && (
                    <ul className="permission-tree__children-list">
                        {node.children.map(child => <PermissionNode key={child.id} node={child} level={level + 1} {...{ onToggle, onPermissionChange, onModuleChange }} />)}
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
                {Object.entries(node.permissions).map(([action, { id, enabled, descripcion }]) => (
                    <label key={id} className="permission-tree__action-label" onClick={() => onPermissionChange(node.id, action)} title={descripcion || action}>
                        <span className="permission-tree__checkbox" data-state={enabled ? 'checked' : 'unchecked'}></span>
                        <span>{action}</span>
                    </label>
                ))}
            </div>
        </li>
    );
};


// --- COMPONENTE PRINCIPAL (CARGA DE DATOS) ---
const GestionPermisos = () => {
    const { id_rol } = useParams();
    
    const [initialData, setInitialData] = useState(null);
    const [initialRolePerms, setInitialRolePerms] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [resTree, resRolePerms, resRoles] = await Promise.all([
                    api.get('/permisos/tree'),
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
    
    if (isLoading || !initialData || !initialRolePerms) {
        return <div>Cargando permisos...</div>;
    }

    return <PermissionTreeEditor initialData={initialData} initialRolePerms={initialRolePerms} roleName={roleName} />;
};


// --- COMPONENTE EDITOR (MANEJO DE LA UI) ---
const PermissionTreeEditor = ({ initialData, initialRolePerms, roleName }) => {
    const { id_rol } = useParams();
    const navigate = useNavigate();

    const { 
        tree, setSearchTerm, handleToggle, handlePermissionChange, handleModuleChange, getSelectedPermissionIds 
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
                            onModuleChange={handleModuleChange}
                        />
                    ))}
                </ul>
            </div>
            
            <div className="action-bar" style={{justifyContent: 'start', marginTop: '20px'}}>
                <PermissionGuard permission="roles_editar">
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