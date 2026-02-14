import { Link } from "react-router-dom";
import { Target, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

const typeLabel: Record<string, string> = {
  annual: "Anual",
  quarterly: "Trimestral",
  monthly: "Mensal",
};

const typeBorderColor: Record<string, string> = {
  annual: "border-l-primary",
  quarterly: "border-l-info",
  monthly: "border-l-warning",
};

function ObjectiveCard({ node, isRoot }: { node: TreeNode; isRoot?: boolean }) {
  const obj = node.objective;

  return (
    <Link
      to={`/objectives/${obj.id}`}
      className={`block rounded-[var(--radius)] border bg-card p-4 transition-all hover:border-primary/40 ${
        isRoot ? "w-72 border-l-4 " + (typeBorderColor[obj.objective_type] || "border-l-primary") : "w-60"
      }`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Target className={`shrink-0 text-primary ${isRoot ? "h-5 w-5" : "h-4 w-4"}`} />
        <span className={`font-semibold truncate flex-1 ${isRoot ? "text-sm" : "text-xs"}`}>
          {obj.title}
        </span>
      </div>
      {obj.objective_type && (
        <div className="mb-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] ${obj.objective_type === "annual" ? "border-primary text-primary font-bold" : ""}`}
          >
            {typeLabel[obj.objective_type] || obj.objective_type}
          </Badge>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={statusVariant[obj.status] || "outline"} className="text-[10px]">
          {statusLabel[obj.status] || obj.status}
        </Badge>
        <Avatar className="h-5 w-5">
          {obj.owner_avatar && <AvatarImage src={obj.owner_avatar} alt={obj.owner_name} />}
          <AvatarFallback className="text-[9px]">
            {(obj.owner_name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-[10px] text-muted-foreground truncate">{obj.owner_name}</span>
      </div>
      <ProgressBar value={obj.progress} status={obj.status} showLabel />
    </Link>
  );
}

function KRCard({ kr }: { kr: any }) {
  const progress =
    kr.target_value !== kr.start_value
      ? Math.round(((kr.current_value - kr.start_value) / (kr.target_value - kr.start_value)) * 100)
      : 0;

  return (
    <div className="w-44 rounded-[calc(var(--radius)-4px)] border border-border bg-muted/30 p-3 text-xs">
      <div className="flex items-center gap-1.5 mb-1">
        <Key className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-medium truncate">{kr.title}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground mb-1">
        <span>
          {kr.current_value}/{kr.target_value} {kr.unit || ""}
        </span>
        <Badge variant={statusVariant[kr.status] || "outline"} className="text-[10px] px-1 py-0">
          {statusLabel[kr.status] || kr.status}
        </Badge>
      </div>
      <ProgressBar value={Math.max(0, Math.min(100, progress))} status={kr.status} />
    </div>
  );
}

/* Vertical connector line */
function VLine({ height = "h-6" }: { height?: string }) {
  return <div className={`w-px ${height} bg-border mx-auto`} />;
}

/* Horizontal connector spanning children */
function HConnector({ count, itemWidth, gap }: { count: number; itemWidth: number; gap: number }) {
  if (count <= 1) return null;
  const totalWidth = (count - 1) * (itemWidth + gap);
  return (
    <div
      className="absolute top-0 h-px bg-border"
      style={{
        left: `calc(50% - ${totalWidth / 2}px)`,
        width: `${totalWidth}px`,
      }}
    />
  );
}

function OrgNode({ node, isRoot = false }: { node: TreeNode; isRoot?: boolean }) {
  const hasChildren = node.children.length > 0;
  const hasKRs = node.keyResults.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Objective card */}
      <ObjectiveCard node={node} isRoot={isRoot} />

      {/* Children objectives (directly below parent) */}
      {hasChildren && (
        <>
          <VLine />
          <div className="flex gap-8 relative">
            <HConnector count={node.children.length} itemWidth={240} gap={32} />
            {node.children.map((child) => (
              <div key={child.objective.id} className="flex flex-col items-center">
                <VLine height="h-4" />
                <OrgNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* KRs below (only if no children, or leaf nodes) */}
      {hasKRs && !hasChildren && (
        <>
          <VLine height="h-4" />
          <div className="flex gap-3 relative">
            <HConnector count={node.keyResults.length} itemWidth={176} gap={12} />
            {node.keyResults.map((kr) => (
              <div key={kr.id} className="flex flex-col items-center">
                <VLine height="h-4" />
                <KRCard kr={kr} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* If has both children AND KRs, show KRs as a compact row under the card */}
      {hasKRs && hasChildren && (
        <div className="mt-2 flex gap-2 justify-center flex-wrap max-w-[300px]">
          {node.keyResults.map((kr) => (
            <div
              key={kr.id}
              className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5 border border-border/50"
            >
              <Key className="h-2.5 w-2.5" />
              <span className="truncate max-w-[100px]">{kr.title}</span>
            </div>
          ))}
        </div>
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
          <OrgNode key={node.objective.id} node={node} isRoot />
        ))}
      </div>
    </div>
  );
}
