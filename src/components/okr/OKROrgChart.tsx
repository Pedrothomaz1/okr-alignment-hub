import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Target, Key, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  quarterly: "border-l-[hsl(var(--info))]",
  monthly: "border-l-[hsl(var(--warning))]",
};

const typeAccentBg: Record<string, string> = {
  annual: "bg-primary/5",
  quarterly: "bg-[hsl(var(--info)/0.05)]",
  monthly: "bg-[hsl(var(--warning)/0.05)]",
};

function nodeMatchesSearch(node: TreeNode, query: string): boolean {
  const q = query.toLowerCase();
  if (node.objective.title.toLowerCase().includes(q)) return true;
  if (node.objective.owner_name?.toLowerCase().includes(q)) return true;
  if (node.keyResults.some((kr) => kr.title.toLowerCase().includes(q))) return true;
  return node.children.some((child) => nodeMatchesSearch(child, q));
}

function directMatch(node: TreeNode, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    node.objective.title.toLowerCase().includes(q) ||
    (node.objective.owner_name?.toLowerCase().includes(q) ?? false)
  );
}

/* ─── Objective Card ─── */
function ObjectiveCard({
  node,
  depth,
  highlighted,
}: {
  node: TreeNode;
  depth: number;
  highlighted?: boolean;
}) {
  const obj = node.objective;
  const isRoot = depth === 0;

  return (
    <Link
      to={`/objectives/${obj.id}`}
      className={[
        "block rounded-lg border-l-4 bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/60",
        typeBorderColor[obj.objective_type] || "border-l-primary",
        typeAccentBg[obj.objective_type] || "",
        isRoot ? "w-[240px] p-3" : "w-[200px] p-2.5",
        highlighted ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-1.5 mb-1">
        <div className={`shrink-0 rounded bg-primary/10 flex items-center justify-center ${isRoot ? "h-6 w-6" : "h-5 w-5"}`}>
          <Target className={`text-primary ${isRoot ? "h-3.5 w-3.5" : "h-3 w-3"}`} />
        </div>
        <span className={`font-bold leading-snug line-clamp-3 flex-1 ${isRoot ? "text-xs" : "text-[11px]"}`}>
          {obj.title}
        </span>
      </div>

      {obj.objective_type && (
        <div className="mb-1 ml-0.5">
          <Badge
            variant="outline"
            className={`text-[8px] px-1 py-0 h-4 ${obj.objective_type === "annual" ? "border-primary/60 text-primary font-bold" : "border-border"}`}
          >
            {typeLabel[obj.objective_type] || obj.objective_type}
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-1 mb-1">
        <Badge variant={statusVariant[obj.status] || "outline"} className="text-[8px] px-1 py-0 h-4 shrink-0">
          {statusLabel[obj.status] || obj.status}
        </Badge>
      </div>

      <div className="flex items-center gap-1 mb-1.5">
        <Avatar className="h-4 w-4 shrink-0">
          {obj.owner_avatar && <AvatarImage src={obj.owner_avatar} alt={obj.owner_name} />}
          <AvatarFallback className="text-[7px]">
            {(obj.owner_name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-[9px] text-muted-foreground truncate">{obj.owner_name}</span>
      </div>

      <ProgressBar value={obj.progress} status={obj.status} showLabel />
    </Link>
  );
}

/* ─── KR Card (same style as Objective) ─── */
function KRCard({ kr }: { kr: any }) {
  const progress = kr.target_value > 0 ? Math.round((kr.current_value / kr.target_value) * 100) : 0;

  return (
    <Link
      to={`/objectives/${kr.objective_id}#kr-${kr.id}`}
      className="block rounded-lg border-l-4 border-l-muted-foreground/40 bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/60 w-[200px] p-2.5"
    >
      <div className="flex items-start gap-1.5 mb-1">
        <div className="shrink-0 rounded bg-muted-foreground/10 flex items-center justify-center h-5 w-5">
          <Key className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="font-bold leading-snug line-clamp-3 flex-1 text-[11px]">
          {kr.title}
        </span>
      </div>

      <div className="flex items-center gap-1 mb-1">
        <Badge variant={statusVariant[kr.status] || "outline"} className="text-[8px] px-1 py-0 h-4 shrink-0">
          {statusLabel[kr.status] || kr.status}
        </Badge>
        <span className="font-mono text-muted-foreground text-[9px] ml-auto">
          {kr.current_value}/{kr.target_value}
        </span>
      </div>

      <ProgressBar value={progress} status={kr.status} showLabel />
    </Link>
  );
}

/* ─── Connector Lines ─── */
function VLine({ height = "h-5" }: { height?: string }) {
  return <div className={`w-[2px] ${height} bg-border mx-auto`} />;
}

/* ─── Org Node ─── */
function OrgNode({
  node,
  depth = 0,
  searchQuery,
  expandedIds,
  onToggle,
}: {
  node: TreeNode;
  depth?: number;
  searchQuery: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const hasKRs = node.keyResults.length > 0;
  const isExpanded = expandedIds.has(node.objective.id);
  const isHighlighted = directMatch(node, searchQuery);
  const childCount = node.children.length;
  const krCount = node.keyResults.length;
  

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ObjectiveCard node={node} depth={depth} highlighted={isHighlighted} />
        {(hasChildren || hasKRs) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(node.objective.id);
            }}
            className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 rounded-full border border-border bg-card px-1.5 py-0.5 text-[8px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
          >
            {isExpanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
            <span>
              {childCount > 0 ? `${childCount} obj` : ""}
              {childCount > 0 && krCount > 0 ? " · " : ""}
              {krCount > 0 ? `${krCount} KR` : ""}
            </span>
          </button>
        )}
      </div>

      {/* KRs as compact stacked chips */}
      {isExpanded && hasKRs && (
        <>
          <VLine height="h-4" />
          <div className="flex flex-wrap gap-2 justify-center">
            {node.keyResults.map((kr) => (
              <KRCard key={kr.id} kr={kr} />
            ))}
          </div>
        </>
      )}

      {/* Child objectives */}
      {isExpanded && hasChildren && (
        <>
          <VLine height="h-5" />
          {node.children.length === 1 ? (
            <OrgNode
              node={node.children[0]}
              depth={depth + 1}
              searchQuery={searchQuery}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ) : (
            <div className="relative">
              <div className="flex">
                {node.children.map((child, i) => (
                  <div key={child.objective.id} className="flex flex-col items-center" style={{ margin: "0 8px" }}>
                    <div className="relative w-full flex justify-center">
                      {i > 0 && (
                        <div className="absolute top-0 h-[2px] bg-border" style={{ left: "-8px", right: "50%" }} />
                      )}
                      {i < node.children.length - 1 && (
                        <div className="absolute top-0 h-[2px] bg-border" style={{ right: "-8px", left: "50%" }} />
                      )}
                      <div className="w-[2px] h-3 bg-border" />
                    </div>
                    <OrgNode
                      node={child}
                      depth={depth + 1}
                      searchQuery={searchQuery}
                      expandedIds={expandedIds}
                      onToggle={onToggle}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function collectIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const n of nodes) {
    ids.push(n.objective.id);
    ids.push(...collectIds(n.children));
  }
  return ids;
}

function collectMatchingIds(nodes: TreeNode[], query: string): string[] {
  const ids: string[] = [];
  for (const n of nodes) {
    if (nodeMatchesSearch(n, query)) {
      ids.push(n.objective.id);
      ids.push(...collectMatchingIds(n.children, query));
    }
  }
  return ids;
}

interface OKROrgChartProps {
  tree: TreeNode[];
}

export function OKROrgChart({ tree }: OKROrgChartProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const allIds = useMemo(() => collectIds(tree), [tree]);
  // Start collapsed — only root nodes visible
  const rootIds = useMemo(() => tree.map((n) => n.objective.id), [tree]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(rootIds));
  const allExpanded = expandedIds.size >= allIds.length;

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        const matching = collectMatchingIds(tree, query.trim());
        setExpandedIds(new Set(matching));
      }
    },
    [tree]
  );

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedIds(allExpanded ? new Set() : new Set(allIds));
  }, [allExpanded, allIds]);

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Nenhum objetivo encontrado neste ciclo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar objetivo ou responsável..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExpandAll}>
          {allExpanded ? "Colapsar tudo" : "Expandir tudo"}
        </Button>
      </div>

      <div className="overflow-auto pb-4 max-h-[calc(100vh-260px)] touch-pan-x touch-pan-y">
        <div className="flex gap-4 md:gap-6 justify-center py-2 px-2 flex-wrap">
          {tree.map((node) => (
            <OrgNode
              key={node.objective.id}
              node={node}
              depth={0}
              searchQuery={searchQuery}
              expandedIds={expandedIds}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
