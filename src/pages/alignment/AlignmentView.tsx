import { useState, useMemo } from "react";
import { useOKRTree } from "@/hooks/useOKRTree";
import { useCycles } from "@/hooks/useCycles";
import { OKRTreeView } from "@/components/okr/OKRTreeView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, ChevronsUpDown } from "lucide-react";
import type { TreeNode } from "@/hooks/useOKRTree";

function filterTree(nodes: TreeNode[], owner?: string, status?: string): TreeNode[] {
  return nodes
    .map((node) => {
      const children = filterTree(node.children, owner, status);
      const matchOwner = !owner || node.objective.owner_id === owner;
      const matchStatus = !status || node.objective.status === status;
      if ((matchOwner && matchStatus) || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}

export default function AlignmentView() {
  const { cycles } = useCycles();
  const activeCycle = cycles.find((c) => c.status === "active") || cycles[0];
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const cycleId = selectedCycleId || activeCycle?.id || "";
  const { data: tree, isLoading } = useOKRTree(cycleId || undefined);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expanded, setExpanded] = useState(true);

  const filteredTree = useMemo(() => {
    if (!tree) return [];
    return filterTree(tree, undefined, statusFilter || undefined);
  }, [tree, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GitBranch className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Alinhamento</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={cycleId} onValueChange={setSelectedCycleId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecione um ciclo" />
          </SelectTrigger>
          <SelectContent>
            {cycles.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="on_track">No caminho</SelectItem>
            <SelectItem value="at_risk">Em risco</SelectItem>
            <SelectItem value="behind">Atrasado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          <ChevronsUpDown className="h-4 w-4 mr-1" />
          {expanded ? "Colapsar" : "Expandir"}
        </Button>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Árvore de Objetivos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <OKRTreeView tree={filteredTree} defaultExpanded={expanded} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
