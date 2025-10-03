import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const ProtectedRoute = ({ permission }) => {
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

  // Si pasa todas las validaciones, renderiza la ruta hija.
  return <Outlet />;
};

export default ProtectedRoute;