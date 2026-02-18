import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MyKeyResults } from "@/components/dashboard/MyKeyResults";
import { MyTeam } from "@/components/dashboard/MyTeam";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/okr/ProgressBar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const { roles } = useRoles(user?.id);
  const { data: stats, isLoading } = useDashboardStats();

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bem-vindo, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          {roles.map((role) => (
            <span key={role} className={roleBadgeClass(role)}>{role}</span>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card" style={{ borderLeft: "3px solid hsl(var(--muted-foreground) / 0.3)" }}>
            <p className="text-xs font-medium text-muted-foreground">Ciclos Ativos</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{stats?.activeCycles ?? 0}</p>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid hsl(var(--muted-foreground) / 0.3)" }}>
            <p className="text-xs font-medium text-muted-foreground">Objetivos</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{stats?.totalObjectives ?? 0}</p>
          </div>
          <div className="stat-card stat-card-primary" style={{ background: "hsl(var(--primary) / 0.06)" }}>
            <p className="text-xs font-semibold text-primary">Progresso Médio</p>
            <p className="text-3xl font-bold mt-1 text-primary">
              {stats?.averageProgress ?? 0}
              <span className="text-base font-normal text-primary/60">%</span>
            </p>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid hsl(var(--muted-foreground) / 0.3)" }}>
            <p className="text-xs font-medium text-muted-foreground">KRs Concluídos</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">
              {stats?.completedKRs ?? 0}
              <span className="text-sm font-normal text-muted-foreground/60">/{stats?.totalKRs ?? 0}</span>
            </p>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <MyKeyResults />
          <MyTeam />

          {/* Active Cycles */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ciclos Ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : stats?.cyclesSummary && stats.cyclesSummary.length > 0 ? (
                stats.cyclesSummary.map((cycle) => (
                  <Link
                    key={cycle.id}
                    to={`/cycles/${cycle.id}`}
                    className="block card-interactive p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium truncate">{cycle.name}</p>
                      <span className="text-[10px] text-muted-foreground">{cycle.objectiveCount} obj.</span>
                    </div>
                    <ProgressBar value={cycle.averageProgress} showLabel />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(cycle.start_date).toLocaleDateString("pt-BR")} — {new Date(cycle.end_date).toLocaleDateString("pt-BR")}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum ciclo ativo.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">
          {/* Date header */}
          <div className="card-elevated p-4">
            <p className="text-xs text-muted-foreground">Hoje</p>
            <p className="text-sm font-semibold">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>

          <ActivityFeed />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button variant="cta" asChild>
          <Link to="/cycles">
            <Calendar className="h-4 w-4" />
            Ver Ciclos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
