import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

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
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Flujos de Trabajo (Workflows)</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h3>Crear Nuevo Workflow</h3>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre del Workflow"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <textarea
          name="descripcion"
          placeholder="Descripción del Workflow"
          value={formData.descripcion}
          onChange={handleChange}
          style={{ marginLeft: '10px', width: '300px' }}
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Crear</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>

      <h3>Workflows Existentes</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '8px' }}>Nombre</th>
            <th style={{ padding: '8px' }}>Descripción</th>
            <th style={{ padding: '8px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map(wf => (
            <tr key={wf.id}>
              <td style={{ padding: '8px' }}>{wf.nombre}</td>
              <td style={{ padding: '8px' }}>{wf.descripcion}</td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
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