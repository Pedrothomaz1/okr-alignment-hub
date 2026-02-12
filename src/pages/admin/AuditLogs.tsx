import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

const ENTITY_TYPES = ["profiles", "user_roles"];
const ACTIONS = ["INSERT", "UPDATE", "DELETE"];

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [detail, setDetail] = useState<{ before: unknown; after: unknown } | null>(null);

  const { data, isLoading } = useAuditLogs({
    page,
    pageSize: 20,
    entityType: entityType || undefined,
    action: action || undefined,
  });

  const totalPages = Math.ceil((data?.count ?? 0) / 20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>

      <div className="flex gap-3 flex-wrap">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Entity type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm text-muted-foreground">{format(new Date(log.created_at), "PPp")}</TableCell>
              <TableCell>{log.entity_type}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">{log.actor_id?.slice(0, 8) ?? "system"}</TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => setDetail({ before: log.before_state, after: log.after_state })}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.count ?? 0} total entries</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Change Details</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Before</h3>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">{detail?.before ? JSON.stringify(detail.before, null, 2) : "—"}</pre>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">After</h3>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">{detail?.after ? JSON.stringify(detail.after, null, 2) : "—"}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
