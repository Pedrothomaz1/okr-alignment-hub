import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  okr_master: "OKR Master",
  manager: "Manager",
  member: "Member",
};

const ROLES = ["admin", "okr_master", "manager", "member"] as const;

const MODULE_LABELS: Record<string, string> = {
  cycles: "Ciclos",
  objectives: "Objetivos",
  kr: "Key Results",
  initiatives: "Iniciativas",
  users: "Usuários",
  reports: "Relatórios",
  admin: "Administração",
  ppp: "PPP Semanal",
  pulse: "Pulse Survey",
  kudos: "Kudos",
};

function getModule(key: string) {
  return key.split(".")[0];
}

export default function PermissionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions, isLoading: permsLoading } = useQuery({
    queryKey: ["all-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("id, key, description")
        .order("key");
      if (error) throw error;
      return data;
    },
  });

  const { data: rolePermissions, isLoading: rpLoading } = useQuery({
    queryKey: ["all-role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("id, role, permission_id");
      if (error) throw error;
      return data;
    },
  });

  // Build a set of "role:permissionId" for quick lookup
  const rpSet = useMemo(() => {
    const set = new Set<string>();
    rolePermissions?.forEach((rp) => set.add(`${rp.role}:${rp.permission_id}`));
    return set;
  }, [rolePermissions]);

  const rpIdMap = useMemo(() => {
    const map = new Map<string, string>();
    rolePermissions?.forEach((rp) => map.set(`${rp.role}:${rp.permission_id}`, rp.id));
    return map;
  }, [rolePermissions]);

  const toggleMutation = useMutation({
    mutationFn: async ({ role, permissionId, enabled }: { role: string; permissionId: string; enabled: boolean }) => {
      if (enabled) {
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role: role as any, permission_id: permissionId });
        if (error) throw error;
      } else {
        const rpId = rpIdMap.get(`${role}:${permissionId}`);
        if (rpId) {
          const { error } = await supabase
            .from("role_permissions")
            .delete()
            .eq("id", rpId);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-role-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
    },
    onError: (e) => {
      toast({ title: "Erro ao atualizar permissão", description: String(e), variant: "destructive" });
    },
  });

  // Filter to only show our standard permission keys (with dots)
  const standardPerms = useMemo(() => {
    return (permissions ?? []).filter((p) => p.key.includes("."));
  }, [permissions]);

  // Group by module
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof standardPerms>();
    standardPerms.forEach((p) => {
      const mod = getModule(p.key);
      if (!groups.has(mod)) groups.set(mod, []);
      groups.get(mod)!.push(p);
    });
    return groups;
  }, [standardPerms]);

  const isLoading = permsLoading || rpLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Permissões</h1>
        <p className="text-sm text-muted-foreground">Gerencie as permissões de cada papel na plataforma</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        Array.from(grouped.entries()).map(([mod, perms]) => (
          <Card key={mod} className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {MODULE_LABELS[mod] || mod}
                <Badge variant="secondary" className="text-2xs">{perms.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Permissão</TableHead>
                      {ROLES.map((role) => (
                        <TableHead key={role} className="text-center w-[120px]">
                          {ROLE_LABELS[role]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.map((perm) => (
                      <TableRow key={perm.id}>
                        <TableCell>
                          <div>
                            <span className="text-sm font-medium">{perm.description || perm.key}</span>
                            <span className="block text-2xs text-muted-foreground font-mono">{perm.key}</span>
                          </div>
                        </TableCell>
                        {ROLES.map((role) => {
                          const key = `${role}:${perm.id}`;
                          const isEnabled = rpSet.has(key);
                          return (
                            <TableCell key={role} className="text-center">
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) =>
                                  toggleMutation.mutate({ role, permissionId: perm.id, enabled: checked })
                                }
                                disabled={toggleMutation.isPending}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
