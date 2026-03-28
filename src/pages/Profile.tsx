import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { roles } = useRoles(user?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setFullName(profileQuery.data.full_name || "");
      setAvatarUrl(profileQuery.data.avatar_url || "");
    }
  }, [profileQuery.data]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newUrl);

      await supabase.rpc("update_own_profile", { _avatar_url: newUrl });

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({ title: "Foto atualizada!" });
    } catch (err) {
      toast({ title: "Erro ao enviar foto", description: String(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("update_own_profile", {
        _full_name: fullName,
        _avatar_url: avatarUrl || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({ title: "Perfil atualizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar perfil", variant: "destructive" });
    },
  });

  const initials = (fullName || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (profileQuery.isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <CardTitle>{fullName || "Sem nome"}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              <p className="text-xs text-muted-foreground mt-1">Passe o mouse sobre a foto para alterar</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled className="opacity-60" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          {roles.length > 0 && (
            <div className="space-y-2">
              <Label>Papéis</Label>
              <div className="flex gap-2 flex-wrap">
                {roles.map((role) => (
                  <Badge key={role} variant="secondary" className="capitalize">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {mutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
