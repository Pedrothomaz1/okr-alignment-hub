import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface Cycle {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export function useCycles() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const cyclesQuery = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cycles")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as Cycle[];
    },
  });

  const createCycle = useMutation({
    mutationFn: async (cycle: { name: string; description?: string; start_date: string; end_date: string; status?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("cycles")
        .insert({ ...cycle, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Cycle;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; start_date?: string; end_date?: string; status?: string }) => {
      const { data, error } = await supabase
        .from("cycles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Cycle;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  });

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cycles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  });

  return {
    cycles: cyclesQuery.data ?? [],
    isLoading: cyclesQuery.isLoading,
    error: cyclesQuery.error,
    createCycle,
    updateCycle,
    deleteCycle,
  };
}
