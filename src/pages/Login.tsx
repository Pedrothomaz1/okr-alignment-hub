import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/lib/validations";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getSafeAuthError } from "@/lib/safe-error";
import { MFAVerify } from "@/components/auth/MFAVerify";
import { Target, TrendingUp, Users } from "lucide-react";

function AuthBrandingPanel() {
  return (
    <div
      className="relative hidden lg:flex flex-col items-center justify-center p-12 overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Decorative circles */}
      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full border border-sidebar-primary/20" />
      <div className="absolute bottom-[-60px] right-[-60px] w-48 h-48 rounded-full border border-sidebar-primary/15" />
      <div className="absolute top-1/3 right-10 w-24 h-24 rounded-full border border-sidebar-primary/10" />

      {/* Logo & tagline */}
      <div className="relative z-10 text-center space-y-6 max-w-md">
        <h1 className="text-5xl font-extrabold tracking-tight text-sidebar-foreground">
          Vektor<span className="text-cta">Flow</span>
        </h1>
        <p className="text-lg text-sidebar-foreground/80 font-medium leading-relaxed">
          Alinhe objetivos. Acelere resultados.
        </p>

        {/* Feature highlights */}
        <div className="mt-10 space-y-5 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
              <Target className="h-4 w-4 text-cta" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">OKRs conectados</p>
              <p className="text-xs text-sidebar-foreground/60">Objetivos alinhados do estratégico ao operacional</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
              <TrendingUp className="h-4 w-4 text-cta" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">Check-ins contínuos</p>
              <p className="text-xs text-sidebar-foreground/60">Acompanhe progresso em tempo real</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
              <Users className="h-4 w-4 text-cta" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">Colaboração</p>
              <p className="text-xs text-sidebar-foreground/60">Kudos, pulse surveys e feedbacks integrados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { signIn, listMFAFactors } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        toast({ variant: "destructive", title: "Falha no login", description: getSafeAuthError(error) });
        return;
      }
      const { data: factors } = await listMFAFactors();
      const totpFactors = factors?.totp ?? [];
      const verifiedFactors = totpFactors.filter((f) => f.status === "verified");
      if (verifiedFactors.length > 0) {
        setMfaFactorId(verifiedFactors[0].id);
        setMfaRequired(true);
      } else {
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (mfaRequired) {
    return <MFAVerify factorId={mfaFactorId} onSuccess={() => navigate("/")} />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandingPanel />

      {/* Right side — Form */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile-only compact branding */}
        <div className="mb-8 text-center lg:hidden">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Vektor<span className="text-cta">Flow</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Alinhe objetivos. Acelere resultados.</p>
        </div>

        <Card className="card-elevated w-full max-w-md animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold tracking-tight">Entrar</CardTitle>
            <CardDescription>Use suas credenciais para acessar sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" variant="cta" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">Esqueceu a senha?</Link>
            <p className="text-muted-foreground text-xs">
              O acesso é feito por convite. Fale com o administrador.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export { AuthBrandingPanel };
