import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Login.css';

const SetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error('Las contraseñas no coinciden.');
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            
            const res = await api.post('/auth/set-password', {
                token: token,
                password: password
            });

            setSuccess(res.data.msg);
            toast.success(res.data.msg + " Serás redirigido en 3 segundos.");
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al establecer la contraseña.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ margin: '50px auto' }}>
            <h2 className="login-title">Establecer Contraseña</h2>
            
            {success ? (
                <p style={{ color: 'white', textAlign: 'center', fontSize: '1.1rem' }}>{success}</p>
            ) : (
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group-1">
                        <label htmlFor="password" className="form-label">Nueva Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group-1">
                        <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'Guardando...' : 'Guardar Contraseña'}
                    </button>
                    {error && <p style={{ color: 'white', backgroundColor: '#c53030', padding: '10px', borderRadius: '6px', marginTop: '1rem' }}>{error}</p>}
                </form>
            )}
        </div>
    );
};

export default SetPassword;