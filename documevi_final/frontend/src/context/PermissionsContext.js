import React, { createContext, useState, useContext, useCallback } from 'react';

// 1. Crear el contexto
const PermissionsContext = createContext();

// 2. Crear el Proveedor del contexto
export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  // Empezamos en 'true' para que las rutas protegidas esperen hasta que se verifique la sesión.
  const [loading, setLoading] = useState(true); 

  // Función para cargar los permisos del usuario (se llamará desde App.js)
  const loadPermissions = useCallback((userPermissions = []) => {
    setPermissions(userPermissions);
    setLoading(false);
  }, []);

  const value = { permissions, loading, loadPermissions };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// 3. Crear un hook para consumir el contexto fácilmente
export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext debe ser usado dentro de un PermissionsProvider');
  }
  return context;
};