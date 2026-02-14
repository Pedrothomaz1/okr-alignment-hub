import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TeamMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  avg_progress: number;
  kr_count: number;
}

export function useMyTeam() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-team", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get active cycle IDs where user has objectives
      const { data: myCycles } = await supabase
        .from("objectives")
        .select("cycle_id, cycles!inner(status)")
        .eq("owner_id", user.id)
        .eq("cycles.status", "active");

      const cycleIds = [...new Set((myCycles ?? []).map((o: any) => o.cycle_id))];
      if (cycleIds.length === 0) return [];

      // Get all objective owners in those cycles (excluding self)
      const { data: teammates } = await supabase
        .from("objectives")
        .select("owner_id, profiles!inner(id, full_name, avatar_url)")
        .in("cycle_id", cycleIds)
        .neq("owner_id", user.id);

      if (!teammates || teammates.length === 0) return [];

      const uniqueIds = [...new Set(teammates.map((t: any) => t.owner_id))];

      // Get KR progress for each teammate
      const { data: krs } = await supabase
        .from("key_results")
        .select("owner_id, current_value, start_value, target_value")
        .in("owner_id", uniqueIds);

      const progressMap = new Map<string, { total: number; count: number }>();
      (krs ?? []).forEach((kr: any) => {
        const range = kr.target_value - kr.start_value;
        const pct = range === 0 ? 0 : Math.min(100, Math.max(0, ((kr.current_value - kr.start_value) / range) * 100));
        const existing = progressMap.get(kr.owner_id) ?? { total: 0, count: 0 };
        progressMap.set(kr.owner_id, { total: existing.total + pct, count: existing.count + 1 });
      });

      const profileMap = new Map<string, any>();
      teammates.forEach((t: any) => {
        if (!profileMap.has(t.owner_id)) profileMap.set(t.owner_id, t.profiles);
      });

      return uniqueIds.map((id) => {
        const profile = profileMap.get(id);
        const prog = progressMap.get(id);
        return {
          id,
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          avg_progress: prog ? Math.round(prog.total / prog.count) : 0,
          kr_count: prog?.count ?? 0,
        };
      }) as TeamMember[];
    },
    enabled: !!user,
  });
}
