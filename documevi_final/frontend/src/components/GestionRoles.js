import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const GestionRoles = () => {
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  
  // Estados para la edición en línea
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRoleName, setEditingRoleName] = useState('');

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch (err) {
      toast.error('No se pudieron cargar los roles.');
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/roles', { nombre: newRoleName });
      toast.success('Rol creado con éxito.');
      setNewRoleName('');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al crear el rol.');
    }
  };

  const handleDelete = async (roleId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este rol?')) {
      try {
        await api.delete(`/roles/${roleId}`);
        toast.success('Rol eliminado con éxito.');
        fetchRoles();
      } catch (err) {
        toast.error(err.response?.data?.msg || 'Error al eliminar el rol.');
      }
    }
  };
  
  const handleUpdate = async (roleId) => {
    try {
      await api.put(`/roles/${roleId}`, { nombre: editingRoleName });
      toast.success('Rol actualizado con éxito.');
      setEditingRoleId(null);
      setEditingRoleName('');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al actualizar el rol.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Roles</h1>
      
      <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          placeholder="Nombre del nuevo rol"
          required 
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Crear Rol</button>
      </form>

      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Nombre del Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(rol => (
            <tr key={rol.id}>
              <td>
                {editingRoleId === rol.id ? (
                  <input 
                    type="text" 
                    value={editingRoleName} 
                    onChange={(e) => setEditingRoleName(e.target.value)}
                  />
                ) : (
                  rol.nombre
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {editingRoleId === rol.id ? (
                  <>
                    <button onClick={() => handleUpdate(rol.id)}>Guardar</button>
                    <button onClick={() => setEditingRoleId(null)} style={{marginLeft: '5px'}}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingRoleId(rol.id); setEditingRoleName(rol.nombre); }}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(rol.id)} style={{ marginLeft: '5px' }}>
                      Eliminar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionRoles;