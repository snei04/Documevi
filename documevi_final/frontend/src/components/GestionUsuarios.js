import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const GestionUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/usuarios');
      setUsers(res.data);
    } catch (err) {
      setError('No se pudo cargar la lista de usuarios.');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    // Cargar los roles para el menú desplegable de edición
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        setRoles(res.data);
      } catch (err) {
        console.error('No se pudieron cargar los roles.');
      }
    };
    fetchRoles();
  }, [fetchUsers]);

  const handleUpdate = async (userId, dataToUpdate) => {
    try {
      await api.put(`/usuarios/${userId}`, dataToUpdate);
      alert('Usuario actualizado con éxito.');
      fetchUsers(); // Recargar la lista
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al actualizar el usuario.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Usuarios</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>Nombre Completo</th>
            <th>Email</th>
            <th>Documento</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.nombre_completo}</td>
              <td>{user.email}</td>
              <td>{user.documento}</td>
              <td>
                <select 
                  defaultValue={roles.find(r => r.nombre === user.rol)?.id}
                  onChange={(e) => handleUpdate(user.id, { rol_id: e.target.value })}
                >
                  {roles.map(rol => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
              </td>
              <td>{user.activo ? 'Activo' : 'Inactivo'}</td>
              <td>
                <button onClick={() => handleUpdate(user.id, { activo: !user.activo })}>
                  {user.activo ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionUsuarios;