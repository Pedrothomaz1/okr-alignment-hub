import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MyKeyResult {
  id: string;
  title: string;
  current_value: number;
  start_value: number;
  target_value: number;
  unit: string | null;
  status: string;
  objective_title: string;
  cycle_name: string;
}

export function useMyKeyResults() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-key-results", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("key_results")
        .select("id, title, current_value, start_value, target_value, unit, status, objectives!inner(title, cycles!inner(name, status))")
        .eq("owner_id", user.id)
        .eq("objectives.cycles.status", "active")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((kr: any) => ({
        id: kr.id,
        title: kr.title,
        current_value: kr.current_value,
        start_value: kr.start_value,
        target_value: kr.target_value,
        unit: kr.unit,
        status: kr.status,
        objective_title: kr.objectives?.title ?? "",
        cycle_name: kr.objectives?.cycles?.name ?? "",
      })) as MyKeyResult[];
    },
    enabled: !!user,
  });
}
