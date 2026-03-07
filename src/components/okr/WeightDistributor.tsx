import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Equal } from "lucide-react";
import type { KeyResult } from "@/hooks/useKeyResults";

interface WeightDistributorProps {
  keyResults: KeyResult[];
  onUpdateWeight: (krId: string, weight: number) => void;
  isPending?: boolean;
}

export function WeightDistributor({ keyResults, onUpdateWeight, isPending }: WeightDistributorProps) {
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});

  const getWeight = (kr: KeyResult) => localWeights[kr.id] ?? kr.weight;
  const totalWeight = keyResults.reduce((sum, kr) => sum + getWeight(kr), 0);
  const isBalanced = Math.abs(totalWeight - 100) < 0.01;

  const handleSliderChange = (krId: string, value: number[]) => {
    setLocalWeights((prev) => ({ ...prev, [krId]: value[0] }));
  };

  const handleSliderCommit = (krId: string, value: number[]) => {
    const newWeight = value[0];
    setLocalWeights((prev) => ({ ...prev, [krId]: newWeight }));
    onUpdateWeight(krId, newWeight);
  };

  const distributeEqually = () => {
    const count = keyResults.length;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;

    keyResults.forEach((kr, i) => {
      const w = base + (i < remainder ? 1 : 0);
      setLocalWeights((prev) => ({ ...prev, [kr.id]: w }));
      onUpdateWeight(kr.id, w);
    });
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4" /> Distribuição de pesos
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={distributeEqually}
            disabled={isPending}
            className="text-xs"
          >
            <Equal className="h-3.5 w-3.5 mr-1" /> Distribuir igualmente
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {keyResults.map((kr) => {
          const weight = getWeight(kr);
          return (
            <div key={kr.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[70%] text-foreground">{kr.title}</span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {weight}%
                </span>
              </div>
              <Slider
                min={1}
                max={100}
                step={1}
                value={[weight]}
                onValueChange={(v) => handleSliderChange(kr.id, v)}
                onValueCommit={(v) => handleSliderCommit(kr.id, v)}
                disabled={isPending}
              />
            </div>
          );
        })}

        {/* Total bar */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-medium text-foreground">Total</span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                isBalanced ? "text-success" : totalWeight > 100 ? "text-destructive" : "text-warning"
              }`}
            >
              {totalWeight}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isBalanced
                  ? "bg-success"
                  : totalWeight > 100
                  ? "bg-destructive"
                  : "bg-warning"
              }`}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            />
          </div>
          {!isBalanced && (
            <p className="text-xs mt-1 text-muted-foreground">
              {totalWeight > 100
                ? `⚠️ Excede 100% em ${totalWeight - 100}%`
                : `Faltam ${100 - totalWeight}% para completar`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
