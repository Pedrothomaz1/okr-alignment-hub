import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown, Target } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProgressBar } from "@/components/okr/ProgressBar";
import { Badge } from "@/components/ui/badge";
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

interface OKRTreeNodeProps {
  node: TreeNode;
  level: number;
  defaultExpanded?: boolean;
}

function OKRTreeNode({ node, level, defaultExpanded = true }: OKRTreeNodeProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;
  const obj = node.objective;

  return (
    <div className="relative">
      {level > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l-2 border-muted-foreground/20"
          style={{ marginLeft: `${(level - 1) * 24 + 11}px` }}
        />
      )}
      <div style={{ paddingLeft: `${level * 24}px` }}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group">
            {hasChildren ? (
              <CollapsibleTrigger className="p-0.5 rounded hover:bg-muted">
                {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </CollapsibleTrigger>
            ) : (
              <span className="w-5" />
            )}
            <Target className="h-4 w-4 text-primary shrink-0" />
            <Link
              to={`/objectives/${obj.id}`}
              className="text-sm font-medium hover:underline truncate flex-1"
            >
              {obj.title}
            </Link>
            <Badge variant={statusVariant[obj.status] || "outline"} className="text-2xs shrink-0">
              {statusLabel[obj.status] || obj.status}
            </Badge>
            <div className="w-24 shrink-0 hidden sm:block">
              <ProgressBar value={obj.progress} status={obj.status} />
            </div>
            <span className="text-2xs text-muted-foreground shrink-0 hidden md:inline">
              {obj.owner_name}
            </span>
            <span className="text-2xs text-muted-foreground shrink-0">
              {obj.kr_count} KR{obj.kr_count !== 1 ? "s" : ""}
            </span>
          </div>
          {hasChildren && (
            <CollapsibleContent>
              {node.children.map((child) => (
                <OKRTreeNode key={child.objective.id} node={child} level={level + 1} defaultExpanded={defaultExpanded} />
              ))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    </div>
  );
}

interface OKRTreeViewProps {
  tree: TreeNode[];
  defaultExpanded?: boolean;
}

export function OKRTreeView({ tree, defaultExpanded = true }: OKRTreeViewProps) {
  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Nenhum objetivo encontrado neste ciclo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <OKRTreeNode key={node.objective.id} node={node} level={0} defaultExpanded={defaultExpanded} />
      ))}
    </div>
  );
}
