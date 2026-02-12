import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/okr/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Target, TrendingUp, CheckCircle2, Calendar, ArrowRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  on_track: "hsl(153, 45%, 42%)",
  at_risk: "hsl(35, 58%, 61%)",
  behind: "hsl(13, 69%, 55%)",
  completed: "hsl(200, 65%, 50%)",
};

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
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card stat-card-primary">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Ciclos Ativos</p>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold mt-2">{stats?.activeCycles ?? 0}</p>
          </div>

          <div className="stat-card stat-card-success">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Objetivos</p>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold mt-2">{stats?.totalObjectives ?? 0}</p>
          </div>

          <div className="stat-card stat-card-warning">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Progresso Médio</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold mt-2">{stats?.averageProgress ?? 0}%</p>
          </div>

          <div className="stat-card stat-card-primary">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">KRs Concluídos</p>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold mt-2">
              {stats?.completedKRs ?? 0}
              <span className="text-base font-normal text-muted-foreground">/{stats?.totalKRs ?? 0}</span>
            </p>
          </div>
        </div>
      )}

      {/* Chart + Active Cycles */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Progress Chart */}
        <Card className="card-elevated lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Progresso por Objetivo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : stats?.objectivesChart && stats.objectivesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, stats.objectivesChart.length * 48)}>
                <BarChart
                  data={stats.objectivesChart}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
                  <YAxis
                    dataKey="title"
                    type="category"
                    width={140}
                    fontSize={12}
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Progresso"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={24}>
                    {stats.objectivesChart.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] || STATUS_COLORS.on_track} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                Nenhum objetivo encontrado nos ciclos ativos.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active Cycles Summary */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ciclos Ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stats?.cyclesSummary && stats.cyclesSummary.length > 0 ? (
              stats.cyclesSummary.map((cycle) => (
                <Link
                  key={cycle.id}
                  to={`/cycles/${cycle.id}`}
                  className="block p-3 rounded-lg border border-border hover:border-primary/30 transition-smooth"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{cycle.name}</p>
                    <span className="text-xs text-muted-foreground">{cycle.objectiveCount} obj.</span>
                  </div>
                  <ProgressBar value={cycle.averageProgress} showLabel />
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(cycle.start_date).toLocaleDateString("pt-BR")} — {new Date(cycle.end_date).toLocaleDateString("pt-BR")}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum ciclo ativo encontrado.
              </p>
            )}
          </CardContent>
        </Card>
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
