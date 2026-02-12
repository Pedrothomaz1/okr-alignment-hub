import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Objective } from "@/hooks/useObjectives";

const schema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional(),
  status: z.string().default("on_track"),
});

type FormValues = z.infer<typeof schema>;

interface ObjectiveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  defaultValues?: Partial<Objective>;
  isPending?: boolean;
}

const statuses = [
  { value: "on_track", label: "No caminho" },
  { value: "at_risk", label: "Em risco" },
  { value: "behind", label: "Atrasado" },
  { value: "completed", label: "Concluído" },
];

export function ObjectiveForm({ open, onOpenChange, onSubmit, defaultValues, isPending }: ObjectiveFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      status: defaultValues?.status || "on_track",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{defaultValues?.id ? "Editar Objetivo" : "Novo Objetivo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="obj-title">Título</Label>
            <Input id="obj-title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="obj-desc">Descrição</Label>
            <Textarea id="obj-desc" rows={3} {...register("description")} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{defaultValues?.id ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
