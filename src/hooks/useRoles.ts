import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;

export function useRoles(userId: string | undefined) {
  const rolesQuery = useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) throw error;
      return data.map((r) => r.role);
    },
    enabled: !!userId,
  });

  const hasRole = (role: AppRole) => rolesQuery.data?.includes(role) ?? false;
  const isAdmin = hasRole("admin");

  return {
    roles: rolesQuery.data ?? [],
    isLoading: rolesQuery.isLoading,
    hasRole,
    isAdmin,
    refetch: rolesQuery.refetch,
  };
}
