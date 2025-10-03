import { usePermissionsContext } from '../context/PermissionsContext';

export const usePermissions = () => {
  const { permissions, loading } = usePermissionsContext();

  /**
   * Verifica si el usuario actual tiene un permiso específico en su lista.
   * Si no se pasa ningún permiso, verifica si la lista de permisos no está vacía (útil para saber si está logueado).
   * @param {string} [requiredPermission] - El nombre del permiso (ej. 'cerrar_expedientes').
   * @returns {boolean} - True si tiene el permiso, false en caso contrario.
   */
  const hasPermission = (requiredPermission) => {
    if (loading || !Array.isArray(permissions)) {
      return false;
    }

    // Si no se especifica un permiso, verificamos si el usuario tiene CUALQUIER permiso (está logueado y su sesión es válida)
    if (!requiredPermission) {
        return permissions.length > 0;
    }

    // Verifica si el string del permiso requerido está incluido en el array de permisos del usuario.
    return permissions.includes(requiredPermission);
  };

  return { hasPermission, isLoading: loading };
};