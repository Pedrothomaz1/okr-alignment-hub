import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, format } from "date-fns";

export interface LeaderTeamMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  avg_progress: number;
  kr_count: number;
  last_checkin: string | null;
  has_ppp_this_week: boolean;
  pulse_score: number | null;
}

export function useLeaderDashboard() {
  const { user } = useAuth();
  const currentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["leader-dashboard", user?.id, currentWeek],
    queryFn: async () => {
      if (!user) return [];

      // Get direct reports
      const { data: subordinatesRaw, error: subErr } = await supabase
        .from("profiles_public" as any)
        .select("id, full_name, avatar_url")
        .eq("manager_id", user.id);
      if (subErr) throw subErr;
      const subordinates = (subordinatesRaw ?? []) as unknown as Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
      if (subordinates.length === 0) return [];

      const subIds = subordinates.map((s) => s.id);

      // Get KR progress for each subordinate
      const { data: krs } = await supabase
        .from("key_results")
        .select("owner_id, current_value, start_value, target_value")
        .in("owner_id", subIds);

      const progressMap = new Map<string, { total: number; count: number }>();
      (krs ?? []).forEach((kr: any) => {
        const range = kr.target_value - kr.start_value;
        const pct = range === 0 ? 0 : Math.min(100, Math.max(0, ((kr.current_value - kr.start_value) / range) * 100));
        const existing = progressMap.get(kr.owner_id) ?? { total: 0, count: 0 };
        progressMap.set(kr.owner_id, { total: existing.total + pct, count: existing.count + 1 });
      });

      // Get latest checkin for each subordinate
      const { data: checkins } = await supabase
        .from("kr_checkins")
        .select("author_id, created_at")
        .in("author_id", subIds)
        .order("created_at", { ascending: false });

      const lastCheckinMap = new Map<string, string>();
      (checkins ?? []).forEach((c: any) => {
        if (!lastCheckinMap.has(c.author_id)) lastCheckinMap.set(c.author_id, c.created_at);
      });

      // Get PPP status for this week
      const { data: ppps } = await supabase
        .from("weekly_ppp")
        .select("user_id")
        .in("user_id", subIds)
        .eq("week_start", currentWeek);

      const pppSet = new Set((ppps ?? []).map((p: any) => p.user_id));

      // Get pulse for this week
      const { data: pulses } = await supabase
        .from("pulse_surveys")
        .select("user_id, score")
        .in("user_id", subIds)
        .eq("week_start", currentWeek);

      const pulseMap = new Map<string, number>();
      (pulses ?? []).forEach((p: any) => pulseMap.set(p.user_id, p.score));

      return subordinates.map((s) => {
        const prog = progressMap.get(s.id);
        return {
          id: s.id,
          full_name: s.full_name,
          avatar_url: s.avatar_url,
          avg_progress: prog ? Math.round(prog.total / prog.count) : 0,
          kr_count: prog?.count ?? 0,
          last_checkin: lastCheckinMap.get(s.id) ?? null,
          has_ppp_this_week: pppSet.has(s.id),
          pulse_score: pulseMap.get(s.id) ?? null,
        } as LeaderTeamMember;
      });
    },
    enabled: !!user,
  });
}
