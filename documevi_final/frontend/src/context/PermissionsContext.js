// En: src/context/PermissionsContext.js

import React, { createContext, useState, useContext, useCallback } from 'react';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true); 

  const loadPermissions = useCallback((userPermissions = []) => {
    setPermissions(userPermissions);
    setLoading(false);
  }, []);

  // --- 👇 CAMBIO AQUÍ ---
  // Añadimos 'setLoading' al objeto 'value' para poder usarlo en otros componentes.
  const value = { permissions, loading, setLoading, loadPermissions };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext debe ser usado dentro de un PermissionsProvider');
  }
  return context;
};