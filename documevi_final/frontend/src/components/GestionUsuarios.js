import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionUsuarios = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
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
      toast.error('No se pudo cargar la lista de usuarios.');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
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
      return toast.warn("Por favor, seleccione un rol para el nuevo usuario.");
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
    <div>
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
      </div>
      
      <div className="action-bar">
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="button button-primary">
          {showCreateForm ? 'Cancelar' : 'Invitar Nuevo Usuario'}
        </button>
      </div>

      {showCreateForm && (
        <div className="content-box">
          <h3>Formulario de Invitación</h3>
          <form onSubmit={handleInviteUser}>
            <div className="form-grid">
              <input type="text" name="nombre_completo" placeholder="Nombre Completo" value={newUser.nombre_completo} onChange={handleNewUserChange} required />
              <input type="email" name="email" placeholder="Email" value={newUser.email} onChange={handleNewUserChange} required />
              <input type="text" name="documento" placeholder="Documento" value={newUser.documento} onChange={handleNewUserChange} required />
            </div>
            <div className="action-bar" style={{ justifyContent: 'start', marginTop: '1rem' }}>
              <select name="rol_id" value={newUser.rol_id} onChange={handleNewUserChange} required>
                <option value="">-- Seleccione un Rol --</option>
                {roles.map(rol => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
              </select>
              <button type="submit" className="button button-primary">Enviar Invitación</button>
            </div>
          </form>
        </div>
      )}

      <h3>Usuarios Existentes</h3>
      <table className="styled-table">
        <thead>
          <tr>
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
                  value={roles.find(r => r.nombre === user.rol)?.id || ''}
                  onChange={(e) => handleUpdate(user.id, { rol_id: e.target.value })}
                >
                  {roles.map(rol => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
              </td>
              <td>
                <span className={`status ${user.activo ? 'status-active' : 'status-inactive'}`}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="action-cell">
                <button onClick={() => handleUpdate(user.id, { activo: !user.activo })} className="button">
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