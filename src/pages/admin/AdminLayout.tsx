import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Users & Roles", path: "/admin/users" },
  { label: "Audit Logs", path: "/admin/audit" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-foreground">OKR Platform</Link>
            <nav className="flex gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm transition-colors hover:text-foreground",
                    location.pathname === item.path ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
