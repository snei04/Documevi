import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Checkbox from './Checkbox'; // <-- 1. Importar el nuevo componente
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
            setRolePermissions(resRolePerms.data);
            
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
                            <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                {/* 👇 2. Reemplazamos el input por el nuevo componente Checkbox 👇 */}
                                <Checkbox
                                    checked={rolePermissions.includes(permission.id)}
                                    onChange={() => handleCheckboxChange(permission.id)}
                                />
                                <span>{permission.nombre_permiso}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="action-bar" style={{justifyContent: 'start'}}>
                <button onClick={handleSaveChanges} className="button button-primary">
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default GestionPermisos;