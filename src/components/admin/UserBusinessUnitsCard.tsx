import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";
import { useUserBusinessUnits } from "@/hooks/useBusinessUnits";

export function UserBusinessUnitsCard({ userId }: { userId: string | undefined }) {
  const { businessUnits, isLoading: loadingBUs } = useBusinessUnits();
  const { links, linkBU, unlinkBU, isLoading: loadingLinks } = useUserBusinessUnits(userId);
  const { toast } = useToast();

  const linkedSet = new Set(links.map((l: any) => l.business_unit_id));

  const toggle = async (buId: string, checked: boolean) => {
    try {
      if (checked) await linkBU(buId);
      else await unlinkBU(buId);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader><CardTitle className="text-base">Business Units</CardTitle></CardHeader>
      <CardContent>
        {loadingBUs || loadingLinks ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : businessUnits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma BU cadastrada.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Selecione as BUs que este usuário pode acessar. Sem nenhuma, ele verá apenas itens corporativos.
            </p>
            {businessUnits.map((bu) => {
              const checked = linkedSet.has(bu.id);
              return (
                <label key={bu.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                  <Checkbox checked={checked} onCheckedChange={(c) => toggle(bu.id, !!c)} />
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: bu.color || "#0ea5a4" }} />
                  <span className="text-sm">{bu.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}