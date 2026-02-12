import { useState } from "react";
import { Pencil, History } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { CheckinTimeline } from "./CheckinTimeline";
import { CheckinChart } from "./CheckinChart";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCheckins } from "@/hooks/useCheckins";
import type { KeyResult } from "@/hooks/useKeyResults";

interface KeyResultCardProps {
  kr: KeyResult;
  onUpdateProgress: (id: string, value: number) => void;
  onEdit?: (kr: KeyResult) => void;
}

function computeProgress(kr: KeyResult): number {
  const range = kr.target_value - kr.start_value;
  if (range === 0) return 0;
  return Math.min(100, Math.max(0, ((kr.current_value - kr.start_value) / range) * 100));
}

export function KeyResultCard({ kr, onEdit }: KeyResultCardProps) {
  const [open, setOpen] = useState(false);
  const progress = computeProgress(kr);
  const { checkins, isLoading } = useCheckins(open ? kr.id : undefined);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="card-elevated p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{kr.title}</p>
            {kr.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{kr.description}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <History className="h-3.5 w-3.5" />
              </Button>
            </CollapsibleTrigger>
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(kr)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <ProgressBar value={progress} status={kr.status} showLabel />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{kr.unit ? `${kr.start_value} ${kr.unit}` : kr.start_value}</span>
          <span className="font-medium text-foreground">
            {kr.unit ? `${kr.current_value} ${kr.unit}` : kr.current_value}
          </span>
          <span>{kr.unit ? `${kr.target_value} ${kr.unit}` : kr.target_value}</span>
        </div>

        <CollapsibleContent>
          <Tabs defaultValue="timeline" className="pt-2">
            <TabsList className="h-8 w-full">
              <TabsTrigger value="timeline" className="text-xs flex-1">Timeline</TabsTrigger>
              <TabsTrigger value="chart" className="text-xs flex-1">Gráfico</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline">
              <CheckinTimeline keyResultId={kr.id} />
            </TabsContent>
            <TabsContent value="chart">
              <CheckinChart
                checkins={checkins}
                startValue={kr.start_value}
                targetValue={kr.target_value}
                unit={kr.unit}
              />
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
