import axios from 'axios';

// Configuración para usar el proxy de Nginx (location /api/)
// Esto hará que las peticiones vayan a https://dominio:puerto/api
const api = axios.create({
  baseURL: '/api'
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