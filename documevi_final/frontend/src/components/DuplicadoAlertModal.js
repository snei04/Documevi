import React, { useState } from 'react';
import Modal from 'react-modal';
import './Dashboard.css';

Modal.setAppElement('#root');

const DuplicadoAlertModal = ({ 
    isOpen, 
    onClose, 
    duplicadoInfo, 
    onConfirmarAnexion,
    loading 
}) => {
    const [fechaApertura, setFechaApertura] = useState('');
    const [tipoSoporte, setTipoSoporte] = useState('Electronico');
    const [observaciones, setObservaciones] = useState('');
    const [confirmado, setConfirmado] = useState(false);
    const [paso, setPaso] = useState(1);

    const handleContinuar = () => {
        setPaso(2);
    };

    const handleAnexar = () => {
        if (!fechaApertura) {
            alert('La fecha de apertura del documento es obligatoria');
            return;
        }
        if (!confirmado) {
            alert('Debe confirmar que el documento pertenece al expediente correcto');
            return;
        }
        onConfirmarAnexion({
            fecha_apertura_documento: fechaApertura,
            tipo_soporte: tipoSoporte,
            observaciones
        });
    };

    const handleClose = () => {
        setPaso(1);
        setFechaApertura('');
        setTipoSoporte('Electronico');
        setObservaciones('');
        setConfirmado(false);
        onClose();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-CO');
    };

    if (!duplicadoInfo) return null;

    const { campo_duplicado, expediente_existente } = duplicadoInfo;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
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
            {paso === 1 ? (
                <>
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
                            </tbody>
                        </table>
                    </div>

                    <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
                        ¿Desea anexar el documento al expediente existente?
                    </p>

                    <div className="modal-actions" style={{ justifyContent: 'center' }}>
                        <button 
                            type="button" 
                            onClick={handleClose} 
                            className="button"
                        >
                            ❌ No, cancelar
                        </button>
                        <button 
                            type="button" 
                            onClick={handleContinuar} 
                            className="button button-primary"
                        >
                            ✅ Si, anexar documento
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <span style={{ fontSize: '48px' }}>📎</span>
                        <h2 style={{ margin: '10px 0' }}>
                            Anexar Documento al Expediente
                        </h2>
                    </div>

                    <p style={{ marginBottom: '15px' }}>
                        <strong>Expediente destino:</strong> {expediente_existente?.nombre_expediente}
                    </p>

                    <div style={{ 
                        background: '#fff3cd', 
                        border: '1px solid #ffc107', 
                        borderRadius: '8px', 
                        padding: '15px',
                        marginBottom: '20px'
                    }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                            ⚠️ <strong>Verificacion de identidad:</strong> Por favor confirme que el documento 
                            corresponde al registro correcto antes de continuar.
                        </p>
                    </div>

                    <div className="form-group">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={confirmado} 
                                onChange={(e) => setConfirmado(e.target.checked)}
                                style={{ marginRight: '8px' }}
                            />
                            Confirmo que el documento pertenece a este expediente
                        </label>
                    </div>

                    <div className="form-group">
                        <label htmlFor="fecha_apertura">Fecha de Apertura del Documento *</label>
                        <input
                            type="date"
                            id="fecha_apertura"
                            value={fechaApertura}
                            onChange={(e) => setFechaApertura(e.target.value)}
                            required
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <small style={{ color: '#6c757d' }}>
                            Fecha en que se creo o recibio el documento/historia
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="tipo_soporte">Tipo de Soporte *</label>
                        <select
                            id="tipo_soporte"
                            value={tipoSoporte}
                            onChange={(e) => setTipoSoporte(e.target.value)}
                        >
                            <option value="Electronico">Electronico</option>
                            <option value="Fisico">Fisico</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="observaciones">Observaciones (opcional)</label>
                        <textarea
                            id="observaciones"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            rows="3"
                            placeholder="Documento anexado por coincidencia de campo..."
                        />
                    </div>

                    <div className="modal-actions" style={{ justifyContent: 'center' }}>
                        <button 
                            type="button" 
                            onClick={() => setPaso(1)} 
                            className="button"
                            disabled={loading}
                        >
                            ← Volver
                        </button>
                        <button 
                            type="button" 
                            onClick={handleAnexar} 
                            className="button button-primary"
                            disabled={loading || !confirmado || !fechaApertura}
                        >
                            {loading ? 'Anexando...' : '📎 Confirmar Anexion'}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default DuplicadoAlertModal;
