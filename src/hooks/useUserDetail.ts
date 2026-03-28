import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cpf: string | null;
  birth_date: string | null;
  language: string | null;
  job_title: string | null;
  department: string | null;
  management: string | null;
  manager_id: string | null;
  status: string | null;
  receive_feedback_emails: boolean | null;
  eligible_for_bonus: boolean | null;
  config_panel_access: boolean | null;
}

export function useUserDetail(userId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: async () => {
      // Fetch non-sensitive profile fields
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, language, job_title, department, management, manager_id, status, receive_feedback_emails, config_panel_access")
        .eq("id", userId!)
        .single();
      if (profileError) throw profileError;

      // Fetch sensitive PII via secure RPC (admin or owner only)
      const { data: sensitiveData } = await supabase
        .rpc("get_sensitive_profile", { _user_id: userId! });

      const sensitive = sensitiveData?.[0] ?? { cpf: null, birth_date: null, eligible_for_bonus: null };

      return {
        ...profileData,
        cpf: sensitive.cpf,
        birth_date: sensitive.birth_date,
        eligible_for_bonus: sensitive.eligible_for_bonus,
      } as UserProfile;
    },
    enabled: !!userId,
  });

  const rolesQuery = useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return data.map((r) => r.role);
    },
    enabled: !!userId,
  });

  const managersQuery = useQuery({
    queryKey: ["profiles-managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("archived", false)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-detail", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({ title: "Perfil atualizado com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro ao salvar", description: err.message });
    },
  });

  const toggleOkrMaster = useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId!, role: "okr_master" as any });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId!)
          .eq("role", "okr_master" as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Papel atualizado!" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    },
  });

  const uploadAvatar = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem válida", variant: "destructive" });
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 2MB", variant: "destructive" });
      return null;
    }

    const ext = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", userId);
    queryClient.invalidateQueries({ queryKey: ["user-detail", userId] });
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
    toast({ title: "Foto atualizada!" });
    return newUrl;
  };

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    roles: rolesQuery.data ?? [],
    managers: managersQuery.data ?? [],
    updateProfile,
    toggleOkrMaster,
    uploadAvatar,
    isOkrMaster: rolesQuery.data?.includes("okr_master") ?? false,
  };
}
