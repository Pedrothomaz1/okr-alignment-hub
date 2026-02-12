import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, Send } from "lucide-react";
import { useCycleRequests } from "@/hooks/useCycleRequests";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface CycleApprovalCardProps {
  cycleId: string;
  cycleStatus: string;
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  pending: { icon: Clock, label: "Pendente", className: "text-yellow-500" },
  approved: { icon: CheckCircle2, label: "Aprovado", className: "text-green-500" },
  rejected: { icon: XCircle, label: "Rejeitado", className: "text-red-500" },
};

export function CycleApprovalCard({ cycleId, cycleStatus }: CycleApprovalCardProps) {
  const { requests, isLoading, createRequest, decideRequest } = useCycleRequests(cycleId);
  const { user } = useAuth();
  const { hasRole } = useRoles(user?.id);
  const { toast } = useToast();

  const isAdmin = hasRole("admin");
  const canRequest = isAdmin || hasRole("okr_master");

  const [decisionModal, setDecisionModal] = useState<{ requestId: string; decision: string } | null>(null);
  const [comment, setComment] = useState("");

  const hasPending = requests.some((r) => r.status === "pending");
  const canRequestApproval = canRequest && cycleStatus === "draft" && !hasPending;

  const handleRequestApproval = async () => {
    try {
      await createRequest.mutateAsync({ cycle_id: cycleId });
      toast({ title: "Solicitação de aprovação enviada" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDecision = async () => {
    if (!decisionModal) return;
    try {
      await decideRequest.mutateAsync({
        request_id: decisionModal.requestId,
        decision: decisionModal.decision,
        comment,
      });
      toast({ title: decisionModal.decision === "approved" ? "Ciclo aprovado" : "Ciclo rejeitado" });
      setDecisionModal(null);
      setComment("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Aprovações</CardTitle>
            {canRequestApproval && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={handleRequestApproval}
                disabled={createRequest.isPending}
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Solicitar Aprovação
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação de aprovação.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const config = statusConfig[req.status] || statusConfig.pending;
                const Icon = config.icon;
                return (
                  <div key={req.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${config.className}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{config.label}</span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(req.created_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {req.comment && (
                        <p className="text-xs text-muted-foreground mt-1">{req.comment}</p>
                      )}
                      {req.decision_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Decisão em: {format(new Date(req.decision_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                      {req.status === "pending" && isAdmin && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => setDecisionModal({ requestId: req.id, decision: "approved" })}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => setDecisionModal({ requestId: req.id, decision: "rejected" })}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!decisionModal} onOpenChange={(open) => !open && setDecisionModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decisionModal?.decision === "approved" ? "Aprovar Ciclo" : "Rejeitar Ciclo"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionModal(null)}>Cancelar</Button>
            <Button
              variant={decisionModal?.decision === "approved" ? "default" : "destructive"}
              onClick={handleDecision}
              disabled={decideRequest.isPending}
            >
              {decisionModal?.decision === "approved" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
