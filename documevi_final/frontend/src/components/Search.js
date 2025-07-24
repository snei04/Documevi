import React, { useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

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
    <div style={{ padding: '20px' }}>
      <h1>Búsqueda de Documentos y Expedientes</h1>
      
      <form onSubmit={handleSearch} style={{ marginBottom: '40px' }}>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por asunto o nombre..."
          style={{ minWidth: '300px', padding: '8px' }}
        />
        <button type="submit" style={{ marginLeft: '10px' }} disabled={isLoading}>
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      {results && (
        <div>
          <h2>Resultados Encontrados</h2>

          {/* Resultados de Expedientes */}
          <h3>Expedientes ({results.expedientes.length})</h3>
          {results.expedientes.length > 0 ? (
            <ul>
              {results.expedientes.map(exp => (
                <li key={`exp-${exp.id}`}>
                  <Link to={`/dashboard/expedientes/${exp.id}`}>{exp.nombre_expediente}</Link> (Estado: {exp.estado})
                </li>
              ))}
            </ul>
          ) : <p>No se encontraron expedientes.</p>}

          {/* Resultados de Documentos */}
          <h3>Documentos ({results.documentos.length})</h3>
          {results.documentos.length > 0 ? (
            <ul>
              {results.documentos.map(doc => (
                <li key={`doc-${doc.id}`}>
                  {doc.radicado} - {doc.asunto}
                </li>
              ))}
            </ul>
          ) : <p>No se encontraron documentos.</p>}
        </div>
      )}
    </div>
  );
};

export default Search;