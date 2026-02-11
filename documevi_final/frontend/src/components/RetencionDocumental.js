import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

Modal.setAppElement('#root');

const RetencionDocumental = () => {
    // Estados principales
    const [resumen, setResumen] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [expedientes, setExpedientes] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Filtros y selección
    const [filtroFase, setFiltroFase] = useState(''); // Dashboard
    const [filters, setFilters] = useState({
        oficina_id: '',
        serie_id: '',
        fecha_inicio: '',
        fecha_fin: ''
    });
    const [oficinas, setOficinas] = useState([]);
    const [series, setSeries] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    // Modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [selectedExpediente, setSelectedExpediente] = useState(null);
    const [accion, setAccion] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [procesando, setProcesando] = useState(false);

    // Cargar datos principales
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resumenRes, dashboardRes] = await Promise.all([
                api.get('/retencion/resumen'),
                api.get('/retencion/dashboard')
            ]);
            setResumen(resumenRes.data);
            setDashboard(dashboardRes.data);
        } catch (error) {
            toast.error('Error al cargar datos de retención');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Paginación
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
    });

    // Cargar expedientes con filtros y paginación
    const fetchExpedientes = useCallback(async () => {
        try {
            const queryParams = new URLSearchParams({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            }).toString();

            const res = await api.get(`/retencion/expedientes?${queryParams}`);

            // Backend ahora devuelve { data, pagination }
            if (res.data.pagination) {
                setExpedientes(res.data.data);
                setPagination(prev => ({ ...prev, ...res.data.pagination }));
            } else {
                // Fallback si el backend no devolviera paginación (aunque ya lo hace)
                setExpedientes(res.data);
            }
            setSelectedIds([]); // Limpiar selección al recargar
        } catch (error) {
            toast.error('Error al cargar expedientes');
        }
    }, [filters, pagination.page, pagination.limit]);

    const fetchHistorial = useCallback(async () => {
        try {
            const res = await api.get('/retencion/historial');
            setHistorial(res.data);
        } catch (error) {
            toast.error('Error al cargar historial');
        }
    }, []);

    // Cargar listas para filtros
    useEffect(() => {
        const fetchListas = async () => {
            try {
                const [ofiRes, serRes] = await Promise.all([
                    api.get('/oficinas'),
                    api.get('/series')
                ]);
                setOficinas(ofiRes.data);
                setSeries(serRes.data);
            } catch (error) { }
        };
        fetchListas();
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (activeTab === 'pendientes') fetchExpedientes();
        if (activeTab === 'historial') fetchHistorial();
    }, [activeTab, fetchExpedientes, fetchHistorial]);

    // Manejo de Selección
    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(expedientes.map(ex => ex.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Procesamiento Individual
    const openProcesarModal = (expediente) => {
        setSelectedExpediente(expediente);
        setAccion(expediente.disposicion_final === 'Eliminación' ? 'Eliminado' : 'Conservado');
        setObservaciones('');
        setIsModalOpen(true);
    };

    const handleProcesar = async () => {
        if (!accion) { toast.warning('Seleccione una acción'); return; }
        setProcesando(true);
        try {
            await api.post(`/retencion/procesar/${selectedExpediente.id}`, { accion, observaciones });
            toast.success(`Expediente ${accion.toLowerCase()} correctamente`);
            setIsModalOpen(false);
            fetchData();
            fetchExpedientes();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al procesar expediente');
        } finally {
            setProcesando(false);
        }
    };

    // Procesamiento Masivo
    const openBulkModal = (accionMasiva) => {
        setAccion(accionMasiva);
        setObservaciones('');
        setIsBulkModalOpen(true);
    };

    const handleProcesarMasivo = async () => {
        if (!accion) return;
        setProcesando(true);
        try {
            const res = await api.post('/retencion/procesar-masivo', {
                ids: selectedIds,
                accion,
                observaciones
            });
            toast.success(res.data.msg);
            if (res.data.errors.length > 0) {
                res.data.errors.forEach(err => toast.warn(err));
            }
            setIsBulkModalOpen(false);
            setSelectedIds([]);
            fetchData();
            fetchExpedientes();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error en procesamiento masivo');
        } finally {
            setProcesando(false);
        }
    };

    // Transferir a central
    // Transferir a central - Unused but kept for reference or future use if needed, commenting out to fix lint
    /*
    const handleTransferir = async (expediente) => {
        if (!window.confirm(`¿Transferir "${expediente.nombre_expediente}" al Archivo Central?`)) return;
        try {
            await api.post(`/retencion/transferir/${expediente.id}`, {
                observaciones: 'Transferencia por cumplimiento de retención en gestión'
            });
            toast.success('Expediente transferido a Archivo Central');
            fetchData();
            fetchExpedientes();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al transferir');
        }
    };
    */

    // Helpers
    const handleLeerAlerta = async (alertaId) => {
        try { await api.post(`/retencion/alertas/${alertaId}/leer`); fetchData(); } catch (error) { }
    };

    const handleEjecutarJob = async () => {
        try {
            toast.info('Ejecutando actualización...');
            await api.post('/retencion/ejecutar-job');
            toast.success('Retención actualizada');
            fetchData();
        } catch (error) { toast.error('Error al ejecutar job'); }
    };

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('es-CO') : '-';

    const faseConfig = {
        'Vigente': { color: '#10b981', bg: '#d1fae5', icon: '🟢' },
        'En Gestión': { color: '#3b82f6', bg: '#dbeafe', icon: '📁' },
        'En Central': { color: '#f59e0b', bg: '#fef3c7', icon: '🏛️' },
        'Histórico': { color: '#8b5cf6', bg: '#ede9fe', icon: '📜' },
        'Eliminable': { color: '#ef4444', bg: '#fee2e2', icon: '🗑️' }
    };

    const getEstadoClass = (estado) => {
        if (estado?.includes('Vencido')) return 'status-danger';
        if (estado?.includes('Próximo')) return 'status-warning';
        return 'status-active';
    };

    /*
    const getDisposicionClass = (disposicion) => {
        switch (disposicion) {
            case 'Eliminación': return 'badge-danger';
            case 'Conservación Total': return 'badge-success';
            case 'Selección': return 'badge-warning';
            default: return 'badge-default';
        }
    };
    */

    // Render Logic
    if (loading && !resumen) return <div className="loading-container">Cargando datos de retención...</div>;
    const expedientesFiltrados = dashboard?.proximosCambio?.filter(exp => !filtroFase || exp.fase_retencion === filtroFase) || [];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Retención Documental (TRD)</h1>
                <PermissionGuard permission="retencion_procesar">
                    <button onClick={handleEjecutarJob} className="button button-secondary">🔄 Actualizar Fases</button>
                </PermissionGuard>
            </div>

            {/* Tarjetas Resumen */}
            {resumen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {Object.entries(faseConfig).map(([fase, config]) => {
                        const count = fase === 'Vigente' ? resumen.vigentes
                            : fase === 'En Gestión' ? resumen.en_gestion
                                : fase === 'En Central' ? resumen.en_central
                                    : fase === 'Histórico' ? resumen.historicos
                                        : resumen.eliminables;
                        return (
                            <div key={fase}
                                style={{
                                    background: config.bg, borderLeft: `4px solid ${config.color}`,
                                    borderRadius: '8px', padding: '16px', cursor: 'pointer',
                                    transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                                onClick={() => { setFiltroFase(fase === filtroFase ? '' : fase); setActiveTab('dashboard'); }}
                            >
                                <div style={{ fontSize: '1.5rem' }}>{config.icon}</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: config.color }}>{count || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>{fase}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tabs */}
            <div className="tabs-container">
                <button className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
                <button className={`tab-button ${activeTab === 'pendientes' ? 'active' : ''}`} onClick={() => setActiveTab('pendientes')}>📋 Pendientes {resumen ? `(${resumen.total_vencidos + resumen.total_proximos})` : ''}</button>
                <button className={`tab-button ${activeTab === 'porOficina' ? 'active' : ''}`} onClick={() => setActiveTab('porOficina')}>🏢 Por Oficina</button>
                <button className={`tab-button ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>📜 Historial</button>
            </div>

            <div className="content-box">
                {/* === DASHBOARD === */}
                {activeTab === 'dashboard' && dashboard && (
                    <>
                        {dashboard.alertas?.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h3>🔔 Alertas Activas ({dashboard.alertas.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                    {dashboard.alertas.map(alerta => (
                                        <div key={alerta.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px' }}>
                                            <div><strong>⚠️ {alerta.tipo_alerta}:</strong> {alerta.nombre_expediente} <span style={{ color: '#c2410c' }}>Límite: {formatDate(alerta.fecha_limite)}</span></div>
                                            <button onClick={() => handleLeerAlerta(alerta.id)} className="button" style={{ padding: '2px 8px' }}>✓ Leída</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <h3>⏳ Próximos a Cambiar de Fase {filtroFase && `(${filtroFase})`}</h3>
                        <div className="table-responsive">
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>Expediente</th>
                                        <th>Serie</th>
                                        <th>Fase Actual</th>
                                        <th>Fecha Cambio</th>
                                        <th>Días</th>
                                        <th>Disposición</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expedientesFiltrados.map(exp => (
                                        <tr key={exp.id}>
                                            <td>{exp.nombre_expediente}</td>
                                            <td>{exp.nombre_serie}</td>
                                            <td><span className="badge badge-default">{exp.fase_retencion}</span></td>
                                            <td>{formatDate(exp.fecha_cambio)}</td>
                                            <td><span style={{ fontWeight: 'bold', color: exp.dias_restantes <= 7 ? '#ef4444' : '#10b981' }}>{exp.dias_restantes}d</span></td>
                                            <td>{exp.disposicion_final}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* === PENDIENTES (BULK ACTION) === */}
                {activeTab === 'pendientes' && (
                    <>
                        {/* Filtros */}
                        <div className="filters-bar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '15px' }}>
                            <select
                                className="form-input"
                                value={filters.oficina_id}
                                onChange={e => setFilters({ ...filters, oficina_id: e.target.value })}
                                style={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc' }}
                            >
                                <option value="">Todas las Oficinas</option>
                                {oficinas.map(o => <option key={o.id} value={o.id}>{o.nombre_oficina}</option>)}
                            </select>
                            <select
                                className="form-input"
                                value={filters.serie_id}
                                onChange={e => setFilters({ ...filters, serie_id: e.target.value })}
                                style={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc' }}
                            >
                                <option value="">Todas las Series</option>
                                {series.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
                            </select>
                            <input
                                type="date"
                                className="form-input"
                                value={filters.fecha_inicio}
                                onChange={e => setFilters({ ...filters, fecha_inicio: e.target.value })}
                                title="Fecha Inicio Vencimiento"
                                style={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc' }}
                            />
                            <input
                                type="date"
                                className="form-input"
                                value={filters.fecha_fin}
                                onChange={e => setFilters({ ...filters, fecha_fin: e.target.value })}
                                title="Fecha Fin Vencimiento"
                                style={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc' }}
                            />
                        </div>

                        {/* Barra de Acciones Masivas */}
                        {selectedIds.length > 0 && (
                            <div className="bulk-actions-bar" style={{
                                display: 'flex', alignItems: 'center', gap: '15px',
                                padding: '10px 20px', backgroundColor: '#e0f2fe',
                                border: '1px solid #bae6fd', borderRadius: '6px', marginBottom: '15px'
                            }}>
                                <span style={{ fontWeight: 'bold', color: '#0369a1' }}>{selectedIds.length} seleccionados</span>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                                    <button onClick={() => openBulkModal('Transferir')} className="button button-secondary">📤 Transferir</button>
                                    <button onClick={() => openBulkModal('Conservado')} className="button button-primary">✅ Conservar</button>
                                    <button onClick={() => openBulkModal('Eliminado')} className="button button-danger">🗑️ Eliminar</button>
                                </div>
                            </div>
                        )}

                        {expedientes.length === 0 ? <p className="empty-message">No hay expedientes pendientes.</p> : (
                            <div className="table-responsive">
                                <table className="styled-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px', textAlign: 'center' }}>
                                                <input type="checkbox"
                                                    onChange={toggleSelectAll}
                                                    checked={expedientes.length > 0 && selectedIds.length === expedientes.length}
                                                />
                                            </th>
                                            <th>Expediente</th>
                                            <th>Serie</th>
                                            <th>Vencimiento</th>
                                            <th>Fase</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expedientes.map(exp => (
                                            <tr key={exp.id} className={selectedIds.includes(exp.id) ? 'row-selected' : ''}>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input type="checkbox"
                                                        checked={selectedIds.includes(exp.id)}
                                                        onChange={() => toggleSelectOne(exp.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <strong>{exp.nombre_expediente}</strong>
                                                    <br /><small>{exp.nombre_oficina}</small>
                                                </td>
                                                <td>{exp.nombre_serie}</td>
                                                <td>
                                                    {exp.fase_retencion === 'En Gestión' ? formatDate(exp.fecha_fin_gestion) : formatDate(exp.fecha_fin_central)}
                                                </td>
                                                <td><span className="badge badge-default">{exp.fase_retencion}</span></td>
                                                <td><span className={`status-badge ${getEstadoClass(exp.estado_retencion)}`}>{exp.estado_retencion}</span></td>
                                                <td>
                                                    <button onClick={() => openProcesarModal(exp)} className="button button-small">⚙️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Controles de Paginación */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                                <button
                                    className="button button-secondary"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    ⬅ Anterior
                                </button>
                                <span>Página <strong>{pagination.page}</strong> de {pagination.totalPages} (Total: {pagination.total})</span>
                                <button
                                    className="button button-secondary"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Siguiente ➡
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* === HISTORIAL, POR OFICINA ... (Simplificado) === */}
                {activeTab === 'porOficina' && dashboard?.porOficina && (
                    <div className="table-responsive">
                        <table className="styled-table">
                            <thead><tr><th>Oficina</th><th>Total</th></tr></thead>
                            <tbody>{dashboard.porOficina.map(o => <tr key={o.id_oficina}><td>{o.nombre_oficina}</td><td>{o.total}</td></tr>)}</tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'historial' && (
                    <div className="table-responsive">
                        <table className="styled-table">
                            <thead><tr><th>Fecha</th><th>Expediente</th><th>Acción</th></tr></thead>
                            <tbody>{historial.map(h => <tr key={h.id}><td>{formatDate(h.fecha_procesado)}</td><td>{h.nombre_expediente}</td><td>{h.estado}</td></tr>)}</tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Individual */}
            <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="modal" overlayClassName="modal-overlay">
                <h2>Procesar {selectedExpediente?.nombre_expediente}</h2>
                <div className="form-group">
                    <label>Acción</label>
                    <select
                        value={accion}
                        onChange={(e) => setAccion(e.target.value)}
                        className="form-input"
                        style={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc' }}
                    >
                        <option value="">Seleccione...</option>
                        <option value="Conservado">Conservar</option>
                        <option value="Eliminado">Eliminar</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Observaciones</label>
                    <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="form-input"
                        style={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc', minHeight: '100px' }}
                    />
                </div>
                <div className="modal-actions">
                    <button onClick={handleProcesar} className="button button-primary" disabled={procesando}>Confirmar</button>
                    <button onClick={() => setIsModalOpen(false)} className="button">Cancelar</button>
                </div>
            </Modal>

            {/* Modal Masivo */}
            <Modal isOpen={isBulkModalOpen} onRequestClose={() => setIsBulkModalOpen(false)} className="modal" overlayClassName="modal-overlay">
                <h2>Procesamiento Masivo ({selectedIds.length} expedientes)</h2>
                <p>Acción seleccionada: <strong>{accion}</strong></p>
                <div className="form-group">
                    <label>Observaciones para todos los expedientes:</label>
                    <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="form-input"
                        rows="3"
                        style={{ backgroundColor: 'white', color: '#333', borderColor: '#ccc' }}
                    />
                </div>
                <div className="modal-actions">
                    <button onClick={handleProcesarMasivo} className="button button-primary" disabled={procesando}>
                        {procesando ? 'Procesando...' : 'Confirmar Procesamiento Masivo'}
                    </button>
                    <button onClick={() => setIsBulkModalOpen(false)} className="button">Cancelar</button>
                </div>
            </Modal>
        </div>
    );
};

export default RetencionDocumental;
