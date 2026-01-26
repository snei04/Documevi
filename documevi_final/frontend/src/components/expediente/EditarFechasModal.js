import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        maxWidth: '90%',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1000
    }
};

const EditarFechasModal = ({ isOpen, onRequestClose, expediente, onSubmit }) => {
    const [fechaApertura, setFechaApertura] = useState('');
    const [fechaCierre, setFechaCierre] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (expediente) {
            // Formatear fechas para el input type="datetime-local"
            const formatForInput = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                // Ajustar a zona horaria local o mantener UTC según lógica de negocio.
                // Aquí usamos ISO string cortado para simplificar, pero idealmente manejar timezone.
                return date.toISOString().slice(0, 16); 
            };

            setFechaApertura(formatForInput(expediente.fecha_apertura));
            setFechaCierre(formatForInput(expediente.fecha_cierre));
        }
    }, [expediente, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!fechaApertura) {
            setError('La fecha de apertura es obligatoria.');
            return;
        }

        if (fechaCierre && new Date(fechaCierre) < new Date(fechaApertura)) {
            setError('La fecha de cierre no puede ser anterior a la fecha de apertura.');
            return;
        }

        if (window.confirm('¿Está seguro de que desea modificar las fechas del expediente? Esta acción quedará registrada en la auditoría.')) {
            onSubmit({
                fecha_apertura: fechaApertura,
                fecha_cierre: fechaCierre || null
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="Editar Fechas del Expediente"
            ariaHideApp={false}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2d3748' }}>Editar Fechas del Expediente</h2>
                <button 
                    onClick={onRequestClose}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0aec0' }}
                >
                    &times;
                </button>
            </div>

            {error && (
                <div style={{ backgroundColor: '#fed7d7', color: '#c53030', padding: '0.75rem', borderRadius: '0.25rem', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>
                        Fecha de Apertura <span style={{ color: '#e53e3e' }}>*</span>
                    </label>
                    <input
                        type="datetime-local"
                        value={fechaApertura}
                        onChange={(e) => setFechaApertura(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#4a5568' }}>
                        Fecha de Cierre
                    </label>
                    <input
                        type="datetime-local"
                        value={fechaCierre}
                        onChange={(e) => setFechaCierre(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                    />
                    <small style={{ color: '#718096', display: 'block', marginTop: '0.25rem' }}>
                        Deje en blanco si el expediente aún no tiene fecha de cierre.
                    </small>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={onRequestClose}
                        className="button"
                        style={{ backgroundColor: '#edf2f7', color: '#4a5568' }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="button button-primary"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditarFechasModal;
