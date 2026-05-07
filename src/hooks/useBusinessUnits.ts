import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BusinessUnit {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessUnitInput {
  name: string;
  description?: string | null;
  color?: string | null;
  archived?: boolean;
}

export function useBusinessUnits(includeArchived = false) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["business_units", includeArchived],
    queryFn: async () => {
      let q = supabase.from("business_units" as any).select("*").order("name");
      if (!includeArchived) q = q.eq("archived", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as BusinessUnit[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: BusinessUnitInput) => {
      const { data, error } = await supabase
        .from("business_units" as any)
        .insert({ ...input, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BusinessUnit;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business_units"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: BusinessUnitInput & { id: string }) => {
      const { data, error } = await supabase
        .from("business_units" as any)
        .update(rest as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BusinessUnit;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business_units"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("business_units" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business_units"] }),
  });

  return {
    businessUnits: list.data ?? [],
    isLoading: list.isLoading,
    createBU: create.mutateAsync,
    updateBU: update.mutateAsync,
    deleteBU: remove.mutateAsync,
  };
}

export function useMyBusinessUnits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-business-units", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_business_units" as any)
        .select("business_unit_id, business_units:business_unit_id(id, name, color)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserBusinessUnits(userId: string | undefined) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["user-business-units", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_business_units" as any)
        .select("id, business_unit_id")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!userId,
  });

  const link = useMutation({
    mutationFn: async (businessUnitId: string) => {
      const { error } = await supabase
        .from("user_business_units" as any)
        .insert({ user_id: userId, business_unit_id: businessUnitId } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-business-units", userId] }),
  });

  const unlink = useMutation({
    mutationFn: async (businessUnitId: string) => {
      const { error } = await supabase
        .from("user_business_units" as any)
        .delete()
        .eq("user_id", userId)
        .eq("business_unit_id", businessUnitId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-business-units", userId] }),
  });

  return {
    links: list.data ?? [],
    isLoading: list.isLoading,
    linkBU: link.mutateAsync,
    unlinkBU: unlink.mutateAsync,
  };
}