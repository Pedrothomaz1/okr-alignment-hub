import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OKRCollaborator {
  id: string;
  objective_id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export function useOKRCollaborators(objectiveId: string | undefined) {
  const queryClient = useQueryClient();

  const collaboratorsQuery = useQuery({
    queryKey: ["okr-collaborators", objectiveId],
    queryFn: async () => {
      if (!objectiveId) return [];
      const { data, error } = await supabase
        .from("okr_collaborators")
        .select("*, profiles!okr_collaborators_user_id_fkey(full_name, email)")
        .eq("objective_id", objectiveId);
      if (error) throw error;
      return (data as any[]).map((c) => ({
        ...c,
        user_name: c.profiles?.full_name || "Usuário",
        user_email: c.profiles?.email || "",
        profiles: undefined,
      })) as OKRCollaborator[];
    },
    enabled: !!objectiveId,
  });

  const addCollaborator = useMutation({
    mutationFn: async (collab: { objective_id: string; user_id: string; role: string }) => {
      const { data, error } = await supabase
        .from("okr_collaborators")
        .insert(collab)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["okr-collaborators", objectiveId] }),
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase
        .from("okr_collaborators")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["okr-collaborators", objectiveId] }),
  });

  const removeCollaborator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("okr_collaborators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["okr-collaborators", objectiveId] }),
  });

  return {
    collaborators: collaboratorsQuery.data ?? [],
    isLoading: collaboratorsQuery.isLoading,
    addCollaborator,
    updateRole,
    removeCollaborator,
  };
}
