import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface KeyResult {
  id: string;
  title: string;
  description: string | null;
  objective_id: string;
  owner_id: string;
  kr_type: string;
  start_value: number;
  target_value: number;
  current_value: number;
  unit: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useKeyResults(objectiveId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const keyResultsQuery = useQuery({
    queryKey: ["key-results", objectiveId],
    queryFn: async () => {
      if (!objectiveId) return [];
      const { data, error } = await supabase
        .from("key_results")
        .select("*")
        .eq("objective_id", objectiveId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as KeyResult[];
    },
    enabled: !!objectiveId,
  });

  const createKeyResult = useMutation({
    mutationFn: async (kr: {
      title: string;
      description?: string;
      objective_id: string;
      owner_id?: string;
      kr_type?: string;
      start_value?: number;
      target_value?: number;
      current_value?: number;
      unit?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("key_results")
        .insert({ ...kr, owner_id: kr.owner_id || user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
    },
  });

  const updateKeyResult = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; kr_type?: string; start_value?: number; target_value?: number; current_value?: number; unit?: string; status?: string }) => {
      const { data, error } = await supabase
        .from("key_results")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ id, current_value }: { id: string; current_value: number }) => {
      const { data, error } = await supabase
        .from("key_results")
        .update({ current_value })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
    },
  });

  const deleteKeyResult = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("key_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key-results", objectiveId] });
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
    },
  });

  return {
    keyResults: keyResultsQuery.data ?? [],
    isLoading: keyResultsQuery.isLoading,
    error: keyResultsQuery.error,
    createKeyResult,
    updateKeyResult,
    updateProgress,
    deleteKeyResult,
  };
}
