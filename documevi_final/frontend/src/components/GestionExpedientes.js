import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const GestionExpedientes = () => {
    const [expedientes, setExpedientes] = useState([]);
    const [series, setSeries] = useState([]);
    const [subseries, setSubseries] = useState([]);
    const [filteredSubseries, setFilteredSubseries] = useState([]);
    const [formData, setFormData] = useState({
        nombre_expediente: '',
        id_serie: '',
        id_subserie: '',
        descriptor_1: '',
        descriptor_2: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resExp, resSer, resSub] = await Promise.all([
                    api.get('/expedientes'),
                    api.get('/series'),
                    api.get('/subseries')
                ]);
                setExpedientes(resExp.data);
                setSeries(resSer.data);
                setSubseries(resSub.data);
            } catch (err) {
                setError('Error al cargar datos iniciales.');
            }
        };
        fetchData();
    }, []);

    const handleSerieChange = (e) => {
        const serieId = e.target.value;
        setFormData({ ...formData, id_serie: serieId, id_subserie: '' });
        setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(serieId)));
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/expedientes', formData);
            toast.success('Expediente creado con éxito!');
            const resExp = await api.get('/expedientes');
            setExpedientes(resExp.data);
            setFormData({
                nombre_expediente: '',
                id_serie: '',
                id_subserie: '',
                descriptor_1: '',
                descriptor_2: ''
            });
            setFilteredSubseries([]);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear el expediente.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Expedientes</h1>
            </div>

            <div className="content-box">
                <h3>Crear Nuevo Expediente</h3>
                <form onSubmit={handleSubmit} className="form-grid">
                    <input type="text" name="nombre_expediente" placeholder="Nombre del Expediente" value={formData.nombre_expediente} onChange={handleChange} required />
                    <select name="id_serie" value={formData.id_serie} onChange={handleSerieChange} required>
                        <option value="">-- Seleccione Serie --</option>
                        {series.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
                    </select>
                    <select name="id_subserie" value={formData.id_subserie} onChange={handleChange} required>
                        <option value="">-- Seleccione Subserie --</option>
                        {filteredSubseries.map(ss => <option key={ss.id} value={ss.id}>{ss.nombre_subserie}</option>)}
                    </select>
                    <input type="text" name="descriptor_1" placeholder="Descriptor 1 (Opcional)" value={formData.descriptor_1} onChange={handleChange} />
                    <input type="text" name="descriptor_2" placeholder="Descriptor 2 (Opcional)" value={formData.descriptor_2} onChange={handleChange} />
                    <button type="submit" className="button button-primary">Crear Expediente</button>
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>

            <h3>Expedientes Existentes</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Serie</th>
                        <th>Subserie</th>
                        <th>Estado</th>
                        <th>Responsable</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {expedientes.map(exp => (
                        <tr key={exp.id}>
                            <td>{exp.nombre_expediente}</td>
                            <td>{exp.nombre_serie}</td>
                            <td>{exp.nombre_subserie}</td>
                            <td>{exp.estado}</td>
                            <td>{exp.nombre_responsable}</td>
                            <td style={{ textAlign: 'center' }}>
                                <Link to={`/dashboard/expedientes/${exp.id}`}>Ver Detalles</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GestionExpedientes;