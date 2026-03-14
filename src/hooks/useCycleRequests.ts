import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CycleRequest {
  id: string;
  cycle_id: string;
  requested_by: string;
  approver_id: string | null;
  status: string;
  comment: string | null;
  created_at: string;
  decision_at: string | null;
  decision_by: string | null;
}

export function useCycleRequests(cycleId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const requestsQuery = useQuery({
    queryKey: ["cycle_requests", cycleId],
    queryFn: async () => {
      if (!cycleId) return [];
      const { data, error } = await supabase
        .from("cycle_requests")
        .select("*")
        .eq("cycle_id", cycleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CycleRequest[];
    },
    enabled: !!cycleId,
  });

  const createRequest = useMutation({
    mutationFn: async (params: { cycle_id: string; comment?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("cycle_requests")
        .insert({
          cycle_id: params.cycle_id,
          requested_by: user.id,
          status: "pending",
          comment: params.comment || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CycleRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle_requests", cycleId] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });

  const decideRequest = useMutation({
    mutationFn: async (params: { request_id: string; decision: string; comment?: string }) => {
      const { data, error } = await supabase.rpc("decide_cycle_request", {
        _request_id: params.request_id,
        _decision: params.decision,
        _comment: params.comment || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle_requests", cycleId] });
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });

  return {
    requests: requestsQuery.data ?? [],
    isLoading: requestsQuery.isLoading,
    createRequest,
    decideRequest,
  };
}
