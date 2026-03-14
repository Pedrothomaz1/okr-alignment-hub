import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";
import { Search, UserPlus } from "lucide-react";

type AppRole = Enums<"app_role">;
const ROLES = Constants.public.Enums.app_role;

const roleBadgeClass = (role: string) => {
  switch (role) {
    case "admin": return "badge-critical";
    case "okr_master": return "badge-info";
    case "manager": return "badge-warning";
    default: return "badge-success";
  }
};

const statusBadgeClass = (status: string | null) => {
  return status === "inactive" ? "badge-destructive" : "badge-success";
};

export default function UsersRoles() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignDialog, setAssignDialog] = useState<{ userId: string; email: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("member");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, archived, status")
        .eq("archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["admin-all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Role assigned" });
      setAssignDialog(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível atribuir o papel." });
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Role removed" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover o papel." });
    },
  });

  const inviteUser = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: inviteEmail, full_name: inviteName, role: inviteRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Usuário convidado com sucesso!" });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erro ao convidar", description: err.message });
    },
  });

  const getUserRoles = (userId: string) =>
    rolesQuery.data?.filter((r) => r.user_id === userId).map((r) => r.role) ?? [];

  const filteredUsers = usersQuery.data?.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usuários & Papéis</h1>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Papéis</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="table-row-hover">
            {filteredUsers?.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => navigate(`/admin/users/${user.id}`)}
              >
                <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <span className={statusBadgeClass((user as any).status)}>
                    {(user as any).status === "inactive" ? "Inativo" : "Ativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                    {getUserRoles(user.id).map((role) => (
                      <span key={role} className={`${roleBadgeClass(role)} cursor-pointer`} onClick={() => removeRole.mutate({ userId: user.id, role })}>
                        {role} ×
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="outline" onClick={() => { setAssignDialog({ userId: user.id, email: user.email ?? "" }); setSelectedRole("member"); }}>
                    Add Role
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to {assignDialog?.email}</DialogTitle>
          </DialogHeader>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={() => assignDialog && assignRole.mutate({ userId: assignDialog.userId, role: selectedRole })}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
