import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string;
  created_at: string;
  actor_name: string | null;
  actor_avatar: string | null;
}

export function useActivityFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-feed", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, after_state, created_at")
        .eq("actor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      return (data ?? []).map((log: any) => {
        const afterState = log.after_state as Record<string, any> | null;
        const title = afterState?.title || afterState?.name || afterState?.content || log.entity_type;
        return {
          id: log.id,
          action: log.action,
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          entity_title: typeof title === "string" ? title : log.entity_type,
          created_at: log.created_at,
          actor_name: profile?.full_name ?? null,
          actor_avatar: profile?.avatar_url ?? null,
        };
      }) as ActivityItem[];
    },
    enabled: !!user,
  });
}
