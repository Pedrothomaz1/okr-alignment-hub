import { useState } from "react";
import { Plus, Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBusinessUnits, type BusinessUnit } from "@/hooks/useBusinessUnits";

export default function BusinessUnitsPage() {
  const { businessUnits, isLoading, createBU, updateBU, deleteBU } = useBusinessUnits(true);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessUnit | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0ea5a4");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setName(""); setDescription(""); setColor("#0ea5a4");
    setOpen(true);
  };
  const openEdit = (bu: BusinessUnit) => {
    setEditing(bu);
    setName(bu.name);
    setDescription(bu.description ?? "");
    setColor(bu.color ?? "#0ea5a4");
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateBU({ id: editing.id, name, description, color });
        toast({ title: "Business Unit atualizada" });
      } else {
        await createBU({ name, description, color });
        toast({ title: "Business Unit criada" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const toggleArchive = async (bu: BusinessUnit) => {
    try {
      await updateBU({ id: bu.id, name: bu.name, archived: !bu.archived });
      toast({ title: bu.archived ? "BU restaurada" : "BU arquivada" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBU(deleteId);
      toast({ title: "Business Unit removida" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Units</h1>
          <p className="text-sm text-muted-foreground">Gerencie as unidades de negócio da organização.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova BU</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Unidades cadastradas</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : businessUnits.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma BU cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[80px]">Cor</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[160px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessUnits.map((bu) => (
                  <TableRow key={bu.id} className={bu.archived ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{bu.name}</TableCell>
                    <TableCell className="text-muted-foreground">{bu.description || "—"}</TableCell>
                    <TableCell>
                      <span className="inline-block h-5 w-5 rounded-full border" style={{ backgroundColor: bu.color || "#0ea5a4" }} />
                    </TableCell>
                    <TableCell>{bu.archived ? "Arquivada" : "Ativa"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(bu)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleArchive(bu)}>
                        {bu.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(bu.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar BU" : "Nova BU"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded border bg-transparent" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Business Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Os itens vinculados (Ciclos, OKRs, Iniciativas) ficarão como corporativos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}