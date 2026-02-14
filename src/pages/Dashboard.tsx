import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
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
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card stat-card-primary">
            <p className="text-xs font-medium text-muted-foreground">Ciclos Ativos</p>
            <p className="text-2xl font-bold mt-1">{stats?.activeCycles ?? 0}</p>
          </div>
          <div className="stat-card stat-card-success">
            <p className="text-xs font-medium text-muted-foreground">Objetivos</p>
            <p className="text-2xl font-bold mt-1">{stats?.totalObjectives ?? 0}</p>
          </div>
          <div className="stat-card stat-card-warning">
            <p className="text-xs font-medium text-muted-foreground">Progresso Médio</p>
            <p className="text-2xl font-bold mt-1">{stats?.averageProgress ?? 0}%</p>
          </div>
          <div className="stat-card stat-card-primary">
            <p className="text-xs font-medium text-muted-foreground">KRs Concluídos</p>
            <p className="text-2xl font-bold mt-1">
              {stats?.completedKRs ?? 0}
              <span className="text-sm font-normal text-muted-foreground">/{stats?.totalKRs ?? 0}</span>
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
                <Skeleton className="h-16 w-full" />
              ) : stats?.cyclesSummary && stats.cyclesSummary.length > 0 ? (
                stats.cyclesSummary.map((cycle) => (
                  <Link
                    key={cycle.id}
                    to={`/cycles/${cycle.id}`}
                    className="block p-3 rounded-md border border-border hover:border-primary/30 transition-smooth"
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
        <Link to="/cycles" className="btn-cta">
          <Calendar className="h-4 w-4" />
          Ver Ciclos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
