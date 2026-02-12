import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useRoles(user?.id);

  if (loading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
