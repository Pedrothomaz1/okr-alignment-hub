import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCycles } from "@/hooks/useCycles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  closed: "Encerrado",
  archived: "Arquivado",
};

const statusBadge = (status: string) => {
  switch (status) {
    case "active": return "badge-success";
    case "draft": return "badge-info";
    case "closed": return "badge-warning";
    case "archived": return "badge-destructive";
    default: return "badge-info";
  }
};

export default function CycleDetail() {
  const { id } = useParams<{ id: string }>();
  const { cycles, isLoading } = useCycles();
  const cycle = cycles.find((c) => c.id === id);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!cycle) {
    return (
      <div className="space-y-4">
        <Link to="/cycles"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button></Link>
        <p className="text-muted-foreground">Ciclo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cycles"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{cycle.name}</h1>
          <span className={statusBadge(cycle.status)}>{statusLabel[cycle.status] || cycle.status}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{cycle.description || "Sem descrição"}</p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(cycle.start_date), "dd MMM yyyy", { locale: ptBR })} — {format(new Date(cycle.end_date), "dd MMM yyyy", { locale: ptBR })}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base">OKRs Vinculados</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nenhum OKR vinculado a este ciclo ainda.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
