import axios from 'axios';

// Crear una instancia de axios con la URL base de la API
const api = axios.create({
  // Usar la variable de entorno o localhost por defecto
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      // Si hay un token, lo añadimos a los encabezados de la solicitud
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default api;