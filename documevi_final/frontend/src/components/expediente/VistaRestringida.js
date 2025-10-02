import React, { useState } from 'react';

const VistaRestringida = ({ expediente, onSolicitarPrestamo }) => {
    const [showPrestamoForm, setShowPrestamoForm] = useState(false);
    const [observaciones, setObservaciones] = useState('');
    const [tipoPrestamo, setTipoPrestamo] = useState('Electrónico');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSolicitarPrestamo({ observaciones, tipoPrestamo });
        setShowPrestamoForm(false);
    };

    return (
        <div>
            <div className="page-header">
                <h1>{expediente.nombre_expediente}</h1>
                <p><strong>Estado:</strong> {expediente.estado}</p>
            </div>
            <div className="content-box">
                <h3>Acceso Restringido</h3>
                <p>No tienes acceso a los documentos de este expediente. Para verlos, debes solicitar un préstamo.</p>
                <div className="action-bar" style={{ justifyContent: 'start', marginTop: '1rem' }}>
                    <button onClick={() => setShowPrestamoForm(!showPrestamoForm)} className="button button-primary">
                        {showPrestamoForm ? 'Cancelar' : 'Solicitar Préstamo'}
                    </button>
                </div>
                {showPrestamoForm && (
                    <div style={{ marginTop: '1rem' }}>
                        <h4>Nueva Solicitud de Préstamo</h4>
                        <form onSubmit={handleSubmit} className="action-bar">
                            <select value={tipoPrestamo} onChange={(e) => setTipoPrestamo(e.target.value)}>
                                <option value="Electrónico">Electrónico</option>
                                <option value="Físico">Físico</option>
                            </select>
                            <input 
                                type="text" 
                                placeholder="Observaciones (opcional)" 
                                value={observaciones} 
                                onChange={(e) => setObservaciones(e.target.value)} 
                            />
                            <button type="submit" className="button button-primary">Confirmar</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VistaRestringida;