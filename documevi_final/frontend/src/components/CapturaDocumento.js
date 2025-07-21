import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const CapturaDocumento = () => {
  const [formData, setFormData] = useState({
    asunto: '',
    id_oficina_productora: '',
    id_serie: '',
    id_subserie: '',
    remitente_nombre: '',
    remitente_identificacion: '',
    remitente_direccion: ''
  });
  
  const [dependencias, setDependencias] = useState([]);
  const [oficinas, setOficinas] = useState([]);
  const [series, setSeries] = useState([]);
  const [subseries, setSubseries] = useState([]);

  const [filteredOficinas, setFilteredOficinas] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [filteredSubseries, setFilteredSubseries] = useState([]);
  
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resDep, resOfi, resSer, resSub] = await Promise.all([
          api.get('/dependencias'),
          api.get('/oficinas'),
          api.get('/series'),
          api.get('/subseries')
        ]);
        setDependencias(resDep.data);
        setOficinas(resOfi.data);
        setSeries(resSer.data);
        setSubseries(resSub.data);
      } catch (err) {
        setError('Error al cargar datos iniciales.');
      }
    };
    fetchInitialData();
  }, []);
  
  const handleDependenciaChange = (e) => {
    const depId = e.target.value;
    setFormData({ ...formData, id_dependencia: depId, id_oficina_productora: '', id_serie: '', id_subserie: '' });
    setFilteredOficinas(oficinas.filter(o => o.id_dependencia === parseInt(depId)));
    setFilteredSeries([]);
    setFilteredSubseries([]);
  };

  const handleOficinaChange = (e) => {
    const ofiId = e.target.value;
    setFormData({ ...formData, id_oficina_productora: ofiId, id_serie: '', id_subserie: '' });
    setFilteredSeries(series.filter(s => s.id_oficina_productora === parseInt(ofiId)));
    setFilteredSubseries([]);
  };
  
  const handleSerieChange = (e) => {
    const serId = e.target.value;
    setFormData({ ...formData, id_serie: serId, id_subserie: '' });
    setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(serId)));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/documentos', formData);
      alert(`Documento radicado con éxito. Número de Radicado: ${res.data.radicado}`);
      // Aquí podrías limpiar el formulario o redirigir
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al radicar el documento.');
    }
  };

  // 👇 ESTA ES LA PARTE QUE ESTABA INCOMPLETA. AHORA USAMOS TODAS LAS VARIABLES Y FUNCIONES.
  return (
    <div style={{ padding: '20px' }}>
      <h1>Captura y Radicación de Documentos</h1>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h3>Datos del Documento</h3>
        <textarea name="asunto" placeholder="Asunto del documento" value={formData.asunto} onChange={handleChange} required style={{width: '100%', minHeight: '60px'}} />
        
        <h3 style={{marginTop: '20px'}}>Clasificación TRD</h3>
        <select onChange={handleDependenciaChange} required>
            <option value="">-- Seleccione Dependencia --</option>
            {dependencias.map(d => <option key={d.id} value={d.id}>{d.nombre_dependencia}</option>)}
        </select>
        <select name="id_oficina_productora" value={formData.id_oficina_productora} onChange={handleOficinaChange} required style={{marginLeft: '10px'}}>
            <option value="">-- Seleccione Oficina --</option>
            {filteredOficinas.map(o => <option key={o.id} value={o.id}>{o.nombre_oficina}</option>)}
        </select>
        <br/><br/>
        <select name="id_serie" value={formData.id_serie} onChange={handleSerieChange} required>
            <option value="">-- Seleccione Serie --</option>
            {filteredSeries.map(s => <option key={s.id} value={s.id}>{s.nombre_serie}</option>)}
        </select>
        <select name="id_subserie" value={formData.id_subserie} onChange={handleChange} required style={{marginLeft: '10px'}}>
            <option value="">-- Seleccione Subserie --</option>
            {filteredSubseries.map(ss => <option key={ss.id} value={ss.id}>{ss.nombre_subserie}</option>)}
        </select>

        <h3 style={{marginTop: '20px'}}>Datos del Remitente</h3>
        <input type="text" name="remitente_nombre" placeholder="Nombre del Remitente" value={formData.remitente_nombre} onChange={handleChange} required />
        <input type="text" name="remitente_identificacion" placeholder="Identificación" value={formData.remitente_identificacion} onChange={handleChange} style={{marginLeft: '10px'}} />
        <input type="text" name="remitente_direccion" placeholder="Dirección" value={formData.remitente_direccion} onChange={handleChange} style={{marginLeft: '10px'}} />

        <br/><br/>
        <button type="submit">Radicar Documento</button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </form>
    </div>
  );
};

export default CapturaDocumento;