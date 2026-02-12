import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { user } = useAuth();
  const { roles } = useRoles(user?.id);

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "badge-critical";
      case "okr_master": return "badge-info";
      case "manager": return "badge-warning";
      default: return "badge-success";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Bem-vindo, {user?.user_metadata?.full_name || user?.email}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">Seus papéis:</p>
          <div className="flex gap-2">
            {roles.map((role) => (
              <span key={role} className={roleBadgeClass(role)}>{role}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
