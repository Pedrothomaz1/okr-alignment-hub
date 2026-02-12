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
  on_track: "bg-[hsl(var(--success)/0.15)]",
  at_risk: "bg-[hsl(var(--warning)/0.15)]",
  behind: "bg-[hsl(var(--destructive)/0.15)]",
  completed: "bg-[hsl(var(--info)/0.15)]",
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
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">{clamped}%</span>
      )}
    </div>
  );
}
