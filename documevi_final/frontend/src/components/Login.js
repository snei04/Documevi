// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios'; // Asegúrate de tener axios instalado (npm install axios)
import './Login.css';
import logoCircular from '../assets/logo-circular.png';

const Login = () => {
  const [formData, setFormData] = useState({
    // Cambiamos 'usuario' por 'email' para que coincida con el backend
    documento: '',
    password: ''
  });

  const { documento, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Creamos el objeto con los datos que espera el backend
      const userToLogin = {
        documento,
        password
      };

      // 2. Hacemos la petición POST a la ruta de login de nuestra API
      const res = await axios.post('http://localhost:4000/api/auth/login', userToLogin);

      // 3. Si todo sale bien, el backend nos devuelve un token
      console.log('Login exitoso. Token recibido:', res.data.token);
      
      // 4. Guardamos el token en el almacenamiento local del navegador
      // Esto nos permitirá usarlo en otras partes de la aplicación
      localStorage.setItem('token', res.data.token);

      alert('¡Inicio de sesión exitoso!');
      // Aquí, en un futuro, redirigiríamos al usuario al dashboard principal

    } catch (err) {
      // Si el backend devuelve un error (ej. credenciales inválidas), lo mostramos
      console.error(err.response.data);
      alert(err.response.data.msg || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-container">
      <img src={logoCircular} alt="Logo Documevi" className="login-logo" />
      <h2 className="login-title">DOCUMEVI</h2>

      <form onSubmit={onSubmit} className="login-form">
        <div className="form-group">
          {/* Cambiamos el 'for' y 'name' a 'email' */}
          <label htmlFor="documento" className="form-label">Usuario</label>
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