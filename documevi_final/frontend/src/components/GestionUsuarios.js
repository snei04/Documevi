import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const GestionUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [newUser, setNewUser] = useState({
    nombre_completo: '',
    email: '',
    documento: '',
    rol_id: ''
  });

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
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        setRoles(res.data);
      } catch (err)
 {
        console.error('No se pudieron cargar los roles.');
      }
    };
    fetchRoles();
  }, [fetchUsers]);

  const handleUpdate = async (userId, dataToUpdate) => {
    try {
      await api.put(`/usuarios/${userId}`, dataToUpdate);
      toast.success('Usuario actualizado con éxito.');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al actualizar el usuario.');
    }
  };

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!newUser.rol_id) {
      toast.success("Por favor, seleccione un rol para el nuevo usuario.");
      return;
    }
    try {
      await api.post('/usuarios/invite', newUser);
      toast.success('Invitación enviada con éxito.');
      setShowCreateForm(false);
      setNewUser({ nombre_completo: '', email: '', documento: '', rol_id: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al enviar la invitación.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Usuarios</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ marginBottom: '20px' }}>
        {showCreateForm ? 'Cancelar' : 'Invitar Nuevo Usuario'}
      </button>

      {showCreateForm && (
        <form onSubmit={handleInviteUser} style={{ marginBottom: '40px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <h3>Formulario de Invitación</h3>
          <input type="text" name="nombre_completo" placeholder="Nombre Completo" value={newUser.nombre_completo} onChange={handleNewUserChange} required />
          <input type="email" name="email" placeholder="Email" value={newUser.email} onChange={handleNewUserChange} required style={{ marginLeft: '10px' }} />
          <input type="text" name="documento" placeholder="Documento" value={newUser.documento} onChange={handleNewUserChange} required style={{ marginLeft: '10px' }} />
          <select name="rol_id" value={newUser.rol_id} onChange={handleNewUserChange} required style={{ marginLeft: '10px' }}>
            <option value="">-- Seleccione un Rol --</option>
            {roles.map(rol => (
              <option key={rol.id} value={rol.id}>{rol.nombre}</option>
            ))}
          </select>
          <button type="submit" style={{ marginLeft: '10px' }}>Enviar Invitación</button>
        </form>
      )}

      <h3>Usuarios Existentes</h3>
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
                  value={roles.find(r => r.nombre === user.rol)?.id}
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