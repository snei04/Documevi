import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionDependencias = () => {
  const { dependencias, refreshDependencias } = useOutletContext();
  
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/dependencias', {
        codigo_dependencia: codigo,
        nombre_dependencia: nombre
      });
      toast.success('¡Dependencia creada con éxito!');
      setCodigo('');
      setNombre('');
      refreshDependencias();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al crear la dependencia');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Gestión de Dependencias</h1>
      </div>
      
      <div className="content-box">
        <h3>Crear Nueva Dependencia</h3>
        <form onSubmit={handleSubmit} className="action-bar">
          <input 
            type="text" 
            placeholder="Código (ej. 100)" 
            value={codigo} 
            onChange={(e) => setCodigo(e.target.value)} 
            required 
            style={{ padding: '0.5rem' }}
          />
          <input 
            type="text" 
            placeholder="Nombre de la Dependencia" 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            required 
            style={{ flexGrow: 1, padding: '0.5rem' }}
          />
          <button type="submit" className="button button-primary">Crear</button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>

      <h3>Dependencias Existentes</h3>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
          </tr>
        </thead>
        <tbody>
          {dependencias.map(dep => (
            <tr key={dep.id}>
              <td>{dep.codigo_dependencia}</td>
              <td>{dep.nombre_dependencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionDependencias;