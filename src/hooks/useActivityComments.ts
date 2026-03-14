import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ActivityComment {
  id: string;
  audit_log_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
}

export function useActivityComments(auditLogId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const commentsQuery = useQuery({
    queryKey: ["activity-comments", auditLogId],
    queryFn: async () => {
      if (!auditLogId) return [];
      const { data, error } = await supabase
        .from("activity_comments")
        .select("*")
        .eq("audit_log_id", auditLogId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      
      // Get author profiles
      const authorIds = [...new Set((data ?? []).map((c: any) => c.author_id))];
      const { data: profiles } = authorIds.length > 0
        ? await supabase.from("profiles_public" as any).select("id, full_name").in("id", authorIds)
        : { data: [] };
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));

      return (data ?? []).map((c: any) => ({
        id: c.id,
        audit_log_id: c.audit_log_id,
        author_id: c.author_id,
        content: c.content,
        created_at: c.created_at,
        author_name: profileMap.get(c.author_id) ?? null,
      })) as ActivityComment[];
    },
    enabled: !!auditLogId,
  });

  const addComment = useMutation({
    mutationFn: async (input: { audit_log_id: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("activity_comments")
        .insert({ ...input, author_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-comments", auditLogId] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    addComment,
  };
}
