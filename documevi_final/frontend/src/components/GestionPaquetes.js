import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from '../api/axios';
import './Dashboard.css';

const GestionPaquetes = () => {
    const [paquetes, setPaquetes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedPaquete, setExpandedPaquete] = useState(null);
    const [expedientesPaquete, setExpedientesPaquete] = useState([]);
    const [showObsModal, setShowObsModal] = useState(null);
    const [observaciones, setObservaciones] = useState('');
    const [showCrearModal, setShowCrearModal] = useState(false);

    const fetchPaquetes = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            const res = await axios.get('/paquetes', { params });
            setPaquetes(res.data.paquetes || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            toast.error('Error al cargar paquetes');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchPaquetes(); }, [fetchPaquetes]);

    const handleVerExpedientes = async (id_paquete) => {
        if (expandedPaquete === id_paquete) {
            setExpandedPaquete(null);
            return;
        }
        try {
            const res = await axios.get(`/paquetes/${id_paquete}/expedientes`);
            setExpedientesPaquete(res.data || []);
            setExpandedPaquete(id_paquete);
        } catch (err) {
            toast.error('Error al cargar expedientes');
        }
    };

    const handleMarcarLleno = async (id_paquete) => {
        try {
            const res = await axios.post(`/paquetes/${id_paquete}/marcar-lleno`, {
                observaciones: observaciones || null
            });
            toast.success(res.data.msg);
            setShowObsModal(null);
            setObservaciones('');
            fetchPaquetes();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error');
        }
    };

    const handleReabrir = async (id_paquete) => {
        if (!window.confirm('¿Reabrir este paquete?')) return;
        try {
            const res = await axios.post(`/paquetes/${id_paquete}/reabrir`);
            toast.success(res.data.msg);
            fetchPaquetes();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error');
        }
    };

    const handleCrearPaquete = async () => {
        try {
            // Ya no requiere oficina, crea/obtiene el global
            const res = await axios.get(`/paquetes/activo`);
            toast.success(`Paquete ${res.data.numero_paquete} verificado/creado como activo.`);
            setShowCrearModal(false);
            fetchPaquetes();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear paquete');
        }
    };

    const getEstadoBadge = (estado) => {
        const colors = {
            'Activo': { bg: '#c6f6d5', color: '#22543d' },
            'Lleno': { bg: '#fed7d7', color: '#c53030' },
            'Cerrado': { bg: '#e2e8f0', color: '#4a5568' }
        };
        const s = colors[estado] || colors['Cerrado'];
        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.85em',
                fontWeight: '600',
                backgroundColor: s.bg,
                color: s.color
            }}>
                {estado}
            </span>
        );
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>📦 Gestión de Paquetes (Global)</h1>
                    <p style={{ color: '#718096' }}>Administre los paquetes de expedientes del sistema</p>
                </div>
                <button
                    className="button button-primary"
                    onClick={() => setShowCrearModal(true)}
                    style={{ padding: '10px 20px', fontSize: '0.95em' }}
                >
                    + Verificar Paquete Activo
                </button>
            </div>

            {/* Tabla */}
            {loading ? (
                <div className="content-box"><p>Cargando paquetes...</p></div>
            ) : paquetes.length === 0 ? (
                <div className="content-box">
                    <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>
                        No se encontraron paquetes
                    </p>
                </div>
            ) : (
                <div className="content-box" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f7fafc' }}>
                                <th style={thStyle}>Paquete</th>
                                <th style={thStyle}>Expedientes</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Fecha Creación</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paquetes.map(p => (
                                <React.Fragment key={p.id}>
                                    <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                                        <td style={tdStyle}>
                                            <strong style={{ color: '#2b6cb0' }}>{p.numero_paquete}</strong>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: p.expedientes_actuales >= 20 ? '#c53030' : '#2d3748'
                                            }}>
                                                {p.expedientes_actuales}
                                            </span>
                                            {p.expedientes_actuales >= 20 && <span style={{ color: '#c53030' }}> ⚠️</span>}
                                        </td>
                                        <td style={tdStyle}>{getEstadoBadge(p.estado)}</td>
                                        <td style={tdStyle}>
                                            {new Date(p.fecha_creacion).toLocaleDateString()}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => handleVerExpedientes(p.id)}
                                                    className="button"
                                                    style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8' }}
                                                >
                                                    {expandedPaquete === p.id ? '▲ Cerrar' : '▼ Ver expedientes'}
                                                </button>
                                                {p.estado === 'Activo' && (
                                                    <button
                                                        onClick={() => setShowObsModal(p.id)}
                                                        className="button button-danger"
                                                        style={{ fontSize: '0.85em', padding: '4px 10px' }}
                                                    >
                                                        Marcar lleno
                                                    </button>
                                                )}
                                                {(p.estado === 'Lleno' || p.estado === 'Cerrado') && (
                                                    <button
                                                        onClick={() => handleReabrir(p.id)}
                                                        className="button"
                                                        style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#f0fff4', color: '#22543d', border: '1px solid #c6f6d5' }}
                                                    >
                                                        Reabrir
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedPaquete === p.id && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '0 16px 16px', backgroundColor: '#f7fafc' }}>
                                                {expedientesPaquete.length === 0 ? (
                                                    <p style={{ color: '#a0aec0', textAlign: 'center', padding: '12px' }}>
                                                        Sin expedientes asignados
                                                    </p>
                                                ) : (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                                                        <thead>
                                                            <tr style={{ backgroundColor: '#edf2f7' }}>
                                                                <th style={{ ...thStyle, fontSize: '0.85em' }}>Expediente</th>
                                                                <th style={{ ...thStyle, fontSize: '0.85em' }}>Carpeta</th>
                                                                <th style={{ ...thStyle, fontSize: '0.85em' }}>Estado</th>
                                                                <th style={{ ...thStyle, fontSize: '0.85em' }}>Apertura</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {expedientesPaquete.map(exp => (
                                                                <tr key={exp.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                                    <td style={tdStyle}>{exp.nombre_expediente}</td>
                                                                    <td style={tdStyle}>{exp.codigo_carpeta || '-'}</td>
                                                                    <td style={tdStyle}>{exp.estado}</td>
                                                                    <td style={tdStyle}>
                                                                        {exp.fecha_apertura ? new Date(exp.fecha_apertura).toLocaleDateString() : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                                {p.observaciones && (
                                                    <p style={{ fontSize: '0.85em', color: '#718096', marginTop: '8px' }}>
                                                        <strong>Observaciones:</strong> {p.observaciones}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="button"
                                style={{ fontSize: '0.9em' }}
                            >
                                ← Anterior
                            </button>
                            <span style={{ padding: '8px 16px', color: '#4a5568' }}>
                                Página {page} de {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="button"
                                style={{ fontSize: '0.9em' }}
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de observaciones para marcar lleno */}
            {showObsModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '12px', padding: '28px',
                        maxWidth: '440px', width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>📦 Marcar Paquete como Lleno</h3>
                        <p style={{ color: '#4a5568', fontSize: '0.95em' }}>
                            Se cerrará el paquete y se creará automáticamente el siguiente.
                        </p>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9em', color: '#718096' }}>
                                Observaciones (opcional)
                            </label>
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Ej: Paquete completo con 15 expedientes voluminosos"
                                style={{
                                    width: '100%', minHeight: '70px', padding: '10px',
                                    borderRadius: '6px', border: '1px solid #e2e8f0', resize: 'vertical'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                className="button"
                                onClick={() => { setShowObsModal(null); setObservaciones(''); }}
                                style={{ backgroundColor: '#e2e8f0', color: '#2d3748' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-danger"
                                onClick={() => handleMarcarLleno(showObsModal)}
                            >
                                Confirmar y Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal crear paquete */}
            {showCrearModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '12px', padding: '28px',
                        maxWidth: '440px', width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>📦 Verificar/Crear Paquete</h3>
                        <p style={{ color: '#4a5568', fontSize: '0.95em' }}>
                            Se verificará si existe un paquete activo. Si no, se creará uno nuevo automáticamente siguiendo el consecutivo global.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                className="button"
                                onClick={() => setShowCrearModal(false)}
                                style={{ backgroundColor: '#e2e8f0', color: '#2d3748' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-primary"
                                onClick={handleCrearPaquete}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '0.9em', color: '#4a5568' };
const tdStyle = { padding: '10px 16px', fontSize: '0.9em' };

export default GestionPaquetes;
