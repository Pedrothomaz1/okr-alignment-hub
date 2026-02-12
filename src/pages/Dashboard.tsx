import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { user, signOut } = useAuth();
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
    <div className="min-h-screen bg-background">
      <header className="border-b" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-white">OKR Platform</h1>
          <div className="flex items-center gap-3">
            {roles.includes("admin") && (
              <Link to="/admin/users">
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 hover:text-white">Admin</Button>
              </Link>
            )}
            <Link to="/settings/2fa">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">2FA Settings</Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => signOut()}>Sign Out</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 animate-slide-up">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Welcome, {user?.user_metadata?.full_name || user?.email}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">Your roles:</p>
            <div className="flex gap-2">
              {roles.map((role) => (
                <span key={role} className={roleBadgeClass(role)}>{role}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
