import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useProfiles } from "@/hooks/useProfiles";
import type { Initiative, InitiativeInsert } from "@/hooks/useInitiatives";

const DRE_LINES = [
  "Receita Bruta",
  "Deduções",
  "Receita Líquida",
  "CPV / CMV",
  "Lucro Bruto",
  "Despesas Operacionais",
  "Despesas Administrativas",
  "Despesas Comerciais",
  "EBITDA",
  "Depreciação e Amortização",
  "EBIT",
  "Resultado Financeiro",
  "Lucro Líquido",
  "Outros",
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

interface InitiativeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InitiativeInsert) => Promise<void>;
  initiative?: Initiative | null;
  currentUserId: string;
  isSubmitting?: boolean;
}

export default function InitiativeForm({
  open, onOpenChange, onSubmit, initiative, currentUserId, isSubmitting,
}: InitiativeFormProps) {
  const { data: profiles } = useProfiles();

  const [date, setDate] = useState<Date>(new Date());
  const [unit, setUnit] = useState("");
  const [dreLine, setDreLine] = useState("");
  const [action, setAction] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [deadline, setDeadline] = useState<Date>(new Date());
  const [status, setStatus] = useState("pending");
  const [expectedImpact, setExpectedImpact] = useState("");

  useEffect(() => {
    if (initiative) {
      setDate(new Date(initiative.date));
      setUnit(initiative.unit);
      setDreLine(initiative.dre_line);
      setAction(initiative.action);
      setOwnerId(initiative.owner_id);
      setDeadline(new Date(initiative.deadline));
      setStatus(initiative.status);
      setExpectedImpact(initiative.expected_impact ?? "");
    } else {
      setDate(new Date());
      setUnit("");
      setDreLine("");
      setAction("");
      setOwnerId("");
      setDeadline(new Date());
      setStatus("pending");
      setExpectedImpact("");
    }
  }, [initiative, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      date: format(date, "yyyy-MM-dd"),
      unit,
      dre_line: dreLine,
      action,
      owner_id: ownerId,
      deadline: format(deadline, "yyyy-MM-dd"),
      status,
      expected_impact: expectedImpact || null,
      created_by: initiative?.created_by ?? currentUserId,
    });
    onOpenChange(false);
  };

  const isValid = unit && dreLine && action && ownerId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initiative ? "Editar Iniciativa" : "Nova Iniciativa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Prazo */}
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(deadline, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={(d) => d && setDeadline(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Unidade */}
          <div className="space-y-2">
            <Label>Unidade</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: Unidade SP, Filial RJ..." required />
          </div>

          {/* Linha da DRE */}
          <div className="space-y-2">
            <Label>Linha da DRE</Label>
            <Select value={dreLine} onValueChange={setDreLine} required>
              <SelectTrigger><SelectValue placeholder="Selecione a linha da DRE" /></SelectTrigger>
              <SelectContent>
                {DRE_LINES.map((line) => (
                  <SelectItem key={line} value={line}>{line}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ação */}
          <div className="space-y-2">
            <Label>Ação</Label>
            <Textarea value={action} onChange={(e) => setAction(e.target.value)} placeholder="Descreva a iniciativa / ação corretiva..." required rows={3} />
          </div>

          {/* Dono */}
          <div className="space-y-2">
            <Label>Dono</Label>
            <Select value={ownerId} onValueChange={setOwnerId} required>
              <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
              <SelectContent>
                {profiles?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name || p.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Impacto esperado */}
          <div className="space-y-2">
            <Label>Impacto Esperado</Label>
            <Textarea value={expectedImpact} onChange={(e) => setExpectedImpact(e.target.value)} placeholder="Descreva o impacto financeiro/operacional esperado..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Salvando..." : initiative ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
