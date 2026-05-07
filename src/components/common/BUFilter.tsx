import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";

interface BUFilterProps {
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
}

export function BUFilter({ value, onValueChange, className }: BUFilterProps) {
  const { businessUnits } = useBusinessUnits();
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className ?? "w-[220px]"}>
        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Business Unit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as BUs</SelectItem>
        <SelectItem value="none">Corporativo (sem BU)</SelectItem>
        {businessUnits.map((b) => (
          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface BUSelectFieldProps {
  value: string | null | undefined;
  onValueChange: (v: string | null) => void;
  allowNone?: boolean;
  required?: boolean;
}

export function BUSelectField({ value, onValueChange, allowNone = true }: BUSelectFieldProps) {
  const { businessUnits } = useBusinessUnits();
  return (
    <Select
      value={value ?? "none"}
      onValueChange={(v) => onValueChange(v === "none" ? null : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione a Business Unit" />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="none">Corporativo (sem BU)</SelectItem>}
        {businessUnits.map((b) => (
          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}