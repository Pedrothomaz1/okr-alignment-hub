import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send } from "lucide-react";
import { useCheckins } from "@/hooks/useCheckins";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CheckinTimelineProps {
  keyResultId: string;
  unit?: string | null;
}

export function CheckinTimeline({ keyResultId, unit }: CheckinTimelineProps) {
  const { checkins, isLoading, createCheckin } = useCheckins(keyResultId);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    createCheckin.mutate(
      { key_result_id: keyResultId, value: num, note: note.trim() || undefined },
      { onSuccess: () => { setValue(""); setNote(""); } }
    );
  };

  return (
    <div className="space-y-3 pt-2">
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
        <Textarea
          placeholder="Nota opcional..."
          className="text-xs min-h-[48px] resize-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
          {checkins.map((c) => (
            <div key={c.id} className="flex gap-3 relative py-1.5">
              <div className="w-[15px] flex justify-center shrink-0 z-10">
                <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium">
                    {unit ? `${c.value} ${unit}` : c.value}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(c.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {c.profiles?.full_name && (
                  <span className="text-[10px] text-muted-foreground">{c.profiles.full_name}</span>
                )}
                {c.note && <p className="text-xs text-muted-foreground mt-0.5">{c.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
