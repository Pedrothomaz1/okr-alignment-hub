import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { roles } = useRoles(user?.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-foreground">OKR Platform</h1>
          <div className="flex items-center gap-3">
            {roles.includes("admin") && (
              <Link to="/admin/users">
                <Button variant="outline" size="sm">Admin</Button>
              </Link>
            )}
            <Link to="/settings/2fa">
              <Button variant="ghost" size="sm">2FA Settings</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign Out</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.user_metadata?.full_name || user?.email}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">Your roles:</p>
            <div className="flex gap-2">
              {roles.map((role) => <Badge key={role} variant="secondary">{role}</Badge>)}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
