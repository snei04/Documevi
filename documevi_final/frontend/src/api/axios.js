import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api' // La URL base de tu API
});

// Usamos un "interceptor" para modificar las peticiones antes de que se envíen
api.interceptors.request.use(
  config => {
    // Obtenemos el token del localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Si el token existe, lo añadimos al encabezado 'x-auth-token'
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default api;