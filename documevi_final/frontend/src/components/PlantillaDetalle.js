import React, { useState, useEffect, useCallback } from 'react';
// 👇 LA CORRECCIÓN ESTÁ EN ESTA LÍNEA 👇
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const PlantillaDetalle = () => {
    const { id } = useParams();
    const [plantilla, setPlantilla] = useState(null);
    const [campos, setCampos] = useState([]);
    const [newCampo, setNewCampo] = useState({
        nombre_campo: '',
        tipo_campo: 'texto',
        orden: ''
    });

    const fetchPlantillaData = useCallback(async () => {
        try {
            const res = await api.get(`/plantillas/${id}`);
            setPlantilla(res.data);
            setCampos(res.data.campos || []);
        } catch (err) {
            toast.error('No se pudo cargar la información de la plantilla.');
        }
    }, [id]);

    useEffect(() => {
        fetchPlantillaData();
    }, [fetchPlantillaData]);

    const handleChange = (e) => {
        setNewCampo({ ...newCampo, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/plantillas/${id}/campos`, newCampo);
            toast.success('Campo añadido a la plantilla con éxito.');
            setNewCampo({ nombre_campo: '', tipo_campo: 'texto', orden: '' });
            fetchPlantillaData();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al añadir el campo.');
        }
    };

    if (!plantilla) return <div>Cargando plantilla...</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Administrar Campos para Plantilla: "{plantilla.nombre}"</h1>
                <p>{plantilla.descripcion}</p>
            </div>

            <div className="content-box">
                <h3>Añadir Nuevo Campo</h3>
                <form onSubmit={handleSubmit} className="action-bar" style={{flexWrap: 'wrap'}}>
                    <input
                        type="number"
                        name="orden"
                        value={newCampo.orden}
                        onChange={handleChange}
                        placeholder="Orden (ej. 1)"
                        required
                        style={{width: '100px'}}
                    />
                    <input
                        type="text"
                        name="nombre_campo"
                        value={newCampo.nombre_campo}
                        onChange={handleChange}
                        placeholder="Nombre del Campo (ej. Nombre Contratista)"
                        required
                        style={{flexGrow: 1}}
                    />
                    <select name="tipo_campo" value={newCampo.tipo_campo} onChange={handleChange}>
                        <option value="texto">Texto</option>
                        <option value="numero">Número</option>
                        <option value="fecha">Fecha</option>
                    </select>
                    <button type="submit" className="button button-primary">Añadir Campo</button>
                </form>
            </div>

            <h3>Campos Existentes en la Plantilla</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Orden</th>
                        <th>Nombre del Campo</th>
                        <th>Tipo</th>
                    </tr>
                </thead>
                <tbody>
                    {campos.map(campo => (
                        <tr key={campo.id}>
                            <td>{campo.orden}</td>
                            <td>{campo.nombre_campo}</td>
                            <td>{campo.tipo_campo}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PlantillaDetalle;