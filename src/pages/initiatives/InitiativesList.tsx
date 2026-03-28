import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useProfiles } from "@/hooks/useProfiles";
import { useInitiatives, type Initiative, type InitiativeInsert } from "@/hooks/useInitiatives";
import InitiativeForm from "./InitiativeForm";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  in_progress: { label: "Em andamento", variant: "default" },
  completed: { label: "Concluída", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

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

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

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

  const canEdit = (init: Initiative) => canManage || init.owner_id === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Iniciativas</h1>
          <p className="text-muted-foreground">Ações corretivas fora do ciclo de OKRs</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Iniciativa
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Carregando...</div>
      ) : initiatives.length === 0 ? (
        <div className="text-muted-foreground text-center py-12">Nenhuma iniciativa cadastrada.</div>
      ) : (
        <div className="rounded-[var(--radius)] border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Linha da DRE</TableHead>
                <TableHead className="min-w-[200px]">Ação</TableHead>
                <TableHead>Dono</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Impacto Esperado</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initiatives.map((init) => {
                const st = STATUS_MAP[init.status] ?? STATUS_MAP.pending;
                return (
                  <TableRow key={init.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(init.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{init.unit}</TableCell>
                    <TableCell>{init.dre_line}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{init.action}</TableCell>
                    <TableCell className="whitespace-nowrap">{profileMap.get(init.owner_id) ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{format(new Date(init.deadline), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{init.expected_impact || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canEdit(init) && (
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(init); setFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
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
  );
}
