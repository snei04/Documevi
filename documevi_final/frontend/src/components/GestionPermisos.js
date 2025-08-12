import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const GestionPermisos = () => {
    const { id_rol } = useParams(); // Obtenemos el ID del rol desde la URL
    const navigate = useNavigate();
    const [allPermissions, setAllPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [roleName, setRoleName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            // Hacemos todas las peticiones en paralelo para más eficiencia
            const [resAllPerms, resRolePerms, resRoles] = await Promise.all([
                api.get('/permisos'),
                api.get(`/permisos/rol/${id_rol}`),
                api.get('/roles') // Necesitamos el nombre del rol
            ]);
            
            setAllPermissions(resAllPerms.data);
            setRolePermissions(resRolePerms.data); // Esto es un array de IDs: [1, 3, 5]
            
            // Encontrar el nombre del rol actual
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            navigate('/dashboard/roles'); // Volvemos a la lista de roles
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al guardar los cambios.');
        }
    };

    if (isLoading) return <div>Cargando permisos...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Gestionar Permisos para el Rol: "{roleName}"</h1>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
                {allPermissions.map(permission => (
                    <div key={permission.id}>
                        <label>
                            <input
                                type="checkbox"
                                checked={rolePermissions.includes(permission.id)}
                                onChange={() => handleCheckboxChange(permission.id)}
                            />
                            {permission.nombre_permiso}
                        </label>
                    </div>
                ))}
            </div>
            <button onClick={handleSaveChanges} style={{ marginTop: '20px' }}>
                Guardar Cambios
            </button>
        </div>
    );
};

export default GestionPermisos;