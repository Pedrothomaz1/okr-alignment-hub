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

export type ComputedStatus = "completed" | "completed_late" | "late" | "in_progress";

export function computeStatus(
  currentValue: number,
  targetValue: number,
  deadline: string,
  measurementUnit: string
): ComputedStatus {
  const done = measurementUnit === "bool"
    ? currentValue >= 1
    : targetValue > 0 && currentValue >= targetValue;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline + "T00:00:00");
  const isLate = dl < today;

  if (done && isLate) return "completed_late";
  if (done) return "completed";
  if (isLate) return "late";

  return "in_progress";
}

/** Calculate days late (positive = days after deadline) */
export function daysLate(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline + "T00:00:00");
  const diff = today.getTime() - dl.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const STATUS_DISPLAY: Record<ComputedStatus, { label: string; color: string }> = {
  completed: { label: "Concluída", color: "text-green-600" },
  completed_late: { label: "Concluída com atraso", color: "text-amber-600" },
  late: { label: "Atrasada", color: "text-destructive" },
  in_progress: { label: "Em andamento", color: "text-blue-600" },
};
