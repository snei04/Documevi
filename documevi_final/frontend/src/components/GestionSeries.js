import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionSeries = () => {
    const [series, setSeries] = useState([]);
    const [oficinas, setOficinas] = useState([]);
    const [formData, setFormData] = useState({
        id_oficina_productora: '',
        codigo_serie: '',
        nombre_serie: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resSeries, resOficinas] = await Promise.all([
                    api.get('/series'),
                    api.get('/oficinas')
                ]);
                setSeries(resSeries.data);
                setOficinas(resOficinas.data);
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
        if (!formData.id_oficina_productora) {
            return toast.warn('Debe seleccionar una oficina productora.');
        }
        try {
            await api.post('/series', formData);
            toast.success('Serie creada con éxito!');
            const resSeries = await api.get('/series');
            setSeries(resSeries.data);
            setFormData({ id_oficina_productora: '', codigo_serie: '', nombre_serie: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear la serie');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Series Documentales (TRD)</h1>
            </div>
            
            <div className="content-box">
                <h3>Crear Nueva Serie</h3>
                <form onSubmit={handleSubmit} className="form-grid">
                    <select name="id_oficina_productora" value={formData.id_oficina_productora} onChange={handleChange} required>
                        <option value="">-- Seleccione una Oficina Productora --</option>
                        {oficinas.map(oficina => (
                            <option key={oficina.id} value={oficina.id}>
                                {oficina.nombre_oficina}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name="codigo_serie"
                        placeholder="Código de la Serie"
                        value={formData.codigo_serie}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="nombre_serie"
                        placeholder="Nombre de la Serie"
                        value={formData.nombre_serie}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" className="button button-primary">Crear</button>
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>

            <h3>Series Existentes</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre Serie</th>
                        <th>Oficina Productora</th>
                    </tr>
                </thead>
                <tbody>
                    {series.map(serie => (
                        <tr key={serie.id}>
                            <td>{serie.codigo_serie}</td>
                            <td>{serie.nombre_serie}</td>
                            <td>{serie.nombre_oficina}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GestionSeries;