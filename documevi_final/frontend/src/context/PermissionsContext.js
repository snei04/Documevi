import React, { createContext, useState, useContext, useCallback } from 'react';

/**
 * Contexto de React para gestionar los permisos del usuario autenticado.
 * Permite compartir el estado de permisos entre todos los componentes de la aplicación.
 */
const PermissionsContext = createContext();

/**
 * Proveedor del contexto de permisos.
 * Envuelve la aplicación para proporcionar acceso global al estado de permisos.
 * 
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto
 * @returns {JSX.Element} Proveedor del contexto con los valores de permisos
 */
export const PermissionsProvider = ({ children }) => {
  // Estado que almacena la lista de permisos del usuario actual
  const [permissions, setPermissions] = useState([]);
  // Estado de carga, inicia en true hasta que se carguen los permisos
  const [loading, setLoading] = useState(true); 

  /**
   * Carga los permisos del usuario en el estado global.
   * Se usa típicamente después del login o al verificar la sesión.
   * @param {Array} userPermissions - Array de permisos del usuario (default: [])
   */
  const loadPermissions = useCallback((userPermissions = []) => {
    setPermissions(userPermissions);
    setLoading(false);
  }, []);

  /**
   * Limpia los permisos del estado global.
   * Se usa típicamente al cerrar sesión (logout).
   * Resetea loading a true para indicar que no hay permisos cargados.
   */
  const clearPermissions = useCallback(() => {
    setPermissions([]);
    setLoading(true);
  }, []);

  // Objeto con todos los valores y funciones expuestos por el contexto
  // setLoading se expone para permitir control manual del estado de carga desde otros componentes
  const value = { permissions, loading, setLoading, loadPermissions, clearPermissions };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de permisos.
 * Proporciona acceso a: permissions, loading, setLoading, loadPermissions, clearPermissions
 * 
 * @returns {Object} Objeto con el estado y funciones del contexto de permisos
 * @throws {Error} Si se usa fuera de un PermissionsProvider
 * 
 * @example
 * const { permissions, loading, loadPermissions } = usePermissionsContext();
 */
export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext debe ser usado dentro de un PermissionsProvider');
  }
  return context;
};