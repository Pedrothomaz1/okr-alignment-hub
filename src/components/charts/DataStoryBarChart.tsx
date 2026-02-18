import { cn } from "@/lib/utils";

interface BarData {
  label: string;
  value: number;
  highlight?: boolean;
}

interface DataStoryBarChartProps {
  data: BarData[];
  /** Color for highlighted bars — use semantic token e.g. "var(--destructive)" */
  highlightColor?: string;
  /** Color for neutral bars */
  neutralColor?: string;
  /** Show value labels inside bars */
  showValues?: boolean;
  className?: string;
  /** Max value for scale (auto-detected if not provided) */
  maxValue?: number;
}

export function DataStoryBarChart({
  data,
  highlightColor = "var(--destructive)",
  neutralColor = "var(--muted-foreground)",
  showValues = true,
  className,
  maxValue,
}: DataStoryBarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item) => {
        const pct = Math.min(100, (item.value / max) * 100);
        const isHighlight = item.highlight;
        const barColor = isHighlight ? highlightColor : neutralColor;

        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-xs",
                  isHighlight ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {showValues && (
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    isHighlight ? "font-bold text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.value}
                </span>
              )}
            </div>
            <div className="h-5 w-full rounded-sm overflow-hidden" style={{ background: `hsl(${neutralColor} / 0.1)` }}>
              <div
                className="h-full rounded-sm transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: `hsl(${barColor})`,
                  opacity: isHighlight ? 1 : 0.35,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
