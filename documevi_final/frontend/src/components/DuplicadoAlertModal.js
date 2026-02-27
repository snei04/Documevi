import React from 'react';
import Modal from 'react-modal';
import './Dashboard.css';

Modal.setAppElement('#root');

/**
 * DuplicadoAlertModal - Modal simplificado para el nuevo flujo de creación de expedientes.
 * Muestra información del expediente duplicado encontrado y ofrece 3 opciones:
 * 1. Anexar documento → redirige al expediente existente
 * 2. Crear Nuevo de todas formas → continúa con la creación
 * 3. Cancelar → cierra el modal
 */
const DuplicadoAlertModal = ({
    isOpen,
    onClose,
    duplicadoInfo,
    onConfirmarAnexion,
    onForzarCreacion,
    loading
}) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-CO');
    };

    if (!duplicadoInfo) return null;

    const { campo_duplicado, expediente_existente } = duplicadoInfo;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Expediente Duplicado Detectado"
            className="modal"
            overlayClassName="modal-overlay"
            style={{
                content: {
                    maxWidth: '600px',
                    margin: 'auto'
                }
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '48px' }}>⚠️</span>
                <h2 style={{ color: '#e67e22', margin: '10px 0' }}>
                    Expediente Existente Detectado
                </h2>
            </div>

            <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                Ya existe un expediente con el mismo valor en el campo{' '}
                <strong>"{campo_duplicado?.nombre}"</strong>:{' '}
                <strong style={{ color: '#3498db' }}>{campo_duplicado?.valor}</strong>
            </p>

            <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                    📁 Expediente Encontrado
                </h4>
                <table style={{ width: '100%', fontSize: '14px' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '5px 0', fontWeight: 'bold', width: '40%' }}>Nombre:</td>
                            <td>{expediente_existente?.nombre_expediente}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Serie:</td>
                            <td>{expediente_existente?.nombre_serie}</td>
                        </tr>
                        {expediente_existente?.nombre_subserie && (
                            <tr>
                                <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Subserie:</td>
                                <td>{expediente_existente?.nombre_subserie}</td>
                            </tr>
                        )}
                        <tr>
                            <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Fecha Apertura:</td>
                            <td>{formatDate(expediente_existente?.fecha_apertura)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Estado:</td>
                            <td>
                                <span className={`status-badge ${expediente_existente?.estado === 'En tramite' ? 'status-active' : 'status-warning'}`}>
                                    {expediente_existente?.estado}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Responsable:</td>
                            <td>{expediente_existente?.responsable || '-'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Ubicación Física:</td>
                            <td>
                                Paquete: {expediente_existente?.numero_paquete || 'No asignado'} <br />
                                Carpeta: {expediente_existente?.codigo_carpeta || 'No asignada'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
                ¿Qué desea hacer?
            </p>

            <div className="modal-actions" style={{ justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                    type="button"
                    onClick={onClose}
                    className="button"
                    disabled={loading}
                >
                    ❌ Cancelar
                </button>
                <button
                    type="button"
                    onClick={onConfirmarAnexion}
                    className="button button-primary"
                    disabled={loading}
                >
                    📎 Anexar al Existente
                </button>
                {onForzarCreacion && (
                    <button
                        type="button"
                        onClick={onForzarCreacion}
                        className="button"
                        disabled={loading}
                        style={{
                            backgroundColor: '#f39c12',
                            color: 'white',
                            border: 'none'
                        }}
                    >
                        ➕ Crear Nuevo de todas formas
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default DuplicadoAlertModal;
