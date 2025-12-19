import { usePermissionsContext } from '../context/PermissionsContext';

/**
 * Hook personalizado para verificar permisos del usuario actual.
 * Proporciona una interfaz simplificada para consultar si el usuario
 * tiene permisos específicos para realizar acciones en el sistema.
 * 
 * @returns {Object} Objeto con utilidades de permisos
 * @returns {Function} returns.hasPermission - Función para verificar un permiso específico
 * @returns {boolean} returns.isLoading - Indica si los permisos aún se están cargando
 * 
 * @example
 * const { hasPermission, isLoading } = usePermissions();
 * if (hasPermission('crear_documentos')) { ... }
 */
export const usePermissions = () => {
  // Obtener permisos y estado de carga del contexto global
  const { permissions, loading } = usePermissionsContext();

  /**
   * Verifica si el usuario actual tiene un permiso específico en su lista.
   * Si no se pasa ningún permiso, verifica si la lista de permisos no está vacía
   * (útil para saber si el usuario está autenticado).
   * 
   * @param {string} [requiredPermission] - Nombre del permiso a verificar (ej: 'cerrar_expedientes')
   * @returns {boolean} true si tiene el permiso, false en caso contrario
   * 
   * @example
   * hasPermission('ver_expedientes')  // Verifica permiso específico
   * hasPermission()                   // Verifica si tiene algún permiso (está logueado)
   */
  const hasPermission = (requiredPermission) => {
    // Si está cargando o no hay permisos válidos, denegar acceso
    if (loading || !Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }

    // Si no se especifica permiso, verificar si tiene al menos uno (usuario autenticado)
    if (!requiredPermission) {
        return permissions.length > 0;
    }

    // Buscar el permiso usando trim() para evitar errores por espacios en blanco
    // Se usa 'some' en lugar de 'includes' para poder aplicar trim() a cada elemento
    return permissions.some(p => p.trim() === requiredPermission.trim());
  };

  return { hasPermission, isLoading: loading };
};