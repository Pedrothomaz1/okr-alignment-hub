import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useProfiles } from "@/hooks/useProfiles";
import { useInitiatives, type Initiative, type InitiativeInsert } from "@/hooks/useInitiatives";
import { formatValue, computeStatus, STATUS_DISPLAY } from "@/lib/initiative-format";
import InitiativeForm from "./InitiativeForm";

export default function InitiativesList() {
  const { user } = useAuth();
  const { isAdmin, hasRole } = useRoles(user?.id);
  const canManage = isAdmin || hasRole("okr_master");
  const { data: profiles } = useProfiles();
  const { initiatives, isLoading, createInitiative, updateInitiative, deleteInitiative, isCreating, isUpdating } = useInitiatives();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Initiative | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Filters
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

  // Unique units from initiatives for filter
  const uniqueUnits = useMemo(() => {
    const units = new Set(initiatives.map((i) => i.unit));
    return Array.from(units).sort();
  }, [initiatives]);

  // Unique owners from initiatives for filter
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
      if (filterOwner !== "all" && i.owner_id !== filterOwner) return false;
      return true;
    });
  }, [initiatives, filterUnit, filterOwner]);

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
          {canManage && (
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
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground text-center py-12">Nenhuma iniciativa encontrada.</div>
        ) : (
          <div className="rounded-[var(--radius)] border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Linha da DRE</TableHead>
                  <TableHead className="min-w-[200px]">Ação</TableHead>
                  <TableHead>Dono</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Impacto Esperado</TableHead>
                  <TableHead className="min-w-[180px]">Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((init) => {
                  const mu = init.measurement_unit || "R$";
                  const target = init.target_value || 0;
                  const current = init.current_value || 0;
                  const status = computeStatus(current, target, init.deadline, mu);
                  const display = STATUS_DISPLAY[status];
                  const progressPct = mu === "bool"
                    ? (current >= 1 ? 100 : 0)
                    : target > 0 ? Math.min(100, (current / target) * 100) : 0;
                  const expired = isDeadlineExpired(init.deadline);

                  return (
                    <TableRow key={init.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(init.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{init.unit}</TableCell>
                      <TableCell>{init.dre_line}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{init.action}</TableCell>
                      <TableCell className="whitespace-nowrap">{profileMap.get(init.owner_id) ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{format(new Date(init.deadline), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {mu === "bool" ? "—" : formatValue(target, mu)}
                      </TableCell>
                      <TableCell>
                        {mu === "bool" ? (
                          <div className="flex items-center gap-2">
                            {current >= 1 ? (
                              <Check className="h-5 w-5 text-green-600" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="text-sm">{current >= 1 ? "Sim" : "Não"}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{formatValue(current, mu)}</span>
                              <span>{Math.round(progressPct)}%</span>
                            </div>
                            <Progress
                              value={progressPct}
                              className={cn(
                                "h-2",
                                status === "completed" && "[&>[data-state]]:bg-green-600",
                                status === "expired" && "[&>[data-state]]:bg-destructive",
                                status === "in_progress" && "[&>[data-state]]:bg-blue-600"
                              )}
                            />
                          </div>
                        )}
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
                        <div className="flex gap-1">
                          {(canManage || init.owner_id === user?.id) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={expired}
                                    onClick={() => { setEditing(init); setFormOpen(true); }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {expired && <TooltipContent>Prazo expirado</TooltipContent>}
                            </Tooltip>
                          )}
                          {isAdmin && (
                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(init.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
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
