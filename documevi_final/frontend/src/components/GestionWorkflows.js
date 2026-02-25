import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import PermissionGuard from './auth/PermissionGuard';

import './Dashboard.css';

const GestionWorkflows = () => {
    const [workflows, setWorkflows] = useState([]);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });
    const [error, setError] = useState('');

    // Estado para edición
    const [editingWf, setEditingWf] = useState(null);
    const [editForm, setEditForm] = useState({ nombre: '', descripcion: '' });

    // Estado para confirmación de eliminación
    const [deletingWf, setDeletingWf] = useState(null);



    const fetchWorkflows = useCallback(async () => {
        try {
            const res = await api.get('/workflows');
            setWorkflows(res.data);
        } catch (err) {
            setError('No se pudieron cargar los flujos de trabajo.');
        }
    }, []);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/workflows', formData);
            toast.success('Workflow creado con éxito!');
            fetchWorkflows();
            setFormData({ nombre: '', descripcion: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear el workflow.');
        }
    };

    // --- Editar ---
    const handleStartEdit = (wf) => {
        setEditingWf(wf.id);
        setEditForm({ nombre: wf.nombre, descripcion: wf.descripcion || '' });
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async () => {
        try {
            await api.put(`/workflows/${editingWf}`, editForm);
            toast.success('Workflow actualizado con éxito.');
            setEditingWf(null);
            fetchWorkflows();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar el workflow.');
        }
    };

    const handleCancelEdit = () => {
        setEditingWf(null);
    };

    // --- Eliminar ---
    const handleDelete = async (id) => {
        try {
            await api.delete(`/workflows/${id}`);
            toast.success('Workflow eliminado con éxito.');
            setDeletingWf(null);
            fetchWorkflows();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al eliminar el workflow.');
        }
    };


    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Flujos de Trabajo (Workflows)</h1>
            </div>

            <PermissionGuard permission="workflows_crear">
                <div className="content-box">
                    <h3>Crear Nuevo Workflow</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                name="nombre"
                                placeholder="Nombre del Workflow"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                style={{ flexGrow: 1, padding: '0.5rem' }}
                            />
                            <input
                                type="text"
                                name="descripcion"
                                placeholder="Descripción del Workflow"
                                value={formData.descripcion}
                                onChange={handleChange}
                                style={{ flexGrow: 2, padding: '0.5rem' }}
                            />
                            <button type="submit" className="button button-primary">Crear</button>
                        </div>
                        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    </form>
                </div>
            </PermissionGuard>

            <h3>Workflows Existentes</h3>
            {workflows.length === 0 ? (
                <div className="content-box">
                    <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>
                        No hay workflows registrados.
                    </p>
                </div>
            ) : (
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workflows.map(wf => (
                            <tr key={wf.id}>
                                {editingWf === wf.id ? (
                                    <>
                                        <td>
                                            <input
                                                type="text"
                                                name="nombre"
                                                value={editForm.nombre}
                                                onChange={handleEditChange}
                                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="descripcion"
                                                value={editForm.descripcion}
                                                onChange={handleEditChange}
                                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="button"
                                                    style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#c6f6d5', color: '#22543d', border: '1px solid #9ae6b4' }}
                                                >
                                                    ✅ Guardar
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="button"
                                                    style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#e2e8f0', color: '#4a5568', border: '1px solid #cbd5e0' }}
                                                >
                                                    ✕ Cancelar
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{wf.nombre}</td>
                                        <td>{wf.descripcion}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <Link
                                                    to={`/dashboard/workflows/${wf.id}`}
                                                    className="button"
                                                    style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8', textDecoration: 'none' }}
                                                >
                                                    ⚙️ Administrar Pasos
                                                </Link>
                                                <PermissionGuard permission="workflows_editar">
                                                    <button
                                                        onClick={() => handleStartEdit(wf)}
                                                        className="button"
                                                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fefcbf', color: '#744210', border: '1px solid #f6e05e' }}
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard permission="workflows_eliminar">
                                                    <button
                                                        onClick={() => setDeletingWf(wf)}
                                                        className="button"
                                                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fed7d7', color: '#c53030', border: '1px solid #feb2b2' }}
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal de confirmación de eliminación */}
            {deletingWf && (
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
                            <h3 style={{ margin: '10px 0', color: '#c53030' }}>Eliminar Workflow</h3>
                        </div>
                        <p style={{ color: '#4a5568', fontSize: '0.95em', textAlign: 'center' }}>
                            ¿Está seguro de que desea eliminar el workflow <strong>"{deletingWf.nombre}"</strong>?
                        </p>
                        <p style={{ color: '#e53e3e', fontSize: '0.85em', textAlign: 'center', fontWeight: '500' }}>
                            ⚠️ Se eliminarán también todos los pasos asociados a este workflow.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button
                                className="button"
                                onClick={() => setDeletingWf(null)}
                                style={{ backgroundColor: '#e2e8f0', color: '#2d3748', padding: '8px 20px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-danger"
                                onClick={() => handleDelete(deletingWf.id)}
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

export default GestionWorkflows;