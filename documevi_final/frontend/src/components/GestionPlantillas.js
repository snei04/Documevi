import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Asegúrate de importar el CSS

const GestionPlantillas = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  const fetchPlantillas = useCallback(async () => {
    try {
      const res = await api.get('/plantillas');
      setPlantillas(res.data);
    } catch (err) {
      toast.error('No se pudieron cargar las plantillas.');
    }
  }, []);

  useEffect(() => {
    fetchPlantillas();
  }, [fetchPlantillas]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/plantillas', formData);
      toast.success('Plantilla creada con éxito.');
      setFormData({ nombre: '', descripcion: '' });
      fetchPlantillas();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error al crear la plantilla.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Gestión de Plantillas de Documentos</h1>
      </div>
      
      <div className="content-box">
        <h3>Crear Nueva Plantilla</h3>
        <form onSubmit={handleSubmit}>
          <input 
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre de la Plantilla"
            required 
          />
          <input 
            type="text"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Descripción (opcional)"
            style={{ marginLeft: '10px', width: '300px' }}
          />
          <button type="submit" style={{ marginLeft: '10px' }} className="button button-primary">Crear Plantilla</button>
        </form>
      </div>

      <h3>Plantillas Existentes</h3>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {plantillas.map(p => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.descripcion}</td>
              <td style={{ textAlign: 'center' }}>
                <Link to={`/dashboard/plantillas/${p.id}`}>
                  Administrar Campos
                </Link>
                <Link to={`/dashboard/plantillas/${p.id}/disenar`} style={{ marginLeft: '15px' }}>
                  Diseñar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionPlantillas;