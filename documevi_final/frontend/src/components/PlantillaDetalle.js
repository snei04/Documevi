import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import PermissionGuard from './auth/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import './Dashboard.css';

// Componente para gestionar los detalles de una plantilla y sus campos
const PlantillaDetalle = () => {
    const { id } = useParams();
    const [plantilla, setPlantilla] = useState(null);
    const [campos, setCampos] = useState([]);
    const [newCampo, setNewCampo] = useState({
        nombre_campo: '',
        tipo_campo: 'texto',
        orden: ''
    });

    // Estado para edición de campos
    const [editingCampo, setEditingCampo] = useState(null);
    const [editForm, setEditForm] = useState({
        nombre_campo: '',
        tipo_campo: 'texto',
        orden: ''
    });

    // Estado para confirmación de eliminación
    const [deletingCampo, setDeletingCampo] = useState(null);

    const { hasPermission } = usePermissions();

    // Función para obtener los datos de la plantilla
    const fetchPlantillaData = useCallback(async () => {
        try {
            const res = await api.get(`/plantillas/${id}`);
            setPlantilla(res.data);
            setCampos(res.data.campos || []);
        } catch (err) {
            toast.error('No se pudo cargar la información de la plantilla.');
        }
    }, [id]);

    useEffect(() => {
        fetchPlantillaData();
    }, [fetchPlantillaData]);

    const handleChange = (e) => {
        setNewCampo({ ...newCampo, [e.target.name]: e.target.value });
    };

    // Función para manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/plantillas/${id}/campos`, newCampo);
            toast.success('Campo añadido a la plantilla con éxito.');
            setNewCampo({ nombre_campo: '', tipo_campo: 'texto', orden: '' });
            fetchPlantillaData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al añadir el campo.');
        }
    };

    // --- Editar campo ---
    const handleStartEdit = (campo) => {
        setEditingCampo(campo.id);
        setEditForm({
            nombre_campo: campo.nombre_campo,
            tipo_campo: campo.tipo_campo,
            orden: campo.orden
        });
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async () => {
        try {
            await api.put(`/plantillas/${id}/campos/${editingCampo}`, editForm);
            toast.success('Campo actualizado con éxito.');
            setEditingCampo(null);
            fetchPlantillaData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar el campo.');
        }
    };

    const handleCancelEdit = () => {
        setEditingCampo(null);
    };

    // --- Eliminar campo ---
    const handleDelete = async (id_campo) => {
        try {
            await api.delete(`/plantillas/${id}/campos/${id_campo}`);
            toast.success('Campo eliminado con éxito.');
            setDeletingCampo(null);
            fetchPlantillaData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al eliminar el campo.');
        }
    };

    const showActions = hasPermission('plantillas_editar') || hasPermission('plantillas_eliminar');

    if (!plantilla) return <div>Cargando plantilla...</div>;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Administrar Campos para Plantilla: "{plantilla.nombre}"</h1>
                    <p style={{ color: '#718096' }}>{plantilla.descripcion}</p>
                </div>
                <Link
                    to="/dashboard/plantillas"
                    className="button"
                    style={{ textDecoration: 'none', padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#2d3748' }}
                >
                    ← Volver al listado
                </Link>
            </div>

            <PermissionGuard permission="plantillas_editar">
                <div className="content-box">
                    <h3>Añadir Nuevo Campo</h3>
                    <form onSubmit={handleSubmit} className="action-bar" style={{ flexWrap: 'wrap' }}>
                        <input
                            type="number"
                            name="orden"
                            value={newCampo.orden}
                            onChange={handleChange}
                            placeholder="Orden (ej. 1)"
                            required
                            style={{ width: '100px' }}
                        />
                        <input
                            type="text"
                            name="nombre_campo"
                            value={newCampo.nombre_campo}
                            onChange={handleChange}
                            placeholder="Nombre del Campo (ej. Nombre Contratista)"
                            required
                            style={{ flexGrow: 1 }}
                        />
                        <select name="tipo_campo" value={newCampo.tipo_campo} onChange={handleChange}>
                            <option value="texto">Texto</option>
                            <option value="numero">Número</option>
                            <option value="fecha">Fecha</option>
                        </select>
                        <button type="submit" className="button button-primary">Añadir Campo</button>
                    </form>
                </div>
            </PermissionGuard>

            <h3>Campos Existentes en la Plantilla</h3>
            {campos.length === 0 ? (
                <div className="content-box">
                    <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>
                        No hay campos definidos para esta plantilla.
                    </p>
                </div>
            ) : (
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>Nombre del Campo</th>
                            <th>Tipo</th>
                            {showActions && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {campos.map(campo => (
                            <tr key={campo.id}>
                                {editingCampo === campo.id ? (
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
                                                name="nombre_campo"
                                                value={editForm.nombre_campo}
                                                onChange={handleEditChange}
                                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                name="tipo_campo"
                                                value={editForm.tipo_campo}
                                                onChange={handleEditChange}
                                                style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                            >
                                                <option value="texto">Texto</option>
                                                <option value="numero">Número</option>
                                                <option value="fecha">Fecha</option>
                                            </select>
                                        </td>
                                        {showActions && (
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
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
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <td>{campo.orden}</td>
                                        <td>{campo.nombre_campo}</td>
                                        <td>{campo.tipo_campo}</td>
                                        {showActions && (
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <PermissionGuard permission="plantillas_editar">
                                                        <button
                                                            onClick={() => handleStartEdit(campo)}
                                                            className="button"
                                                            style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fefcbf', color: '#744210', border: '1px solid #f6e05e' }}
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                    </PermissionGuard>
                                                    <PermissionGuard permission="plantillas_eliminar">
                                                        <button
                                                            onClick={() => setDeletingCampo(campo)}
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

            {/* Modal de confirmación de eliminación */}
            {deletingCampo && (
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
                            <h3 style={{ margin: '10px 0', color: '#c53030' }}>Eliminar Campo</h3>
                        </div>
                        <p style={{ color: '#4a5568', fontSize: '0.95em', textAlign: 'center' }}>
                            ¿Está seguro de que desea eliminar el campo <strong>"{deletingCampo.nombre_campo}"</strong>?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button
                                className="button"
                                onClick={() => setDeletingCampo(null)}
                                style={{ backgroundColor: '#e2e8f0', color: '#2d3748', padding: '8px 20px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-danger"
                                onClick={() => handleDelete(deletingCampo.id)}
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

export default PlantillaDetalle;