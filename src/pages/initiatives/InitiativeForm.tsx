import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { usePermissions } from "@/hooks/usePermissions";
import { MEASUREMENT_UNITS } from "@/lib/initiative-format";
import type { Initiative, InitiativeInsert } from "@/hooks/useInitiatives";

const DRE_LINES = [
  "Receita Bruta", "Deduções", "Receita Líquida", "CPV / CMV", "Custos",
  "Lucro Bruto", "Despesas Operacionais", "Despesas Administrativas",
  "Despesas Comerciais", "SG&A", "Estrutura", "Outras Desp Op",
  "EBITDA", "Depreciação e Amortização",
  "EBIT", "Resultado Financeiro", "Lucro Líquido", "Outros",
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
  const { can } = usePermissions();
  const isAdmin = can("initiatives.delete"); // admin-level permission

  const [date, setDate] = useState<Date>(new Date());
  const [canal, setCanal] = useState("");
  const [unit, setUnit] = useState("");
  const [dreLine, setDreLine] = useState("");
  const [action, setAction] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [deadline, setDeadline] = useState<Date>(new Date());
  const [measurementUnit, setMeasurementUnit] = useState("R$");
  const [targetValue, setTargetValue] = useState<string>("");
  const [currentValue, setCurrentValue] = useState<string>("");
  const [boolValue, setBoolValue] = useState(false);

  const isEditing = !!initiative;

  useEffect(() => {
    if (initiative) {
      setDate(new Date(initiative.date));
      setCanal(initiative.canal || "");
      setUnit(initiative.unit);
      setDreLine(initiative.dre_line);
      setAction(initiative.action);
      setOwnerId(initiative.owner_id);
      setDeadline(new Date(initiative.deadline));
      setMeasurementUnit(initiative.measurement_unit || "R$");
      setTargetValue(String(initiative.target_value || ""));
      setCurrentValue(String(initiative.current_value || ""));
      setBoolValue((initiative.current_value || 0) >= 1);
    } else {
      setDate(new Date());
      setCanal("");
      setUnit("");
      setDreLine("");
      setAction("");
      setOwnerId("");
      setDeadline(new Date());
      setMeasurementUnit("R$");
      setTargetValue("");
      setCurrentValue("");
      setBoolValue(false);
    }
  }, [initiative, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isBool = measurementUnit === "bool";
    await onSubmit({
      date: format(date, "yyyy-MM-dd"),
      canal,
      unit,
      dre_line: dreLine,
      action,
      owner_id: ownerId,
      deadline: format(deadline, "yyyy-MM-dd"),
      status: "pending",
      expected_impact: null,
      measurement_unit: measurementUnit,
      target_value: isBool ? 1 : Number(targetValue) || 0,
      current_value: isBool ? (boolValue ? 1 : 0) : Number(currentValue) || 0,
      created_by: initiative?.created_by ?? currentUserId,
    });
    onOpenChange(false);
  };

  const isValid = unit && dreLine && action && ownerId && (measurementUnit === "bool" || Number(targetValue) > 0);
  const isBool = measurementUnit === "bool";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Iniciativa" : "Nova Iniciativa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Prazo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")} disabled={isEditing && !isAdmin}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(deadline, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={deadline} onSelect={(d) => d && setDeadline(d)} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                {isEditing && !isAdmin && (
                  <p className="text-xs text-muted-foreground">Somente administradores podem alterar o prazo.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Input value={canal} onChange={(e) => setCanal(e.target.value)} placeholder="Ex: Lojas físicas, Consultoras, Site..." />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: Todas, Cambuí..." required />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label>Ação</Label>
              <Textarea value={action} onChange={(e) => setAction(e.target.value)} placeholder="Descreva a iniciativa / ação corretiva..." required rows={3} />
            </div>

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

            <div className="space-y-2">
              <Label>Forma de Mensuração</Label>
              <Select value={measurementUnit} onValueChange={setMeasurementUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEASUREMENT_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isBool && (
              <div className="space-y-2">
                <Label>Impacto Esperado ({measurementUnit})</Label>
                <Input
                  type="number"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={`Ex: ${measurementUnit === "R$" ? "100000" : measurementUnit === "%" ? "100" : "50"}`}
                  required
                />
              </div>
            )}

            {isEditing && (
              <div className="space-y-2">
                <Label>Valor Atual {!isBool && `(${measurementUnit})`}</Label>
                {isBool ? (
                  <div className="flex items-center gap-3">
                    <Switch checked={boolValue} onCheckedChange={setBoolValue} />
                    <span className="text-sm text-muted-foreground">{boolValue ? "Sim" : "Não"}</span>
                  </div>
                ) : (
                  <Input
                    type="number"
                    step="any"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="Valor atual de progresso"
                  />
                )}
              </div>
            )}
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
