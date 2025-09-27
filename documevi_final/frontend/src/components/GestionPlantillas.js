import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';
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
        id_dependencia: '', // Temporal, para el filtro
        id_oficina_productora: '',
        id_serie: '',
        id_subserie: ''
    });

    // Estados para los selectores filtrados
    const [filteredOficinas, setFilteredOficinas] = useState([]);
    const [filteredSeries, setFilteredSeries] = useState([]);
    const [filteredSubseries, setFilteredSubseries] = useState([]);

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
    
    // --- 4. RENDERIZADO DEL COMPONENTE ---
    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Plantillas</h1>
                <button onClick={openCreateModal} className="button button-primary">Crear Nueva Plantilla</button>
            </div>

            <div className="content-box">
                <h3>Plantillas Existentes</h3>
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
                                <td>{p.nombre}</td>
                                <td>{p.descripcion}</td>
                                <td className="action-cell">
                                    <Link to={`/dashboard/plantillas/${p.id}`}>Administrar Campos</Link>
                                    <Link to={`/dashboard/plantillas/${p.id}/disenar`} style={{ marginLeft: '15px' }}>Diseñar</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
                        <select name="id_subserie" value={newPlantilla.id_subserie} onChange={handleChange} required>
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
        </div>
    );
};

export default GestionPlantillas;