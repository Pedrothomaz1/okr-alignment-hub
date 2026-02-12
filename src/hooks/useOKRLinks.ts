import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface OKRLink {
  id: string;
  from_id: string;
  to_id: string;
  link_type: string;
  created_by: string;
  created_at: string;
}

export function useOKRLinks(objectiveId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const linksQuery = useQuery({
    queryKey: ["okr-links", objectiveId],
    queryFn: async () => {
      if (!objectiveId) return [];
      const { data, error } = await supabase
        .from("okr_links")
        .select("*")
        .or(`from_id.eq.${objectiveId},to_id.eq.${objectiveId}`);
      if (error) throw error;
      return data as OKRLink[];
    },
    enabled: !!objectiveId,
  });

  const createLink = useMutation({
    mutationFn: async (link: { from_id: string; to_id: string; link_type: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("okr_links")
        .insert({ ...link, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["okr-links", objectiveId] }),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("okr_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["okr-links", objectiveId] }),
  });

  return {
    links: linksQuery.data ?? [],
    isLoading: linksQuery.isLoading,
    createLink,
    deleteLink,
  };
}
