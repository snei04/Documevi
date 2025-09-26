import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const useAuth = () => {
    const [auth, setAuth] = useState({ token: null, user: null });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setAuth({ token, user: decodedToken.user });
            } catch (error) {
                console.error("Token inválido:", error);
                setAuth({ token: null, user: null });
            }
        }
    }, []);

    const hasPermission = (permissionName) => {
        if (auth.user && auth.user.permissions) {
            return auth.user.permissions.includes(permissionName);
        }
        return false;
    };

    return { ...auth, hasPermission };
};

export default useAuth;