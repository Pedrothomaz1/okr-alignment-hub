import { Building2 } from "lucide-react";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";

export function BUBadge({ businessUnitId }: { businessUnitId: string | null | undefined }) {
  const { businessUnits } = useBusinessUnits();
  if (!businessUnitId) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        <Building2 className="h-3 w-3" /> Corporativo
      </span>
    );
  }
  const bu = businessUnits.find((b) => b.id === businessUnitId);
  if (!bu) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: `${bu.color || "#0ea5a4"}22`, color: bu.color || "#0ea5a4" }}
    >
      <Building2 className="h-3 w-3" />
      {bu.name}
    </span>
  );
}