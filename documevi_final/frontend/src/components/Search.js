import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

const Search = () => {
  // Estados para búsqueda básica
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para búsqueda avanzada
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedResults, setAdvancedResults] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    termino: '',
    fecha_desde: '',
    fecha_hasta: '',
    id_serie: '',
    id_subserie: '',
    id_oficina: '',
    tipo_soporte: '',
    campo_personalizado_id: '',
    campo_personalizado_valor: ''
  });

  // Datos para filtros
  const [series, setSeries] = useState([]);
  const [subseries, setSubseries] = useState([]);
  const [oficinas, setOficinas] = useState([]);
  const [camposPersonalizados, setCamposPersonalizados] = useState([]);
  const [filteredSubseries, setFilteredSubseries] = useState([]);

  // Cargar datos para filtros
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [seriesRes, subsRes, ofiRes] = await Promise.all([
          api.get('/series'),
          api.get('/subseries'),
          api.get('/oficinas')
        ]);
        setSeries(seriesRes.data.filter(s => s.activo));
        setSubseries(subsRes.data.filter(ss => ss.activo));
        setOficinas(ofiRes.data.filter(o => o.activo));

        // Cargar campos personalizados
        try {
          const camposRes = await api.get('/search/campos-personalizados');
          setCamposPersonalizados(camposRes.data);
        } catch (err) {
          // Si no tiene permiso, no mostrar campos personalizados
          console.log('No se pudieron cargar campos personalizados');
        }
      } catch (err) {
        console.error('Error al cargar datos de filtros:', err);
      }
    };
    loadFilterData();
  }, []);

  // Búsqueda básica
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Por favor, ingrese un término de búsqueda.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResults(null);
    setAdvancedResults(null);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (err) {
      setError('Error al realizar la búsqueda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Búsqueda avanzada
  const handleAdvancedSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResults(null);
    setAdvancedResults(null);

    try {
      const params = new URLSearchParams();
      Object.entries(advancedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await api.get(`/search/avanzada?${params.toString()}`);
      setAdvancedResults(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al realizar la búsqueda avanzada.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio de filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvancedFilters(prev => ({ ...prev, [name]: value }));

    // Filtrar subseries cuando cambia la serie
    if (name === 'id_serie') {
      setAdvancedFilters(prev => ({ ...prev, id_subserie: '' }));
      if (value) {
        setFilteredSubseries(subseries.filter(ss => ss.id_serie === parseInt(value)));
      } else {
        setFilteredSubseries([]);
      }
    }
  };

  // Limpiar filtros avanzados
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      termino: '',
      fecha_desde: '',
      fecha_hasta: '',
      id_serie: '',
      id_subserie: '',
      id_oficina: '',
      tipo_soporte: '',
      campo_personalizado_id: '',
      campo_personalizado_valor: ''
    });
    setFilteredSubseries([]);
    setAdvancedResults(null);
  };

  // Formatear fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Búsqueda de Documentos y Expedientes</h1>
      </div>
      
      {/* Búsqueda Básica */}
      <div className="content-box">
        <form onSubmit={handleSearch} className="action-bar">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por asunto, nombre, radicado, contenido o metadatos..."
            style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <button type="submit" className="button button-primary" disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
          <button 
            type="button" 
            className="button button-secondary"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Ocultar Avanzada' : 'Búsqueda Avanzada'}
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>

      {/* Búsqueda Avanzada */}
      {showAdvanced && (
        <div className="content-box" style={{ marginTop: '15px' }}>
          <h3>Búsqueda Avanzada</h3>
          <form onSubmit={handleAdvancedSearch}>
            <div className="filters-row" style={{ marginBottom: '15px' }}>
              <div className="filter-group">
                <label>Término de búsqueda</label>
                <input
                  type="text"
                  name="termino"
                  value={advancedFilters.termino}
                  onChange={handleFilterChange}
                  placeholder="Buscar en asunto, contenido, metadatos..."
                />
              </div>
              <div className="filter-group">
                <label>Fecha desde</label>
                <input
                  type="date"
                  name="fecha_desde"
                  value={advancedFilters.fecha_desde}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label>Fecha hasta</label>
                <input
                  type="date"
                  name="fecha_hasta"
                  value={advancedFilters.fecha_hasta}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="filters-row" style={{ marginBottom: '15px' }}>
              <div className="filter-group">
                <label>Oficina Productora</label>
                <select name="id_oficina" value={advancedFilters.id_oficina} onChange={handleFilterChange}>
                  <option value="">Todas las oficinas</option>
                  {oficinas.map(o => (
                    <option key={o.id} value={o.id}>{o.codigo_oficina} - {o.nombre_oficina}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Serie</label>
                <select name="id_serie" value={advancedFilters.id_serie} onChange={handleFilterChange}>
                  <option value="">Todas las series</option>
                  {series.map(s => (
                    <option key={s.id} value={s.id}>{s.codigo_serie} - {s.nombre_serie}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Subserie</label>
                <select 
                  name="id_subserie" 
                  value={advancedFilters.id_subserie} 
                  onChange={handleFilterChange}
                  disabled={!advancedFilters.id_serie}
                >
                  <option value="">Todas las subseries</option>
                  {filteredSubseries.map(ss => (
                    <option key={ss.id} value={ss.id}>{ss.codigo_subserie} - {ss.nombre_subserie}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Tipo de Soporte</label>
                <select name="tipo_soporte" value={advancedFilters.tipo_soporte} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  <option value="Electrónico">Electrónico</option>
                  <option value="Físico">Físico</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
            </div>

            {/* Búsqueda por campos personalizados */}
            {camposPersonalizados.length > 0 && (
              <div className="filters-row" style={{ marginBottom: '15px' }}>
                <div className="filter-group">
                  <label>Campo Personalizado</label>
                  <select 
                    name="campo_personalizado_id" 
                    value={advancedFilters.campo_personalizado_id} 
                    onChange={handleFilterChange}
                  >
                    <option value="">Seleccione un campo</option>
                    {camposPersonalizados.map(cp => (
                      <option key={cp.id} value={cp.id}>
                        {cp.nombre_campo} ({cp.nombre_oficina})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Valor del Campo</label>
                  <input
                    type="text"
                    name="campo_personalizado_valor"
                    value={advancedFilters.campo_personalizado_valor}
                    onChange={handleFilterChange}
                    placeholder="Buscar valor..."
                    disabled={!advancedFilters.campo_personalizado_id}
                  />
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="submit" className="button button-primary" disabled={isLoading}>
                {isLoading ? 'Buscando...' : 'Buscar'}
              </button>
              <button type="button" className="button" onClick={clearAdvancedFilters}>
                Limpiar Filtros
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resultados de búsqueda básica */}
      {results && (
        <div className="content-box" style={{ marginTop: '15px' }}>
          <h2>Resultados Encontrados</h2>

          <h3 style={{marginTop: '1.5rem'}}>Expedientes ({results.expedientes.length})</h3>
          {results.expedientes.length > 0 ? (
            <ul style={{listStyle: 'disc', paddingLeft: '20px'}}>
              {results.expedientes.map(exp => (
                <li key={`exp-${exp.id}`}>
                  <Link to={`/dashboard/expedientes/${exp.id}`}>{exp.nombre_expediente}</Link> (Estado: {exp.estado})
                </li>
              ))}
            </ul>
          ) : <p>No se encontraron expedientes que coincidan.</p>}

          <h3 style={{marginTop: '1.5rem'}}>Documentos ({results.documentos.length})</h3>
          {results.documentos.length > 0 ? (
            <ul style={{listStyle: 'disc', paddingLeft: '20px'}}>
              {results.documentos.map(doc => (
                <li key={`doc-${doc.id}`}>
                  {doc.radicado} - {doc.asunto}
                </li>
              ))}
            </ul>
          ) : <p>No se encontraron documentos que coincidan.</p>}
        </div>
      )}

      {/* Resultados de búsqueda avanzada */}
      {advancedResults && (
        <div className="content-box" style={{ marginTop: '15px' }}>
          <h2>Resultados de Búsqueda Avanzada ({advancedResults.length})</h2>
          
          {advancedResults.length > 0 ? (
            <div className="table-responsive">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Radicado</th>
                    <th>Asunto</th>
                    <th>Fecha</th>
                    <th>Serie / Subserie</th>
                    <th>Oficina</th>
                    <th>Soporte</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedResults.map(doc => (
                    <tr key={doc.id}>
                      <td><strong>{doc.radicado}</strong></td>
                      <td>{doc.asunto}</td>
                      <td>{formatDate(doc.fecha_radicado)}</td>
                      <td>
                        {doc.nombre_serie}
                        {doc.nombre_subserie && <><br /><small>{doc.nombre_subserie}</small></>}
                      </td>
                      <td>{doc.nombre_oficina}</td>
                      <td>
                        <span className={`badge ${doc.tipo_soporte === 'Electrónico' ? 'badge-info' : doc.tipo_soporte === 'Físico' ? 'badge-warning' : 'badge-success'}`}>
                          {doc.tipo_soporte}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-message">No se encontraron documentos con los filtros especificados.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;