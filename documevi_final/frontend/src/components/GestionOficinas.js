import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

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
      setError('Debe seleccionar una dependencia.');
      return;
    }
    try {
      await api.post('/oficinas', formData);
      alert('Oficina creada con éxito!');
      const resOficinas = await api.get('/oficinas');
      setOficinas(resOficinas.data);
      setFormData({ id_dependencia: '', codigo_oficina: '', nombre_oficina: '' });
    } catch (err) {
      console.error('Error al crear la oficina:', err.response?.data);
      setError(err.response?.data?.msg || 'Error al crear la oficina');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gestión de Oficinas Productoras</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h3>Crear Nueva Oficina</h3>
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
          style={{ marginLeft: '10px' }}
        />
        <input
          type="text"
          name="nombre_oficina"
          placeholder="Nombre de la Oficina"
          value={formData.nombre_oficina}
          onChange={handleChange}
          required
          style={{ marginLeft: '10px' }}
        />
        <button type="submit" style={{ marginLeft: '10px' }}>Crear</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>

      <h3>Oficinas Existentes</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ padding: '8px' }}>Código</th>
            <th style={{ padding: '8px' }}>Nombre Oficina</th>
            <th style={{ padding: '8px' }}>Dependencia a la que pertenece</th>
          </tr>
        </thead>
        <tbody>
          {oficinas.map(oficina => (
            <tr key={oficina.id}>
              <td style={{ padding: '8px' }}>{oficina.codigo_oficina}</td>
              <td style={{ padding: '8px' }}>{oficina.nombre_oficina}</td>
              <td style={{ padding: '8px' }}>{oficina.nombre_dependencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionOficinas;