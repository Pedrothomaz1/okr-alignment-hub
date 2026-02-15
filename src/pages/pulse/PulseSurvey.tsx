import { useState } from "react";
import { usePulseSurvey } from "@/hooks/usePulseSurvey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Heart, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function PulseSurvey() {
  const { currentPulse, isLoading, trend, trendLoading, submitPulse, hasVotedThisWeek } = usePulseSurvey();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (score === 0) {
      toast({ title: "Selecione uma nota de 1 a 5", variant: "destructive" });
      return;
    }
    try {
      await submitPulse.mutateAsync({ score, comment: comment || undefined });
      toast({ title: "Pulse registrado!" });
    } catch {
      toast({ title: "Erro ao registrar pulse", variant: "destructive" });
    }
  };

  const trendData = trend.map((p) => ({
    week: format(new Date(p.week_start), "dd/MM", { locale: ptBR }),
    score: p.score,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Heart className="h-6 w-6 text-destructive" />
          Pulse Survey
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Como você está se sentindo esta semana?</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : hasVotedThisWeek ? (
        <Card className="card-elevated border-l-4 border-l-success">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm font-medium">Você já votou esta semana!</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-6 w-6 ${s <= (currentPulse?.score ?? 0) ? "text-warning fill-warning" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            {currentPulse?.comment && (
              <p className="text-xs text-muted-foreground italic">"{currentPulse.comment}"</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Sua avaliação da semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setScore(s)}
                  className="transition-spring p-1"
                >
                  <Star
                    className={`h-8 w-8 ${s <= score ? "text-warning fill-warning" : "text-muted-foreground hover:text-warning/50"}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Comentário opcional..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={submitPulse.isPending}>
                Enviar Pulse
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tendência (últimas 12 semanas)</CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="h-48" />
          ) : trendData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
