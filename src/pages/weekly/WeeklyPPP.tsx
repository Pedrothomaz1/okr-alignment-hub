import { useState } from "react";
import { useWeeklyPPP } from "@/hooks/useWeeklyPPP";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format, startOfWeek, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Save, ClipboardList } from "lucide-react";

export default function WeeklyPPP() {
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeekDate = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset);
  const weekStart = format(startOfWeek(currentWeekDate, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { currentPPP, isLoading, history, historyLoading, upsertPPP } = useWeeklyPPP(weekStart);

  const [plans, setPlans] = useState("");
  const [progress, setProgress] = useState("");
  const [problems, setProblems] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Sync form with loaded data
  if (currentPPP && !initialized) {
    setPlans(currentPPP.plans);
    setProgress(currentPPP.progress);
    setProblems(currentPPP.problems);
    setInitialized(true);
  }

  // Reset form on week change
  const changeWeek = (offset: number) => {
    setWeekOffset((prev) => prev + offset);
    setPlans("");
    setProgress("");
    setProblems("");
    setInitialized(false);
  };

  const handleSave = async () => {
    if (!plans.trim() || !progress.trim() || !problems.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    try {
      await upsertPPP.mutateAsync({ plans, progress, problems });
      toast({ title: "PPP salvo com sucesso!" });
    } catch {
      toast({ title: "Erro ao salvar PPP", variant: "destructive" });
    }
  };

  const weekLabel = format(startOfWeek(currentWeekDate, { weekStartsOn: 1 }), "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            PPP Semanal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Plans, Progress, Problems</p>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => changeWeek(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[160px] text-center">
          Semana de {weekLabel}
        </span>
        <Button variant="outline" size="icon" onClick={() => changeWeek(1)} disabled={weekOffset >= 0}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Plans (Planos)", value: plans, setter: setPlans, color: "border-l-primary" },
            { label: "Progress (Progresso)", value: progress, setter: setProgress, color: "border-l-success" },
            { label: "Problems (Problemas)", value: problems, setter: setProblems, color: "border-l-destructive" },
          ].map((field) => (
            <Card key={field.label} className={`card-elevated border-l-4 ${field.color}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{field.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={`Descreva seus ${field.label.toLowerCase()}...`}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsertPPP.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {currentPPP ? "Atualizar PPP" : "Salvar PPP"}
        </Button>
      </div>

      {/* History */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Histórico Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <Skeleton className="h-20" />
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum PPP registrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {history.map((ppp) => (
                <div key={ppp.id} className="card-outline p-3 text-xs space-y-1">
                  <p className="font-medium text-muted-foreground">
                    Semana de {format(new Date(ppp.week_start), "dd/MM/yyyy")}
                  </p>
                  <div className="grid gap-2 md:grid-cols-3 mt-2">
                    <div>
                      <p className="font-semibold text-primary">Plans</p>
                      <p className="text-foreground whitespace-pre-wrap">{ppp.plans}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-success">Progress</p>
                      <p className="text-foreground whitespace-pre-wrap">{ppp.progress}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-destructive">Problems</p>
                      <p className="text-foreground whitespace-pre-wrap">{ppp.problems}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
