import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import logoCircular from '../assets/logo-circular.png';
import Loader from './Loader';
import TermsModal from './TermsModal';
import './Login.css';

// Iconos SVG para el ojo (abierto y cerrado)
const EyeIcon = () => <svg height="20" width="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>;
const EyeOffIcon = () => <svg height="20" width="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-4 .7l2.17 2.17C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"></path></svg>;

const Login = () => {
    const [formData, setFormData] = useState({ documento: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [termsModalIsOpen, setTermsModalIsOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { documento, password } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const apiCall = axios.post('http://localhost:4000/api/auth/login', { documento, password });
            const timer = new Promise(resolve => setTimeout(resolve, 3000));
            const [apiResponse] = await Promise.all([apiCall, timer]);

            localStorage.setItem('token', apiResponse.data.token);
            toast.success('¡Inicio de sesión exitoso!');
            navigate('/dashboard');
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al iniciar sesión.';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {isLoading && (
                <div className="loading-overlay">
                    <Loader />
                </div>
            )}

            <img src={logoCircular} alt="Logo Documevi" className="login-logo" />
            <h2 className="login-title">DOCUMEVI</h2>

            <form onSubmit={onSubmit} className="login-form">
                <div className="form-group">
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
                <div className="form-group password-wrapper">
                    <label htmlFor="password" className="form-label">Contraseña</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className="form-input"
                        value={password}
                        onChange={onChange}
                        required
                    />
                    <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </span>
                </div>
                <button type="submit" className="login-button" disabled={isLoading}>
                    Ingresar
                </button>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/forgot-password">¿Olvidó su contraseña?</Link>
                </div>
            </form>

            <div className="terms-link-container" style={{ marginTop: '20px', fontSize: '0.8rem' }}>
                <p>Al ingresar, aceptas nuestros 
                    <button onClick={() => setTermsModalIsOpen(true)} style={{background: 'none', border: 'none', color: 'white', textDecoration: 'underline', cursor: 'pointer', padding: '0 5px'}}>
                        Términos y Condiciones
                    </button>
                .</p>
            </div>
            
            <TermsModal 
                isOpen={termsModalIsOpen} 
                onRequestClose={() => setTermsModalIsOpen(false)} 
            />
        </div>
    );
};

export default Login;