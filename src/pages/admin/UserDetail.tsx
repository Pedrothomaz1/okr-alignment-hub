import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserDetail } from "@/hooks/useUserDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(digits[10]);
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profile, isLoading, roles, managers,
    updateProfile, toggleOkrMaster, uploadAvatar, isOkrMaster,
  } = useUserDetail(id);

  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    birth_date: "",
    language: "pt-BR",
    job_title: "",
    department: "",
    management: "",
    manager_id: "",
    status: "active",
    receive_feedback_emails: true,
    eligible_for_bonus: false,
    config_panel_access: false,
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [nameError, setNameError] = useState("");
  const { toast: detailToast } = useToast();

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        cpf: profile.cpf || "",
        birth_date: profile.birth_date || "",
        language: profile.language || "pt-BR",
        job_title: profile.job_title || "",
        department: profile.department || "",
        management: profile.management || "",
        manager_id: profile.manager_id || "",
        status: profile.status || "active",
        receive_feedback_emails: profile.receive_feedback_emails ?? true,
        eligible_for_bonus: profile.eligible_for_bonus ?? false,
        config_panel_access: profile.config_panel_access ?? false,
      });
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const newUrl = await uploadAvatar(file);
      if (newUrl) setAvatarUrl(newUrl);
    } catch {
      // handled in hook
    } finally {
      setUploading(false);
    }
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    handleChange("cpf", formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11 && !isValidCpf(formatted)) {
      setCpfError("CPF inválido");
    } else {
      setCpfError("");
    }
  };

  const handleSave = () => {
    const trimmedName = form.full_name.trim();
    if (!trimmedName) {
      setNameError("Nome completo é obrigatório");
      detailToast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha o nome completo." });
      return;
    }
    setNameError("");

    if (form.cpf) {
      const digits = form.cpf.replace(/\D/g, "");
      if (digits.length > 0 && (digits.length !== 11 || !isValidCpf(form.cpf))) {
        detailToast({ variant: "destructive", title: "CPF inválido", description: "Verifique o número do CPF." });
        return;
      }
    }
    const { receive_feedback_emails, eligible_for_bonus, config_panel_access, ...rest } = form;
    updateProfile.mutate({
      ...rest,
      manager_id: rest.manager_id || null,
      receive_feedback_emails,
      eligible_for_bonus,
      config_panel_access,
    } as any);
  };

  const initials = (form.full_name || profile?.email || "U")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {form.full_name || "Usuário"}
          </h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Avatar */}
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center pt-6 pb-6 gap-3">
              <div className="relative group">
                <Avatar className="h-28 w-28">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={form.full_name} />}
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-background animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-background" />
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <p className="font-medium text-foreground">{form.full_name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">Passe o mouse para alterar foto</p>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="card-elevated">
            <CardHeader><CardTitle className="text-base">Preferências</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="feedback-emails" className="text-sm">Receber emails de feedback</Label>
                <Switch
                  id="feedback-emails"
                  checked={form.receive_feedback_emails}
                  onCheckedChange={(v) => handleChange("receive_feedback_emails", v)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Personal data */}
          <Card className="card-elevated">
            <CardHeader><CardTitle className="text-base">Dados pessoais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome completo <span className="text-destructive">*</span></Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => { handleChange("full_name", e.target.value); if (e.target.value.trim()) setNameError(""); }}
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={cpfError ? "border-destructive" : ""}
                />
                {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled className="opacity-60" />
              </div>
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => handleChange("birth_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={form.language} onValueChange={(v) => handleChange("language", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Organizational data */}
          <Card className="card-elevated">
            <CardHeader><CardTitle className="text-base">Dados organizacionais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Função</Label>
                <Input value={form.job_title} onChange={(e) => handleChange("job_title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vice-Presidência</Label>
                <Input value={form.department} onChange={(e) => handleChange("department", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gerência</Label>
                <Input value={form.management} onChange={(e) => handleChange("management", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gestor</Label>
                <Select value={form.manager_id || "none"} onValueChange={(v) => handleChange("manager_id", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {managers.filter((m) => m.id !== id).map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card className="card-elevated">
            <CardHeader><CardTitle className="text-base">Permissões</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Elegível para bonificação</Label>
                <Switch checked={form.eligible_for_bonus} onCheckedChange={(v) => handleChange("eligible_for_bonus", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">OKR Master</Label>
                <Switch
                  checked={isOkrMaster}
                  onCheckedChange={(v) => toggleOkrMaster.mutate(v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Acesso ao painel de configurações</Label>
                <Switch checked={form.config_panel_access} onCheckedChange={(v) => handleChange("config_panel_access", v)} />
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end">
            <Button variant="cta" onClick={handleSave} disabled={updateProfile.isPending}>
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
