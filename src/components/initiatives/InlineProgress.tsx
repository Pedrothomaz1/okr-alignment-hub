import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { formatValue, computeStatus } from "@/lib/initiative-format";
import type { Initiative } from "@/hooks/useInitiatives";

interface InlineProgressProps {
  init: Initiative;
  canEdit: boolean;
  onUpdate: (data: { id: string; current_value: number }) => Promise<unknown>;
}

export default function InlineProgress({ init, canEdit, onUpdate }: InlineProgressProps) {
  const mu = init.measurement_unit || "R$";
  const target = init.target_value || 0;
  const current = init.current_value || 0;
  const status = computeStatus(current, target, init.deadline, mu);
  const progressPct = mu === "bool"
    ? (current >= 1 ? 100 : 0)
    : target > 0 ? Math.min(100, (current / target) * 100) : 0;

  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(current));
  const [saving, setSaving] = useState(false);

  const handleSaveNumeric = async () => {
    const val = parseFloat(inputValue.replace(",", "."));
    if (isNaN(val)) return;
    setSaving(true);
    try {
      await onUpdate({ id: init.id, current_value: val });
      setPopoverOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBool = async (checked: boolean) => {
    try {
      await onUpdate({ id: init.id, current_value: checked ? 1 : 0 });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  if (mu === "bool") {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={current >= 1}
          onCheckedChange={handleToggleBool}
          disabled={!canEdit}
        />
        <span className="text-sm">{current >= 1 ? "Sim" : "Não"}</span>
      </div>
    );
  }

  const progressBar = (
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
  );

  if (!canEdit) return progressBar;

  return (
    <Popover open={popoverOpen} onOpenChange={(o) => { setPopoverOpen(o); if (o) setInputValue(String(current)); }}>
      <PopoverTrigger asChild>
        <button type="button" className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity">
          {progressBar}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <p className="text-sm font-medium">Atualizar progresso</p>
        <div className="space-y-1">
          <Input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveNumeric()}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            de {formatValue(target, mu)}
          </p>
        </div>
        <Button size="sm" className="w-full" onClick={handleSaveNumeric} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
