import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const WorkflowDetalle = () => {
    const { id } = useParams();
    const [workflow, setWorkflow] = useState(null);
    const [pasos, setPasos] = useState([]);
    const [roles, setRoles] = useState([]);
    const [formData, setFormData] = useState({ 
        nombre_paso: '', 
        orden: '', 
        id_rol_responsable: '', 
        requiere_firma: false
    });
    const [error, setError] = useState('');

    const fetchPasos = useCallback(async () => {
        try {
            const res = await api.get(`/workflows/${id}/pasos`);
            setPasos(res.data);
        } catch (err) {
            setError('No se pudo cargar los pasos del workflow.');
        }
    }, [id]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resWf, resRoles] = await Promise.all([
                    api.get(`/workflows/${id}`),
                    api.get('/roles')
                ]);
                setWorkflow(resWf.data);
                setRoles(resRoles.data);
                fetchPasos();
            } catch (err) {
                setError('Error al cargar datos iniciales.');
            }
        };
        fetchInitialData();
    }, [id, fetchPasos]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post(`/workflows/${id}/pasos`, formData);
            toast.success('Paso creado con éxito');
            setFormData({ nombre_paso: '', orden: '', id_rol_responsable: '', requiere_firma: false });
            fetchPasos();
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear el paso.');
        }
    };

    if (!workflow) return <div>Cargando...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Detalle de Workflow: {workflow.nombre}</h1>
                <p>{workflow.descripcion}</p>
            </div>

            <div className="content-box">
                <h3>Añadir Nuevo Paso</h3>
                <form onSubmit={handleSubmit} className="action-bar" style={{flexWrap: 'wrap'}}>
                    <input type="number" name="orden" placeholder="Orden (ej. 1)" value={formData.orden} onChange={handleChange} required />
                    <input type="text" name="nombre_paso" placeholder="Nombre del Paso" value={formData.nombre_paso} onChange={handleChange} required />
                    <select name="id_rol_responsable" value={formData.id_rol_responsable} onChange={handleChange} required>
                        <option value="">-- Asignar a Rol --</option>
                        {roles.map(rol => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
                    </select>
                    <label>
                        <input
                            type="checkbox"
                            name="requiere_firma"
                            checked={formData.requiere_firma}
                            onChange={handleChange}
                        />
                        ¿Requiere Firma?
                    </label>
                    <button type="submit" className="button button-primary">Añadir Paso</button>
                </form>
                {error && <p style={{color: 'red'}}>{error}</p>}
            </div>

            <h3>Pasos del Workflow</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Orden</th>
                        <th>Nombre del Paso</th>
                        <th>Rol Responsable</th>
                        <th>Requiere Firma</th>
                    </tr>
                </thead>
                <tbody>
                    {pasos.map(paso => (
                        <tr key={paso.id}>
                            <td>{paso.orden}</td>
                            <td>{paso.nombre_paso}</td>
                            <td>{paso.nombre_rol}</td>
                            <td>{paso.requiere_firma ? 'Sí' : 'No'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default WorkflowDetalle;