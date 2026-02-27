import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getExpedientes } from '../api/expedienteAPI';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import { usePermissionsContext } from '../context/PermissionsContext';
import WizardCrearExpediente from './WizardCrearExpediente';
import './Dashboard.css';

Modal.setAppElement('#root');

const GestionExpedientes = () => {
    // Estados principales
    const [expedientes, setExpedientes] = useState([]);
    const [series, setSeries] = useState([]);
    const [subseries, setSubseries] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para el wizard de creación
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const { permissions: userPermissions } = usePermissionsContext();

    // Estados de filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterSerie, setFilterSerie] = useState('');
    const [filterFechaInicio, setFilterFechaInicio] = useState('');
    const [filterFechaFin, setFilterFechaFin] = useState('');
    const [filterCustomField, setFilterCustomField] = useState('');

    // Estado de paginación
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    });

    // Cargar datos iniciales (Solo catalogos)
    useEffect(() => {
        fetchCatalogos();
    }, []);

    // Cargar expedientes cuando cambian filtros o pagina
    useEffect(() => {
        const timerId = setTimeout(() => {
            fetchExpedientes();
        }, 500); // Debounce de 500ms para busqueda

        return () => clearTimeout(timerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, searchTerm, filterEstado, filterSerie, filterFechaInicio, filterFechaFin, filterCustomField]);

    const fetchCatalogos = async () => {
        try {
            const [resSer, resSub] = await Promise.all([
                api.get('/series'),
                api.get('/subseries')
            ]);
            setSeries(resSer.data.filter(s => s.activo));
            setSubseries(resSub.data.filter(ss => ss.activo));
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar catálogos.');
        }
    };

    const fetchExpedientes = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                estado: filterEstado,
                serie: filterSerie,
                fecha_inicio: filterFechaInicio,
                fecha_fin: filterFechaFin,
                custom_search: filterCustomField
            };

            const res = await getExpedientes(params);

            // Soporte para respuesta antigua (array) por si el backend no ha actualizado o cache
            if (Array.isArray(res.data)) {
                setExpedientes(res.data);
                // Si es array directo, asumimos que no hay paginacion real o es todo
                setPagination(prev => ({ ...prev, total: res.data.length, totalPages: 1 }));
            } else {
                // Nuevo formato { data, meta }
                setExpedientes(res.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: res.data.meta.total,
                    totalPages: res.data.meta.totalPages
                }));
            }
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar expedientes.');
        } finally {
            setLoading(false);
        }
    };

    // Cambiar pagina
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    // Limpiar filtros
    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterEstado('');
        setFilterSerie('');
        setFilterFechaInicio('');
        setFilterFechaFin('');
        setFilterCustomField('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Estadísticas
    const stats = useMemo(() => ({
        total: expedientes.length,
        enTramite: expedientes.filter(e => e.estado === 'En trámite').length,
        cerradosGestion: expedientes.filter(e => e.estado === 'Cerrado en Gestión').length,
        cerradosCentral: expedientes.filter(e => e.estado === 'Cerrado en Central').length
    }), [expedientes]);

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

    if (loading) {
        return <div className="loading-container">Cargando expedientes...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Expedientes</h1>
                <PermissionGuard permission="expedientes_crear">
                    <button onClick={() => setIsWizardOpen(true)} className="button button-primary">
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
                    {(searchTerm || filterEstado || filterSerie || filterFechaInicio || filterFechaFin || filterCustomField) && (
                        <button
                            className="button button-secondary"
                            onClick={handleClearFilters}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
                {/* Segunda fila de filtros */}
                <div className="filters-row" style={{ marginTop: '10px' }}>
                    <div className="filter-group">
                        <label>Fecha Apertura (Desde)</label>
                        <input
                            type="date"
                            value={filterFechaInicio}
                            onChange={(e) => setFilterFechaInicio(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Fecha Apertura (Hasta)</label>
                        <input
                            type="date"
                            value={filterFechaFin}
                            onChange={(e) => setFilterFechaFin(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label>Buscar en Campos Personalizados</label>
                        <input
                            type="text"
                            placeholder="Valor del metadato..."
                            value={filterCustomField}
                            onChange={(e) => setFilterCustomField(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tabla de expedientes */}
            <div className="content-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Expedientes ({pagination.total})</h3>
                    <span className="text-muted">Página {pagination.page} de {pagination.totalPages}</span>
                </div>

                {expedientes.length === 0 ? (
                    <p className="empty-message">No se encontraron expedientes.</p>
                ) : (
                    <>
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
                                    {expedientes.map(exp => (
                                        <tr key={exp.id}>
                                            <td>
                                                <strong>{exp.nombre_expediente}</strong>
                                                {exp.descriptor_1 && (
                                                    <><br /><small className="text-muted">Descriptor 1: {exp.descriptor_1}</small></>
                                                )}
                                                {exp.descriptor_2 && (
                                                    <><br /><small className="text-muted">Descriptor 2: {exp.descriptor_2}</small></>
                                                )}
                                                {(() => {
                                                    let campos = exp.datos_personalizados;
                                                    if (typeof campos === 'string') {
                                                        try { campos = JSON.parse(campos); } catch (e) { campos = []; }
                                                    }
                                                    return Array.isArray(campos) && campos.map((campo, idx) => (
                                                        <div key={idx} style={{ lineHeight: '1.2', marginTop: '2px' }}>
                                                            <small className="text-muted">
                                                                <strong>{campo.nombre_campo}:</strong> {campo.valor}
                                                            </small>
                                                        </div>
                                                    ));
                                                })()}
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

                        {/* Paginación */}
                        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                            <button
                                className="button"
                                disabled={pagination.page === 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                            >
                                &laquo; Anterior
                            </button>

                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                Página {pagination.page} de {pagination.totalPages}
                            </span>

                            <button
                                className="button"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                            >
                                Siguiente &raquo;
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Wizard de Creación de Expediente */}
            <WizardCrearExpediente
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={() => fetchExpedientes()}
                series={series}
                subseries={subseries}
                userPermissions={userPermissions}
            />
        </div >
    );
};

export default GestionExpedientes;