import { useState } from "react";
import { Pencil } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { KeyResult } from "@/hooks/useKeyResults";

interface KeyResultCardProps {
  kr: KeyResult;
  onUpdateProgress: (id: string, value: number) => void;
  onEdit?: (kr: KeyResult) => void;
}

function computeProgress(kr: KeyResult): number {
  const range = kr.target_value - kr.start_value;
  if (range === 0) return 0;
  return Math.min(100, Math.max(0, ((kr.current_value - kr.start_value) / range) * 100));
}

export function KeyResultCard({ kr, onUpdateProgress, onEdit }: KeyResultCardProps) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(kr.current_value));
  const progress = computeProgress(kr);

  const handleSave = () => {
    const num = parseFloat(tempValue);
    if (!isNaN(num)) {
      onUpdateProgress(kr.id, num);
    }
    setEditing(false);
  };

  return (
    <div className="card-elevated p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{kr.title}</p>
          {kr.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{kr.description}</p>}
        </div>
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onEdit(kr)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ProgressBar value={progress} status={kr.status} showLabel />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{kr.unit ? `${kr.start_value} ${kr.unit}` : kr.start_value}</span>
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              className="h-6 w-20 text-xs px-1"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={handleSave}>OK</Button>
          </div>
        ) : (
          <button
            className="font-medium text-primary hover:underline cursor-pointer"
            onClick={() => { setTempValue(String(kr.current_value)); setEditing(true); }}
          >
            {kr.unit ? `${kr.current_value} ${kr.unit}` : kr.current_value}
          </button>
        )}
        <span>{kr.unit ? `${kr.target_value} ${kr.unit}` : kr.target_value}</span>
      </div>
    </div>
  );
}
