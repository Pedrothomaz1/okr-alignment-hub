import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;
const ROLES = Constants.public.Enums.app_role;

export default function UsersRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignDialog, setAssignDialog] = useState<{ userId: string; email: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("member");

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, archived")
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
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
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
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const getUserRoles = (userId: string) =>
    rolesQuery.data?.filter((r) => r.user_id === userId).map((r) => r.role) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Users & Roles</h1>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersQuery.data?.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {getUserRoles(user.id).map((role) => (
                    <Badge key={role} variant="secondary" className="cursor-pointer" onClick={() => removeRole.mutate({ userId: user.id, role })}>
                      {role} ×
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => { setAssignDialog({ userId: user.id, email: user.email ?? "" }); setSelectedRole("member"); }}>
                  Add Role
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
