import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Kudos {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  category: string;
  objective_id: string | null;
  created_at: string;
  from_profile?: { full_name: string | null; avatar_url: string | null };
  to_profile?: { full_name: string | null; avatar_url: string | null };
}

export function useKudos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const kudosQuery = useQuery({
    queryKey: ["kudos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kudos")
        .select("*, from_profile:profiles!kudos_from_user_id_fkey(full_name, avatar_url), to_profile:profiles!kudos_to_user_id_fkey(full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as Kudos[];
    },
  });

  const sendKudos = useMutation({
    mutationFn: async (values: { to_user_id: string; message: string; category?: string; objective_id?: string }) => {
      const { error } = await supabase
        .from("kudos")
        .insert({
          from_user_id: user!.id,
          to_user_id: values.to_user_id,
          message: values.message,
          category: values.category || "general",
          objective_id: values.objective_id || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kudos"] });
    },
  });

  return {
    kudos: kudosQuery.data ?? [],
    isLoading: kudosQuery.isLoading,
    sendKudos,
  };
}
