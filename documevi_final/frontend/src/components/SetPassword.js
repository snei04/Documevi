import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Reutilizamos los estilos del login

const SetPassword = () => {
  const { token } = useParams(); // Obtenemos el token de la URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await axios.post('http://localhost:4000/api/auth/set-password', {
        token: token,
        password: password
      });
      setSuccess(res.data.msg);
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al establecer la contraseña.');
    }
  };

  return (
    <div className="login-container" style={{ margin: '50px auto' }}>
      <h2 className="login-title">Establecer Contraseña</h2>
      {!success ? (
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Nueva Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">Guardar Contraseña</button>
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        </form>
      ) : (
        <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>
      )}
    </div>
  );
};

export default SetPassword;