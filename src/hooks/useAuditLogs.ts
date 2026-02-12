import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuditLogFilters {
  entityType?: string;
  action?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { page = 1, pageSize = 20, entityType, action, actorId, from, to } = filters;

  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (entityType) query = query.eq("entity_type", entityType);
      if (action) query = query.eq("action", action);
      if (actorId) query = query.eq("actor_id", actorId);
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
}
