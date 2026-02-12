import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCycles } from "@/hooks/useCycles";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const cycleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().min(1, "Data de fim é obrigatória"),
  status: z.string().default("draft"),
}).refine((d) => d.end_date > d.start_date, {
  message: "Data de fim deve ser posterior à de início",
  path: ["end_date"],
});

type CycleFormValues = z.infer<typeof cycleSchema>;

interface CycleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string | null;
}

export function CycleForm({ open, onOpenChange, cycleId }: CycleFormProps) {
  const { cycles, createCycle, updateCycle } = useCycles();
  const { toast } = useToast();
  const editing = cycleId ? cycles.find((c) => c.id === cycleId) : null;

  const form = useForm<CycleFormValues>({
    resolver: zodResolver(cycleSchema),
    defaultValues: { name: "", description: "", start_date: "", end_date: "", status: "draft" },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        description: editing.description || "",
        start_date: editing.start_date,
        end_date: editing.end_date,
        status: editing.status,
      });
    } else {
      form.reset({ name: "", description: "", start_date: "", end_date: "", status: "draft" });
    }
  }, [editing, open]);

  const onSubmit = async (values: CycleFormValues) => {
    try {
      if (editing) {
        await updateCycle.mutateAsync({ id: editing.id, ...values });
        toast({ title: "Ciclo atualizado" });
      } else {
        await createCycle.mutateAsync({ name: values.name, description: values.description, start_date: values.start_date, end_date: values.end_date, status: values.status });
        toast({ title: "Ciclo criado" });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Ciclo" : "Novo Ciclo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Q1 2026" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Textarea placeholder="Descrição do ciclo..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Início</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fim</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="closed">Encerrado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={createCycle.isPending || updateCycle.isPending}>
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
