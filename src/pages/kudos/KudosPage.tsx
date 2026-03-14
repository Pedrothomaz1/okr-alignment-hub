import { useKudos } from "@/hooks/useKudos";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award } from "lucide-react";
import { SendKudosDialog } from "@/components/kudos/SendKudosDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoryLabels: Record<string, string> = {
  general: "Geral",
  teamwork: "Trabalho em Equipe",
  innovation: "Inovação",
  results: "Resultados",
};

const categoryColors: Record<string, string> = {
  general: "badge-info",
  teamwork: "badge-success",
  innovation: "badge-warning",
  results: "badge-critical",
};

export default function KudosPage() {
  const { kudos, isLoading } = useKudos();

  const getInitials = (name: string | null) =>
    (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-warning" />
            Kudos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Reconhecimento público da equipe</p>
        </div>
        <SendKudosDialog />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : kudos.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum kudos ainda. Seja o primeiro a reconhecer um colega!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {kudos.map((k) => (
            <Card key={k.id} className="card-elevated border-l-4 border-l-warning">
              <CardContent className="p-4 flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(k.from_profile?.full_name ?? null)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">
                      {k.from_profile?.full_name || "Alguém"}
                    </p>
                    <span className="text-xs text-muted-foreground">→</span>
                    <p className="text-sm font-medium">
                      {k.to_profile?.full_name || "Alguém"}
                    </p>
                    <span className={categoryColors[k.category] || "badge-info"}>
                      {categoryLabels[k.category] || k.category}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{k.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(k.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
