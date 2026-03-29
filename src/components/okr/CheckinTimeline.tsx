import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Smile, Meh, Frown } from "lucide-react";
import { useCheckins } from "@/hooks/useCheckins";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CheckinTimelineProps {
  keyResultId: string;
  unit?: string | null;
  targetValue?: number;
  canCheckin?: boolean;
}

type Confidence = "confident" | "neutral" | "concerned";

const CONFIDENCE_CONFIG: Record<Confidence, { icon: typeof Smile; label: string; colorClass: string }> = {
  confident: { icon: Smile, label: "Confiante", colorClass: "text-[hsl(var(--success))]" },
  neutral: { icon: Meh, label: "Neutro", colorClass: "text-[hsl(var(--warning))]" },
  concerned: { icon: Frown, label: "Preocupado", colorClass: "text-[hsl(var(--destructive))]" },
};

export function CheckinTimeline({ keyResultId, unit, targetValue }: CheckinTimelineProps) {
  const { checkins, isLoading, createCheckin } = useCheckins(keyResultId);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [difficulties, setDifficulties] = useState("");
  const [confidence, setConfidence] = useState<Confidence>("neutral");

  const lastCheckin = checkins.length > 0 ? checkins[0] : null;

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    createCheckin.mutate(
      {
        key_result_id: keyResultId,
        value: num,
        note: note.trim() || undefined,
        confidence,
        difficulties: difficulties.trim() || undefined,
      },
      {
        onSuccess: () => {
          setValue("");
          setNote("");
          setDifficulties("");
          setConfidence("neutral");
        },
      }
    );
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Reference info */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        {lastCheckin && (
          <span>Último: <span className="font-medium text-foreground">{unit ? `${lastCheckin.value} ${unit}` : lastCheckin.value}</span></span>
        )}
        {targetValue !== undefined && (
          <span>Meta: <span className="font-medium text-foreground">{unit ? `${targetValue} ${unit}` : targetValue}</span></span>
        )}
      </div>

      {/* New check-in form */}
      <div className="flex flex-col gap-2 p-3 rounded-md border border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={unit ? `Valor (${unit})` : "Valor"}
            className="h-8 text-xs flex-1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleSubmit}
            disabled={createCheckin.isPending || !value}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Check-in
          </Button>
        </div>

        {/* Confidence selector */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Como estou me sentindo?</p>
          <div className="flex gap-2">
            {(Object.entries(CONFIDENCE_CONFIG) as [Confidence, typeof CONFIDENCE_CONFIG.confident][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isSelected = confidence === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setConfidence(key)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-smooth",
                    isSelected
                      ? "border-primary/50 bg-primary/10 font-medium"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isSelected ? cfg.colorClass : "text-muted-foreground")} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <Textarea
          placeholder="Comentários gerais..."
          className="text-xs min-h-[40px] resize-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Textarea
          placeholder="Dificuldades encontradas..."
          className="text-xs min-h-[40px] resize-none"
          value={difficulties}
          onChange={(e) => setDifficulties(e.target.value)}
        />
      </div>

      {/* Timeline */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : checkins.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhum check-in registrado.</p>
      ) : (
        <div className="space-y-0 relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
          {checkins.map((c: any) => {
            const conf = c.confidence as Confidence | undefined;
            const ConfIcon = conf && CONFIDENCE_CONFIG[conf] ? CONFIDENCE_CONFIG[conf].icon : null;
            return (
              <div key={c.id} className="flex gap-3 relative py-1.5">
                <div className="w-[15px] flex justify-center shrink-0 z-10">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium">
                      {unit ? `${c.value} ${unit}` : c.value}
                    </span>
                    {ConfIcon && conf && (
                      <ConfIcon className={cn("h-3 w-3", CONFIDENCE_CONFIG[conf].colorClass)} />
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(c.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {c.profiles?.full_name && (
                    <span className="text-[10px] text-muted-foreground">{c.profiles.full_name}</span>
                  )}
                  {c.note && <p className="text-xs text-muted-foreground mt-0.5">{c.note}</p>}
                  {c.difficulties && (
                    <p className="text-xs mt-0.5 text-[hsl(var(--destructive))]">
                      ⚠ {c.difficulties}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
