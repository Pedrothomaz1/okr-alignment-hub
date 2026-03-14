import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public" as any)
        .select("id, full_name, avatar_url")
        .eq("status", "active")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: null,
        avatar_url: p.avatar_url,
      })) as Profile[];
    },
  });
}
