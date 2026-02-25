import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import PermissionGuard from './auth/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import './Dashboard.css';

const WorkflowDetalle = () => {
    const { id } = useParams();
    const [workflow, setWorkflow] = useState(null);
    const [pasos, setPasos] = useState([]);
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({
        nombre_paso: '',
        orden: '',
        id_rol_responsable: '',
        requiere_firma: false
    });
    const [error, setError] = useState('');

    // Estado para edición de pasos
    const [editingPaso, setEditingPaso] = useState(null);
    const [editForm, setEditForm] = useState({
        nombre_paso: '',
        orden: '',
        id_rol_responsable: '',
        requiere_firma: false
    });

    // Estado para confirmación de eliminación
    const [deletingPaso, setDeletingPaso] = useState(null);

    const { hasPermission } = usePermissions();

    const fetchPasos = useCallback(async () => {
        try {
            const res = await api.get(`/workflows/${id}/pasos`);
            setPasos(res.data);
        } catch (err) {
            setError('No se pudo cargar los pasos del workflow.');
        }
    }, [id]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resWf, resRoles] = await Promise.all([
                    api.get(`/workflows/${id}`),
                    api.get('/roles')
                ]);
                setWorkflow(resWf.data);
                setRoles(resRoles.data);
                fetchPasos();
            } catch (err) {
                setError('Error al cargar datos iniciales.');
            }
        };
        fetchInitialData();
    }, [id, fetchPasos]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post(`/workflows/${id}/pasos`, formData);
            toast.success('Paso creado con éxito');
            setFormData({ nombre_paso: '', orden: '', id_rol_responsable: '', requiere_firma: false });
            fetchPasos();
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear el paso.');
        }
    };

    // --- Editar paso ---
    const handleStartEditPaso = (paso) => {
        setEditingPaso(paso.id);
        setEditForm({
            nombre_paso: paso.nombre_paso,
            orden: paso.orden,
            id_rol_responsable: paso.id_rol_responsable,
            requiere_firma: !!paso.requiere_firma
        });
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveEditPaso = async () => {
        try {
            await api.put(`/workflows/${id}/pasos/${editingPaso}`, editForm);
            toast.success('Paso actualizado con éxito.');
            setEditingPaso(null);
            fetchPasos();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar el paso.');
        }
    };

    const handleCancelEditPaso = () => {
        setEditingPaso(null);
    };

    // --- Eliminar paso ---
    const handleDeletePaso = async (id_paso) => {
        try {
            await api.delete(`/workflows/${id}/pasos/${id_paso}`);
            toast.success('Paso eliminado con éxito.');
            setDeletingPaso(null);
            fetchPasos();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al eliminar el paso.');
        }
    };

    const showPasoActions = hasPermission('workflows_editar') || hasPermission('workflows_eliminar');

    if (!workflow) return <div>Cargando...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Detalle de Workflow: {workflow.nombre}</h1>
                    <p style={{ color: '#718096' }}>{workflow.descripcion}</p>
                </div>
                <Link
                    to="/dashboard/workflows"
                    className="button"
                    style={{ textDecoration: 'none', padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#2d3748' }}
                >
                    ← Volver al listado
                </Link>
            </div>

            <PermissionGuard permission="workflows_crear">
                <div className="content-box">
                    <h3>Añadir Nuevo Paso</h3>
                    <form onSubmit={handleSubmit} className="action-bar" style={{ flexWrap: 'wrap' }}>
                        <input type="number" name="orden" placeholder="Orden (ej. 1)" value={formData.orden} onChange={handleChange} required />
                        <input type="text" name="nombre_paso" placeholder="Nombre del Paso" value={formData.nombre_paso} onChange={handleChange} required />
                        <select name="id_rol_responsable" value={formData.id_rol_responsable} onChange={handleChange} required>
                            <option value="">-- Asignar a Rol --</option>
                            {roles.map(rol => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
                        </select>
                        <label>
                            <input
                                type="checkbox"
                                name="requiere_firma"
                                checked={formData.requiere_firma}
                                onChange={handleChange}
                            />
                            ¿Requiere Firma?
                        </label>
                        <button type="submit" className="button button-primary">Añadir Paso</button>
                    </form>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </div>
            </PermissionGuard>

            <h3>Pasos del Workflow</h3>
            {pasos.length === 0 ? (
                <div className="content-box">
                    <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>
                        No hay pasos definidos para este workflow.
                    </p>
                </div>
            ) : (
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>Nombre del Paso</th>
                            <th>Rol Responsable</th>
                            <th>Requiere Firma</th>
                            {showPasoActions && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {pasos.map(paso => (
                            <tr key={paso.id}>
                                {editingPaso === paso.id ? (
                                    <>
                                        <td>
                                            <input
                                                type="number"
                                                name="orden"
                                                value={editForm.orden}
                                                onChange={handleEditChange}
                                                style={{ width: '60px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                name="nombre_paso"
                                                value={editForm.nombre_paso}
                                                onChange={handleEditChange}
                                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                name="id_rol_responsable"
                                                value={editForm.id_rol_responsable}
                                                onChange={handleEditChange}
                                                style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            >
                                                <option value="">-- Asignar a Rol --</option>
                                                {roles.map(rol => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                name="requiere_firma"
                                                checked={editForm.requiere_firma}
                                                onChange={handleEditChange}
                                            />
                                        </td>
                                        {showPasoActions && (
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button
                                                        onClick={handleSaveEditPaso}
                                                        className="button"
                                                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#c6f6d5', color: '#22543d', border: '1px solid #9ae6b4' }}
                                                    >
                                                        ✅ Guardar
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEditPaso}
                                                        className="button"
                                                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#e2e8f0', color: '#4a5568', border: '1px solid #cbd5e0' }}
                                                    >
                                                        ✕ Cancelar
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <td>{paso.orden}</td>
                                        <td>{paso.nombre_paso}</td>
                                        <td>{paso.nombre_rol}</td>
                                        <td>{paso.requiere_firma ? 'Sí' : 'No'}</td>
                                        {showPasoActions && (
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <PermissionGuard permission="workflows_editar">
                                                        <button
                                                            onClick={() => handleStartEditPaso(paso)}
                                                            className="button"
                                                            style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fefcbf', color: '#744210', border: '1px solid #f6e05e' }}
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                    </PermissionGuard>
                                                    <PermissionGuard permission="workflows_eliminar">
                                                        <button
                                                            onClick={() => setDeletingPaso(paso)}
                                                            className="button"
                                                            style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fed7d7', color: '#c53030', border: '1px solid #feb2b2' }}
                                                        >
                                                            🗑️ Eliminar
                                                        </button>
                                                    </PermissionGuard>
                                                </div>
                                            </td>
                                        )}
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Modal de confirmación de eliminación de paso */}
            {deletingPaso && (
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
                            <h3 style={{ margin: '10px 0', color: '#c53030' }}>Eliminar Paso</h3>
                        </div>
                        <p style={{ color: '#4a5568', fontSize: '0.95em', textAlign: 'center' }}>
                            ¿Está seguro de que desea eliminar el paso <strong>"{deletingPaso.nombre_paso}"</strong> (Orden: {deletingPaso.orden})?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button
                                className="button"
                                onClick={() => setDeletingPaso(null)}
                                style={{ backgroundColor: '#e2e8f0', color: '#2d3748', padding: '8px 20px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-danger"
                                onClick={() => handleDeletePaso(deletingPaso.id)}
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

export default WorkflowDetalle;