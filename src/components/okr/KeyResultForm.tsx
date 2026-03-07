import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProfiles } from "@/hooks/useProfiles";
import type { KeyResult } from "@/hooks/useKeyResults";

const schema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional(),
  kr_type: z.string().default("percentage"),
  start_value: z.coerce.number().default(0),
  target_value: z.coerce.number().default(100),
  current_value: z.coerce.number().default(0),
  unit: z.string().optional(),
  weight: z.coerce.number().min(0.01, "Peso deve ser maior que 0").default(1),
  owner_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface KeyResultFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => void;
  defaultValues?: Partial<KeyResult>;
  isPending?: boolean;
  existingWeights?: number[];
}

const krTypes = [
  { value: "percentage", label: "Porcentagem" },
  { value: "number", label: "Número" },
  { value: "currency", label: "Moeda" },
  { value: "boolean", label: "Sim/Não" },
];

export function KeyResultForm({ open, onOpenChange, onSubmit, defaultValues, isPending, existingWeights = [] }: KeyResultFormProps) {
  const { toast } = useToast();
  const { data: profiles = [] } = useProfiles();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      kr_type: defaultValues?.kr_type || "percentage",
      start_value: defaultValues?.start_value ?? 0,
      target_value: defaultValues?.target_value ?? 100,
      current_value: defaultValues?.current_value ?? 0,
      unit: defaultValues?.unit || "",
      weight: (defaultValues as any)?.weight ?? 1,
      owner_id: defaultValues?.owner_id || "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{defaultValues?.id ? "Editar Key Result" : "Novo Key Result"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="kr-title">Título</Label>
            <Input id="kr-title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="kr-desc">Descrição</Label>
            <Textarea id="kr-desc" rows={2} {...register("description")} />
          </div>
          <div>
            <Label>Responsável</Label>
            <Select value={watch("owner_id") || "auto"} onValueChange={(v) => setValue("owner_id", v === "auto" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Eu mesmo" /></SelectTrigger>
              <SelectContent position="popper" className="z-[9999]">
                <SelectItem value="auto">Eu mesmo</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || "Sem nome"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={watch("kr_type")} onValueChange={(v) => setValue("kr_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="z-[9999]">
                  {krTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="kr-unit">Unidade</Label>
              <Input id="kr-unit" placeholder="%, R$, users..." {...register("unit")} />
            </div>
            <div>
              <Label htmlFor="kr-weight">Peso (%)</Label>
              <Input id="kr-weight" type="number" step="any" {...register("weight")} />
              {errors.weight && <p className="text-xs text-destructive mt-1">{errors.weight.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="kr-start">Início</Label>
              <Input id="kr-start" type="number" {...register("start_value")} />
            </div>
            <div>
              <Label htmlFor="kr-current">Atual</Label>
              <Input id="kr-current" type="number" {...register("current_value")} />
            </div>
            <div>
              <Label htmlFor="kr-target">Meta</Label>
              <Input id="kr-target" type="number" {...register("target_value")} />
            </div>
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
