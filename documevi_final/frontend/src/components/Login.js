import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logoCircular from '../assets/logo-circular.png';
import Loader from './Loader'; // Importamos el componente de la animación
import TermsModal from './TermsModal';
import './Login.css';      // Importamos el CSS para el formulario y el overlay

const Login = () => {
    const [formData, setFormData] = useState({ documento: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [termsModalIsOpen, setTermsModalIsOpen] = useState(false);
    const navigate = useNavigate();
    const { documento, password } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        // Creamos la petición a la API
        const apiCall = axios.post('http://localhost:4000/api/auth/login', { documento, password });
        
        // Creamos una promesa que simplemente espera 3 segundos (3000 milisegundos)
        const timer = new Promise(resolve => setTimeout(resolve, 3000));

        // Usamos Promise.all para esperar a que AMBAS cosas terminen: la llamada a la API y el temporizador
        const [apiResponse] = await Promise.all([apiCall, timer]);

        // Si llegamos aquí, ambas promesas se completaron con éxito
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
            {/* Lógica para mostrar el loader */}
            {isLoading && (
                <div className="loading-overlay">
                    {/* Usamos el nuevo componente de la animación de cajas */}
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
                <button type="submit" className="login-button" disabled={isLoading}>
                    Ingresar
                </button>
            </form>
            <div className="terms-link-container" style={{ marginTop: '20px', fontSize: '0.8rem' }}>
                <p>Al ingresar, aceptas nuestros 
                    <button onClick={() => setTermsModalIsOpen(true)} style={{background: 'none', border: 'none', color: 'white', textDecoration: 'underline', cursor: 'pointer'}}>
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