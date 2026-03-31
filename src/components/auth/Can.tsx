import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

interface CanProps {
  do: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ do: permission, children, fallback = null }: CanProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!can(permission)) return <>{fallback}</>;

  return <>{children}</>;
}
