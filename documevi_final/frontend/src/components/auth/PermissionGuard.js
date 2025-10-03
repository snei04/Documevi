import { usePermissions } from '../../hooks/usePermissions';

/**
 * Wrapper que renderiza sus hijos solo si el usuario tiene el permiso requerido.
 * @param {{permission: string, children: React.ReactNode}} props
 */
const PermissionGuard = ({ permission, children }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return null; // Si no hay permiso, no se renderiza nada.
  }

  return <>{children}</>;
};

export default PermissionGuard;