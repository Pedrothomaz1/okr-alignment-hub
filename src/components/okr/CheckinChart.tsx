import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
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
      .map((c) => ({
        date: format(new Date(c.created_at), "dd/MM", { locale: ptBR }),
        fullDate: format(new Date(c.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR }),
        value: c.value,
        note: c.note,
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
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
          <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" domain={["auto", "auto"]} />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <ReferenceLine
            y={targetValue}
            stroke="hsl(var(--primary))"
            strokeDasharray="6 3"
            label={{ value: "Meta", position: "right", fontSize: 10, fill: "hsl(var(--primary))" }}
          />
          <ReferenceLine
            y={startValue}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            label={{ value: "Início", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg space-y-1">
      <p className="font-medium">{unit ? `${d.value} ${unit}` : d.value}</p>
      <p className="text-muted-foreground">{d.fullDate}</p>
      {d.note && <p className="text-muted-foreground italic">{d.note}</p>}
    </div>
  );
}
