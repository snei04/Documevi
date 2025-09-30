import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import './Dashboard.css';

// Configuración del modal para accesibilidad
Modal.setAppElement('#root');

const GestionSeries = () => {
    // --- 1. ESTADOS DEL COMPONENTE ---

    // Obtiene los datos y las funciones de refresco del contexto del Outlet
    const { oficinas, series, refreshSeries } = useOutletContext();
    
    // Estados para el modal de CREACIÓN
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSerie, setNewSerie] = useState({
        codigo_serie: '',
        nombre_serie: '',
        id_oficina_productora: '',
        requiere_subserie: true,
        retencion_gestion: '',
        retencion_central: '',
        disposicion_final: 'Conservación Total',
        procedimientos: ''
    });

    // Estados para el modal de EDICIÓN
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSerie, setEditingSerie] = useState(null);

    // --- 2. MANEJADORES DE MODALES ---
    const openCreateModal = () => {
        setNewSerie({ 
            codigo_serie: '', 
            nombre_serie: '', 
            id_oficina_productora: '', 
            requiere_subserie: true,
            retencion_gestion: '',
            retencion_central: '',
            disposicion_final: 'Conservación Total',
            procedimientos: ''
        });
        setIsCreateModalOpen(true);
    };
    const closeCreateModal = () => setIsCreateModalOpen(false);

    const openEditModal = (serie) => {
        setEditingSerie({ ...serie });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => setIsEditModalOpen(false);

    // --- 3. LÓGICA DE FORMULARIOS ---

    // Maneja los cambios en los inputs de texto y selectores
    const handleChange = (e, setter) => {
        setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Manejador especial para el checkbox
    const handleCheckboxChange = (e, setter) => {
        const isChecked = e.target.checked;
        setter(prev => ({ 
            ...prev, 
            [e.target.name]: isChecked,
            // Si marca que requiere subserie, limpiar los campos de retención
            ...(isChecked ? {
                retencion_gestion: '',
                retencion_central: '',
                disposicion_final: 'Conservación Total',
                procedimientos: ''
            } : {})
        }));
    };
    
    // Envía el formulario para CREAR una nueva serie
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/series', newSerie);
            toast.success('Serie creada con éxito.');
            closeCreateModal();
            refreshSeries();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear la serie.');
        }
    };
    
    // Envía el formulario para ACTUALIZAR una serie
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/series/${editingSerie.id}`, editingSerie);
            toast.success('Serie actualizada con éxito.');
            closeEditModal();
            refreshSeries();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar.');
        }
    };

    // Cambia el estado (activo/inactivo) de una serie
    const handleToggleStatus = async (id, estadoActual) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (window.confirm(`¿Estás seguro de que quieres ${accion} esta serie?`)) {
            try {
                await api.patch(`/series/${id}/toggle-status`);
                toast.success('Estado actualizado.');
                refreshSeries();
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cambiar el estado.');
            }
        }
    };

    // --- 4. RENDERIZADO DEL COMPONENTE ---
    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Series (TRD)</h1>
                <button onClick={openCreateModal} className="button button-primary">Crear Nueva Serie</button>
            </div>

            <div className="content-box">
                <h3>Series Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre de la Serie</th>
                            <th>Oficina Productora</th>
                            <th>¿Requiere Subserie?</th>
                            <th>Retención</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {series && series.map(serie => (
                            <tr key={serie.id} className={!serie.activo ? 'inactive-row' : ''}>
                                <td>{serie.codigo_serie}</td>
                                <td>{serie.nombre_serie}</td>
                                <td>{serie.nombre_oficina}</td>
                                <td>{serie.requiere_subserie ? 'Sí' : 'No'}</td>
                                <td>
                                    {!serie.requiere_subserie ? 
                                        `G: ${serie.retencion_gestion || 'N/A'}a, C: ${serie.retencion_central || 'N/A'}a` 
                                        : '-'}
                                </td>
                                <td>
                                    <span className={serie.activo ? 'status-active' : 'status-inactive'}>
                                        {serie.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <button onClick={() => openEditModal(serie)} className="button">Editar</button>
                                    <button onClick={() => handleToggleStatus(serie.id, serie.activo)} className={`button ${serie.activo ? 'button-danger' : 'button-success'}`}>
                                        {serie.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL PARA CREAR SERIE --- */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Serie</h2>
                <form onSubmit={handleCreateSubmit}>
                    <div className="form-group">
                        <label>Oficina Productora</label>
                        <select name="id_oficina_productora" value={newSerie.id_oficina_productora} onChange={(e) => handleChange(e, setNewSerie)} required>
                            <option value="">-- Seleccione una Oficina --</option>
                            {oficinas.map(ofi => ofi.activo && <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Código de la Serie</label>
                        <input type="text" name="codigo_serie" value={newSerie.codigo_serie} onChange={(e) => handleChange(e, setNewSerie)} required />
                    </div>
                    <div className="form-group">
                        <label>Nombre de la Serie</label>
                        <input type="text" name="nombre_serie" value={newSerie.nombre_serie} onChange={(e) => handleChange(e, setNewSerie)} required />
                    </div>
                    <div className="form-group">
                        <label>
                            <input 
                                type="checkbox" 
                                name="requiere_subserie"
                                checked={newSerie.requiere_subserie}
                                onChange={(e) => handleCheckboxChange(e, setNewSerie)}
                                style={{ marginRight: '10px' }}
                            />
                            ¿Esta serie requiere subseries?
                        </label>
                    </div>

                    {/* Campos adicionales si NO requiere subserie */}
                    {!newSerie.requiere_subserie && (
                        <>
                            <div className="form-group">
                                <label>Retención en Gestión (años)</label>
                                <input 
                                    type="number" 
                                    name="retencion_gestion" 
                                    value={newSerie.retencion_gestion} 
                                    onChange={(e) => handleChange(e, setNewSerie)} 
                                    placeholder="Ej: 5"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Retención en Central (años)</label>
                                <input 
                                    type="number" 
                                    name="retencion_central" 
                                    value={newSerie.retencion_central} 
                                    onChange={(e) => handleChange(e, setNewSerie)} 
                                    placeholder="Ej: 10"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Disposición Final</label>
                                <select name="disposicion_final" value={newSerie.disposicion_final} onChange={(e) => handleChange(e, setNewSerie)}>
                                    <option>Conservación Total</option>
                                    <option>Eliminación</option>
                                    <option>Selección</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Procedimientos</label>
                                <textarea 
                                    name="procedimientos" 
                                    value={newSerie.procedimientos} 
                                    onChange={(e) => handleChange(e, setNewSerie)}
                                    placeholder="Descripción de procedimientos aplicables..."
                                    rows="4"
                                />
                            </div>
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL PARA EDITAR SERIE --- */}
            <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="modal-overlay">
                <h2>Editar Serie</h2>
                {editingSerie && (
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="form-group">
                            <label>Oficina Productora</label>
                            <select name="id_oficina_productora" value={editingSerie.id_oficina_productora} onChange={(e) => handleChange(e, setEditingSerie)} required>
                                {oficinas.map(ofi => <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Código</label>
                            <input type="text" name="codigo_serie" value={editingSerie.codigo_serie} onChange={(e) => handleChange(e, setEditingSerie)} required />
                        </div>
                        <div className="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre_serie" value={editingSerie.nombre_serie} onChange={(e) => handleChange(e, setEditingSerie)} required />
                        </div>
                        <div className="form-group">
                            <label className='checkbox-label'>
                                <input 
                                    type="checkbox" 
                                    name="requiere_subserie"
                                    checked={editingSerie.requiere_subserie}
                                    onChange={(e) => handleCheckboxChange(e, setEditingSerie)}
                                    style={{ marginRight: '10px' }}
                                />
                                ¿Esta serie requiere subseries?
                            </label>
                        </div>

                        {/* Campos adicionales si NO requiere subserie */}
                        {!editingSerie.requiere_subserie && (
                            <>
                                <div className="form-group">
                                    <label>Retención en Gestión (años)</label>
                                    <input 
                                        type="number" 
                                        name="retencion_gestion" 
                                        value={editingSerie.retencion_gestion || ''} 
                                        onChange={(e) => handleChange(e, setEditingSerie)}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Retención en Central (años)</label>
                                    <input 
                                        type="number" 
                                        name="retencion_central" 
                                        value={editingSerie.retencion_central || ''} 
                                        onChange={(e) => handleChange(e, setEditingSerie)}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Disposición Final</label>
                                    <select 
                                        name="disposicion_final" 
                                        value={editingSerie.disposicion_final || 'Conservación Total'} 
                                        onChange={(e) => handleChange(e, setEditingSerie)}
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
                                        value={editingSerie.procedimientos || ''} 
                                        onChange={(e) => handleChange(e, setEditingSerie)}
                                        rows="4"
                                    />
                                </div>
                            </>
                        )}

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

export default GestionSeries;