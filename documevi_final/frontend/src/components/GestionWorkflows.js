import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionWorkflows = () => {
    const [workflows, setWorkflows] = useState([]);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                const res = await api.get('/workflows');
                setWorkflows(res.data);
            } catch (err) {
                setError('No se pudieron cargar los flujos de trabajo.');
            }
        };
        fetchWorkflows();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/workflows', formData);
            toast.success('Workflow creado con éxito!');
            const res = await api.get('/workflows');
            setWorkflows(res.data);
            setFormData({ nombre: '', descripcion: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear el workflow.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Flujos de Trabajo (Workflows)</h1>
            </div>
            
            <div className="content-box">
                <h3>Crear Nuevo Workflow</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            name="nombre"
                            placeholder="Nombre del Workflow"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            style={{ flexGrow: 1, padding: '0.5rem' }}
                        />
                        <input
                            type="text"
                            name="descripcion"
                            placeholder="Descripción del Workflow"
                            value={formData.descripcion}
                            onChange={handleChange}
                            style={{ flexGrow: 2, padding: '0.5rem' }}
                        />
                        <button type="submit" className="button button-primary">Crear</button>
                    </div>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                </form>
            </div>

            <h3>Workflows Existentes</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {workflows.map(wf => (
                        <tr key={wf.id}>
                            <td>{wf.nombre}</td>
                            <td>{wf.descripcion}</td>
                            <td style={{ textAlign: 'center' }}>
                                <Link to={`/dashboard/workflows/${wf.id}`}>Administrar Pasos</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GestionWorkflows;