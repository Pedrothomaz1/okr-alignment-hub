export const MEASUREMENT_UNITS = [
  { value: "R$", label: "R$ (Moeda)" },
  { value: "%", label: "% (Percentual)" },
  { value: "un", label: "Unidades" },
  { value: "horas", label: "Horas" },
  { value: "bool", label: "Sim / Não" },
] as const;

export function formatValue(value: number, unit: string): string {
  switch (unit) {
    case "R$":
      return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    case "%":
      return `${value.toLocaleString("pt-BR")}%`;
    case "un":
      return `${value.toLocaleString("pt-BR")} un`;
    case "horas":
      return `${value.toLocaleString("pt-BR")} horas`;
    case "bool":
      return value >= 1 ? "Sim" : "Não";
    default:
      return String(value);
  }
}

export type ComputedStatus = "completed" | "expired" | "in_progress";

export function computeStatus(
  currentValue: number,
  targetValue: number,
  deadline: string,
  measurementUnit: string
): ComputedStatus {
  const done = measurementUnit === "bool"
    ? currentValue >= 1
    : targetValue > 0 && currentValue >= targetValue;

  if (done) return "completed";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline + "T00:00:00");
  if (dl < today) return "expired";

  return "in_progress";
}

export const STATUS_DISPLAY: Record<ComputedStatus, { label: string; color: string }> = {
  completed: { label: "Concluída", color: "text-green-600" },
  expired: { label: "Expirada", color: "text-destructive" },
  in_progress: { label: "Em andamento", color: "text-blue-600" },
};
