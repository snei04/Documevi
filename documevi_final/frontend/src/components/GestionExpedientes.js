import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getExpedientes } from '../api/expedienteAPI';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import { usePermissionsContext } from '../context/PermissionsContext';
import DuplicadoAlertModal from './DuplicadoAlertModal';
import WizardCrearExpediente from './WizardCrearExpediente';
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

    // Estados para campos personalizados y validacion de duplicados
    const [camposPersonalizados, setCamposPersonalizados] = useState([]);
    const [customData, setCustomData] = useState({});
    const [duplicadoModalOpen, setDuplicadoModalOpen] = useState(false);
    const [duplicadoInfo, setDuplicadoInfo] = useState(null);
    // const [documentoParaAnexar, setDocumentoParaAnexar] = useState(null); // unused

    // Estado para el wizard unificado
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

    // Función auxiliar para mantener compatibilidad con codigo existente que llama a fetchData
    const fetchData = () => {
        fetchExpedientes();
        fetchCatalogos();
    };

    // Cargar campos personalizados cuando se selecciona una serie
    const fetchCamposPersonalizados = useCallback(async (idOficina) => {
        if (!idOficina) {
            setCamposPersonalizados([]);
            return;
        }
        try {
            const res = await api.get(`/campos-personalizados/oficina/${idOficina}`);
            setCamposPersonalizados(res.data);
        } catch (err) {
            console.error('Error al cargar campos personalizados:', err);
            setCamposPersonalizados([]);
        }
    }, []);

    // Cambiar pagina
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    // Limpiar filtros
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

    // Manejar cambio de serie en el formulario
    const handleSerieChange = (e) => {
        const serieId = e.target.value;
        setFormData({ ...formData, id_serie: serieId, id_subserie: '' });
        setCustomData({});

        // Verificar si la serie requiere subserie
        const serieSeleccionada = series.find(s => s.id === parseInt(serieId));
        if (serieSeleccionada && !serieSeleccionada.requiere_subserie) {
            setFilteredSubseries([]);
        } else {
            setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(serieId)));
        }

        // Cargar campos personalizados de la oficina de la serie
        if (serieSeleccionada) {
            fetchCamposPersonalizados(serieSeleccionada.id_oficina_productora);
        } else {
            setCamposPersonalizados([]);
        }
    };

    // Manejar cambio en campos personalizados
    const handleCustomDataChange = (campoId, valor) => {
        setCustomData(prev => ({
            ...prev,
            [campoId]: valor
        }));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Abrir modal
    // const openModal = () => {
    //     setFormData({
    //         nombre_expediente: '',
    //         id_serie: '',
    //         id_subserie: '',
    //         descriptor_1: '',
    //         descriptor_2: ''
    //     });
    //     setFilteredSubseries([]);
    //     setCamposPersonalizados([]);
    //     setCustomData({});
    //     setIsModalOpen(true);
    // };

    // Cerrar modal
    const closeModal = () => {
        setIsModalOpen(false);
        setCamposPersonalizados([]);
        setCustomData({});
    };

    // Crear expediente
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const serieSeleccionada = series.find(s => s.id === parseInt(formData.id_serie));
            const dataToSend = { ...formData };

            if (serieSeleccionada && !serieSeleccionada.requiere_subserie) {
                dataToSend.id_subserie = null;
            }

            // Verificar si hay campos con validacion de duplicidad
            const camposConValidacion = camposPersonalizados.filter(c => c.validar_duplicidad);

            if (camposConValidacion.length > 0 && Object.keys(customData).length > 0) {
                // Validar duplicados antes de crear
                const validacionRes = await api.post('/expedientes/validar-duplicados', {
                    id_oficina: serieSeleccionada?.id_oficina_productora,
                    campos_personalizados: customData
                });

                if (validacionRes.data.duplicado) {
                    // Mostrar modal de duplicado
                    setDuplicadoInfo(validacionRes.data);
                    setDuplicadoModalOpen(true);
                    setSubmitting(false);
                    return;
                }
            }

            // No hay duplicados, crear expediente normalmente
            await crearExpedienteConDatos(dataToSend);

        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear el expediente.');
            setSubmitting(false);
        }
    };

    // Funcion auxiliar para crear expediente con datos personalizados
    const crearExpedienteConDatos = async (dataToSend) => {
        try {
            const res = await api.post('/expedientes', dataToSend);
            const nuevoExpedienteId = res.data.id;

            // Guardar datos personalizados si existen
            if (Object.keys(customData).length > 0) {
                await api.put(`/expedientes/${nuevoExpedienteId}/custom-data`, customData);
            }

            toast.success('Expediente creado con exito!');
            closeModal();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear el expediente.');
        } finally {
            setSubmitting(false);
        }
    };

    // Manejar confirmacion de anexion por duplicado
    const handleConfirmarAnexion = async (anexionData) => {
        setSubmitting(true);
        try {
            // Aqui se anexaria el documento al expediente existente
            // Por ahora, redirigimos al expediente existente
            const expedienteId = duplicadoInfo.expediente_existente.id;

            toast.success(`Redirigiendo al expediente #${expedienteId} para anexar el documento...`);
            setDuplicadoModalOpen(false);
            setDuplicadoInfo(null);
            closeModal();

            // Redirigir al detalle del expediente
            window.location.href = `/dashboard/expedientes/${expedienteId}`;

        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al procesar la anexion.');
        } finally {
            setSubmitting(false);
        }
    };

    // Cerrar modal de duplicado
    const handleCloseDuplicadoModal = () => {
        setDuplicadoModalOpen(false);
        setDuplicadoInfo(null);
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

                    {/* Campos Personalizados */}
                    {camposPersonalizados.length > 0 && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                            <h4 style={{ marginBottom: '15px' }}>
                                Campos Personalizados
                                {camposPersonalizados.some(c => c.validar_duplicidad) && (
                                    <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '10px' }}>
                                        (🔍 = valida duplicidad)
                                    </span>
                                )}
                            </h4>
                            <div className="form-row" style={{ flexWrap: 'wrap' }}>
                                {camposPersonalizados.map(campo => (
                                    <div className="form-group" key={campo.id} style={{ flex: '1 1 45%', minWidth: '200px' }}>
                                        <label htmlFor={`campo_${campo.id}`}>
                                            {campo.nombre_campo}
                                            {campo.es_obligatorio && ' *'}
                                            {campo.validar_duplicidad && ' 🔍'}
                                        </label>
                                        {campo.tipo_campo === 'fecha' ? (
                                            <input
                                                type="date"
                                                id={`campo_${campo.id}`}
                                                value={customData[campo.id] || ''}
                                                onChange={(e) => handleCustomDataChange(campo.id, e.target.value)}
                                                required={campo.es_obligatorio}
                                            />
                                        ) : campo.tipo_campo === 'numero' ? (
                                            <input
                                                type="number"
                                                id={`campo_${campo.id}`}
                                                value={customData[campo.id] || ''}
                                                onChange={(e) => handleCustomDataChange(campo.id, e.target.value)}
                                                required={campo.es_obligatorio}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                id={`campo_${campo.id}`}
                                                value={customData[campo.id] || ''}
                                                onChange={(e) => handleCustomDataChange(campo.id, e.target.value)}
                                                required={campo.es_obligatorio}
                                                placeholder={campo.validar_duplicidad ? 'Se validará si ya existe...' : ''}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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

            {/* Modal de Alerta de Duplicado */}
            <DuplicadoAlertModal
                isOpen={duplicadoModalOpen}
                onClose={handleCloseDuplicadoModal}
                duplicadoInfo={duplicadoInfo}
                onConfirmarAnexion={handleConfirmarAnexion}
                loading={submitting}
            />

            {/* Wizard Unificado de Creación */}
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