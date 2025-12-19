import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

Modal.setAppElement('#root');

const RetencionDocumental = () => {
    // Estados
    const [expedientes, setExpedientes] = useState([]);
    const [resumen, setResumen] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pendientes');
    
    // Modal de procesamiento
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpediente, setSelectedExpediente] = useState(null);
    const [accion, setAccion] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [procesando, setProcesando] = useState(false);

    // Cargar datos
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [expRes, resumenRes] = await Promise.all([
                api.get('/retencion/expedientes'),
                api.get('/retencion/resumen')
            ]);
            setExpedientes(expRes.data);
            setResumen(resumenRes.data);
        } catch (error) {
            toast.error('Error al cargar datos de retención');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistorial = useCallback(async () => {
        try {
            const res = await api.get('/retencion/historial');
            setHistorial(res.data);
        } catch (error) {
            toast.error('Error al cargar historial');
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (activeTab === 'historial') {
            fetchHistorial();
        }
    }, [activeTab, fetchHistorial]);

    // Abrir modal de procesamiento
    const openProcesarModal = (expediente) => {
        setSelectedExpediente(expediente);
        setAccion(expediente.disposicion_final === 'Eliminación' ? 'Eliminado' : 'Conservado');
        setObservaciones('');
        setIsModalOpen(true);
    };

    // Procesar expediente
    const handleProcesar = async () => {
        if (!accion) {
            toast.warning('Seleccione una acción');
            return;
        }

        setProcesando(true);
        try {
            await api.post(`/retencion/procesar/${selectedExpediente.id}`, {
                accion,
                observaciones
            });
            toast.success(`Expediente ${accion.toLowerCase()} correctamente`);
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al procesar expediente');
        } finally {
            setProcesando(false);
        }
    };

    // Transferir a central
    const handleTransferir = async (expediente) => {
        if (!window.confirm(`¿Transferir "${expediente.nombre_expediente}" al Archivo Central?`)) {
            return;
        }

        try {
            await api.post(`/retencion/transferir/${expediente.id}`, {
                observaciones: 'Transferencia por cumplimiento de retención en gestión'
            });
            toast.success('Expediente transferido a Archivo Central');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al transferir');
        }
    };

    // Formatear fecha
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-CO');
    };

    // Obtener clase de estado
    const getEstadoClass = (estado) => {
        switch (estado) {
            case 'Vencido en Central':
            case 'Vencido en Gestión':
                return 'status-danger';
            case 'Próximo a vencer en Central':
            case 'Próximo a vencer en Gestión':
                return 'status-warning';
            default:
                return 'status-active';
        }
    };

    // Obtener clase de disposición
    const getDisposicionClass = (disposicion) => {
        switch (disposicion) {
            case 'Eliminación':
                return 'badge-danger';
            case 'Conservación Total':
                return 'badge-success';
            case 'Selección':
                return 'badge-warning';
            default:
                return 'badge-default';
        }
    };

    if (loading) {
        return <div className="loading-container">Cargando datos de retención...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Retención Documental (TRD)</h1>
            </div>

            {/* Resumen de estadísticas */}
            {resumen && (
                <div className="stats-grid" style={{ marginBottom: '20px' }}>
                    <div className="stat-card stat-danger">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-content">
                            <h3>{resumen.total_vencidos}</h3>
                            <p>Expedientes Vencidos</p>
                        </div>
                    </div>
                    <div className="stat-card stat-warning">
                        <div className="stat-icon">⏰</div>
                        <div className="stat-content">
                            <h3>{resumen.total_proximos}</h3>
                            <p>Próximos a Vencer</p>
                        </div>
                    </div>
                    <div className="stat-card stat-info">
                        <div className="stat-icon">📁</div>
                        <div className="stat-content">
                            <h3>{resumen.vencidos_gestion}</h3>
                            <p>Vencidos en Gestión</p>
                        </div>
                    </div>
                    <div className="stat-card stat-primary">
                        <div className="stat-icon">🏛️</div>
                        <div className="stat-content">
                            <h3>{resumen.vencidos_central}</h3>
                            <p>Vencidos en Central</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs-container">
                <button 
                    className={`tab-button ${activeTab === 'pendientes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pendientes')}
                >
                    📋 Pendientes ({expedientes.length})
                </button>
                <button 
                    className={`tab-button ${activeTab === 'historial' ? 'active' : ''}`}
                    onClick={() => setActiveTab('historial')}
                >
                    📜 Historial
                </button>
            </div>

            {/* Contenido de tabs */}
            <div className="content-box">
                {activeTab === 'pendientes' && (
                    <>
                        <h3>Expedientes con Retención Vencida o Próxima a Vencer</h3>
                        {expedientes.length === 0 ? (
                            <p className="empty-message">✅ No hay expedientes pendientes de procesamiento por retención.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="styled-table">
                                    <thead>
                                        <tr>
                                            <th>Expediente</th>
                                            <th>Serie / Subserie</th>
                                            <th>Fecha Cierre</th>
                                            <th>Retención</th>
                                            <th>Vencimiento</th>
                                            <th>Estado</th>
                                            <th>Disposición</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expedientes.map(exp => (
                                            <tr key={exp.id}>
                                                <td>
                                                    <strong>{exp.nombre_expediente}</strong>
                                                    <br />
                                                    <small className="text-muted">{exp.nombre_oficina}</small>
                                                </td>
                                                <td>
                                                    {exp.nombre_serie}
                                                    {exp.nombre_subserie && (
                                                        <><br /><small>{exp.nombre_subserie}</small></>
                                                    )}
                                                </td>
                                                <td>{formatDate(exp.fecha_cierre)}</td>
                                                <td>
                                                    G: {exp.retencion_gestion || 0}a
                                                    <br />
                                                    C: {exp.retencion_central || 0}a
                                                </td>
                                                <td>
                                                    {exp.estado_expediente === 'Cerrado en Gestión' 
                                                        ? formatDate(exp.fecha_fin_gestion)
                                                        : formatDate(exp.fecha_fin_central)
                                                    }
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${getEstadoClass(exp.estado_retencion)}`}>
                                                        {exp.estado_retencion}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getDisposicionClass(exp.disposicion_final)}`}>
                                                        {exp.disposicion_final || 'Sin definir'}
                                                    </span>
                                                </td>
                                                <td className="action-cell">
                                                    <PermissionGuard permission="retencion_procesar">
                                                        {exp.estado_retencion.includes('Gestión') && (
                                                            <button 
                                                                onClick={() => handleTransferir(exp)}
                                                                className="button button-secondary"
                                                                title="Transferir a Archivo Central"
                                                            >
                                                                📤 Transferir
                                                            </button>
                                                        )}
                                                        {exp.estado_retencion.includes('Vencido') && (
                                                            <button 
                                                                onClick={() => openProcesarModal(exp)}
                                                                className="button button-primary"
                                                            >
                                                                ⚙️ Procesar
                                                            </button>
                                                        )}
                                                    </PermissionGuard>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'historial' && (
                    <>
                        <h3>Historial de Procesamientos</h3>
                        {historial.length === 0 ? (
                            <p className="empty-message">No hay registros de procesamiento.</p>
                        ) : (
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Expediente</th>
                                        <th>Serie / Subserie</th>
                                        <th>Tipo Retención</th>
                                        <th>Disposición</th>
                                        <th>Acción</th>
                                        <th>Procesado por</th>
                                        <th>Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map(item => (
                                        <tr key={item.id}>
                                            <td>{formatDate(item.fecha_procesado)}</td>
                                            <td>{item.nombre_expediente}</td>
                                            <td>
                                                {item.nombre_serie}
                                                {item.nombre_subserie && <><br /><small>{item.nombre_subserie}</small></>}
                                            </td>
                                            <td>{item.tipo_retencion}</td>
                                            <td>
                                                <span className={`badge ${getDisposicionClass(item.disposicion_final)}`}>
                                                    {item.disposicion_final}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${item.estado === 'Eliminado' ? 'badge-danger' : 'badge-success'}`}>
                                                    {item.estado}
                                                </span>
                                            </td>
                                            <td>{item.procesado_por}</td>
                                            <td>{item.observaciones || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>

            {/* Modal de procesamiento */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                className="modal"
                overlayClassName="modal-overlay"
            >
                <h2>⚙️ Procesar Expediente</h2>
                {selectedExpediente && (
                    <div>
                        <div className="info-box" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <p><strong>Expediente:</strong> {selectedExpediente.nombre_expediente}</p>
                            <p><strong>Serie:</strong> {selectedExpediente.nombre_serie}</p>
                            {selectedExpediente.nombre_subserie && (
                                <p><strong>Subserie:</strong> {selectedExpediente.nombre_subserie}</p>
                            )}
                            <p><strong>Disposición Final TRD:</strong> 
                                <span className={`badge ${getDisposicionClass(selectedExpediente.disposicion_final)}`} style={{ marginLeft: '10px' }}>
                                    {selectedExpediente.disposicion_final || 'Sin definir'}
                                </span>
                            </p>
                        </div>

                        <div className="form-group">
                            <label>Acción a realizar *</label>
                            <select 
                                value={accion} 
                                onChange={(e) => setAccion(e.target.value)}
                                required
                            >
                                <option value="">-- Seleccione --</option>
                                <option value="Conservado">✅ Conservar (Archivo Histórico)</option>
                                <option value="Eliminado">🗑️ Eliminar</option>
                            </select>
                        </div>

                        {accion === 'Eliminado' && selectedExpediente.disposicion_final !== 'Eliminación' && (
                            <div className="alert alert-warning" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                                ⚠️ <strong>Advertencia:</strong> La disposición final de la TRD indica "{selectedExpediente.disposicion_final}", 
                                pero está seleccionando "Eliminar". Asegúrese de que esta acción es correcta.
                            </div>
                        )}

                        <div className="form-group">
                            <label>Observaciones</label>
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Justificación o notas adicionales..."
                                rows="3"
                            />
                        </div>

                        <div className="modal-actions">
                            <button 
                                onClick={handleProcesar}
                                className={`button ${accion === 'Eliminado' ? 'button-danger' : 'button-primary'}`}
                                disabled={!accion || procesando}
                            >
                                {procesando ? 'Procesando...' : `Confirmar: ${accion || 'Acción'}`}
                            </button>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="button"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RetencionDocumental;
