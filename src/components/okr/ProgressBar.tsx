import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  status?: string;
  className?: string;
  showLabel?: boolean;
}

const statusColor: Record<string, string> = {
  on_track: "bg-[hsl(var(--success))]",
  at_risk: "bg-[hsl(var(--warning))]",
  behind: "bg-[hsl(var(--destructive))]",
  completed: "bg-[hsl(var(--info))]",
};

const statusBg: Record<string, string> = {
  on_track: "bg-[hsl(var(--success)/0.12)]",
  at_risk: "bg-[hsl(var(--warning)/0.12)]",
  behind: "bg-[hsl(var(--destructive)/0.12)]",
  completed: "bg-[hsl(var(--info)/0.12)]",
};

export function ProgressBar({ value, status = "on_track", className, showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative h-2 w-full overflow-hidden rounded-full", statusBg[status] || statusBg.on_track)}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", statusColor[status] || statusColor.on_track)}
          style={{ width: `${clamped}%` }}
        />
        {/* Current position marker */}
        {clamped > 0 && clamped < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-background"
            style={{
              left: `${clamped}%`,
              transform: "translate(-50%, -50%)",
              background: `hsl(var(--${status === "on_track" ? "success" : status === "at_risk" ? "warning" : status === "behind" ? "destructive" : "info"}))`,
            }}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs tabular-nums w-10 text-right",
            clamped >= 70 ? "font-bold text-foreground" : "font-medium text-muted-foreground"
          )}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
