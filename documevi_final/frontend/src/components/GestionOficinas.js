import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal'; // Importamos el componente Modal
import './Dashboard.css';

// Configuración del modal para accesibilidad
Modal.setAppElement('#root');

const GestionOficinas = () => {
    // --- 1. ESTADOS DEL COMPONENTE ---
    const { dependencias, refreshOficinas } = useOutletContext(); // Usamos refreshOficinas del contexto
    
    // Estado local para la lista de oficinas
    const [oficinas, setOficinas] = useState([]);
    
    // Estados para el formulario de CREACIÓN
    const [formData, setFormData] = useState({
        id_dependencia: '',
        codigo_oficina: '',
        nombre_oficina: ''
    });
    const [error, setError] = useState('');

    // Estados para el modal de EDICIÓN
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOficina, setEditingOficina] = useState(null);

    // --- LÓGICA PARA CARGAR DATOS ---
    const fetchOficinas = async () => {
        try {
            const res = await api.get('/oficinas');
            setOficinas(res.data);
        } catch (err) {
            console.error('Error al cargar oficinas:', err);
            toast.error('No se pudieron cargar las oficinas.');
        }
    };

    useEffect(() => {
        fetchOficinas();
    }, []); // Se carga la primera vez

    // Función para refrescar los datos y volver a cargar la lista
    const refreshAndFetch = () => {
        if (refreshOficinas) {
            refreshOficinas(); // Llama a la función del contexto si existe
        }
        fetchOficinas(); // Vuelve a cargar los datos locales
    };

    // --- 2. MANEJADORES DE MODALES Y FORMULARIOS ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.id_dependencia) {
            toast.warn('Debe seleccionar una dependencia.');
            return;
        }
        try {
            await api.post('/oficinas', formData);
            toast.success('¡Oficina creada con éxito!');
            refreshAndFetch(); // Refresca la lista
            setFormData({ id_dependencia: '', codigo_oficina: '', nombre_oficina: '' });
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al crear la oficina';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    // Abre el modal de edición
    const openEditModal = (oficina) => {
        setEditingOficina({ ...oficina });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingOficina(null);
    };
    
    const handleEditChange = (e) => {
        setEditingOficina({ ...editingOficina, [e.target.name]: e.target.value });
    };

    // Envía la actualización al backend
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/oficinas/${editingOficina.id}`, editingOficina);
            toast.success('Oficina actualizada con éxito.');
            closeEditModal();
            refreshAndFetch();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar.');
        }
    };

    // Cambia el estado (activo/inactivo)
    const handleToggleStatus = async (id, estadoActual) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (window.confirm(`¿Estás seguro de que quieres ${accion} esta oficina?`)) {
            try {
                await api.patch(`/oficinas/${id}/toggle-status`);
                toast.success('Estado actualizado.');
                refreshAndFetch();
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cambiar el estado.');
            }
        }
    };

    // --- 3. RENDERIZADO DEL COMPONENTE ---
    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Oficinas Productoras</h1>
            </div>
            
            <div className="content-box">
                <h3>Crear Nueva Oficina</h3>
                <form onSubmit={handleSubmit} className="form-grid">
                    <select name="id_dependencia" value={formData.id_dependencia} onChange={handleChange} required>
                        <option value="">-- Seleccione una Dependencia --</option>
                        {dependencias && dependencias.map(dep => (
                           dep.activo && <option key={dep.id} value={dep.id}>{dep.nombre_dependencia}</option>
                        ))}
                    </select>
                    <input type="text" name="codigo_oficina" placeholder="Código de la Oficina" value={formData.codigo_oficina} onChange={handleChange} required />
                    <input type="text" name="nombre_oficina" placeholder="Nombre de la Oficina" value={formData.nombre_oficina} onChange={handleChange} required />
                    <button type="submit" className="button button-primary">Crear</button>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>

            <h3>Oficinas Existentes</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre Oficina</th>
                        <th>Dependencia</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {oficinas.map(oficina => (
                        <tr key={oficina.id} className={!oficina.activo ? 'inactive-row' : ''}>
                            <td>{oficina.codigo_oficina}</td>
                            <td>{oficina.nombre_oficina}</td>
                            <td>{oficina.nombre_dependencia}</td>
                            <td>
                                <span className={oficina.activo ? 'status-active' : 'status-inactive'}>
                                    {oficina.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td className="action-cell">
                                <button onClick={() => openEditModal(oficina)} className="button">Editar</button>
                                <button onClick={() => handleToggleStatus(oficina.id, oficina.activo)} className={`button ${oficina.activo ? 'button-danger' : 'button-success'}`}>
                                    {oficina.activo ? 'Desactivar' : 'Activar'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* --- MODAL DE EDICIÓN --- */}
            <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} contentLabel="Editar Oficina" className="modal" overlayClassName="modal-overlay">
                <h2>Editar Oficina</h2>
                {editingOficina && (
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label htmlFor="edit-dependencia">Dependencia</label>
                            <select id="edit-dependencia" name="id_dependencia" value={editingOficina.id_dependencia} onChange={handleEditChange} required>
                                {dependencias.map(dep => <option key={dep.id} value={dep.id}>{dep.nombre_dependencia}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="edit-codigo">Código</label>
                            <input id="edit-codigo" type="text" name="codigo_oficina" value={editingOficina.codigo_oficina} onChange={handleEditChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="edit-nombre">Nombre</label>
                            <input id="edit-nombre" type="text" name="nombre_oficina" value={editingOficina.nombre_oficina} onChange={handleEditChange} required />
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

export default GestionOficinas;