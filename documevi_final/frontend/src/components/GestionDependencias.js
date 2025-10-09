import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

// Configuración del modal para accesibilidad (importante para que no haya errores en la consola)
Modal.setAppElement('#root');

const GestionDependencias = () => {
    // --- 1. ESTADOS DEL COMPONENTE ---

    // Obtiene la lista de dependencias y la función para refrescarla desde el contexto del Outlet.
    const { dependencias, refreshDependencias } = useOutletContext();
    
    // Estados para el formulario de CREACIÓN
    const [codigo, setCodigo] = useState('');
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');

    // Estados para controlar la visibilidad de los MODALES (ventanas emergentes)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Estado para guardar los datos de la dependencia que se está editando
    const [editingDep, setEditingDep] = useState(null);
    // Estado para el mensaje de confirmación
    const [confirmMessage, setConfirmMessage] = useState('');
    const firstInputRef = useRef(null); // Para el foco en el modal de edición

    // --- 2. LÓGICA PARA MANEJAR MODALES ---

    // Abre el modal de creación y limpia los campos
    const openCreateModal = () => {
        setCodigo('');
        setNombre('');
        setError('');
        setIsCreateModalOpen(true);
    };
    const closeCreateModal = () => setIsCreateModalOpen(false);

    // Abre el modal de edición con los datos de la dependencia seleccionada
    const openEditModal = (dependencia) => {
        setEditingDep({ ...dependencia }); // Clona el objeto para evitar mutaciones directas
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingDep(null);
    };
    
    // Abre el modal de confirmación con un mensaje específico
    const showConfirmation = (message) => {
        setConfirmMessage(message);
        setIsConfirmModalOpen(true);
    };

    // --- 3. LÓGICA DE LOS FORMULARIOS (CREAR, EDITAR, CAMBIAR ESTADO) ---

    // Maneja el envío del formulario para CREAR una nueva dependencia
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/dependencias', {
                codigo_dependencia: codigo,
                nombre_dependencia: nombre
            });
            closeCreateModal(); // Cierra el modal de creación
            refreshDependencias();
            showConfirmation('¡Dependencia creada con éxito!'); // Muestra la confirmación
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al crear la dependencia';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    // Actualiza el estado mientras se escribe en el formulario de EDICIÓN
    const handleEditChange = (e) => {
        setEditingDep({ ...editingDep, [e.target.name]: e.target.value });
    };

    // Maneja el envío del formulario para ACTUALIZAR una dependencia
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingDep) return;
        try {
            await api.put(`/dependencias/${editingDep.id}`, {
                codigo_dependencia: editingDep.codigo_dependencia,
                nombre_dependencia: editingDep.nombre_dependencia
            });
            closeEditModal();
            refreshDependencias();
            showConfirmation('Dependencia actualizada con éxito.'); // Muestra la confirmación
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar.');
        }
    };

    // Maneja el clic en el botón para ACTIVAR o DESACTIVAR
    const handleToggleStatus = async (id, estadoActual) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (window.confirm(`¿Estás seguro de que quieres ${accion} esta dependencia?`)) {
            try {
                await api.patch(`/dependencias/${id}/toggle-status`);
                refreshDependencias();
                showConfirmation('Estado actualizado con éxito.'); // Muestra la confirmación
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cambiar el estado.');
            }
        }
    };

    // --- 4. RENDERIZADO DEL COMPONENTE ---
    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Dependencias</h1>
                <PermissionGuard permission="dependencias_crear">
                    <button onClick={openCreateModal} className="button button-primary">Crear Nueva Dependencia</button>
                </PermissionGuard>
            </div>

            <div className="content-box">
                <h3>Dependencias Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dependencias && dependencias.map(dep => (
                            <tr key={dep.id} className={!dep.activo ? 'inactive-row' : ''}>
                                <td>{dep.codigo_dependencia}</td>
                                <td>{dep.nombre_dependencia}</td>
                                <td>
                                    <span className={dep.activo ? 'status-active' : 'status-inactive'}>
                                        {dep.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <PermissionGuard permission="dependencias_editar">
                                        <button onClick={() => openEditModal(dep)} className="button">Editar</button>
                                    </PermissionGuard>
                                    <PermissionGuard permission="dependencias_inactivar">
                                        <button onClick={() => handleToggleStatus(dep.id, dep.activo)} className={`button ${dep.activo ? 'button-danger' : 'button-success'}`}>
                                            {dep.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </PermissionGuard>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL PARA CREAR DEPENDENCIA --- */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} contentLabel="Crear Dependencia" className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Dependencia</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="codigo_dependencia_crear">Código</label>
                        <input id="codigo_dependencia_crear" type="text" placeholder="ej. 100" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nombre_dependencia_crear">Nombre</label>
                        <input id="nombre_dependencia_crear" type="text" placeholder="Nombre de la Dependencia" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL PARA EDITAR DEPENDENCIA --- */}
            <Modal 
                isOpen={isEditModalOpen} 
                onRequestClose={closeEditModal} 
                contentLabel="Editar Dependencia" 
                className="modal" 
                overlayClassName="modal-overlay"
                onAfterOpen={() => { if (firstInputRef.current) firstInputRef.current.focus(); }}
            >
                <h2>Editar Dependencia</h2>
                {editingDep && (
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label htmlFor="codigo_dependencia_modal">Código de la Dependencia</label>
                            <input ref={firstInputRef} id="codigo_dependencia_modal" type="text" name="codigo_dependencia" value={editingDep.codigo_dependencia} onChange={handleEditChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="nombre_dependencia_modal">Nombre de la Dependencia</label>
                            <input id="nombre_dependencia_modal" type="text" name="nombre_dependencia" value={editingDep.nombre_dependencia} onChange={handleEditChange} required />
                        </div>
                        <div className="modal-actions">
                            <button type="submit" className="button button-primary">Guardar Cambios</button>
                            <button type="button" onClick={closeEditModal} className="button">Cancelar</button>
                        </div>
                    </form>
                )}
            </Modal>
            
            {/* --- MODAL DE CONFIRMACIÓN --- */}
            <Modal
                isOpen={isConfirmModalOpen}
                onRequestClose={() => setIsConfirmModalOpen(false)}
                contentLabel="Confirmación"
                className="modal"
                overlayClassName="modal-overlay"
                style={{ content: { width: '350px', textAlign: 'center' } }}
            >
                <h2>Éxito</h2>
                <p>{confirmMessage}</p>
                <button onClick={() => setIsConfirmModalOpen(false)} className="button button-primary">
                    Aceptar
                </button>
            </Modal>
        </div>
    );
};

export default GestionDependencias;