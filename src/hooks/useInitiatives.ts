import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Initiative {
  id: string;
  date: string;
  unit: string;
  dre_line: string;
  action: string;
  owner_id: string;
  deadline: string;
  status: string;
  expected_impact: string | null;
  measurement_unit: string;
  target_value: number;
  current_value: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type InitiativeInsert = Omit<Initiative, "id" | "created_at" | "updated_at">;
export type InitiativeUpdate = Partial<Omit<Initiative, "id" | "created_at" | "updated_at">>;

export function useInitiatives() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Initiative[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (initiative: InitiativeInsert) => {
      const { data, error } = await supabase
        .from("initiatives" as any)
        .insert(initiative as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Initiative;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["initiatives"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: InitiativeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("initiatives" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Initiative;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["initiatives"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("initiatives" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["initiatives"] }),
  });

  return {
    initiatives: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createInitiative: createMutation.mutateAsync,
    updateInitiative: updateMutation.mutateAsync,
    deleteInitiative: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
