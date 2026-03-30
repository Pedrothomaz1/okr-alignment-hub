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
  quarterly: "border-l-info",
  monthly: "border-l-warning",
};

/** Check if a node or any descendant matches the search query */
function nodeMatchesSearch(node: TreeNode, query: string): boolean {
  const q = query.toLowerCase();
  if (node.objective.title.toLowerCase().includes(q)) return true;
  if (node.objective.owner_name?.toLowerCase().includes(q)) return true;
  if (node.keyResults.some((kr) => kr.title.toLowerCase().includes(q))) return true;
  return node.children.some((child) => nodeMatchesSearch(child, q));
}

/** Check if this specific node (not descendants) matches */
function directMatch(node: TreeNode, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    node.objective.title.toLowerCase().includes(q) ||
    (node.objective.owner_name?.toLowerCase().includes(q) ?? false)
  );
}

function ObjectiveCard({
  node,
  isRoot,
  highlighted,
}: {
  node: TreeNode;
  isRoot?: boolean;
  highlighted?: boolean;
}) {
  const obj = node.objective;

  return (
    <Link
      to={`/objectives/${obj.id}`}
      className={`block rounded-[var(--radius)] border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md ${
        isRoot
          ? "min-w-[280px] max-w-[340px] border-l-4 " + (typeBorderColor[obj.objective_type] || "border-l-primary")
          : "min-w-[240px] max-w-[300px]"
      } ${highlighted ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <Target className={`shrink-0 mt-0.5 text-primary ${isRoot ? "h-5 w-5" : "h-4 w-4"}`} />
        <span className={`font-semibold leading-snug line-clamp-3 flex-1 ${isRoot ? "text-sm" : "text-xs"}`}>
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
    <div className="min-w-[220px] max-w-[260px] rounded-[calc(var(--radius)-4px)] border border-border bg-muted/30 p-3 text-xs">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Key className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="font-medium leading-snug line-clamp-3">{kr.title}</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground mb-1.5">
        <span className="font-mono text-[11px]">
          {kr.current_value}/{kr.target_value} {kr.unit || ""}
        </span>
        <Badge variant={statusVariant[kr.status] || "outline"} className="text-[10px] px-1.5 py-0">
          {statusLabel[kr.status] || kr.status}
        </Badge>
      </div>
      <ProgressBar value={Math.max(0, Math.min(100, progress))} status={kr.status} />
    </div>
  );
}

function VLine({ height = "h-6" }: { height?: string }) {
  return <div className={`w-[2px] ${height} bg-foreground/20 mx-auto`} />;
}

function OrgNode({
  node,
  isRoot = false,
  searchQuery,
  expandedIds,
  onToggle,
}: {
  node: TreeNode;
  isRoot?: boolean;
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
        <ObjectiveCard node={node} isRoot={isRoot} highlighted={isHighlighted} />
        {/* Expand/collapse toggle */}
        {(hasChildren || hasKRs) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(node.objective.id);
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>{childCount > 0 ? `${childCount} obj` : ""}{childCount > 0 && krCount > 0 ? " · " : ""}{krCount > 0 ? `${krCount} KR` : ""}</span>
          </button>
        )}
      </div>

      {isExpanded && hasChildren && (
        <>
          <VLine height="h-8" />
          {node.children.length === 1 ? (
            <div className="flex flex-col items-center">
              <OrgNode
                node={node.children[0]}
                searchQuery={searchQuery}
                expandedIds={expandedIds}
                onToggle={onToggle}
              />
            </div>
          ) : (
            <div className="relative">
              <div className="flex">
                {node.children.map((child, i) => (
                  <div key={child.objective.id} className="flex flex-col items-center" style={{ margin: "0 16px" }}>
                    <div className="relative w-full flex justify-center">
                      {i > 0 && (
                        <div
                          className="absolute top-0 h-[2px] bg-foreground/20"
                          style={{ left: "-16px", right: "50%" }}
                        />
                      )}
                      {i < node.children.length - 1 && (
                        <div
                          className="absolute top-0 h-[2px] bg-foreground/20"
                          style={{ right: "-16px", left: "50%" }}
                        />
                      )}
                      <div className="w-[2px] h-4 bg-foreground/20" />
                    </div>
                    <OrgNode
                      node={child}
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

      {isExpanded && hasKRs && !hasChildren && (
        <>
          <VLine height="h-8" />
          <div className="flex flex-wrap gap-3 justify-center max-w-[600px]">
            {node.keyResults.map((kr) => (
              <div key={kr.id} className="flex flex-col items-center">
                <VLine height="h-4" />
                <KRCard kr={kr} />
              </div>
            ))}
          </div>
        </>
      )}

      {isExpanded && hasKRs && hasChildren && (
        <div className="mt-2 flex gap-2 justify-center flex-wrap max-w-[340px]">
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

/** Collect all node IDs in a tree */
function collectIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const n of nodes) {
    ids.push(n.objective.id);
    ids.push(...collectIds(n.children));
  }
  return ids;
}

/** Collect IDs of nodes that match search (or have matching descendants) */
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allIds));
  const allExpanded = expandedIds.size >= allIds.length;

  // When search changes, auto-expand matching branches
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(allIds));
    }
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
    <div className="space-y-4">
      {/* Search + expand/collapse controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar objetivo ou responsável..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExpandAll}>
          {allExpanded ? "Colapsar tudo" : "Expandir tudo"}
        </Button>
      </div>

      {/* Tree */}
      <div className="overflow-x-auto pb-6 -mx-2 px-2 touch-pan-x">
        <div className="flex gap-8 md:gap-12 justify-center min-w-max py-4 px-4 md:px-8">
          {tree.map((node) => (
            <OrgNode
              key={node.objective.id}
              node={node}
              isRoot
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
