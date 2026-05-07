import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  activeCycles: number;
  totalObjectives: number;
  averageProgress: number;
  completedKRs: number;
  totalKRs: number;
  objectivesChart: { title: string; progress: number; status: string }[];
  cyclesSummary: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    objectiveCount: number;
    averageProgress: number;
    business_unit_id?: string | null;
  }[];
}

export function useDashboardStats(buFilter: string = "all") {
  return useQuery({
    queryKey: ["dashboard-stats", buFilter],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch active cycles
      let cyclesQ = supabase
        .from("cycles")
        .select("id, name, start_date, end_date, status, business_unit_id")
        .eq("status", "active");
      if (buFilter === "none") cyclesQ = cyclesQ.is("business_unit_id", null);
      else if (buFilter !== "all") cyclesQ = cyclesQ.eq("business_unit_id", buFilter);
      const { data: cycles, error: cyclesError } = await cyclesQ;
      if (cyclesError) throw cyclesError;

      if (!cycles || cycles.length === 0) {
        return {
          activeCycles: 0,
          totalObjectives: 0,
          averageProgress: 0,
          completedKRs: 0,
          totalKRs: 0,
          objectivesChart: [],
          cyclesSummary: [],
        };
      }

      const cycleIds = cycles.map((c) => c.id);

      // Fetch objectives for active cycles
      let objQ = supabase
        .from("objectives")
        .select("id, title, progress, status, cycle_id, business_unit_id")
        .in("cycle_id", cycleIds);
      if (buFilter === "none") objQ = objQ.is("business_unit_id", null);
      else if (buFilter !== "all") objQ = objQ.eq("business_unit_id", buFilter);
      const { data: objectives, error: objError } = await objQ;
      if (objError) throw objError;

      const objectiveIds = (objectives || []).map((o) => o.id);

      // Fetch key results for those objectives
      let keyResults: { id: string; objective_id: string; status: string; current_value: number; target_value: number; start_value: number }[] = [];
      if (objectiveIds.length > 0) {
        const { data: krs, error: krError } = await supabase
          .from("key_results")
          .select("id, objective_id, status, current_value, target_value, start_value")
          .in("objective_id", objectiveIds);
        if (krError) throw krError;
        keyResults = krs || [];
      }

      const totalObjectives = objectives?.length ?? 0;
      const averageProgress =
        totalObjectives > 0
          ? Math.round((objectives!.reduce((sum, o) => sum + o.progress, 0)) / totalObjectives)
          : 0;

      const completedKRs = keyResults.filter((kr) => kr.status === "completed").length;

      const objectivesChart = (objectives || []).map((o) => ({
        title: o.title.length > 30 ? o.title.slice(0, 30) + "…" : o.title,
        progress: o.progress,
        status: o.status,
      }));

      const cyclesSummary = cycles.map((c) => {
        const cycleObjs = (objectives || []).filter((o) => o.cycle_id === c.id);
        const avg =
          cycleObjs.length > 0
            ? Math.round(cycleObjs.reduce((s, o) => s + o.progress, 0) / cycleObjs.length)
            : 0;
        return {
          id: c.id,
          name: c.name,
          start_date: c.start_date,
          end_date: c.end_date,
          objectiveCount: cycleObjs.length,
          averageProgress: avg,
          business_unit_id: (c as any).business_unit_id ?? null,
        };
      });

      return {
        activeCycles: cycles.length,
        totalObjectives,
        averageProgress,
        completedKRs,
        totalKRs: keyResults.length,
        objectivesChart,
        cyclesSummary,
      };
    },
  });
}
