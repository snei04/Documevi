import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api' // La URL base de tu API
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      // --- ✅ CAMBIO CRÍTICO AQUÍ ---
      // Cambiamos 'x-auth-token' por el estándar 'Authorization'
      // y añadimos el prefijo 'Bearer '.
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default api;