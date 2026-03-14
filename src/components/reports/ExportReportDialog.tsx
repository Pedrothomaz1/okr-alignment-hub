import { useState } from "react";
import { FileBarChart, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCycles } from "@/hooks/useCycles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ExportReportDialogProps {
  cycleId?: string;
}

export function ExportReportDialog({ cycleId }: ExportReportDialogProps) {
  const { cycles } = useCycles();
  const [selectedCycle, setSelectedCycle] = useState(cycleId || "");
  const [format, setFormat] = useState<"csv" | "html">("csv");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExport = async () => {
    if (!selectedCycle) {
      toast({ title: "Selecione um ciclo", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("generate-report", {
        body: { cycle_id: selectedCycle, format },
      });

      if (res.error) throw res.error;

      if (format === "csv") {
        const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-${selectedCycle}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "CSV exportado com sucesso!" });
      } else {
        const blob = new Blob([res.data], { type: "text/html;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        toast({ title: "Relatório aberto para impressão" });
      }
      setOpen(false);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast({ title: "Erro ao gerar relatório", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileBarChart className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Selecione o ciclo e o formato do relatório.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Ciclo</Label>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ciclo" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "csv" | "html")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Download className="h-3 w-3" /> CSV
                  </div>
                </SelectItem>
                <SelectItem value="html">
                  <div className="flex items-center gap-2">
                    <Printer className="h-3 w-3" /> HTML (Imprimir/PDF)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExport} disabled={loading || !selectedCycle} className="w-full">
            {loading ? "Gerando..." : "Exportar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
