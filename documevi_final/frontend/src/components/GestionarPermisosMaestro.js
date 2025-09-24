import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import './Dashboard.css';

Modal.setAppElement('#root');

const GestionarPermisosMaestro = () => {
    const [permisos, setPermisos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados para el modal de edición
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermiso, setEditingPermiso] = useState(null);

    // Carga inicial de todos los permisos
    const fetchPermisos = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/permisos');
            setPermisos(res.data);
        } catch (error) {
            toast.error("No se pudieron cargar los permisos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPermisos();
    }, []);

    // --- MANEJADORES ---
    const openEditModal = (permiso) => {
        setEditingPermiso({ ...permiso });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPermiso(null);
    };
    
    const handleChange = (e) => {
        setEditingPermiso(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // La función ahora solo se encarga de ACTUALIZAR
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingPermiso) return;
        
        try {
            await api.put(`/permisos/${editingPermiso.id}`, editingPermiso);
            toast.success(`Permiso actualizado con éxito.`);
            closeModal();
            fetchPermisos(); // Recarga la lista
        } catch (err) {
            toast.error(err.response?.data?.msg || "Error al guardar el permiso.");
        }
    };

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Permisos del Sistema</h1>
                {/* Se eliminó el botón de "Crear Nuevo Permiso" */}
            </div>
            <div className="content-box">
                <h3>Permisos Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Nombre del Permiso</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permisos.map(p => (
                            <tr key={p.id}>
                                <td><code>{p.nombre_permiso}</code></td>
                                <td>{p.descripcion || 'Sin descripción'}</td>
                                <td className="action-cell">
                                    <button onClick={() => openEditModal(p)} className="button">Editar Descripción</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL PARA EDITAR --- */}
            <Modal isOpen={isModalOpen} onRequestClose={closeModal} className="modal" overlayClassName="modal-overlay">
                <h2>Editar Permiso</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre del Permiso (clave)</label>
                        {/* El nombre del permiso no se puede editar para mantener la integridad del sistema */}
                        <input 
                            type="text" 
                            name="nombre_permiso" 
                            value={editingPermiso?.nombre_permiso || ''} 
                            readOnly 
                            style={{ backgroundColor: '#f0f0f0' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea 
                            name="descripcion" 
                            rows="3"
                            value={editingPermiso?.descripcion || ''} 
                            onChange={handleChange}
                            placeholder="Explica para qué sirve este permiso..."
                        ></textarea>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Guardar Cambios</button>
                        <button type="button" onClick={closeModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GestionarPermisosMaestro;