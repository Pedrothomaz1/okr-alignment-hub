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
      <header className="border-b" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-white">Vektor<span className="text-cta">Flow</span></Link>
            <nav className="flex gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm transition-smooth",
                    location.pathname === item.path
                      ? "text-white font-medium"
                      : "text-white/60 hover:text-white/90"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 animate-slide-up">
        <Outlet />
      </main>
    </div>
  );
}
