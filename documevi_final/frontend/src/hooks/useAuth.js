import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

/**
 * Hook personalizado para gestionar la autenticación del usuario.
 * Lee el token JWT del localStorage, lo decodifica y expone el estado de autenticación.
 * 
 * @returns {Object} Objeto con el estado de autenticación
 * @returns {string|null} returns.token - Token JWT almacenado o null si no existe
 * @returns {Object|null} returns.user - Datos del usuario decodificados del token o null
 * @returns {Function} returns.hasPermission - Función para verificar si el usuario tiene un permiso específico
 * 
 * @example
 * const { token, user, hasPermission } = useAuth();
 * if (hasPermission('ver_documentos')) { ... }
 */
const useAuth = () => {
    // Estado que almacena el token y los datos del usuario
    const [auth, setAuth] = useState({ token: null, user: null });

    // Efecto que se ejecuta al montar el componente para cargar el token del localStorage
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Decodificar el JWT para extraer los datos del usuario
                const decodedToken = jwtDecode(token);
                setAuth({ token, user: decodedToken.user });
            } catch (error) {
                // Si el token es inválido o está corrupto, limpiar el estado
                console.error("Token inválido:", error);
                setAuth({ token: null, user: null });
            }
        }
    }, []);

    /**
     * Verifica si el usuario actual tiene un permiso específico.
     * @param {string} permissionName - Nombre del permiso a verificar
     * @returns {boolean} true si el usuario tiene el permiso, false en caso contrario
     */
    const hasPermission = (permissionName) => {
        if (auth.user && auth.user.permissions) {
            return auth.user.permissions.includes(permissionName);
        }
        return false;
    };

    // Retorna el estado de auth (token, user) junto con la función hasPermission
    return { ...auth, hasPermission };
};

export default useAuth;