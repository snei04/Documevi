import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

Modal.setAppElement('#root');

const GestionExpedientes = () => {
    // Estados principales
    const [expedientes, setExpedientes] = useState([]);
    const [series, setSeries] = useState([]);
    const [subseries, setSubseries] = useState([]);
    const [filteredSubseries, setFilteredSubseries] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados del modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        nombre_expediente: '',
        id_serie: '',
        id_subserie: '',
        descriptor_1: '',
        descriptor_2: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Estados de filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterSerie, setFilterSerie] = useState('');

    // Cargar datos iniciales
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resExp, resSer, resSub] = await Promise.all([
                api.get('/expedientes'),
                api.get('/series'),
                api.get('/subseries')
            ]);
            setExpedientes(resExp.data);
            setSeries(resSer.data.filter(s => s.activo));
            setSubseries(resSub.data.filter(ss => ss.activo));
        } catch (err) {
            toast.error('Error al cargar datos iniciales.');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar expedientes
    const filteredExpedientes = useMemo(() => {
        return expedientes.filter(exp => {
            const matchSearch = exp.nombre_expediente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               exp.nombre_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               exp.nombre_subserie?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchEstado = !filterEstado || exp.estado === filterEstado;
            const matchSerie = !filterSerie || exp.id_serie === parseInt(filterSerie);
            return matchSearch && matchEstado && matchSerie;
        });
    }, [expedientes, searchTerm, filterEstado, filterSerie]);

    // Estadísticas
    const stats = useMemo(() => ({
        total: expedientes.length,
        enTramite: expedientes.filter(e => e.estado === 'En trámite').length,
        cerradosGestion: expedientes.filter(e => e.estado === 'Cerrado en Gestión').length,
        cerradosCentral: expedientes.filter(e => e.estado === 'Cerrado en Central').length
    }), [expedientes]);

    // Manejar cambio de serie en el formulario
    const handleSerieChange = (e) => {
        const serieId = e.target.value;
        setFormData({ ...formData, id_serie: serieId, id_subserie: '' });
        
        // Verificar si la serie requiere subserie
        const serieSeleccionada = series.find(s => s.id === parseInt(serieId));
        if (serieSeleccionada && !serieSeleccionada.requiere_subserie) {
            setFilteredSubseries([]);
        } else {
            setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(serieId)));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Abrir modal
    const openModal = () => {
        setFormData({
            nombre_expediente: '',
            id_serie: '',
            id_subserie: '',
            descriptor_1: '',
            descriptor_2: ''
        });
        setFilteredSubseries([]);
        setIsModalOpen(true);
    };

    // Cerrar modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Crear expediente
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            // Verificar si la serie requiere subserie
            const serieSeleccionada = series.find(s => s.id === parseInt(formData.id_serie));
            const dataToSend = { ...formData };
            
            if (serieSeleccionada && !serieSeleccionada.requiere_subserie) {
                dataToSend.id_subserie = null;
            }
            
            await api.post('/expedientes', dataToSend);
            toast.success('Expediente creado con éxito!');
            closeModal();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear el expediente.');
        } finally {
            setSubmitting(false);
        }
    };

    // Obtener clase de estado
    const getEstadoClass = (estado) => {
        switch (estado) {
            case 'En trámite':
                return 'status-active';
            case 'Cerrado en Gestión':
                return 'status-warning';
            case 'Cerrado en Central':
                return 'status-info';
            default:
                return 'status-default';
        }
    };

    // Formatear fecha
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-CO');
    };

    // Verificar si la serie seleccionada requiere subserie
    const serieRequiereSubserie = () => {
        if (!formData.id_serie) return true;
        const serie = series.find(s => s.id === parseInt(formData.id_serie));
        return serie ? serie.requiere_subserie : true;
    };

    if (loading) {
        return <div className="loading-container">Cargando expedientes...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Expedientes</h1>
                <PermissionGuard permission="expedientes_crear">
                    <button onClick={openModal} className="button button-primary">
                        + Nuevo Expediente
                    </button>
                </PermissionGuard>
            </div>

            {/* Estadísticas */}
            <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card stat-primary">
                    <div className="stat-icon">📁</div>
                    <div className="stat-content">
                        <h3>{stats.total}</h3>
                        <p>Total Expedientes</p>
                    </div>
                </div>
                <div className="stat-card stat-success">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                        <h3>{stats.enTramite}</h3>
                        <p>En Trámite</p>
                    </div>
                </div>
                <div className="stat-card stat-warning">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <h3>{stats.cerradosGestion}</h3>
                        <p>Cerrados en Gestión</p>
                    </div>
                </div>
                <div className="stat-card stat-info">
                    <div className="stat-icon">🏛️</div>
                    <div className="stat-content">
                        <h3>{stats.cerradosCentral}</h3>
                        <p>Cerrados en Central</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="content-box" style={{ marginBottom: '20px' }}>
                <div className="filters-row">
                    <div className="filter-group">
                        <label>Buscar</label>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, serie o subserie..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label>Estado</label>
                        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                            <option value="">Todos los estados</option>
                            <option value="En trámite">En trámite</option>
                            <option value="Cerrado en Gestión">Cerrado en Gestión</option>
                            <option value="Cerrado en Central">Cerrado en Central</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Serie</label>
                        <select value={filterSerie} onChange={(e) => setFilterSerie(e.target.value)}>
                            <option value="">Todas las series</option>
                            {series.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre_serie}</option>
                            ))}
                        </select>
                    </div>
                    {(searchTerm || filterEstado || filterSerie) && (
                        <button 
                            className="button button-secondary"
                            onClick={() => { setSearchTerm(''); setFilterEstado(''); setFilterSerie(''); }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla de expedientes */}
            <div className="content-box">
                <h3>Expedientes ({filteredExpedientes.length})</h3>
                {filteredExpedientes.length === 0 ? (
                    <p className="empty-message">No se encontraron expedientes.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Nombre del Expediente</th>
                                    <th>Serie / Subserie</th>
                                    <th>Fecha Apertura</th>
                                    <th>Estado</th>
                                    <th>Disponibilidad</th>
                                    <th>Responsable</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpedientes.map(exp => (
                                    <tr key={exp.id}>
                                        <td>
                                            <strong>{exp.nombre_expediente}</strong>
                                            {exp.descriptor_1 && (
                                                <><br /><small className="text-muted">{exp.descriptor_1}</small></>
                                            )}
                                        </td>
                                        <td>
                                            <span className="serie-badge">{exp.nombre_serie}</span>
                                            {exp.nombre_subserie && (
                                                <><br /><small>{exp.nombre_subserie}</small></>
                                            )}
                                        </td>
                                        <td>{formatDate(exp.fecha_apertura)}</td>
                                        <td>
                                            <span className={`status-badge ${getEstadoClass(exp.estado)}`}>
                                                {exp.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${exp.disponibilidad === 'Disponible' ? 'badge-success' : 'badge-warning'}`}>
                                                {exp.disponibilidad || 'Disponible'}
                                            </span>
                                        </td>
                                        <td>{exp.nombre_responsable || '-'}</td>
                                        <td className="action-cell">
                                            <Link to={`/dashboard/expedientes/${exp.id}`} className="button button-small">
                                                Ver Detalles
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de creación */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="Crear Nuevo Expediente"
                className="modal"
                overlayClassName="modal-overlay"
            >
                <h2>Crear Nuevo Expediente</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nombre_expediente">Nombre del Expediente *</label>
                        <input
                            type="text"
                            id="nombre_expediente"
                            name="nombre_expediente"
                            value={formData.nombre_expediente}
                            onChange={handleChange}
                            placeholder="Ej: Contrato de prestación de servicios 2024"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="id_serie">Serie Documental *</label>
                            <select
                                id="id_serie"
                                name="id_serie"
                                value={formData.id_serie}
                                onChange={handleSerieChange}
                                required
                            >
                                <option value="">-- Seleccione una Serie --</option>
                                {series.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.codigo_serie} - {s.nombre_serie}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="id_subserie">
                                Subserie Documental {serieRequiereSubserie() ? '*' : '(No aplica)'}
                            </label>
                            <select
                                id="id_subserie"
                                name="id_subserie"
                                value={formData.id_subserie}
                                onChange={handleChange}
                                required={serieRequiereSubserie()}
                                disabled={!serieRequiereSubserie()}
                            >
                                <option value="">
                                    {!formData.id_serie 
                                        ? '-- Primero seleccione una Serie --' 
                                        : serieRequiereSubserie() 
                                            ? '-- Seleccione una Subserie --'
                                            : '-- No requiere Subserie --'
                                    }
                                </option>
                                {filteredSubseries.map(ss => (
                                    <option key={ss.id} value={ss.id}>
                                        {ss.codigo_subserie} - {ss.nombre_subserie}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="descriptor_1">Descriptor 1 (Opcional)</label>
                            <input
                                type="text"
                                id="descriptor_1"
                                name="descriptor_1"
                                value={formData.descriptor_1}
                                onChange={handleChange}
                                placeholder="Ej: Número de contrato, NIT, etc."
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="descriptor_2">Descriptor 2 (Opcional)</label>
                            <input
                                type="text"
                                id="descriptor_2"
                                name="descriptor_2"
                                value={formData.descriptor_2}
                                onChange={handleChange}
                                placeholder="Ej: Año, Departamento, etc."
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button 
                            type="submit" 
                            className="button button-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Creando...' : 'Crear Expediente'}
                        </button>
                        <button 
                            type="button" 
                            onClick={closeModal} 
                            className="button"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GestionExpedientes;