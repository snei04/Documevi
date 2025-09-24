import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import './Dashboard.css';

Modal.setAppElement('#root');

const GestionSubseries = () => {
    const { series, subseries, refreshSubseries } = useOutletContext();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSubserie, setNewSubserie] = useState({
        codigo_subserie: '',
        nombre_subserie: '',
        id_serie: '',
        retencion_gestion: '',
        retencion_central: '',
        disposicion_final: ''
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSubserie, setEditingSubserie] = useState(null);

    // --- MANEJADORES ---
    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => setIsCreateModalOpen(false);
    const openEditModal = (subserie) => {
        setEditingSubserie({ ...subserie });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => setIsEditModalOpen(false);

    const handleCreateChange = (e) => setNewSubserie({ ...newSubserie, [e.target.name]: e.target.value });
    const handleEditChange = (e) => setEditingSubserie({ ...editingSubserie, [e.target.name]: e.target.value });

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subseries', newSubserie);
            toast.success('Subserie creada con éxito.');
            closeCreateModal();
            refreshSubseries();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear la subserie.');
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/subseries/${editingSubserie.id}`, editingSubserie);
            toast.success('Subserie actualizada con éxito.');
            closeEditModal();
            refreshSubseries();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar.');
        }
    };

    const handleToggleStatus = async (id, estadoActual) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (window.confirm(`¿Estás seguro de que quieres ${accion} esta subserie?`)) {
            try {
                await api.patch(`/subseries/${id}/toggle-status`);
                toast.success('Estado actualizado.');
                refreshSubseries();
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cambiar el estado.');
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Subseries (TRD)</h1>
                <button onClick={openCreateModal} className="button button-primary">Crear Nueva Subserie</button>
            </div>

            <div className="content-box">
                <h3>Subseries Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre de la Subserie</th>
                            <th>Serie a la que Pertenece</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subseries && subseries.map(sub => (
                            <tr key={sub.id} className={!sub.activo ? 'inactive-row' : ''}>
                                <td>{sub.codigo_subserie}</td>
                                <td>{sub.nombre_subserie}</td>
                                <td>{sub.nombre_serie}</td>
                                <td>
                                    <span className={sub.activo ? 'status-active' : 'status-inactive'}>
                                        {sub.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <button onClick={() => openEditModal(sub)} className="button">Editar</button>
                                    <button onClick={() => handleToggleStatus(sub.id, sub.activo)} className={`button ${sub.activo ? 'button-danger' : 'button-success'}`}>
                                        {sub.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Modales --- */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Subserie</h2>
                <form onSubmit={handleCreateSubmit}>
                    <div className="form-group">
                        <label>Serie a la que Pertenece</label>
                        <select name="id_serie" value={newSubserie.id_serie} onChange={handleCreateChange} required>
                            <option value="">-- Seleccione una Serie --</option>
                            {series.map(s => s.activo && <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Código de la Subserie</label>
                        <input type="text" name="codigo_subserie" value={newSubserie.codigo_subserie} onChange={handleCreateChange} required />
                    </div>
                    <div className="form-group">
                        <label>Nombre de la Subserie</label>
                        <input type="text" name="nombre_subserie" value={newSubserie.nombre_subserie} onChange={handleCreateChange} required />
                    </div>
                    {/* Campos adicionales de retención */}
                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="modal-overlay">
                <h2>Editar Subserie</h2>
                {editingSubserie && (
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="form-group">
                            <label>Serie</label>
                            <select name="id_serie" value={editingSubserie.id_serie} onChange={handleEditChange} required>
                                {series.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Código</label>
                            <input type="text" name="codigo_subserie" value={editingSubserie.codigo_subserie} onChange={handleEditChange} required />
                        </div>
                        <div className="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre_subserie" value={editingSubserie.nombre_subserie} onChange={handleEditChange} required />
                        </div>
                        <div className="modal-actions">
                            <button type="submit" className="button button-primary">Guardar Cambios</button>
                            <button type="button" onClick={closeEditModal} className="button">Cancelar</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default GestionSubseries;