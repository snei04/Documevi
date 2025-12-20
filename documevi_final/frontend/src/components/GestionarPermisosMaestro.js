import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import useAuth from '../hooks/useAuth';
import './Dashboard.css';

Modal.setAppElement('#root');

const GestionarPermisosMaestro = () => {
    const [permisos, setPermisos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermiso, setEditingPermiso] = useState(null);
    const auth = useAuth();


    // Usamos useCallback para que la función no se recree en cada renderizado.
    const fetchPermisos = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/permisos');
            setPermisos(res.data);
        } catch (error) {
            toast.error("No se pudieron cargar los permisos.");
        } finally {
            setIsLoading(false);
        }
    }, []); // El array vacío significa que la función en sí no cambiará.

    // El useEffect ahora solo llama a la función que ya existe.
    useEffect(() => {
        fetchPermisos();
    }, [fetchPermisos]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingPermiso) return;

        try {
            await api.put(`/permisos/${editingPermiso.id}`, editingPermiso);
            toast.success(`Permiso actualizado con éxito.`);
            closeModal();
            fetchPermisos(); 
        } catch (err) {
            toast.error(err.response?.data?.msg || "Error al guardar el permiso.");
        }
    };

    if (isLoading) return <div>Cargando...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Permisos del Sistema</h1>
            </div>
            <div className="content-box">
                <h3>Permisos Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Nombre del Permiso</th>
                            <th>Descripción</th>
                            {auth.hasPermission('permisos_editar') && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {permisos.map(p => (
                            <tr key={p.id}>
                                <td><code>{p.nombre_permiso}</code></td>
                                <td>{p.descripcion || 'Sin descripción'}</td>
                                {auth.hasPermission('permisos_editar') && (
                                    <td className="action-cell">
                                        <button onClick={() => openEditModal(p)} className="button">Editar Descripción</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onRequestClose={closeModal} className="modal" overlayClassName="modal-overlay">
                <h2>Editar Permiso</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre del Permiso (clave)</label>
                        <input
                            type="text"
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