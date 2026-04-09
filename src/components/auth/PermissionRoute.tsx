import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

interface PermissionRouteProps {
  permission: PermissionKey;
  children: React.ReactNode;
  redirectTo?: string;
}

export function PermissionRoute({ permission, children, redirectTo = "/" }: PermissionRouteProps) {
  const { user, loading } = useAuth();
  const { can, isLoading } = usePermissions();

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!can(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
