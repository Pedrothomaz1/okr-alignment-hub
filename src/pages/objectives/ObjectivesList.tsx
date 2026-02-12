import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Target } from "lucide-react";
import { useObjectives } from "@/hooks/useObjectives";
import { ProgressBar } from "@/components/okr/ProgressBar";
import { ObjectiveForm } from "./ObjectiveForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const statusLabel: Record<string, string> = {
  on_track: "No caminho",
  at_risk: "Em risco",
  behind: "Atrasado",
  completed: "Concluído",
};

const statusBadge: Record<string, string> = {
  on_track: "badge-success",
  at_risk: "badge-warning",
  behind: "badge-destructive",
  completed: "badge-info",
};

interface ObjectivesListProps {
  cycleId: string;
}

export function ObjectivesList({ cycleId }: ObjectivesListProps) {
  const { objectives, isLoading, createObjective } = useObjectives(cycleId);
  const [formOpen, setFormOpen] = useState(false);
  const { toast } = useToast();

  const handleCreate = (values: { title: string; description?: string; status?: string; objective_type?: string; owner_id?: string; parent_objective_id?: string }) => {
    createObjective.mutate(
      { ...values, cycle_id: cycleId },
      {
        onSuccess: () => {
          setFormOpen(false);
          toast({ title: "Objetivo criado com sucesso" });
        },
        onError: (err) => toast({ title: "Erro ao criar objetivo", description: String(err), variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando objetivos...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Objetivos</h3>
        <Button size="sm" className="btn-cta h-8 px-3 text-xs" onClick={() => setFormOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Novo Objetivo
        </Button>
      </div>

      {objectives.length === 0 ? (
        <div className="card-elevated p-6 text-center">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum objetivo vinculado a este ciclo ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {objectives.map((obj) => (
            <Link key={obj.id} to={`/objectives/${obj.id}`} className="block">
              <div className="card-interactive p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{obj.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{obj.owner_name} · {obj.kr_count} KR{obj.kr_count !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={statusBadge[obj.status] || "badge-info"}>
                    {statusLabel[obj.status] || obj.status}
                  </span>
                </div>
                <ProgressBar value={obj.progress} status={obj.status} showLabel />
              </div>
            </Link>
          ))}
        </div>
      )}

      <ObjectiveForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isPending={createObjective.isPending}
        objectives={objectives}
      />
    </div>
  );
}
