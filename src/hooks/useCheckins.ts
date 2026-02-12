import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Checkin {
  id: string;
  key_result_id: string;
  author_id: string;
  value: number;
  note: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export function useCheckins(keyResultId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const checkinsQuery = useQuery({
    queryKey: ["checkins", keyResultId],
    queryFn: async () => {
      if (!keyResultId) return [];
      const { data, error } = await supabase
        .from("kr_checkins")
        .select("*, profiles!kr_checkins_author_id_fkey(full_name)")
        .eq("key_result_id", keyResultId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Checkin[];
    },
    enabled: !!keyResultId,
  });

  const createCheckin = useMutation({
    mutationFn: async (input: { key_result_id: string; value: number; note?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("kr_checkins")
        .insert({ ...input, author_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins", keyResultId] });
      queryClient.invalidateQueries({ queryKey: ["key-results"] });
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
    },
  });

  return {
    checkins: checkinsQuery.data ?? [],
    isLoading: checkinsQuery.isLoading,
    createCheckin,
  };
}
