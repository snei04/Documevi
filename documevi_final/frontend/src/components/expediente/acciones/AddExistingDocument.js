import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';

/**
 * Componente para buscar y relacionar documentos existentes a un expediente.
 * Permite buscar por radicado o asunto, previsualizar el documento y vincularlo.
 *
 * @param {Object} expediente - Objeto del expediente actual al que se vinculará el documento.
 * @param {Function} onDataChange - Callback para refrescar los datos del expediente padre tras una actualización.
 * @param {Array} documentosDisponibles - Lista de documentos disponibles para ser vinculados.
 */
const AddExistingDocument = ({ expediente, onDataChange, documentosDisponibles }) => {
    const [selectedDocumento, setSelectedDocumento] = useState('');
    const [requiereFirma, setRequiereFirma] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedDocInfo, setSelectedDocInfo] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Filtrar documentos según término de búsqueda
    const filteredDocumentos = documentosDisponibles.filter(doc =>
        doc.radicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.asunto.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectDoc = (doc) => {
        setSelectedDocumento(doc.id);
        setSelectedDocInfo(doc);
        setSearchTerm(doc.radicado);
        setShowDropdown(false);
    };

    const handleClearSelection = () => {
        setSelectedDocumento('');
        setSelectedDocInfo(null);
        setSearchTerm('');
    };

    const handlePreviewDoc = (doc, e) => {
        e.stopPropagation();
        setPreviewDoc(doc);
        setShowPreviewModal(true);
    };

    const closePreviewModal = () => {
        setPreviewDoc(null);
        setShowPreviewModal(false);
    };

    const handleAddDocumento = async (e) => {
        e.preventDefault();
        if (!selectedDocumento) return toast.warn('Por favor, seleccione un documento.');
        try {
            await api.post(`/expedientes/${expediente.id}/documentos`, { id_documento: selectedDocumento, requiere_firma: requiereFirma });
            toast.success('Documento añadido con éxito.');
            handleClearSelection();
            setRequiereFirma(false);
            onDataChange();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al añadir el documento.');
        }
    };

    // Permitir agregar documentos si está en trámite o si es expediente físico (incluso cerrado)
    const esCerrado = expediente.estado === 'Cerrado en Gestión' || expediente.estado === 'Cerrado en Central';
    const esFisico = expediente.tipo_soporte === 'Físico';
    if (expediente.estado !== 'En trámite' && !(esFisico && esCerrado)) return null;

    return (
        <div className="content-box">
            <h3>Añadir Documento al Expediente</h3>
            {esCerrado && (
                <div style={{
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '6px',
                    padding: '10px',
                    marginBottom: '15px',
                    fontSize: '13px'
                }}>
                    ⚠️ <strong>Expediente cerrado ({expediente.estado}):</strong> Se permite anexar documentos porque es de soporte físico.
                    Esta acción quedará registrada en auditoría.
                </div>
            )}
            <form onSubmit={handleAddDocumento}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Buscar por radicado o asunto..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                                if (!e.target.value) handleClearSelection();
                            }}
                            onFocus={() => setShowDropdown(true)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: selectedDocInfo ? '2px solid #38a169' : '1px solid #ccc',
                                borderRadius: '6px',
                                fontSize: '14px'
                            }}
                        />
                        {selectedDocInfo && (
                            <button
                                type="button"
                                onClick={handleClearSelection}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    color: '#666'
                                }}
                            >
                                ✕
                            </button>
                        )}
                        {showDropdown && searchTerm && !selectedDocInfo && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                backgroundColor: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '0 0 6px 6px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                zIndex: 1000
                            }}>
                                {filteredDocumentos.length > 0 ? (
                                    filteredDocumentos.slice(0, 10).map(doc => (
                                        <div
                                            key={doc.id}
                                            onClick={() => handleSelectDoc(doc)}
                                            style={{
                                                padding: '10px 12px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #eee',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                        >
                                            <div>
                                                <strong style={{ color: '#2c5282' }}>{doc.radicado}</strong>
                                                <span style={{ color: '#666', marginLeft: '10px' }}>
                                                    {doc.asunto.length > 40 ? doc.asunto.substring(0, 40) + '...' : doc.asunto}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => handlePreviewDoc(doc, e)}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: '12px',
                                                    backgroundColor: '#3182ce',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Ver detalles"
                                            >
                                                👁️ Ver
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '10px 12px', color: '#999', textAlign: 'center' }}>
                                        No se encontraron documentos
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input type="checkbox" checked={requiereFirma} onChange={(e) => setRequiereFirma(e.target.checked)} />
                        ¿Requiere Firma?
                    </label>

                    <button type="submit" className="button" disabled={!selectedDocumento}>
                        Añadir
                    </button>
                </div>

                {selectedDocInfo && (
                    <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: '#f0fff4',
                        borderRadius: '6px',
                        border: '1px solid #9ae6b4'
                    }}>
                        <strong>Documento seleccionado:</strong> {selectedDocInfo.radicado} - {selectedDocInfo.asunto}
                    </div>
                )}
            </form>

            {/* Modal de Vista Previa del Documento */}
            {showPreviewModal && previewDoc && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}
                    onClick={closePreviewModal}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '0',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header del Modal */}
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#f7fafc'
                        }}>
                            <h3 style={{ margin: 0, color: '#2d3748' }}>📄 Detalle del Documento</h3>
                            <button
                                onClick={closePreviewModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#718096'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(80vh - 140px)' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    backgroundColor: previewDoc.tipo_soporte === 'Físico' ? '#feebc8' : previewDoc.tipo_soporte === 'Híbrido' ? '#bee3f8' : '#c6f6d5',
                                    color: previewDoc.tipo_soporte === 'Físico' ? '#c05621' : previewDoc.tipo_soporte === 'Híbrido' ? '#2b6cb0' : '#276749',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {previewDoc.tipo_soporte || 'Electrónico'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Radicado</label>
                                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: 'bold', color: '#2c5282' }}>{previewDoc.radicado}</p>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Asunto</label>
                                    <p style={{ margin: '5px 0 0', color: '#2d3748' }}>{previewDoc.asunto}</p>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Fecha de Radicado</label>
                                    <p style={{ margin: '5px 0 0', color: '#2d3748' }}>
                                        {previewDoc.fecha_radicado ? new Date(previewDoc.fecha_radicado).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>

                                {(previewDoc.tipo_soporte === 'Físico' || previewDoc.tipo_soporte === 'Híbrido') && (
                                    <div style={{
                                        backgroundColor: '#e8f4fd',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        border: '1px solid #bee3f8'
                                    }}>
                                        <label style={{ fontSize: '12px', color: '#2b6cb0', textTransform: 'uppercase', fontWeight: '600' }}>
                                            📍 Ubicación Física
                                        </label>
                                        <p style={{ margin: '5px 0 0', color: '#2c5282', fontWeight: '500' }}>
                                            {previewDoc.ubicacion_fisica || 'Sin ubicación registrada'}
                                        </p>
                                    </div>
                                )}

                                {previewDoc.remitente_nombre && (
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>Remitente</label>
                                        <p style={{ margin: '5px 0 0', color: '#2d3748' }}>{previewDoc.remitente_nombre}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer del Modal */}
                        <div style={{
                            padding: '15px 20px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            backgroundColor: '#f7fafc'
                        }}>
                            <button
                                onClick={() => {
                                    handleSelectDoc(previewDoc);
                                    closePreviewModal();
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#38a169',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                ✓ Seleccionar este documento
                            </button>
                            <button
                                onClick={closePreviewModal}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#e2e8f0',
                                    color: '#4a5568',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddExistingDocument;
