import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfiles } from "@/hooks/useProfiles";
import { useInitiatives, type Initiative, type InitiativeInsert } from "@/hooks/useInitiatives";
import { formatValue, computeStatus, STATUS_DISPLAY } from "@/lib/initiative-format";
import InitiativeForm from "./InitiativeForm";
import InlineProgress from "@/components/initiatives/InlineProgress";
import InitiativeActions from "@/components/initiatives/InitiativeActions";

type SortKey = "date" | "canal" | "unit" | "dre_line" | "action" | "owner" | "deadline" | "target_value" | "status";
type SortDir = "asc" | "desc";

export default function InitiativesList() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can("initiatives.edit_any");
  const canCreate = can("initiatives.create");
  const canDelete = can("initiatives.delete");
  const { data: profiles } = useProfiles();
  const { initiatives, isLoading, createInitiative, updateInitiative, deleteInitiative, isCreating, isUpdating } = useInitiatives();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Initiative | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Filters
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterCanal, setFilterCanal] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

  const uniqueUnits = useMemo(() => {
    const units = new Set(initiatives.map((i) => i.unit));
    return Array.from(units).sort();
  }, [initiatives]);

  const uniqueCanals = useMemo(() => {
    const canals = new Set(initiatives.map((i) => i.canal).filter(Boolean));
    return Array.from(canals).sort();
  }, [initiatives]);

  const uniqueOwners = useMemo(() => {
    const owners = new Map<string, string>();
    initiatives.forEach((i) => {
      if (!owners.has(i.owner_id)) {
        owners.set(i.owner_id, profileMap.get(i.owner_id) ?? i.owner_id);
      }
    });
    return Array.from(owners.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [initiatives, profileMap]);

  const filtered = useMemo(() => {
    return initiatives.filter((i) => {
      if (filterUnit !== "all" && i.unit !== filterUnit) return false;
      if (filterCanal !== "all" && i.canal !== filterCanal) return false;
      if (filterOwner !== "all" && i.owner_id !== filterOwner) return false;
      return true;
    });
  }, [initiatives, filterUnit, filterCanal, filterOwner]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "canal":
          cmp = (a.canal || "").localeCompare(b.canal || "");
          break;
        case "unit":
          cmp = a.unit.localeCompare(b.unit);
          break;
        case "dre_line":
          cmp = a.dre_line.localeCompare(b.dre_line);
          break;
        case "action":
          cmp = a.action.localeCompare(b.action);
          break;
        case "owner":
          cmp = (profileMap.get(a.owner_id) ?? "").localeCompare(profileMap.get(b.owner_id) ?? "");
          break;
        case "deadline":
          cmp = a.deadline.localeCompare(b.deadline);
          break;
        case "target_value":
          cmp = (a.target_value || 0) - (b.target_value || 0);
          break;
        case "status": {
          const sa = computeStatus(a.current_value || 0, a.target_value || 0, a.deadline, a.measurement_unit || "R$");
          const sb = computeStatus(b.current_value || 0, b.target_value || 0, b.deadline, b.measurement_unit || "R$");
          cmp = sa.localeCompare(sb);
          break;
        }
      }
      return cmp * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir, profileMap]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const handleSubmit = async (data: InitiativeInsert) => {
    try {
      if (editing) {
        await updateInitiative({ id: editing.id, ...data });
        toast({ title: "Iniciativa atualizada com sucesso" });
      } else {
        await createInitiative(data);
        toast({ title: "Iniciativa criada com sucesso" });
      }
      setEditing(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInitiative(deleteTarget);
      toast({ title: "Iniciativa excluída" });
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const isDeadlineExpired = (deadline: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(deadline + "T00:00:00") < today;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Iniciativas</h1>
          {canCreate && (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Iniciativa
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterUnit} onValueChange={setFilterUnit}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              {uniqueUnits.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCanal} onValueChange={setFilterCanal}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              {uniqueCanals.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOwner} onValueChange={setFilterOwner}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {uniqueOwners.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground text-center py-12">Carregando...</div>
        ) : sorted.length === 0 ? (
          <div className="text-muted-foreground text-center py-12">Nenhuma iniciativa encontrada.</div>
        ) : (
          <div className="rounded-[var(--radius)] border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead col="date" label="Data" toggleSort={toggleSort} SortIcon={SortIcon} />
                  <SortableHead col="canal" label="Canal" toggleSort={toggleSort} SortIcon={SortIcon} />
                  <SortableHead col="unit" label="Unidade" toggleSort={toggleSort} SortIcon={SortIcon} />
                  <SortableHead col="dre_line" label="Linha da DRE" toggleSort={toggleSort} SortIcon={SortIcon} />
                  <SortableHead col="action" label="Ação" toggleSort={toggleSort} SortIcon={SortIcon} className="min-w-[250px]" />
                  <SortableHead col="owner" label="Dono" toggleSort={toggleSort} SortIcon={SortIcon} />
                  <SortableHead col="deadline" label="Prazo" toggleSort={toggleSort} SortIcon={SortIcon} />
                  <SortableHead col="target_value" label="Impacto Esperado" toggleSort={toggleSort} SortIcon={SortIcon} />
                  <TableHead className="min-w-[180px]">Progresso</TableHead>
                  <SortableHead col="status" label="Status" toggleSort={toggleSort} SortIcon={SortIcon} />
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((init) => {
                  const mu = init.measurement_unit || "R$";
                  const target = init.target_value || 0;
                  const current = init.current_value || 0;
                  const status = computeStatus(current, target, init.deadline, mu);
                  const display = STATUS_DISPLAY[status];
                  const expired = isDeadlineExpired(init.deadline);

                  return (
                    <TableRow key={init.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(init.date + "T00:00:00"), "MMM/yy", { locale: ptBR })}</TableCell>
                      <TableCell>{init.canal || "—"}</TableCell>
                      <TableCell>{init.unit}</TableCell>
                      <TableCell>{init.dre_line}</TableCell>
                      <TableCell className="min-w-[250px]">
                        <span className="block whitespace-normal break-words">{init.action}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{profileMap.get(init.owner_id) ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{format(new Date(init.deadline), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {mu === "bool" ? "—" : formatValue(target, mu)}
                      </TableCell>
                      <TableCell>
                        <InlineProgress
                          init={init}
                          canEdit={(canManage || init.owner_id === user?.id) && !expired}
                          onUpdate={updateInitiative}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status === "completed" ? "secondary" : status === "expired" ? "destructive" : "default"}
                          className={cn(
                            status === "completed" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          )}
                        >
                          {display.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <InitiativeActions
                          init={init}
                          canManage={canManage}
                          isAdmin={isAdmin}
                          isOwner={init.owner_id === user?.id}
                          expired={expired}
                          onEdit={() => { setEditing(init); setFormOpen(true); }}
                          onDelete={() => setDeleteTarget(init.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <InitiativeForm
          open={formOpen}
          onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
          onSubmit={handleSubmit}
          initiative={editing}
          currentUserId={user?.id ?? ""}
          isSubmitting={isCreating || isUpdating}
        />

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir iniciativa?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

/* ── Sortable header cell ── */
function SortableHead({
  col,
  label,
  toggleSort,
  SortIcon,
  className,
}: {
  col: SortKey;
  label: string;
  toggleSort: (k: SortKey) => void;
  SortIcon: React.FC<{ col: SortKey }>;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="flex items-center gap-0.5 hover:text-foreground transition-colors"
        onClick={() => toggleSort(col)}
      >
        {label}
        <SortIcon col={col} />
      </button>
    </TableHead>
  );
}
