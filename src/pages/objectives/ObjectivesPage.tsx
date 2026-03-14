import { useEffect } from "react";
import { useCycles } from "@/hooks/useCycles";
import { ObjectivesList } from "./ObjectivesList";
import { Target } from "lucide-react";

export default function ObjectivesPage() {
  const { cycles, isLoading } = useCycles();
  const activeCycle = cycles.find((c) => c.status === "active") || cycles[0];

  useEffect(() => {
    document.title = "Objectives";
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Objectives</h1>
      </div>

      {activeCycle ? (
        <ObjectivesList cycleId={activeCycle.id} />
      ) : (
        <div className="card-elevated p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum ciclo encontrado.</p>
        </div>
      )}
    </div>
  );
}
