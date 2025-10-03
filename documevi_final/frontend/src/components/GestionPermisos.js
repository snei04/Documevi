import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

// 1. Importamos el guardián de permisos
import PermissionGuard from '../components/auth/PermissionGuard';

import Checkbox from './Checkbox';
import './Dashboard.css';

const GestionPermisos = () => {
    const { id_rol } = useParams();
    const navigate = useNavigate();
    const [allPermissions, setAllPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [roleName, setRoleName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [resAllPerms, resRolePerms, resRoles] = await Promise.all([
                api.get('/permisos'),
                api.get(`/permisos/rol/${id_rol}`),
                api.get('/roles')
            ]);
            
            setAllPermissions(resAllPerms.data);

            // ✅ MEJORA: Nos aseguramos de que el estado solo contenga los IDs,
            // incluso si la API devuelve objetos completos.
            // Asumimos que la API devuelve [{id_permiso: 1}, {id_permiso: 2}] o similar.
            setRolePermissions(resRolePerms.data.map(p => p.id_permiso || p.id));
            
            const currentRole = resRoles.data.find(r => r.id === parseInt(id_rol));
            if (currentRole) {
                setRoleName(currentRole.nombre);
            }

        } catch (err) {
            toast.error('Error al cargar los datos de permisos.');
        } finally {
            setIsLoading(false);
        }
    }, [id_rol]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCheckboxChange = (permissionId) => {
        setRolePermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSaveChanges = async () => {
        try {
            // El backend espera un objeto con la clave "permisosIds"
            await api.put(`/permisos/rol/${id_rol}`, { permisosIds: rolePermissions });
            toast.success('Permisos actualizados con éxito.');
            navigate('/dashboard/roles');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al guardar los cambios.');
        }
    };

    if (isLoading) return <div>Cargando permisos...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Gestionar Permisos para el Rol: "{roleName}"</h1>
            </div>
            
            <div className="content-box">
                <h3>Permisos Disponibles</h3>
                <div className="permissions-grid">
                    {allPermissions.map(permission => (
                        <div key={permission.id} className="permission-item">
                            <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
                                <Checkbox
                                    checked={rolePermissions.includes(permission.id)}
                                    onChange={() => handleCheckboxChange(permission.id)}
                                />
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>{permission.nombre_permiso}</span>
                                    <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>
                                        {permission.descripcion || 'Sin descripción'}
                                    </p>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="action-bar" style={{justifyContent: 'start'}}>
                {/* 2. AQUÍ LA SEGURIDAD */}
                {/* El botón solo se renderiza si el usuario tiene el permiso 'gestionar_roles_permisos' */}
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
};

export default GestionPermisos;