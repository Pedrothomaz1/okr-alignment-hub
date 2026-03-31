import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PermissionKey =
  | "cycles.create" | "cycles.edit" | "cycles.delete" | "cycles.approve"
  | "objectives.create" | "objectives.edit_any" | "objectives.delete"
  | "kr.create" | "kr.checkin_any" | "kr.delete"
  | "initiatives.create" | "initiatives.edit_any" | "initiatives.delete"
  | "users.invite" | "users.manage_roles" | "users.edit_profile_any" | "users.view_sensitive"
  | "reports.view" | "reports.export"
  | "admin.audit_logs" | "admin.change_requests" | "admin.settings"
  | "ppp.view_team" | "pulse.view_team" | "kudos.delete_any";

export function usePermissions() {
  const { user } = useAuth();

  const permissionsQuery = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (rolesError) throw rolesError;
      if (!roles?.length) return [];

      const roleNames = roles.map((r) => r.role);

      // Get role_permissions for those roles
      const { data: rps, error: rpError } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .in("role", roleNames);
      if (rpError) throw rpError;
      if (!rps?.length) return [];

      const permissionIds = [...new Set(rps.map((rp) => rp.permission_id))];

      // Get permission keys
      const { data: perms, error: permError } = await supabase
        .from("permissions")
        .select("key")
        .in("id", permissionIds);
      if (permError) throw permError;

      return perms?.map((p) => p.key) ?? [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const can = (permission: PermissionKey): boolean => {
    return permissionsQuery.data?.includes(permission) ?? false;
  };

  return {
    can,
    permissions: permissionsQuery.data ?? [],
    isLoading: permissionsQuery.isLoading,
    refetch: permissionsQuery.refetch,
  };
}
