import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

const GestionRoles = () => {
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');

  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRoleName, setEditingRoleName] = useState('');

  // Estado para confirmación de eliminación
  const [deletingRole, setDeletingRole] = useState(null);

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
    try {
      await api.delete(`/roles/${roleId}`);
      toast.success('Rol eliminado con éxito.');
      setDeletingRole(null);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al eliminar el rol.');
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

      <PermissionGuard permission="roles_crear">
        <div className="content-box">
          <h3>Crear Nuevo Rol</h3>
          <form onSubmit={handleCreate} className="action-bar">
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Nombre del nuevo rol"
              required
              style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            <button type="submit" className="button button-primary">Crear Rol</button>
          </form>
        </div>
      </PermissionGuard>

      <h3>Roles Existentes</h3>
      {roles.length === 0 ? (
        <div className="content-box">
          <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>
            No hay roles registrados.
          </p>
        </div>
      ) : (
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
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                    />
                  ) : (
                    rol.nombre
                  )}
                </td>
                <td>
                  {editingRoleId === rol.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleUpdate(rol.id)}
                        className="button"
                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#c6f6d5', color: '#22543d', border: '1px solid #9ae6b4' }}
                      >
                        ✅ Guardar
                      </button>
                      <button
                        onClick={() => setEditingRoleId(null)}
                        className="button"
                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#e2e8f0', color: '#4a5568', border: '1px solid #cbd5e0' }}
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <PermissionGuard permission="roles_editar">
                        <button
                          onClick={() => { setEditingRoleId(rol.id); setEditingRoleName(rol.nombre); }}
                          className="button"
                          style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fefcbf', color: '#744210', border: '1px solid #f6e05e' }}
                        >
                          ✏️ Editar
                        </button>
                      </PermissionGuard>
                      <PermissionGuard permission="roles_eliminar">
                        <button
                          onClick={() => setDeletingRole(rol)}
                          className="button"
                          style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fed7d7', color: '#c53030', border: '1px solid #feb2b2' }}
                        >
                          🗑️ Eliminar
                        </button>
                      </PermissionGuard>
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Link
                    to={`/dashboard/roles/${rol.id}/permisos`}
                    className="button"
                    style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8', textDecoration: 'none' }}
                  >
                    🔑 Gestionar Permisos
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de confirmación de eliminación */}
      {deletingRole && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '28px',
            maxWidth: '440px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '48px' }}>⚠️</span>
              <h3 style={{ margin: '10px 0', color: '#c53030' }}>Eliminar Rol</h3>
            </div>
            <p style={{ color: '#4a5568', fontSize: '0.95em', textAlign: 'center' }}>
              ¿Está seguro de que desea eliminar el rol <strong>"{deletingRole.nombre}"</strong>?
            </p>
            <p style={{ color: '#e53e3e', fontSize: '0.85em', textAlign: 'center', fontWeight: '500' }}>
              ⚠️ Los usuarios con este rol podrían perder sus permisos asignados.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button
                className="button"
                onClick={() => setDeletingRole(null)}
                style={{ backgroundColor: '#e2e8f0', color: '#2d3748', padding: '8px 20px' }}
              >
                Cancelar
              </button>
              <button
                className="button button-danger"
                onClick={() => handleDelete(deletingRole.id)}
                style={{ padding: '8px 20px' }}
              >
                🗑️ Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionRoles;