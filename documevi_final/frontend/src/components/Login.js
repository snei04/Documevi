import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Asegúrate que aquí están los estilos del spinner que te di antes
import logoCircular from '../assets/logo-circular.png';

const Login = () => {
  const [formData, setFormData] = useState({
    documento: '',
    password: ''
  });
  // 1. Añadimos el nuevo estado para la carga
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { documento, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

 const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiCall = axios.post('http://localhost:4000/api/auth/login', { documento, password });
      const timer = new Promise(resolve => setTimeout(resolve, 5000));

      const [apiResponse] = await Promise.all([apiCall, timer]);

      localStorage.setItem('token', apiResponse.data.token);
      navigate('/dashboard');

    } catch (err) {
      // 👇 MODIFICACIÓN AQUÍ 👇
      // Esto intenta obtener el mensaje del backend. Si falla, muestra el error de red.
      const errorMsg = err.response?.data?.msg || err.message || 'Ocurrió un error desconocido.';
      
      console.error(err); // Imprimimos el error completo para depurar
      alert(errorMsg);
    
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 5. Mostramos el overlay si isLoading es true */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <img src={logoCircular} alt="Logo Documevi" className="login-logo" />
      <h2 className="login-title">DOCUMEVI</h2>

      <form onSubmit={onSubmit} className="login-form">
        <div className="form-group">
          {/* 6. (Opcional) Corregimos la etiqueta para mayor claridad */}
          <label htmlFor="documento" className="form-label">Documento de usuario</label>
          <input
            type="text"
            id="documento"
            name="documento"
            className="form-input"
            value={documento}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-input"
            value={password}
            onChange={onChange}
            required
          />
        </div>
        <button type="submit" className="login-button">Ingresar</button>
      </form>
    </div>
  );
};

export default Login;