import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Send, ThumbsUp, Hand, Flame } from "lucide-react";
import { useActivityFeed, type ActivityItem } from "@/hooks/useActivityFeed";
import { useActivityComments } from "@/hooks/useActivityComments";
import { useFeedReactions } from "@/hooks/useFeedReactions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_LABELS: Record<string, string> = {
  INSERT: "criou",
  UPDATE: "editou",
  DELETE: "removeu",
};

const ENTITY_LABELS: Record<string, string> = {
  objectives: "objetivo",
  key_results: "resultado-chave",
  cycles: "ciclo",
  kr_checkins: "check-in",
  change_requests: "solicitação",
  cycle_requests: "solicitação de ciclo",
};

const REACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  like: ThumbsUp,
  clap: Hand,
  fire: Flame,
};

function ReactionButtons({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { summary, toggleReaction } = useFeedReactions(entityType, entityId);

  return (
    <div className="flex items-center gap-1">
      {summary.map((r) => {
        const Icon = REACTION_ICONS[r.reaction];
        return (
          <button
            key={r.reaction}
            onClick={() => toggleReaction.mutate(r.reaction)}
            className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border transition-smooth ${
              r.reacted
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3 w-3" />
            {r.count > 0 && <span>{r.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function ActivityComments({ auditLogId }: { auditLogId: string }) {
  const { comments, isLoading, addComment } = useActivityComments(auditLogId);
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    addComment.mutate(
      { audit_log_id: auditLogId, content: text.trim() },
      { onSuccess: () => setText("") }
    );
  };

  return (
    <div className="pl-8 space-y-1.5 mt-1">
      {isLoading ? (
        <Skeleton className="h-6 w-32" />
      ) : (
        comments.map((c) => (
          <div key={c.id} className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">{c.author_name || "Anônimo"}</span>: {c.content}
          </div>
        ))
      )}
      <div className="flex gap-1.5">
        <Input
          className="h-7 text-xs"
          placeholder="Comentar..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button size="sm" className="h-7 px-2" onClick={handleSend} disabled={addComment.isPending || !text.trim()}>
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { data: activities, isLoading } = useActivityFeed();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="card-elevated">
      <div className="flex items-center gap-2 p-4 pb-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Minhas Atualizações</h2>
      </div>
      <div className="px-4 pb-4 space-y-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : !activities || activities.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma atividade recente.</p>
        ) : (
          activities.map((a) => (
            <div key={a.id} className="py-2 border-b border-border last:border-0">
              <div className="flex items-start gap-2">
                <Avatar className="h-6 w-6 mt-0.5">
                  {a.actor_avatar && <AvatarImage src={a.actor_avatar} />}
                  <AvatarFallback className="text-[9px]">{(a.actor_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-medium">{a.actor_name || "Você"}</span>{" "}
                    {ACTION_LABELS[a.action] || a.action}{" "}
                    {ENTITY_LABELS[a.entity_type] || a.entity_type}{" "}
                    <span className="font-medium text-primary">{a.entity_title}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    <button
                      className="text-[10px] text-muted-foreground hover:text-primary transition-smooth"
                      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    >
                      Comentar
                    </button>
                  </div>
                  <div className="mt-1">
                    <ReactionButtons entityType="audit_log" entityId={a.id} />
                  </div>
                </div>
              </div>
              {expandedId === a.id && <ActivityComments auditLogId={a.id} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
