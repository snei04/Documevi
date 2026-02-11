import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from '../../api/axios';
import '../Dashboard.css';

/**
 * PaqueteAsignacion: Componente para asignar un expediente a un paquete.
 * Se muestra dentro del detalle del expediente.
 * 
 * Props:
 *   - expediente: { id, id_paquete, numero_paquete, estado_paquete, id_oficina_productora }
 *   - onUpdate: callback para refrescar los datos del expediente
 */
const PaqueteAsignacion = ({ expediente, onUpdate }) => {
    const [paqueteActivo, setPaqueteActivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [observaciones, setObservaciones] = useState('');

    const fetchPaqueteActivo = useCallback(async () => {
        try {
            // Ya no depende de oficina, obtiene el global
            const res = await axios.get(`/paquetes/activo`);
            setPaqueteActivo(res.data);
        } catch (err) {
            console.error('Error al obtener paquete activo:', err);
        }
    }, []);

    useEffect(() => {
        if (!expediente?.id_paquete) {
            fetchPaqueteActivo();
        }
    }, [expediente, fetchPaqueteActivo]);

    const handleAsignar = async (marcarLleno = false) => {
        if (!paqueteActivo) return;
        setLoading(true);
        try {
            const res = await axios.post('/paquetes/asignar-expediente', {
                id_expediente: expediente.id,
                id_paquete: paqueteActivo.id,
                marcar_paquete_lleno: marcarLleno,
                observaciones: marcarLleno ? (observaciones || null) : null
            });
            toast.success(res.data.msg);
            setShowConfirmModal(false);
            setObservaciones('');
            if (onUpdate) onUpdate();
            if (res.data.nuevo_paquete) {
                setPaqueteActivo(res.data.nuevo_paquete);
            }
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al asignar expediente.');
        } finally {
            setLoading(false);
        }
    };

    // Si ya está asignado, mostrar info del paquete actual
    if (expediente?.id_paquete) {
        return (
            <div className="content-box" style={{ borderLeft: '4px solid #38a169' }}>
                <h3>📦 Paquete Asignado</h3>
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Paquete</label>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#2b6cb0' }}>
                            {expediente.numero_paquete || `#${expediente.id_paquete}`}
                        </span>
                    </div>
                    <div className="detail-item">
                        <label>Estado</label>
                        <span className={`badge badge-${expediente.estado_paquete === 'Activo' ? 'success' : 'secondary'}`}>
                            {expediente.estado_paquete || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Si no está asignado, mostrar control de asignación
    return (
        <div className="content-box" style={{ borderLeft: '4px solid #ed8936' }}>
            <h3>📦 Asignar a Paquete Global</h3>

            {paqueteActivo ? (
                <div>
                    <div style={{
                        background: '#fffff0',
                        border: '1px solid #ecc94b',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#2b6cb0' }}>
                                    Paquete #: {paqueteActivo.numero_paquete}
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#718096', marginTop: '4px' }}>
                                    Expedientes actuales en el sistema: <strong>{paqueteActivo.expedientes_actuales}</strong>
                                </div>
                            </div>
                            <span className="badge badge-success">Activo</span>
                        </div>

                        {paqueteActivo.expedientes_actuales >= 20 && (
                            <div style={{
                                marginTop: '10px',
                                padding: '8px',
                                background: '#fed7d7',
                                borderRadius: '6px',
                                color: '#c53030',
                                fontSize: '0.9em'
                            }}>
                                ⚠️ Este paquete tiene {paqueteActivo.expedientes_actuales} expedientes (límite recomendado: 20).
                                Considere cerrarlo.
                            </div>
                        )}
                    </div>

                    <button
                        className="button button-primary"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={loading}
                        style={{ width: '100%', padding: '12px' }}
                    >
                        {loading ? 'Asignando...' : `Asignar a Paquete Global ${paqueteActivo.numero_paquete}`}
                    </button>
                </div>
            ) : (
                <p style={{ color: '#718096' }}>
                    Cargando paquete activo del sistema...
                </p>
            )}

            {/* Modal de confirmación */}
            {showConfirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '28px',
                        maxWidth: '480px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>
                            ¿Este paquete alcanzó su límite?
                        </h3>
                        <p style={{ color: '#4a5568', fontSize: '0.95em', marginBottom: '16px' }}>
                            Si marca "Sí", el paquete <strong>{paqueteActivo?.numero_paquete}</strong> se cerrará
                            y se creará automáticamente el siguiente paquete.
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9em', color: '#718096' }}>
                                Observaciones (opcional)
                            </label>
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Ej: Paquete completo con 15 expedientes"
                                style={{
                                    width: '100%',
                                    minHeight: '60px',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                className="button"
                                onClick={() => setShowConfirmModal(false)}
                                style={{ backgroundColor: '#e2e8f0', color: '#2d3748' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-primary"
                                onClick={() => handleAsignar(false)}
                                disabled={loading}
                                style={{ backgroundColor: '#38a169' }}
                            >
                                No, solo asignar
                            </button>
                            <button
                                className="button button-danger"
                                onClick={() => handleAsignar(true)}
                                disabled={loading}
                            >
                                Sí, cerrar paquete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaqueteAsignacion;
