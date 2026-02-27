import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }
};

const EditLocationModal = ({ isOpen, onClose, documento, onUpdate, idOficina }) => {
    const [formData, setFormData] = useState({
        id_carpeta: '',
        paquete: '',
        tomo: '',
        modulo: '',
        estante: '',
        entrepaño: '',
        otro: '',
        ubicacion_fisica: ''
    });
    const [carpetas, setCarpetas] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && documento) {
            setFormData({
                id_carpeta: documento.id_carpeta || '',
                paquete: documento.paquete || '',
                tomo: documento.tomo || '',
                modulo: documento.modulo || '',
                estante: documento.estante || '',
                entrepaño: documento.entrepaño || '',
                otro: documento.otro || '',
                ubicacion_fisica: documento.ubicacion_fisica || ''
            });

            if (idOficina) {
                const fetchCarpetas = async () => {
                    try {
                        const res = await api.get('/carpetas', {
                            params: { id_oficina: idOficina, estado: 'Abierta' }
                        });
                        setCarpetas(Array.isArray(res.data) ? res.data : (res.data.data || []));
                    } catch (err) {
                        console.error('Error cargando carpetas', err);
                    }
                };
                fetchCarpetas();
            }
        }
    }, [isOpen, documento, idOficina]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCarpetaChange = (e) => {
        const carpetaId = e.target.value;
        const carpeta = carpetas.find(c => c.id === parseInt(carpetaId));

        if (carpeta) {
            setFormData(prev => ({
                ...prev,
                id_carpeta: carpetaId,
                modulo: carpeta.ubicacion_modulo || '',
                estante: carpeta.ubicacion_estante || '',
                entrepaño: carpeta.ubicacion_entrepaño || '',
                paquete: carpeta.paquete || prev.paquete, // Auto-fill package if available in folder
                otro: ''
            }));
        } else {
            setFormData(prev => ({ ...prev, id_carpeta: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/documentos/${documento.id}/ubicacion`, formData);
            toast.success('Ubicación actualizada correctamente.');
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.msg || 'Error al actualizar ubicación.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={customStyles}
            contentLabel="Editar Ubicación Física"
            ariaHideApp={false}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>📍 Editar Ubicación Física</h3>
                <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.2em', cursor: 'pointer' }}>✖</button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Carpeta (Autocompletar)</label>
                    <select
                        name="id_carpeta"
                        value={formData.id_carpeta}
                        onChange={handleCarpetaChange}
                        className="form-control"
                        style={{ width: '100%' }}
                    >
                        <option value="">-- Sin Carpeta / Manual --</option>
                        {carpetas.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.codigo_carpeta} - {c.nombre_carpeta || `Carpeta #${c.consecutivo} (${c.año})`}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                        <label>Tomo / Legajo</label>
                        <input
                            type="text"
                            name="tomo"
                            value={formData.tomo}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                        <label>Estante</label>
                        <input
                            type="text"
                            name="estante"
                            value={formData.estante}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label>Entrepaño</label>
                        <input
                            type="text"
                            name="entrepaño"
                            value={formData.entrepaño}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label>Módulo</label>
                        <input
                            type="text"
                            name="modulo"
                            value={formData.modulo}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Ubicación Literal (Notas)</label>
                    <textarea
                        name="ubicacion_fisica"
                        value={formData.ubicacion_fisica}
                        onChange={handleChange}
                        className="form-control"
                        rows="2"
                        placeholder="Descripción detallada..."
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>Otro</label>
                    <input
                        type="text"
                        name="otro"
                        value={formData.otro}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={onClose} className="button button-secondary">Cancelar</button>
                    <button type="submit" className="button button-primary" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditLocationModal;
