import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

Modal.setAppElement('#root');

const GestionPlantillas = () => {
    // --- 1. ESTADOS DEL COMPONENTE ---
    const {
        dependencias, oficinas, series, subseries
    } = useOutletContext();

    const [plantillas, setPlantillas] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Estado para el nuevo formulario de creación
    const [newPlantilla, setNewPlantilla] = useState({
        nombre: '',
        descripcion: '',
        id_dependencia: '',
        id_oficina_productora: '',
        id_serie: '',
        id_subserie: ''
    });

    // Estados para los selectores filtrados
    const [filteredOficinas, setFilteredOficinas] = useState([]);
    const [filteredSeries, setFilteredSeries] = useState([]);
    const [filteredSubseries, setFilteredSubseries] = useState([]);

    // Estado para edición inline
    const [editingPlantilla, setEditingPlantilla] = useState(null);
    const [editForm, setEditForm] = useState({ nombre: '', descripcion: '' });

    // Estado para confirmación de eliminación
    const [deletingPlantilla, setDeletingPlantilla] = useState(null);


    // --- 2. LÓGICA DE CARGA Y REFRESCO DE DATOS ---
    const fetchPlantillas = useCallback(async () => {
        try {
            const res = await api.get('/plantillas');
            setPlantillas(res.data);
        } catch (err) {
            toast.error('No se pudieron cargar las plantillas.');
        }
    }, []);

    useEffect(() => {
        fetchPlantillas();
    }, [fetchPlantillas]);

    // --- 3. LÓGICA DE LOS FORMULARIOS Y MODALES ---
    const openCreateModal = () => {
        setNewPlantilla({
            nombre: '', descripcion: '', id_dependencia: '',
            id_oficina_productora: '', id_serie: '', id_subserie: ''
        });
        setFilteredOficinas([]);
        setFilteredSeries([]);
        setFilteredSubseries([]);
        setIsCreateModalOpen(true);
    };
    const closeCreateModal = () => setIsCreateModalOpen(false);

    // --- MANEJADORES DE LOS SELECTORES EN CASCADA ---
    const handleDependenciaChange = (e) => {
        const depId = e.target.value;
        setNewPlantilla(prev => ({ ...prev, id_dependencia: depId, id_oficina_productora: '', id_serie: '', id_subserie: '' }));
        setFilteredOficinas(oficinas.filter(o => o.id_dependencia === parseInt(depId) && o.activo));
        setFilteredSeries([]);
        setFilteredSubseries([]);
    };

    const handleOficinaChange = (e) => {
        const ofiId = e.target.value;
        setNewPlantilla(prev => ({ ...prev, id_oficina_productora: ofiId, id_serie: '', id_subserie: '' }));
        setFilteredSeries(series.filter(s => s.id_oficina_productora === parseInt(ofiId) && s.activo));
        setFilteredSubseries([]);
    };

    const handleSerieChange = (e) => {
        const serId = e.target.value;
        const serieSeleccionada = series.find(s => s.id === parseInt(serId));
        setNewPlantilla(prev => ({ ...prev, id_serie: serId, id_subserie: '' }));

        if (serieSeleccionada && !serieSeleccionada.requiere_subserie) {
            setFilteredSubseries([]);
        } else {
            setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(serId) && ss.activo));
        }
    };

    const handleChange = (e) => {
        setNewPlantilla(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/plantillas', newPlantilla);
            toast.success('Plantilla creada con éxito.');
            closeCreateModal();
            fetchPlantillas();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear la plantilla.');
        }
    };

    // --- Editar plantilla ---
    const handleStartEdit = (p) => {
        setEditingPlantilla(p.id);
        setEditForm({ nombre: p.nombre, descripcion: p.descripcion || '' });
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async () => {
        try {
            await api.put(`/plantillas/${editingPlantilla}`, editForm);
            toast.success('Plantilla actualizada con éxito.');
            setEditingPlantilla(null);
            fetchPlantillas();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar la plantilla.');
        }
    };

    const handleCancelEdit = () => {
        setEditingPlantilla(null);
    };

    // --- Eliminar plantilla ---
    const handleDelete = async (id) => {
        try {
            await api.delete(`/plantillas/${id}`);
            toast.success('Plantilla eliminada con éxito.');
            setDeletingPlantilla(null);
            fetchPlantillas();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al eliminar la plantilla.');
        }
    };

    // --- 4. RENDERIZADO DEL COMPONENTE ---
    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Plantillas</h1>
                <PermissionGuard permission="plantillas_crear">
                    <button onClick={openCreateModal} className="button button-primary">Crear Nueva Plantilla</button>
                </PermissionGuard>
            </div>

            <div className="content-box">
                <h3>Plantillas Existentes</h3>
                {plantillas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>
                        No hay plantillas registradas.
                    </p>
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
                            {plantillas.map(p => (
                                <tr key={p.id}>
                                    {editingPlantilla === p.id ? (
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
                                            <td>{p.nombre}</td>
                                            <td>{p.descripcion}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    <Link
                                                        to={`/dashboard/plantillas/${p.id}`}
                                                        className="button"
                                                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8', textDecoration: 'none' }}
                                                    >
                                                        📋 Administrar Campos
                                                    </Link>
                                                    <Link
                                                        to={`/dashboard/plantillas/${p.id}/disenar`}
                                                        className="button"
                                                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#e9d8fd', color: '#553c9a', border: '1px solid #d6bcfa', textDecoration: 'none' }}
                                                    >
                                                        🎨 Diseñar
                                                    </Link>
                                                    <PermissionGuard permission="plantillas_editar">
                                                        <button
                                                            onClick={() => handleStartEdit(p)}
                                                            className="button"
                                                            style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fefcbf', color: '#744210', border: '1px solid #f6e05e' }}
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                    </PermissionGuard>
                                                    <PermissionGuard permission="plantillas_eliminar">
                                                        <button
                                                            onClick={() => setDeletingPlantilla(p)}
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
            </div>

            {/* Modal crear plantilla */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Plantilla</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre de la Plantilla</label>
                        <input type="text" name="nombre" value={newPlantilla.nombre} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Descripción (opcional)</label>
                        <textarea name="descripcion" rows="2" value={newPlantilla.descripcion} onChange={handleChange}></textarea>
                    </div>

                    <hr />
                    <h4>Asignación TRD Obligatoria</h4>

                    <div className="form-group">
                        <label>Dependencia</label>
                        <select name="id_dependencia" value={newPlantilla.id_dependencia} onChange={handleDependenciaChange} required>
                            <option value="">-- Seleccione --</option>
                            {dependencias.map(d => d.activo && <option key={d.id} value={d.id}>{d.nombre_dependencia}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Oficina Productora</label>
                        <select name="id_oficina_productora" value={newPlantilla.id_oficina_productora} onChange={handleOficinaChange} required>
                            <option value="">-- Seleccione --</option>
                            {filteredOficinas.map(o => <option key={o.id} value={o.id}>{o.nombre_oficina}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Serie</label>
                        <select name="id_serie" value={newPlantilla.id_serie} onChange={handleSerieChange} required>
                            <option value="">-- Seleccione --</option>
                            {filteredSeries.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Subserie</label>
                        <select name="id_subserie" value={newPlantilla.id_subserie} onChange={handleChange}>
                            <option value="">-- Seleccione --</option>
                            {filteredSubseries.map(ss => <option key={ss.id} value={ss.id}>{ss.nombre_subserie}</option>)}
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear Plantilla</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>

            {/* Modal de confirmación de eliminación */}
            {deletingPlantilla && (
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
                            <h3 style={{ margin: '10px 0', color: '#c53030' }}>Eliminar Plantilla</h3>
                        </div>
                        <p style={{ color: '#4a5568', fontSize: '0.95em', textAlign: 'center' }}>
                            ¿Está seguro de que desea eliminar la plantilla <strong>"{deletingPlantilla.nombre}"</strong>?
                        </p>
                        <p style={{ color: '#e53e3e', fontSize: '0.85em', textAlign: 'center', fontWeight: '500' }}>
                            ⚠️ Se eliminarán también todos los campos y el diseño asociado.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button
                                className="button"
                                onClick={() => setDeletingPlantilla(null)}
                                style={{ backgroundColor: '#e2e8f0', color: '#2d3748', padding: '8px 20px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-danger"
                                onClick={() => handleDelete(deletingPlantilla.id)}
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

export default GestionPlantillas;