import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FeedReaction {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  reaction: string;
  created_at: string;
}

export interface ReactionSummary {
  reaction: string;
  count: number;
  reacted: boolean;
}

export function useFeedReactions(entityType: string, entityId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reactionsQuery = useQuery({
    queryKey: ["feed-reactions", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_reactions")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);
      if (error) throw error;
      return data as FeedReaction[];
    },
  });

  const summary: ReactionSummary[] = ["like", "clap", "fire"].map((r) => {
    const items = (reactionsQuery.data ?? []).filter((fr) => fr.reaction === r);
    return {
      reaction: r,
      count: items.length,
      reacted: items.some((fr) => fr.user_id === user?.id),
    };
  });

  const toggleReaction = useMutation({
    mutationFn: async (reaction: string) => {
      const existing = (reactionsQuery.data ?? []).find(
        (fr) => fr.user_id === user?.id && fr.reaction === reaction
      );
      if (existing) {
        const { error } = await supabase
          .from("feed_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("feed_reactions")
          .insert({
            user_id: user!.id,
            entity_type: entityType,
            entity_id: entityId,
            reaction,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-reactions", entityType, entityId] });
    },
  });

  return { summary, toggleReaction };
}
