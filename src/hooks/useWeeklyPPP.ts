import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, format } from "date-fns";

export interface WeeklyPPP {
  id: string;
  user_id: string;
  week_start: string;
  plans: string;
  progress: string;
  problems: string;
  created_at: string;
  updated_at: string;
}

function getWeekStart(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function useWeeklyPPP(weekStart?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentWeek = weekStart || getWeekStart();

  const pppQuery = useQuery({
    queryKey: ["weekly-ppp", user?.id, currentWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_ppp")
        .select("*")
        .eq("user_id", user!.id)
        .eq("week_start", currentWeek)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyPPP | null;
    },
    enabled: !!user?.id,
  });

  const historyQuery = useQuery({
    queryKey: ["weekly-ppp-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_ppp")
        .select("*")
        .eq("user_id", user!.id)
        .order("week_start", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as WeeklyPPP[];
    },
    enabled: !!user?.id,
  });

  const upsertPPP = useMutation({
    mutationFn: async (values: { plans: string; progress: string; problems: string }) => {
      const payload = {
        user_id: user!.id,
        week_start: currentWeek,
        ...values,
      };

      if (pppQuery.data?.id) {
        const { error } = await supabase
          .from("weekly_ppp")
          .update(values)
          .eq("id", pppQuery.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("weekly_ppp")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-ppp"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-ppp-history"] });
    },
  });

  return {
    currentPPP: pppQuery.data,
    isLoading: pppQuery.isLoading,
    history: historyQuery.data ?? [],
    historyLoading: historyQuery.isLoading,
    upsertPPP,
    getWeekStart,
  };
}
