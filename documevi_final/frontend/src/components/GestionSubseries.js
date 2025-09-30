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
        disposicion_final: 'Conservación Total',
        procedimientos: ''
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSubserie, setEditingSubserie] = useState(null);

    // --- MANEJADORES ---
    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setNewSubserie({
            codigo_subserie: '',
            nombre_subserie: '',
            id_serie: '',
            retencion_gestion: '',
            retencion_central: '',
            disposicion_final: 'Conservación Total',
            procedimientos: ''
        });
    };

    const openEditModal = (subserie) => {
        setEditingSubserie({ ...subserie });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingSubserie(null);
    };

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
                <h1>Gestión de Subseries Documentales (TRD)</h1>
                <button onClick={openCreateModal} className="button button-primary">Crear Nueva Subserie</button>
            </div>

            <div className="content-box">
                <h3>Subseries Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre Subserie</th>
                            <th>Serie a la que Pertenece</th>
                            <th>Retención (Gestión/Central)</th>
                            <th>Disposición Final</th>
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
                                <td>{`G: ${sub.retencion_gestion || 'N/A'}a, C: ${sub.retencion_central || 'N/A'}a`}</td>
                                <td>{sub.disposicion_final}</td>
                                <td>
                                    <span className={sub.activo ? 'status-active' : 'status-inactive'}>
                                        {sub.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <button onClick={() => openEditModal(sub)} className="button">Editar</button>
                                    <button 
                                        onClick={() => handleToggleStatus(sub.id, sub.activo)} 
                                        className={`button ${sub.activo ? 'button-danger' : 'button-success'}`}
                                    >
                                        {sub.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL CREAR --- */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Subserie</h2>
                <form onSubmit={handleCreateSubmit}>
                    <div className="form-group">
                        <label>Serie a la que Pertenece *</label>
                        <select name="id_serie" value={newSubserie.id_serie} onChange={handleCreateChange} required>
                            <option value="">-- Seleccione una Serie --</option>
                            {series && series.map(s => s.activo && (
                                <option key={s.id} value={s.id}>{s.nombre_serie}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Código de la Subserie *</label>
                        <input 
                            type="text" 
                            name="codigo_subserie" 
                            value={newSubserie.codigo_subserie} 
                            onChange={handleCreateChange} 
                            placeholder="Ej: 100.01"
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Nombre de la Subserie *</label>
                        <input 
                            type="text" 
                            name="nombre_subserie" 
                            value={newSubserie.nombre_subserie} 
                            onChange={handleCreateChange} 
                            placeholder="Ej: Actas de Comité"
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Retención en Gestión (años)</label>
                        <input 
                            type="number" 
                            name="retencion_gestion" 
                            value={newSubserie.retencion_gestion} 
                            onChange={handleCreateChange} 
                            placeholder="Ej: 5"
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Retención en Central (años)</label>
                        <input 
                            type="number" 
                            name="retencion_central" 
                            value={newSubserie.retencion_central} 
                            onChange={handleCreateChange} 
                            placeholder="Ej: 10"
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Disposición Final</label>
                        <select name="disposicion_final" value={newSubserie.disposicion_final} onChange={handleCreateChange}>
                            <option>Conservación Total</option>
                            <option>Eliminación</option>
                            <option>Selección</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Procedimientos</label>
                        <textarea 
                            name="procedimientos" 
                            value={newSubserie.procedimientos} 
                            onChange={handleCreateChange}
                            placeholder="Descripción de procedimientos aplicables..."
                            rows="4"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear Subserie</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL EDITAR --- */}
            <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="modal-overlay">
                <h2>Editar Subserie</h2>
                {editingSubserie && (
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="form-group">
                            <label>Serie a la que Pertenece *</label>
                            <select name="id_serie" value={editingSubserie.id_serie} onChange={handleEditChange} required>
                                {series && series.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre_serie}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Código *</label>
                            <input 
                                type="text" 
                                name="codigo_subserie" 
                                value={editingSubserie.codigo_subserie} 
                                onChange={handleEditChange} 
                                required 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input 
                                type="text" 
                                name="nombre_subserie" 
                                value={editingSubserie.nombre_subserie} 
                                onChange={handleEditChange} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Retención en Gestión (años)</label>
                            <input 
                                type="number" 
                                name="retencion_gestion" 
                                value={editingSubserie.retencion_gestion || ''} 
                                onChange={handleEditChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Retención en Central (años)</label>
                            <input 
                                type="number" 
                                name="retencion_central" 
                                value={editingSubserie.retencion_central || ''} 
                                onChange={handleEditChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Disposición Final</label>
                            <select 
                                name="disposicion_final" 
                                value={editingSubserie.disposicion_final || 'Conservación Total'} 
                                onChange={handleEditChange}
                            >
                                <option>Conservación Total</option>
                                <option>Eliminación</option>
                                <option>Selección</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Procedimientos</label>
                            <textarea 
                                name="procedimientos" 
                                value={editingSubserie.procedimientos || ''} 
                                onChange={handleEditChange}
                                rows="4"
                            />
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