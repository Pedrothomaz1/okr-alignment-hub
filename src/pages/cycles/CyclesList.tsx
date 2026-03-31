import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCycles } from "@/hooks/useCycles";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CycleForm } from "./CycleForm";

const statusBadge = (status: string) => {
  switch (status) {
    case "active": return "badge-success";
    case "draft": return "badge-info";
    case "closed": return "badge-warning";
    case "archived": return "badge-destructive";
    case "pending_approval": return "badge-warning";
    default: return "badge-info";
  }
};

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  closed: "Encerrado",
  archived: "Arquivado",
  pending_approval: "Aguardando Aprovação",
};

export default function CyclesList() {
  const { cycles, isLoading, deleteCycle } = useCycles();
  const { user } = useAuth();
  const { hasRole } = useRoles(user?.id);
  const canManage = hasRole("admin") || hasRole("okr_master");
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editCycle, setEditCycle] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCycle.mutateAsync(deleteId);
      toast({ title: "Ciclo excluído com sucesso" });
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ciclos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os ciclos de OKR da organização</p>
        </div>
        {canManage && (
          <Button variant="cta" onClick={() => { setEditCycle(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Novo Ciclo
          </Button>
        )}
      </div>

      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : cycles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nenhum ciclo encontrado</div>
        ) : (
          <div className="table-row-hover">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  {canManage && <TableHead className="w-24">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell>
                      <Link to={`/cycles/${cycle.id}`} className="font-medium text-primary hover:underline">
                        {cycle.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={statusBadge(cycle.status)}>
                        {statusLabel[cycle.status] || cycle.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(cycle.start_date), "dd MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(cycle.end_date), "dd MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditCycle(cycle.id); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cycle.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CycleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cycleId={editCycle}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ciclo?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
