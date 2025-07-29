import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

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
        const resSubseries = await api.get('/subseries');
        setSubseries(resSubseries.data);

        const resSeries = await api.get('/series');
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
      // Reset form
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
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Subseries Documentales (TRD)</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h3>Crear Nueva Subserie</h3>
        {/* Form fields */}
        <select name="id_serie" value={formData.id_serie} onChange={handleChange} required>
          <option value="">-- Seleccione una Serie --</option>
          {series.map(s => (
            <option key={s.id} value={s.id}>{s.nombre_serie}</option>
          ))}
        </select>
        <input type="text" name="codigo_subserie" placeholder="Código Subserie" value={formData.codigo_subserie} onChange={handleChange} required style={{ marginLeft: '10px' }} />
        <input type="text" name="nombre_subserie" placeholder="Nombre Subserie" value={formData.nombre_subserie} onChange={handleChange} required style={{ marginLeft: '10px' }} />
        <br/><br/>
        <input type="number" name="retencion_gestion" placeholder="Retención Gestión (años)" value={formData.retencion_gestion} onChange={handleChange} />
        <input type="number" name="retencion_central" placeholder="Retención Central (años)" value={formData.retencion_central} onChange={handleChange} style={{ marginLeft: '10px' }} />
        <select name="disposicion_final" value={formData.disposicion_final} onChange={handleChange} style={{ marginLeft: '10px' }}>
            <option>Conservación Total</option>
            <option>Eliminación</option>
            <option>Selección</option>
        </select>
        <br/><br/>
        <textarea name="procedimientos" placeholder="Procedimientos" value={formData.procedimientos} onChange={handleChange} style={{ width: '100%', minHeight: '60px' }}></textarea>
        <br/><br/>
        <button type="submit">Crear</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>

      <h3>Subseries Existentes</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '8px' }}>Código</th>
            <th style={{ padding: '8px' }}>Nombre Subserie</th>
            <th style={{ padding: '8px' }}>Serie a la que pertenece</th>
            <th style={{ padding: '8px' }}>Retención</th>
          </tr>
        </thead>
        <tbody>
          {subseries.map(ss => (
            <tr key={ss.id}>
              <td style={{ padding: '8px' }}>{ss.codigo_subserie}</td>
              <td style={{ padding: '8px' }}>{ss.nombre_subserie}</td>
              <td style={{ padding: '8px' }}>{ss.nombre_serie}</td>
              <td style={{ padding: '8px' }}>{`Gestión: ${ss.retencion_gestion || 'N/A'} años, Central: ${ss.retencion_central || 'N/A'} años`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionSubseries;