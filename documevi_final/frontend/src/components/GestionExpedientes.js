import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

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
      // Reset form
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
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Expedientes</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h3>Crear Nuevo Expediente</h3>
        <input type="text" name="nombre_expediente" placeholder="Nombre del Expediente" value={formData.nombre_expediente} onChange={handleChange} required />
        <select name="id_serie" value={formData.id_serie} onChange={handleSerieChange} required style={{ marginLeft: '10px' }}>
          <option value="">-- Seleccione Serie --</option>
          {series.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
        </select>
        <select name="id_subserie" value={formData.id_subserie} onChange={handleChange} required style={{ marginLeft: '10px' }}>
          <option value="">-- Seleccione Subserie --</option>
          {filteredSubseries.map(ss => <option key={ss.id} value={ss.id}>{ss.nombre_subserie}</option>)}
        </select>
        <br/><br/>
        <input type="text" name="descriptor_1" placeholder="Descriptor 1 (Opcional)" value={formData.descriptor_1} onChange={handleChange} />
        <input type="text" name="descriptor_2" placeholder="Descriptor 2 (Opcional)" value={formData.descriptor_2} onChange={handleChange} style={{ marginLeft: '10px' }} />
        <br/><br/>
        <button type="submit">Crear Expediente</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>

      <h3>Expedientes Existentes</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '8px' }}>Nombre</th>
            <th style={{ padding: '8px' }}>Serie</th>
            <th style={{ padding: '8px' }}>Subserie</th>
            <th style={{ padding: '8px' }}>Estado</th>
            <th style={{ padding: '8px' }}>Responsable</th>
            <th style={{ padding: '8px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {expedientes.map(exp => (
            <tr key={exp.id}>
              <td style={{ padding: '8px' }}>{exp.nombre_expediente}</td>
              <td style={{ padding: '8px' }}>{exp.nombre_serie}</td>
              <td style={{ padding: '8px' }}>{exp.nombre_subserie}</td>
              <td style={{ padding: '8px' }}>{exp.estado}</td>
              <td style={{ padding: '8px' }}>{exp.nombre_responsable}</td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                {/* 3. Añadir el enlace a la página de detalle */}
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