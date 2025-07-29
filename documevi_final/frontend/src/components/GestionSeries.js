import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';

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
        const resSeries = await api.get('/series');
        setSeries(resSeries.data);

        const resOficinas = await api.get('/oficinas');
        setOficinas(resOficinas.data);
      } catch (err) {
        console.error('Error al cargar datos:', err);
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
      setError('Debe seleccionar una oficina productora.');
      return;
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
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Series Documentales (TRD)</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h3>Crear Nueva Serie</h3>
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
          style={{ marginLeft: '10px' }}
        />
        <input
          type="text"
          name="nombre_serie"
          placeholder="Nombre de la Serie"
          value={formData.nombre_serie}
          onChange={handleChange}
          required
          style={{ marginLeft: '10px' }}
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Crear</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>

      <h3>Series Existentes</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '8px' }}>Código</th>
            <th style={{ padding: '8px' }}>Nombre Serie</th>
            <th style={{ padding: '8px' }}>Oficina Productora</th>
          </tr>
        </thead>
        <tbody>
          {series.map(serie => (
            <tr key={serie.id}>
              <td style={{ padding: '8px' }}>{serie.codigo_serie}</td>
              <td style={{ padding: '8px' }}>{serie.nombre_serie}</td>
              <td style={{ padding: '8px' }}>{serie.nombre_oficina}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionSeries;