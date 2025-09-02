import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionOficinas = () => {
    const { dependencias } = useOutletContext();
    
    const [oficinas, setOficinas] = useState([]);
    const [formData, setFormData] = useState({
        id_dependencia: '',
        codigo_oficina: '',
        nombre_oficina: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOficinas = async () => {
            try {
                const res = await api.get('/oficinas');
                setOficinas(res.data);
            } catch (err) {
                console.error('Error al cargar oficinas:', err);
            }
        };
        fetchOficinas();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.id_dependencia) {
            toast.warn('Debe seleccionar una dependencia.');
            return;
        }
        try {
            await api.post('/oficinas', formData);
            toast.success('Oficina creada con éxito!');
            const resOficinas = await api.get('/oficinas');
            setOficinas(resOficinas.data);
            setFormData({ id_dependencia: '', codigo_oficina: '', nombre_oficina: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al crear la oficina');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Oficinas Productoras</h1>
            </div>
            
            <div className="content-box">
                <h3>Crear Nueva Oficina</h3>
                <form onSubmit={handleSubmit} className="form-grid">
                    <select name="id_dependencia" value={formData.id_dependencia} onChange={handleChange} required>
                        <option value="">-- Seleccione una Dependencia --</option>
                        {dependencias && dependencias.map(dep => (
                            <option key={dep.id} value={dep.id}>{dep.nombre_dependencia}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name="codigo_oficina"
                        placeholder="Código de la Oficina"
                        value={formData.codigo_oficina}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="text"
                        name="nombre_oficina"
                        placeholder="Nombre de la Oficina"
                        value={formData.nombre_oficina}
                        onChange={handleChange}
                        required
                    />
                    <button type="submit" className="button button-primary">Crear</button>
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>

            <h3>Oficinas Existentes</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre Oficina</th>
                        <th>Dependencia a la que pertenece</th>
                    </tr>
                </thead>
                <tbody>
                    {oficinas.map(oficina => (
                        <tr key={oficina.id}>
                            <td>{oficina.codigo_oficina}</td>
                            <td>{oficina.nombre_oficina}</td>
                            <td>{oficina.nombre_dependencia}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GestionOficinas;