import { useState } from "react";
import { Link } from "react-router-dom";
import { useChangeRequests } from "@/hooks/useChangeRequests";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useCycles } from "@/hooks/useCycles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ChangeRequest } from "@/hooks/useChangeRequests";

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", icon: Clock, variant: "secondary" },
  approved: { label: "Aprovado", icon: CheckCircle, variant: "default" },
  rejected: { label: "Rejeitado", icon: XCircle, variant: "destructive" },
  expired: { label: "Expirado", icon: AlertCircle, variant: "outline" },
};

const requestTypeLabels: Record<string, string> = {
  edit_objective: "Editar Objetivo",
  edit_kr: "Editar KR",
  add_kr: "Adicionar KR",
  delete_kr: "Remover KR",
};

export default function ChangeRequestsPage() {
  const { user } = useAuth();
  const { isAdmin } = useRoles(user?.id);
  const { allChangeRequests, isLoadingAll, decideChangeRequest } = useChangeRequests();
  const { cycles } = useCycles();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [decideOpen, setDecideOpen] = useState<{ cr: ChangeRequest; decision: string } | null>(null);
  const [comment, setComment] = useState("");

  const filtered = allChangeRequests.filter((cr) => {
    if (statusFilter !== "all" && cr.status !== statusFilter) return false;
    if (cycleFilter !== "all" && cr.cycle_id !== cycleFilter) return false;
    return true;
  });

  const handleDecide = () => {
    if (!decideOpen) return;
    decideChangeRequest.mutate(
      { request_id: decideOpen.cr.id, decision: decideOpen.decision, comment },
      {
        onSuccess: () => { setDecideOpen(null); setComment(""); toast({ title: `Solicitação ${decideOpen.decision === "approved" ? "aprovada" : "rejeitada"}` }); },
        onError: (e) => toast({ title: "Erro", description: String(e), variant: "destructive" }),
      }
    );
  };

  if (isLoadingAll) return <p className="text-muted-foreground p-8 text-center">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Change Requests</h1>

      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cycleFilter} onValueChange={setCycleFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Ciclo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ciclos</SelectItem>
            {cycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="card-elevated"><CardContent className="py-8 text-center text-muted-foreground">Nenhuma solicitação encontrada.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((cr) => {
            const cfg = statusConfig[cr.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <Card key={cr.id} className="card-elevated">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.variant} className="text-2xs"><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                      <Badge variant="outline" className="text-2xs">{requestTypeLabels[cr.request_type] || cr.request_type}</Badge>
                      <span className="text-xs text-muted-foreground">{cr.cycle_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cr.objective_id && (
                        <Link to={`/objectives/${cr.objective_id}`}>
                          <Button variant="ghost" size="sm" className="h-6 text-2xs"><ExternalLink className="h-3 w-3 mr-1" />{cr.objective_title || "Objetivo"}</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="text-sm">{cr.description}</p>
                  <p className="text-2xs text-muted-foreground">por {cr.requester_name} · {formatDistanceToNow(new Date(cr.created_at), { locale: ptBR, addSuffix: true })}</p>
                  {cr.decision_comment && <p className="text-xs text-muted-foreground italic">"{cr.decision_comment}"</p>}
                  {isAdmin && cr.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="h-7 text-xs" onClick={() => { setDecideOpen({ cr, decision: "approved" }); setComment(""); }}>Aprovar</Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { setDecideOpen({ cr, decision: "rejected" }); setComment(""); }}>Rejeitar</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!decideOpen} onOpenChange={(o) => !o && setDecideOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{decideOpen?.decision === "approved" ? "Aprovar" : "Rejeitar"} Solicitação</DialogTitle></DialogHeader>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentário (opcional)..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecideOpen(null)}>Cancelar</Button>
            <Button variant={decideOpen?.decision === "approved" ? "default" : "destructive"} onClick={handleDecide} disabled={decideChangeRequest.isPending}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
