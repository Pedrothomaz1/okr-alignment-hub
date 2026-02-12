import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChangeRequest {
  id: string;
  cycle_id: string;
  objective_id: string | null;
  requested_by: string;
  request_type: string;
  description: string;
  status: string;
  decision_by: string | null;
  decision_comment: string | null;
  decision_at: string | null;
  expires_at: string | null;
  created_at: string;
  requester_name?: string;
  objective_title?: string;
  cycle_name?: string;
}

export function useChangeRequests(objectiveId?: string, cycleId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["change-requests", objectiveId, cycleId],
    queryFn: async () => {
      let q = supabase
        .from("change_requests")
        .select("*, profiles!change_requests_requested_by_fkey(full_name), objectives(title), cycles(name)")
        .order("created_at", { ascending: false });

      if (objectiveId) q = q.eq("objective_id", objectiveId);
      if (cycleId) q = q.eq("cycle_id", cycleId);

      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]).map((d) => ({
        ...d,
        requester_name: d.profiles?.full_name ?? "—",
        objective_title: d.objectives?.title ?? null,
        cycle_name: d.cycles?.name ?? null,
      })) as ChangeRequest[];
    },
  });

  const allQuery = useQuery({
    queryKey: ["change-requests-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("change_requests")
        .select("*, profiles!change_requests_requested_by_fkey(full_name), objectives(title), cycles(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((d) => ({
        ...d,
        requester_name: d.profiles?.full_name ?? "—",
        objective_title: d.objectives?.title ?? null,
        cycle_name: d.cycles?.name ?? null,
      })) as ChangeRequest[];
    },
    enabled: !objectiveId && !cycleId,
  });

  const createChangeRequest = useMutation({
    mutationFn: async (values: {
      cycle_id: string;
      objective_id?: string;
      request_type: string;
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("change_requests").insert({
        ...values,
        requested_by: user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["change-requests"] });
      qc.invalidateQueries({ queryKey: ["change-requests-all"] });
    },
  });

  const decideChangeRequest = useMutation({
    mutationFn: async (values: { request_id: string; decision: string; comment?: string }) => {
      const { error } = await supabase.rpc("decide_change_request" as any, {
        _request_id: values.request_id,
        _decision: values.decision,
        _comment: values.comment ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["change-requests"] });
      qc.invalidateQueries({ queryKey: ["change-requests-all"] });
    },
  });

  const hasActiveApproval = (objId?: string) => {
    const list = query.data ?? [];
    return list.some(
      (cr) =>
        cr.status === "approved" &&
        (!objId || cr.objective_id === objId) &&
        cr.expires_at &&
        new Date(cr.expires_at) > new Date()
    );
  };

  return {
    changeRequests: query.data ?? [],
    allChangeRequests: allQuery.data ?? [],
    isLoading: query.isLoading,
    isLoadingAll: allQuery.isLoading,
    createChangeRequest,
    decideChangeRequest,
    hasActiveApproval,
  };
}
