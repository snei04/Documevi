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
    if (loading || !Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }

    if (!requiredPermission) {
        return permissions.length > 0;
    }

    // --- ✅ CORRECCIÓN APLICADA AQUÍ ---
    // En lugar de usar 'includes', usamos 'some' para poder iterar
    // y 'trim()' para limpiar los espacios en blanco de ambos lados antes de comparar.
    // Esto hace que la comparación sea a prueba de errores por espacios extra.
    return permissions.some(p => p.trim() === requiredPermission.trim());
  };

  return { hasPermission, isLoading: loading };
};