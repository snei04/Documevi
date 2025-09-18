// src/components/ResetPassword.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Login.css'; // Importa el mismo CSS

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error('Las contraseñas no coinciden.');
        }
        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            toast.success(res.data.msg);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al restablecer la contraseña.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Establecer Nueva Contraseña</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="Nueva Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirmar Nueva Contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Actualizar Contraseña</button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;