import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, format, subWeeks } from "date-fns";

export interface PulseSurvey {
  id: string;
  user_id: string;
  week_start: string;
  score: number;
  comment: string | null;
  created_at: string;
}

function getWeekStart(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function usePulseSurvey(weekStart?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentWeek = weekStart || getWeekStart();

  const currentPulse = useQuery({
    queryKey: ["pulse-survey", user?.id, currentWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pulse_surveys")
        .select("*")
        .eq("user_id", user!.id)
        .eq("week_start", currentWeek)
        .maybeSingle();
      if (error) throw error;
      return data as PulseSurvey | null;
    },
    enabled: !!user?.id,
  });

  const trendQuery = useQuery({
    queryKey: ["pulse-trend", user?.id],
    queryFn: async () => {
      const twelveWeeksAgo = format(subWeeks(new Date(), 12), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("pulse_surveys")
        .select("*")
        .eq("user_id", user!.id)
        .gte("week_start", twelveWeeksAgo)
        .order("week_start", { ascending: true });
      if (error) throw error;
      return data as PulseSurvey[];
    },
    enabled: !!user?.id,
  });

  const submitPulse = useMutation({
    mutationFn: async (values: { score: number; comment?: string }) => {
      const { error } = await supabase
        .from("pulse_surveys")
        .insert({
          user_id: user!.id,
          week_start: currentWeek,
          score: values.score,
          comment: values.comment || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pulse-survey"] });
      queryClient.invalidateQueries({ queryKey: ["pulse-trend"] });
    },
  });

  return {
    currentPulse: currentPulse.data,
    isLoading: currentPulse.isLoading,
    trend: trendQuery.data ?? [],
    trendLoading: trendQuery.isLoading,
    submitPulse,
    hasVotedThisWeek: !!currentPulse.data,
    getWeekStart,
  };
}
