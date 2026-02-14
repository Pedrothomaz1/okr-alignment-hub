import { useMyKeyResults } from "@/hooks/useMyKeyResults";
import { ProgressBar } from "@/components/okr/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { Link } from "react-router-dom";

function computeProgress(kr: { current_value: number; start_value: number; target_value: number }) {
  const range = kr.target_value - kr.start_value;
  if (range === 0) return 0;
  return Math.min(100, Math.max(0, ((kr.current_value - kr.start_value) / range) * 100));
}

export function MyKeyResults() {
  const { data: krs, isLoading } = useMyKeyResults();

  return (
    <div className="card-elevated">
      <div className="flex items-center gap-2 p-4 pb-2">
        <Target className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Meus Resultados-Chave</h2>
        <span className="text-xs text-muted-foreground ml-auto">{krs?.length ?? 0} KRs</span>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
        ) : !krs || krs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhum KR atribuído a você nos ciclos ativos.</p>
        ) : (
          krs.map((kr) => {
            const progress = computeProgress(kr);
            return (
              <Link
                key={kr.id}
                to={`/objectives`}
                className="block card-interactive p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium truncate flex-1">{kr.title}</p>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{kr.objective_title}</span>
                </div>
                <ProgressBar value={progress} status={kr.status} showLabel />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{kr.unit ? `${kr.start_value} ${kr.unit}` : kr.start_value}</span>
                  <span className="font-medium text-foreground">
                    {kr.unit ? `${kr.current_value} ${kr.unit}` : kr.current_value}
                  </span>
                  <span>{kr.unit ? `${kr.target_value} ${kr.unit}` : kr.target_value}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
