import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Por favor, ingrese un término de búsqueda.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await api.get(`/search?q=${query}`);
      setResults(res.data);
    } catch (err) {
      setError('Error al realizar la búsqueda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Búsqueda de Documentos y Expedientes</h1>
      </div>
      
      <div className="content-box">
        <form onSubmit={handleSearch} className="action-bar">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por asunto, nombre, radicado o contenido..."
            style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <button type="submit" className="button button-primary" disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {results && (
        <div className="content-box">
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
    </div>
  );
};

export default Search;