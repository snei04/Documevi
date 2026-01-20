import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const DocumentoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [documento, setDocumento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFileModal, setShowFileModal] = useState(false);

    useEffect(() => {
        const fetchDocumento = async () => {
            try {
                const res = await api.get(`/documentos/${id}`);
                setDocumento(res.data);
            } catch (error) {
                toast.error('Error al cargar el documento');
                navigate('/dashboard/documentos');
            } finally {
                setLoading(false);
            }
        };
        fetchDocumento();
    }, [id, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const parseUbicacionFisica = (ubicacion) => {
        if (!ubicacion) return null;
        const parts = ubicacion.split(' | ');
        return parts.map(part => {
            const [label, value] = part.split(': ');
            return { label, value };
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando documento...</p>
            </div>
        );
    }

    if (!documento) {
        return <div className="content-box">Documento no encontrado</div>;
    }

    const ubicacionParsed = parseUbicacionFisica(documento.ubicacion_fisica);

    return (
        <div>
            <div className="page-header">
                <h1>Detalle del Documento</h1>
                <button onClick={() => navigate(-1)} className="button">
                    ← Volver
                </button>
            </div>

            {/* Información Principal */}
            <div className="content-box">
                <h3>Información del Documento</h3>
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Radicado</label>
                        <span className="detail-value highlight">{documento.radicado}</span>
                    </div>
                    <div className="detail-item">
                        <label>Tipo de Soporte</label>
                        <span className={`badge ${documento.tipo_soporte === 'Físico' ? 'badge-warning' : documento.tipo_soporte === 'Híbrido' ? 'badge-info' : 'badge-success'}`}>
                            {documento.tipo_soporte}
                        </span>
                    </div>
                    <div className="detail-item">
                        <label>Fecha de Radicado</label>
                        <span>{formatDate(documento.fecha_radicado)}</span>
                    </div>
                    <div className="detail-item">
                        <label>Usuario Radicador</label>
                        <span>{documento.usuario_radicador || 'N/A'}</span>
                    </div>
                </div>
                <div className="detail-item full-width" style={{ marginTop: '15px' }}>
                    <label>Asunto</label>
                    <p className="detail-text">{documento.asunto}</p>
                </div>
            </div>

            {/* Clasificación TRD */}
            <div className="content-box">
                <h3>Clasificación TRD</h3>
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Dependencia</label>
                        <span>{documento.codigo_dependencia} - {documento.nombre_dependencia}</span>
                    </div>
                    <div className="detail-item">
                        <label>Oficina Productora</label>
                        <span>{documento.codigo_oficina} - {documento.nombre_oficina}</span>
                    </div>
                    <div className="detail-item">
                        <label>Serie</label>
                        <span>{documento.codigo_serie} - {documento.nombre_serie}</span>
                    </div>
                    <div className="detail-item">
                        <label>Subserie</label>
                        <span>{documento.codigo_subserie} - {documento.nombre_subserie}</span>
                    </div>
                </div>
            </div>

            {/* Expediente Asociado */}
            {documento.id_expediente && (
                <div className="content-box">
                    <h3>Expediente Asociado</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Expediente</label>
                            <Link to={`/dashboard/expedientes/${documento.id_expediente}`} className="link-primary">
                                {documento.nombre_expediente}
                            </Link>
                        </div>
                        <div className="detail-item">
                            <label>Orden de Foliado</label>
                            <span>{documento.orden_foliado}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Ubicación Física */}
            {(documento.tipo_soporte === 'Físico' || documento.tipo_soporte === 'Híbrido') && (
                <div className="content-box">
                    <h3>📍 Ubicación Física</h3>
                    {ubicacionParsed && ubicacionParsed.length > 0 ? (
                        <div className="ubicacion-fisica-grid">
                            {ubicacionParsed.map((item, index) => (
                                <div key={index} className="ubicacion-item">
                                    <label>{item.label}</label>
                                    <span className="ubicacion-value">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">Sin ubicación física registrada</p>
                    )}
                    {documento.ubicacion_fisica && (
                        <div className="ubicacion-completa" style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                            <small><strong>Ubicación completa:</strong> {documento.ubicacion_fisica}</small>
                        </div>
                    )}
                </div>
            )}

            {/* Datos del Remitente */}
            <div className="content-box">
                <h3>Datos del Remitente</h3>
                <div className="detail-grid">
                    <div className="detail-item">
                        <label>Nombre</label>
                        <span>{documento.remitente_nombre || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Identificación</label>
                        <span>{documento.remitente_identificacion || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Dirección</label>
                        <span>{documento.remitente_direccion || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Campos Personalizados */}
            {documento.campos_personalizados && documento.campos_personalizados.length > 0 && (
                <div className="content-box">
                    <h3>Metadatos Adicionales</h3>
                    <div className="detail-grid">
                        {documento.campos_personalizados.map((campo, index) => (
                            <div key={index} className="detail-item">
                                <label>{campo.nombre_campo}</label>
                                <span>{campo.valor}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Archivo Digital */}
            {(documento.tipo_soporte === 'Electrónico' || documento.tipo_soporte === 'Híbrido') && documento.path_archivo && (
                <div className="content-box">
                    <h3>Archivo Digital</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Nombre del Archivo</label>
                            <span>{documento.nombre_archivo_original || 'Archivo adjunto'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Acción</label>
                            <button 
                                onClick={() => setShowFileModal(true)}
                                className="button button-primary"
                            >
                                📄 Ver Documento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ver el archivo */}
            {showFileModal && documento.path_archivo && (() => {
                const fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/${documento.path_archivo}`;
                const fileName = documento.nombre_archivo_original || documento.path_archivo;
                const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
                const isPdf = /\.pdf$/i.test(fileName);
                
                return (
                    <div 
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 9999
                        }}
                        onClick={() => setShowFileModal(false)}
                    >
                        <div 
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                width: '95%',
                                height: '95%',
                                maxWidth: '1200px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 25px 80px rgba(0,0,0,0.4)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header del Modal */}
                            <div style={{
                                padding: '15px 20px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#f7fafc',
                                flexShrink: 0
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#2d3748' }}>📄 {fileName}</h3>
                                    <small style={{ color: '#718096' }}>Radicado: {documento.radicado}</small>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <a 
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#3182ce',
                                            color: '#fff',
                                            textDecoration: 'none',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ↗ Abrir en nueva pestaña
                                    </a>
                                    <a 
                                        href={fileUrl}
                                        download={fileName}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#38a169',
                                            color: '#fff',
                                            textDecoration: 'none',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ⬇ Descargar
                                    </a>
                                    <button 
                                        onClick={() => setShowFileModal(false)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#e2e8f0',
                                            color: '#4a5568',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ✕ Cerrar
                                    </button>
                                </div>
                            </div>

                            {/* Contenido - imagen o iframe según tipo */}
                            <div style={{ 
                                flex: 1, 
                                overflow: 'auto', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                backgroundColor: '#f0f0f0',
                                padding: '20px'
                            }}>
                                {isImage ? (
                                    <img 
                                        src={fileUrl}
                                        alt={fileName}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                            borderRadius: '4px'
                                        }}
                                    />
                                ) : isPdf ? (
                                    <iframe 
                                        src={fileUrl}
                                        title="Visor de documento"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
                                            borderRadius: '4px'
                                        }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#666' }}>
                                        <p style={{ fontSize: '48px', marginBottom: '20px' }}>📄</p>
                                        <p>Este tipo de archivo no se puede previsualizar.</p>
                                        <p>Use los botones de arriba para abrir o descargar.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Firma Digital */}
            {documento.firma_hash && (
                <div className="content-box">
                    <h3>Firma Digital</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Fecha de Firma</label>
                            <span>{formatDate(documento.fecha_firma)}</span>
                        </div>
                        <div className="detail-item">
                            <label>Hash de Firma</label>
                            <span className="hash-value">{documento.firma_hash}</span>
                        </div>
                    </div>
                    {documento.firma_imagen && (
                        <div style={{ marginTop: '15px' }}>
                            <label>Imagen de Firma</label>
                            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '5px', display: 'inline-block' }}>
                                <img src={documento.firma_imagen} alt="Firma digital" style={{ maxHeight: '100px' }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }
                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .detail-item label {
                    font-weight: 600;
                    color: #666;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                }
                .detail-item span, .detail-item p {
                    font-size: 1rem;
                    color: #333;
                }
                .detail-value.highlight {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #2c5282;
                }
                .detail-text {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 0;
                }
                .badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .badge-success { background: #c6f6d5; color: #276749; }
                .badge-warning { background: #feebc8; color: #c05621; }
                .badge-info { background: #bee3f8; color: #2b6cb0; }
                .ubicacion-fisica-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                }
                .ubicacion-item {
                    background: #e8f4fd;
                    padding: 12px;
                    border-radius: 8px;
                    text-align: center;
                }
                .ubicacion-item label {
                    display: block;
                    font-size: 0.75rem;
                    color: #666;
                    margin-bottom: 5px;
                }
                .ubicacion-value {
                    font-size: 1.1rem;
                    font-weight: bold;
                    color: #2c5282;
                }
                .hash-value {
                    font-family: monospace;
                    font-size: 0.85rem;
                    word-break: break-all;
                }
                .link-primary {
                    color: #3182ce;
                    text-decoration: none;
                    font-weight: 500;
                }
                .link-primary:hover {
                    text-decoration: underline;
                }
                .text-muted {
                    color: #718096;
                    font-style: italic;
                }
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 50px;
                }
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e2e8f0;
                    border-top-color: #3182ce;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .full-width {
                    grid-column: 1 / -1;
                }
            `}</style>
        </div>
    );
};

export default DocumentoDetalle;
