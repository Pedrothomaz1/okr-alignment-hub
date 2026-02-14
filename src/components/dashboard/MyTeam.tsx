import { useMyTeam } from "@/hooks/useMyTeam";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/okr/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export function MyTeam() {
  const { data: members, isLoading } = useMyTeam();

  return (
    <div className="card-elevated">
      <div className="flex items-center gap-2 p-4 pb-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Minha Equipe</h2>
        <span className="text-xs text-muted-foreground ml-auto">{members?.length ?? 0}</span>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : !members || members.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhum membro da equipe encontrado.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-md border border-border">
              <Avatar className="h-8 w-8">
                {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                <AvatarFallback className="text-xs">{(m.full_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{m.full_name || "Sem nome"}</p>
                <div className="flex items-center gap-2">
                  <ProgressBar value={m.avg_progress} className="flex-1" />
                  <span className="text-[10px] text-muted-foreground shrink-0">{m.kr_count} KRs</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
