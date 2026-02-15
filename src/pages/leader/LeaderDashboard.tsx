import { useLeaderDashboard } from "@/hooks/useLeaderDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/okr/ProgressBar";
import { UsersRound, CheckCircle, XCircle, Star, ClipboardList } from "lucide-react";
import { ExportReportDialog } from "@/components/reports/ExportReportDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LeaderDashboard() {
  const { user } = useAuth();
  const { hasRole } = useRoles(user?.id);
  const { data: team, isLoading } = useLeaderDashboard();

  const isLeader = hasRole("manager") || hasRole("okr_master") || hasRole("admin");

  if (!isLeader) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Acesso restrito a gestores e administradores.</p>
      </div>
    );
  }

  const teamSize = team?.length ?? 0;
  const checkinCompliance = teamSize > 0
    ? Math.round((team?.filter((m) => m.last_checkin).length ?? 0) / teamSize * 100)
    : 0;
  const pppCompliance = teamSize > 0
    ? Math.round((team?.filter((m) => m.has_ppp_this_week).length ?? 0) / teamSize * 100)
    : 0;
  const avgPulse = teamSize > 0
    ? (() => {
        const scores = (team ?? []).filter((m) => m.pulse_score !== null).map((m) => m.pulse_score!);
        return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
      })()
    : "—";
  const avgProgress = teamSize > 0
    ? Math.round((team ?? []).reduce((a, m) => a + m.avg_progress, 0) / teamSize)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <UsersRound className="h-6 w-6 text-primary" />
            Dashboard do Líder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visão consolidada da sua equipe</p>
        </div>
        <ExportReportDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : teamSize === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum subordinado direto encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="stat-card stat-card-primary">
              <p className="text-xs font-medium text-muted-foreground">Membros</p>
              <p className="text-2xl font-bold mt-1">{teamSize}</p>
            </div>
            <div className="stat-card stat-card-success">
              <p className="text-xs font-medium text-muted-foreground">Progresso Médio</p>
              <p className="text-2xl font-bold mt-1">{avgProgress}%</p>
            </div>
            <div className="stat-card stat-card-warning">
              <p className="text-xs font-medium text-muted-foreground">Pulse Médio</p>
              <p className="text-2xl font-bold mt-1 flex items-center gap-1">
                <Star className="h-5 w-5 text-warning" /> {avgPulse}
              </p>
            </div>
            <div className="stat-card stat-card-primary">
              <p className="text-xs font-medium text-muted-foreground">Check-in Compliance</p>
              <p className="text-2xl font-bold mt-1">{checkinCompliance}%</p>
            </div>
          </div>

          {/* Team table */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs table-row-hover">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Membro</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Progresso</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">KRs</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Último Check-in</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">PPP</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Pulse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(team ?? []).map((m) => (
                      <tr key={m.id} className="border-b border-border/50">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                              <AvatarFallback className="text-[9px]">
                                {(m.full_name || "?").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{m.full_name || "—"}</span>
                          </div>
                        </td>
                        <td className="py-2 min-w-[120px]">
                          <ProgressBar value={m.avg_progress} showLabel />
                        </td>
                        <td className="text-center py-2">{m.kr_count}</td>
                        <td className="text-center py-2">
                          {m.last_checkin
                            ? formatDistanceToNow(new Date(m.last_checkin), { addSuffix: true, locale: ptBR })
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="text-center py-2">
                          {m.has_ppp_this_week
                            ? <CheckCircle className="h-4 w-4 text-success mx-auto" />
                            : <XCircle className="h-4 w-4 text-destructive/50 mx-auto" />
                          }
                        </td>
                        <td className="text-center py-2">
                          {m.pulse_score !== null ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <Star className="h-3 w-3 text-warning fill-warning" />
                              <span>{m.pulse_score}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
