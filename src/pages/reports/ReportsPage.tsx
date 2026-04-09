import { FileBarChart } from "lucide-react";
import { ExportReportDialog } from "@/components/reports/ExportReportDialog";
import { Can } from "@/components/auth/Can";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FileBarChart className="h-6 w-6 text-primary" />
          Relatórios
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exporte relatórios de progresso dos seus ciclos de OKR.
        </p>
      </div>

      <Can do="reports.export">
        <div className="flex items-center gap-4">
          <ExportReportDialog />
        </div>
      </Can>
    </div>
  );
}
