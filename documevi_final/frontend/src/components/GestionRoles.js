import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionRoles = () => {
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  
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
    <div>
      <div className="page-header">
        <h1>Gestión de Roles del Sistema</h1>
      </div>
      
      <div className="content-box">
        <h3>Crear Nuevo Rol</h3>
        <form onSubmit={handleCreate} className="action-bar">
          <input 
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Nombre del nuevo rol"
            required 
            style={{flexGrow: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px'}}
          />
          <button type="submit" className="button button-primary">Crear Rol</button>
        </form>
      </div>

      <h3>Roles Existentes</h3>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Nombre del Rol</th>
            <th>Acciones</th>
            <th>Permisos</th>
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
              <td className="action-cell">
                {editingRoleId === rol.id ? (
                  <>
                    <button onClick={() => handleUpdate(rol.id)} className="button button-primary">Guardar</button>
                    <button onClick={() => setEditingRoleId(null)} className="button">Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingRoleId(rol.id); setEditingRoleName(rol.nombre); }} className="button">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(rol.id)} className="button button-danger">
                      Eliminar
                    </button>
                  </>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                <Link to={`/dashboard/roles/${rol.id}/permisos`}>
                    Gestionar Permisos
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionRoles;