import React from 'react';
// 1. Importamos 'useOutletContext' para poder recibir los datos
import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const ProtectedRoute = ({ permission }) => {
    // 2. Leemos cualquier contexto que nos haya enviado el Outlet padre (el de DashboardLayout)
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

    // 3. Devolvemos el Outlet, PERO AHORA le pasamos el 'contexto' que recibimos
    //    a los componentes hijos (como GestionDependencias).
    return <Outlet context={context} />;
};

export default ProtectedRoute;