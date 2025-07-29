import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom'; // Hook para recibir el contexto
import api from '../api/axios';
import { toast } from 'react-toastify';

const GestionDependencias = () => {
  // 1. Recibimos los datos y la función del padre (DashboardLayout)
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
      
      // 2. Le avisamos al padre que refresque la lista para todos
      refreshDependencias();

    } catch (err) {
      setError(err.response.data.msg || 'Error al crear la dependencia');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestión de Dependencias</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        {/* ... El formulario no cambia ... */}
        <input type="text" placeholder="Código (ej. 01.01)" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
        <input type="text" placeholder="Nombre de la Dependencia" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ marginLeft: '10px' }}/>
        <button type="submit" style={{ marginLeft: '10px' }}>Crear</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      <h3>Dependencias Existentes</h3>
      {/* 3. La tabla ahora usa la lista que viene del padre */}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
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