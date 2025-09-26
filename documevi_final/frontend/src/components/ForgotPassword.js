import React, { useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './Login.css';

// Puedes guardar esta imagen en tu carpeta 'src/assets' e importarla,
// o usar una URL de una imagen que encuentres en internet.
import emailSentIcon from '../assets/check-email.svg';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    // 1. Nuevo estado para controlar qué se muestra
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/forgot-password', { email });
            toast.success(res.data.msg);
            // 2. Cuando el correo se envía con éxito, cambiamos el estado
            setEmailSent(true);
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Error al enviar el correo.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                {/* 3. Renderizado condicional */}
                {!emailSent ? (
                    // Si el correo NO se ha enviado, muestra el formulario
                    <>
                        <h2>Recuperar Contraseña</h2>
                        <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Correo Electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit">Enviar Enlace de Recuperación</button>
                        </form>
                    </>
                ) : (
                    // Si el correo SÍ se ha enviado, muestra la confirmación
                    <div>
                        {/* Puedes reemplazar esto con tu propia imagen */}
                        <img src={emailSentIcon} alt="Correo Enviado" style={{ width: '80px', marginBottom: '20px' }} />
                        <h2>¡Revisa tu correo!</h2>
                        <p>Si la dirección <strong>{email}</strong> está registrada, recibirás un enlace para restablecer tu contraseña en los próximos minutos.</p>
                    </div>
                )}

                <div className="auth-link">
                    <Link to="/login">Volver a Iniciar Sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;