import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionSubseries = () => {
    const [subseries, setSubseries] = useState([]);
    const [series, setSeries] = useState([]);
    const [formData, setFormData] = useState({
        id_serie: '',
        codigo_subserie: '',
        nombre_subserie: '',
        retencion_gestion: '',
        retencion_central: '',
        disposicion_final: 'Conservación Total',
        procedimientos: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resSubseries, resSeries] = await Promise.all([
                    api.get('/subseries'),
                    api.get('/series')
                ]);
                setSubseries(resSubseries.data);
                setSeries(resSeries.data);
            } catch (err) {
                setError('No se pudieron cargar los datos iniciales.');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/subseries', formData);
            toast.success('Subserie creada con éxito!');
            const resSubseries = await api.get('/subseries');
            setSubseries(resSubseries.data);
            setFormData({
                id_serie: '',
                codigo_subserie: '',
                nombre_subserie: '',
                retencion_gestion: '',
                retencion_central: '',
                disposicion_final: 'Conservación Total',
                procedimientos: ''
            });
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear la subserie');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Subseries Documentales (TRD)</h1>
            </div>
            
            <div className="content-box">
                <h3>Crear Nueva Subserie</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                        <select name="id_serie" value={formData.id_serie} onChange={handleChange} required>
                            <option value="">-- Seleccione una Serie --</option>
                            {series.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
                        </select>
                        <input type="text" name="codigo_subserie" placeholder="Código Subserie" value={formData.codigo_subserie} onChange={handleChange} required />
                        <input type="text" name="nombre_subserie" placeholder="Nombre Subserie" value={formData.nombre_subserie} onChange={handleChange} required />
                        <input type="number" name="retencion_gestion" placeholder="Retención Gestión (años)" value={formData.retencion_gestion} onChange={handleChange} />
                        <input type="number" name="retencion_central" placeholder="Retención Central (años)" value={formData.retencion_central} onChange={handleChange} />
                        <select name="disposicion_final" value={formData.disposicion_final} onChange={handleChange}>
                            <option>Conservación Total</option>
                            <option>Eliminación</option>
                            <option>Selección</option>
                        </select>
                    </div>
                    <textarea name="procedimientos" placeholder="Procedimientos" value={formData.procedimientos} onChange={handleChange} style={{ width: '100%', minHeight: '60px', marginTop: '1rem' }}></textarea>
                    <button type="submit" className="button button-primary" style={{ marginTop: '1rem' }}>Crear</button>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                </form>
            </div>

            <h3>Subseries Existentes</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre Subserie</th>
                        <th>Serie a la que pertenece</th>
                        <th>Retención (Gestión/Central)</th>
                        <th>Disposición Final</th>
                    </tr>
                </thead>
                <tbody>
                    {subseries.map(ss => (
                        <tr key={ss.id}>
                            <td>{ss.codigo_subserie}</td>
                            <td>{ss.nombre_subserie}</td>
                            <td>{ss.nombre_serie}</td>
                            <td>{`G: ${ss.retencion_gestion || 'N/A'}a, C: ${ss.retencion_central || 'N/A'}a`}</td>
                            <td>{ss.disposicion_final}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GestionSubseries;