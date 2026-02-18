import { useState, useMemo } from "react";
import { useOKRTree } from "@/hooks/useOKRTree";
import { useCycles } from "@/hooks/useCycles";
import { useProfiles } from "@/hooks/useProfiles";
import { OKRTreeView } from "@/components/okr/OKRTreeView";
import { DataStoryBarChart } from "@/components/charts/DataStoryBarChart";
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

/** Flatten tree into list of objectives for metrics */
function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  for (const n of nodes) {
    result.push(n);
    result.push(...flattenTree(n.children));
  }
  return result;
}

const statusLabels: Record<string, string> = {
  on_track: "No caminho",
  at_risk: "Em risco",
  behind: "Atrasado",
  completed: "Concluído",
};

export default function AlignmentView() {
  const { cycles } = useCycles();
  const { data: profiles } = useProfiles();
  const activeCycle = cycles.find((c) => c.status === "active") || cycles[0];
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const cycleId = selectedCycleId || activeCycle?.id || "";
  const { data: tree, isLoading } = useOKRTree(cycleId || undefined);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [expanded, setExpanded] = useState(true);

  const filteredTree = useMemo(() => {
    if (!tree) return [];
    return filterTree(tree, ownerFilter || undefined, statusFilter || undefined);
  }, [tree, statusFilter, ownerFilter]);

  // Compute metrics from ALL objectives in the cycle (before filtering)
  const allObjectives = useMemo(() => (tree ? flattenTree(tree) : []), [tree]);
  const totalOKRs = allObjectives.length;
  const completedCount = allObjectives.filter((n) => n.objective.status === "completed").length;
  const atRiskCount = allObjectives.filter((n) => n.objective.status === "at_risk" || n.objective.status === "behind").length;
  const avgProgress = totalOKRs > 0
    ? Math.round(allObjectives.reduce((sum, n) => sum + n.objective.progress, 0) / totalOKRs)
    : 0;
  const completedPct = totalOKRs > 0 ? Math.round((completedCount / totalOKRs) * 100) : 0;
  const atRiskPct = totalOKRs > 0 ? Math.round((atRiskCount / totalOKRs) * 100) : 0;

  // Status distribution for bar chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = { on_track: 0, at_risk: 0, behind: 0, completed: 0 };
    for (const n of allObjectives) {
      if (counts[n.objective.status] !== undefined) counts[n.objective.status]++;
    }
    return [
      { label: statusLabels.on_track, value: counts.on_track, highlight: false },
      { label: statusLabels.at_risk, value: counts.at_risk, highlight: true },
      { label: statusLabels.behind, value: counts.behind, highlight: true },
      { label: statusLabels.completed, value: counts.completed, highlight: false },
    ];
  }, [allObjectives]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GitBranch className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Alinhamento</h1>
      </div>

      {/* Filters */}
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

        <Select value={ownerFilter || "all"} onValueChange={(v) => setOwnerFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todos os responsáveis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os responsáveis</SelectItem>
            {(profiles ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || p.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          <ChevronsUpDown className="h-4 w-4 mr-1" />
          {expanded ? "Colapsar" : "Expandir"}
        </Button>
      </div>

      {/* Summary Cards — DataStory: "Em Risco" highlighted, others neutral */}
      {!isLoading && totalOKRs > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card" style={{ borderLeft: "3px solid hsl(var(--muted-foreground) / 0.3)" }}>
            <p className="text-xs font-medium text-muted-foreground">Total OKRs</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">{totalOKRs}</p>
          </div>
          <div className="stat-card" style={{ borderLeft: "3px solid hsl(var(--muted-foreground) / 0.3)" }}>
            <p className="text-xs font-medium text-muted-foreground">Concluídos</p>
            <p className="text-2xl font-bold mt-1 text-muted-foreground">
              {completedPct}<span className="text-sm font-normal text-muted-foreground/60">%</span>
            </p>
          </div>
          <div className="stat-card stat-card-destructive" style={{ background: "hsl(var(--destructive) / 0.06)" }}>
            <p className="text-xs font-semibold text-destructive">Em Risco</p>
            <p className="text-3xl font-bold mt-1 text-destructive">
              {atRiskPct}<span className="text-base font-normal text-destructive/60">%</span>
            </p>
          </div>
          <div className="stat-card stat-card-primary" style={{ background: "hsl(var(--primary) / 0.06)" }}>
            <p className="text-xs font-semibold text-primary">Progresso Médio</p>
            <p className="text-3xl font-bold mt-1 text-primary">
              {avgProgress}<span className="text-base font-normal text-primary/60">%</span>
            </p>
          </div>
        </div>
      )}

      {/* Status Distribution — DataStory: horizontal bars, no pie charts */}
      {!isLoading && totalOKRs > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="card-elevated lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Distribuição de Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DataStoryBarChart
                data={statusDistribution}
                highlightColor="var(--destructive)"
                neutralColor="var(--muted-foreground)"
              />
            </CardContent>
          </Card>

          <Card className="card-elevated lg:col-span-2">
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
      )}

      {/* Fallback when no data or loading */}
      {isLoading && (
        <Card className="card-elevated">
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && totalOKRs === 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Árvore de Objetivos</CardTitle>
          </CardHeader>
          <CardContent>
            <OKRTreeView tree={filteredTree} defaultExpanded={expanded} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
