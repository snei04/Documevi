import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

const GestionCajas = () => {
    const [oficinas, setOficinas] = useState([]);
    const [selectedOficina, setSelectedOficina] = useState('');
    const [cajas, setCajas] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Formulario para nueva caja
    const [newCaja, setNewCaja] = useState({
        codigo_caja: '',
        descripcion: '',
        capacidad_carpetas: 10,
        ubicacion_estante: '',
        ubicacion_entrepaño: '',
        ubicacion_modulo: ''
    });

    useEffect(() => {
        const fetchOficinas = async () => {
            try {
                const res = await api.get('/oficinas');
                setOficinas(res.data.filter(o => o.activo));
            } catch (error) {
                console.error(error);
            }
        };
        fetchOficinas();
    }, []);

    useEffect(() => {
        if (selectedOficina) {
            fetchCajas();
        } else {
            setCajas([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOficina]);

    const fetchCajas = async () => {
        try {
            const res = await api.get(`/cajas?id_oficina=${selectedOficina}`);
            setCajas(res.data);
        } catch (error) {
            toast.error("Error al cargar cajas");
        }
    };

    const handleCreateCaja = async (e) => {
        e.preventDefault();
        try {
            await api.post('/cajas', { ...newCaja, id_oficina: selectedOficina });
            toast.success("Caja creada con éxito");
            setShowModal(false);
            setNewCaja({ codigo_caja: '', descripcion: '', capacidad_carpetas: 10, ubicacion_estante: '', ubicacion_entrepaño: '', ubicacion_modulo: '' });
            fetchCajas();
        } catch (error) {
            toast.error(error.response?.data?.msg || "Error al crear caja");
        }
    };

    return (
        <div className="container">
            <h1>Gestión de Cajas / Paquetes</h1>

            <div className="content-box">
                <div className="form-group">
                    <label>Seleccionar Oficina:</label>
                    <select value={selectedOficina} onChange={(e) => setSelectedOficina(e.target.value)}>
                        <option value="">-- Seleccione Oficina --</option>
                        {oficinas.map(o => (
                            <option key={o.id} value={o.id}>{o.nombre_oficina}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedOficina && (
                <div className="content-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Listado de Cajas</h3>
                        <button className="button button-primary" onClick={() => setShowModal(true)}>+ Nueva Caja</button>
                    </div>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Capacidad</th>
                                <th>Ubicación</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cajas.map(c => (
                                <tr key={c.id}>
                                    <td>{c.codigo_caja}</td>
                                    <td>{c.descripcion}</td>
                                    <td>
                                        <div style={{
                                            background: '#eee', borderRadius: '4px', overflow: 'hidden', width: '100px', height: '20px', position: 'relative'
                                        }}>
                                            <div style={{
                                                background: c.cantidad_actual >= c.capacidad_carpetas ? 'red' : 'green',
                                                width: `${(c.cantidad_actual / c.capacidad_carpetas) * 100}%`,
                                                height: '100%'
                                            }}></div>
                                            <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', textAlign: 'center', fontSize: '12px', lineHeight: '20px' }}>
                                                {c.cantidad_actual} / {c.capacidad_carpetas}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        {c.ubicacion_estante && `Est: ${c.ubicacion_estante} `}
                                        {c.ubicacion_modulo && `Mod: ${c.ubicacion_modulo} `}
                                        {c.ubicacion_entrepaño && `Ent: ${c.ubicacion_entrepaño}`}
                                    </td>
                                    <td>{c.estado}</td>
                                </tr>
                            ))}
                            {cajas.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No hay cajas registradas.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Nueva Caja</h3>
                        <form onSubmit={handleCreateCaja}>
                            <div className="form-group">
                                <label>Código *</label>
                                <input type="text" value={newCaja.codigo_caja} onChange={e => setNewCaja({ ...newCaja, codigo_caja: e.target.value })} required placeholder="Ej: CAJA-001-2026" />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <input type="text" value={newCaja.descripcion} onChange={e => setNewCaja({ ...newCaja, descripcion: e.target.value })} placeholder="Ej: Contratos Enero" />
                            </div>
                            <div className="form-group">
                                <label>Capacidad (Carpetas) *</label>
                                <input type="number" value={newCaja.capacidad_carpetas} onChange={e => setNewCaja({ ...newCaja, capacidad_carpetas: e.target.value })} required min="1" />
                            </div>
                            <h4>Ubicación Topográfica</h4>
                            <div className="form-grid-3">
                                <div className="form-group">
                                    <label>Estante</label>
                                    <input type="text" value={newCaja.ubicacion_estante} onChange={e => setNewCaja({ ...newCaja, ubicacion_estante: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Módulo</label>
                                    <input type="text" value={newCaja.ubicacion_modulo} onChange={e => setNewCaja({ ...newCaja, ubicacion_modulo: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Entrepaño</label>
                                    <input type="text" value={newCaja.ubicacion_entrepaño} onChange={e => setNewCaja({ ...newCaja, ubicacion_entrepaño: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="button button-primary">Crear</button>
                                <button type="button" className="button" onClick={() => setShowModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionCajas;
