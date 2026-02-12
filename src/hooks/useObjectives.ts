import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Objective {
  id: string;
  title: string;
  description: string | null;
  cycle_id: string;
  owner_id: string;
  status: string;
  progress: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  kr_count?: number;
}

export function useObjectives(cycleId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const objectivesQuery = useQuery({
    queryKey: ["objectives", cycleId],
    queryFn: async () => {
      if (!cycleId) return [];
      const { data, error } = await supabase
        .from("objectives")
        .select("*, profiles!objectives_owner_id_fkey(full_name), key_results(id)")
        .eq("cycle_id", cycleId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((o) => ({
        ...o,
        owner_name: o.profiles?.full_name || "Sem dono",
        kr_count: o.key_results?.length ?? 0,
        profiles: undefined,
        key_results: undefined,
      })) as Objective[];
    },
    enabled: !!cycleId,
  });

  const createObjective = useMutation({
    mutationFn: async (obj: { title: string; description?: string; cycle_id: string; owner_id?: string; status?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("objectives")
        .insert({ ...obj, owner_id: obj.owner_id || user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["objectives", cycleId] }),
  });

  const updateObjective = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; status?: string; owner_id?: string }) => {
      const { data, error } = await supabase
        .from("objectives")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["objectives", cycleId] }),
  });

  const deleteObjective = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("objectives").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["objectives", cycleId] }),
  });

  return {
    objectives: objectivesQuery.data ?? [],
    isLoading: objectivesQuery.isLoading,
    error: objectivesQuery.error,
    createObjective,
    updateObjective,
    deleteObjective,
  };
}
