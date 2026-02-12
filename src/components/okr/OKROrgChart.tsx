import { Link } from "react-router-dom";
import { Target, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/okr/ProgressBar";
import type { TreeNode } from "@/hooks/useOKRTree";

const statusLabel: Record<string, string> = {
  on_track: "No caminho",
  at_risk: "Em risco",
  behind: "Atrasado",
  completed: "Concluído",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  on_track: "default",
  at_risk: "secondary",
  behind: "destructive",
  completed: "outline",
};

function OrgNode({ node }: { node: TreeNode }) {
  const obj = node.objective;
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Objective card */}
      <Link
        to={`/objectives/${obj.id}`}
        className="block w-64 rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold truncate flex-1">{obj.title}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={statusVariant[obj.status] || "outline"} className="text-2xs">
            {statusLabel[obj.status] || obj.status}
          </Badge>
          <span className="text-2xs text-muted-foreground truncate">{obj.owner_name}</span>
        </div>
        <ProgressBar value={obj.progress} status={obj.status} showLabel />
      </Link>

      {/* KRs below objective */}
      {node.keyResults.length > 0 && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-3 relative">
            {/* Horizontal connector line */}
            {node.keyResults.length > 1 && (
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: `calc(50% - ${((node.keyResults.length - 1) * (176 + 12)) / 2}px)`,
                  width: `${(node.keyResults.length - 1) * (176 + 12)}px`,
                }}
              />
            )}
            {node.keyResults.map((kr) => {
              const progress = kr.target_value !== kr.start_value
                ? Math.round(((kr.current_value - kr.start_value) / (kr.target_value - kr.start_value)) * 100)
                : 0;
              return (
                <div key={kr.id} className="flex flex-col items-center">
                  <div className="w-px h-4 bg-border" />
                  <div className="w-44 rounded-md border border-border bg-muted/30 p-3 text-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Key className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{kr.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span>{kr.current_value}/{kr.target_value} {kr.unit || ""}</span>
                      <Badge variant={statusVariant[kr.status] || "outline"} className="text-[10px] px-1 py-0">
                        {statusLabel[kr.status] || kr.status}
                      </Badge>
                    </div>
                    <ProgressBar value={Math.max(0, Math.min(100, progress))} status={kr.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Child objectives below */}
      {hasChildren && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-8 relative">
            {/* Horizontal connector */}
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: `calc(50% - ${((node.children.length - 1) * (256 + 32)) / 2}px)`,
                  width: `${(node.children.length - 1) * (256 + 32)}px`,
                }}
              />
            )}
            {node.children.map((child) => (
              <div key={child.objective.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface OKROrgChartProps {
  tree: TreeNode[];
}

export function OKROrgChart({ tree }: OKROrgChartProps) {
  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Nenhum objetivo encontrado neste ciclo.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-12 justify-center min-w-max py-4 px-8">
        {tree.map((node) => (
          <OrgNode key={node.objective.id} node={node} />
        ))}
      </div>
    </div>
  );
}
