import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { Checkin } from "@/hooks/useCheckins";

interface CheckinChartProps {
  checkins: Checkin[];
  startValue: number;
  targetValue: number;
  unit?: string | null;
}

export function CheckinChart({ checkins, startValue, targetValue, unit }: CheckinChartProps) {
  const data = useMemo(() => {
    return [...checkins]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((c, i, arr) => ({
        date: format(new Date(c.created_at), "dd/MM", { locale: ptBR }),
        fullDate: format(new Date(c.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR }),
        value: c.value,
        note: c.note,
        isLast: i === arr.length - 1,
      }));
  }, [checkins]);

  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        Nenhum check-in para exibir no gráfico.
      </p>
    );
  }

  return (
    <div className="pt-2 w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 32, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <ReferenceLine
            y={targetValue}
            stroke="hsl(var(--primary) / 0.4)"
            strokeDasharray="6 3"
            label={{
              value: `Meta: ${targetValue}${unit ? ` ${unit}` : ""}`,
              position: "insideTopRight",
              fontSize: 10,
              fill: "hsl(var(--primary))",
            }}
          />
          <ReferenceLine
            y={startValue}
            stroke="hsl(var(--muted-foreground) / 0.25)"
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          >
            <LabelList
              dataKey="value"
              position="top"
              formatter={() => {
                // Only show label on the last point
                return undefined;
              }}
              content={({ x, y, value, index }: any) => {
                if (index !== data.length - 1) return null;
                return (
                  <text
                    x={x}
                    y={(y ?? 0) - 10}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill="hsl(var(--primary))"
                  >
                    {unit ? `${value} ${unit}` : value}
                  </text>
                );
              }}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[calc(var(--radius)-4px)] border border-border/50 bg-background/95 px-3 py-2 text-xs shadow-sm space-y-1">
      <p className="font-semibold">{unit ? `${d.value} ${unit}` : d.value}</p>
      <p className="text-muted-foreground">{d.fullDate}</p>
      {d.note && <p className="text-muted-foreground italic">{d.note}</p>}
    </div>
  );
}
