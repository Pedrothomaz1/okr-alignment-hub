import { useState } from "react";
import { useChangeRequests, type ChangeRequest } from "@/hooks/useChangeRequests";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface Props {
  cycleId: string;
  objectiveId?: string;
  showCreateButton?: boolean;
}

export function ChangeRequestCard({ cycleId, objectiveId, showCreateButton = true }: Props) {
  const { user } = useAuth();
  const { isAdmin } = useRoles(user?.id);
  const { changeRequests, createChangeRequest, decideChangeRequest } = useChangeRequests(objectiveId, !objectiveId ? cycleId : undefined);
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [decideOpen, setDecideOpen] = useState<{ cr: ChangeRequest; decision: string } | null>(null);
  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState("edit_objective");
  const [comment, setComment] = useState("");

  const handleCreate = () => {
    createChangeRequest.mutate(
      { cycle_id: cycleId, objective_id: objectiveId, request_type: requestType, description },
      {
        onSuccess: () => { setCreateOpen(false); setDescription(""); toast({ title: "Solicitação enviada" }); },
        onError: (e) => toast({ title: "Erro", description: String(e), variant: "destructive" }),
      }
    );
  };

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

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expirado";
    return formatDistanceToNow(new Date(expiresAt), { locale: ptBR, addSuffix: false }) + " restantes";
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Change Requests
          </CardTitle>
          {showCreateButton && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Solicitar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {changeRequests.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma solicitação.</p>
        ) : (
          <div className="space-y-3">
            {changeRequests.map((cr) => {
              const cfg = statusConfig[cr.status] || statusConfig.pending;
              const Icon = cfg.icon;
              return (
                <div key={cr.id} className="border rounded-[calc(var(--radius)-4px)] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.variant} className="text-2xs"><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                      <Badge variant="outline" className="text-2xs">{requestTypeLabels[cr.request_type] || cr.request_type}</Badge>
                    </div>
                    {cr.status === "approved" && cr.expires_at && (
                      <span className="text-2xs text-muted-foreground">{getTimeRemaining(cr.expires_at)}</span>
                    )}
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Solicitar Alteração</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit_objective">Editar Objetivo</SelectItem>
                  <SelectItem value="edit_kr">Editar KR</SelectItem>
                  <SelectItem value="add_kr">Adicionar KR</SelectItem>
                  <SelectItem value="delete_kr">Remover KR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Justificativa</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a alteração necessária..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!description.trim() || createChangeRequest.isPending}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decide dialog */}
      <Dialog open={!!decideOpen} onOpenChange={(o) => !o && setDecideOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decideOpen?.decision === "approved" ? "Aprovar" : "Rejeitar"} Solicitação</DialogTitle>
          </DialogHeader>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentário (opcional)..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecideOpen(null)}>Cancelar</Button>
            <Button variant={decideOpen?.decision === "approved" ? "default" : "destructive"} onClick={handleDecide} disabled={decideChangeRequest.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
