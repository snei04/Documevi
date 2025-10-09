import React from 'react';
import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const ProtectedRoute = ({ permission }) => {
    // 1. Obtenemos el 'contexto' del Outlet padre (DashboardLayout)
    //    para pasarlo a los hijos.
    // 2. Usamos el hook usePermissions para verificar permisos.
    //    Si no tiene permiso, redirigimos a "No Autorizado".
    //    Si no está logueado, redirigimos a "Login".
    //    Si todo está bien, renderizamos el Outlet (componente hijo).
    
    // Obtenemos el contexto del Outlet padre (DashboardLayout)
    const context = useOutletContext();
    
    const { hasPermission, isLoading } = usePermissions();

    // Mientras se cargan los permisos iniciales, no renderizar nada para evitar parpadeos.
    if (isLoading) {
        return <div>Verificando sesión...</div>; // O un componente Spinner/Loader
    }

    // Si se requiere un permiso específico y el usuario no lo tiene, se va a "No Autorizado".
    if (permission && !hasPermission(permission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Si NO se requiere un permiso específico (ruta base del dashboard), 
    // pero el usuario no tiene NINGÚN permiso (no está logueado), se va al login.
    if (!permission && !hasPermission()) {
        return <Navigate to="/login" replace />;
    }
    // Si todo está bien, renderizamos el componente hijo con el contexto.
    return <Outlet context={context} />;
};

export default ProtectedRoute;