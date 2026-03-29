import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AuthBrandingPanel } from "@/pages/Login";

const resetSchema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [checking, setChecking] = useState(true);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    // Listen for recovery or invite events from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValid(true);
        setChecking(false);
      }
      if (event === "SIGNED_IN") {
        // inviteUserByEmail redirects with a SIGNED_IN event after token exchange
        // Check if URL hash contains type=invite or type=recovery
        const hash = window.location.hash;
        if (hash.includes("type=invite") || hash.includes("type=recovery")) {
          setIsValid(true);
          setIsInvite(hash.includes("type=invite"));
          setChecking(false);
        }
      }
    });

    // Check URL hash for token indicators
    const hash = window.location.hash;
    const hasRecoveryOrInvite = hash.includes("type=recovery") || hash.includes("type=invite");

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && hasRecoveryOrInvite) {
        setIsValid(true);
        setIsInvite(hash.includes("type=invite"));
      } else if (session) {
        setIsValid(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (values: ResetFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
        return;
      }
      toast({ title: "Senha redefinida com sucesso!" });
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Verificando...</div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthBrandingPanel />
        <div className="flex flex-col items-center justify-center px-6 py-12 bg-background">
          <Card className="card-elevated w-full max-w-md text-center animate-scale-in">
            <CardHeader>
              <CardTitle>Link inválido ou expirado</CardTitle>
              <CardDescription>
                Este link de redefinição de senha não é mais válido. Solicite um novo link.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Link to="/forgot-password" className="text-primary hover:underline text-sm">
                Solicitar novo link
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandingPanel />

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
            <CardTitle className="text-xl font-semibold tracking-tight">
              {isInvite ? "Crie sua Senha" : "Nova Senha"}
            </CardTitle>
            <CardDescription>
              {isInvite ? "Bem-vindo ao VektorFlow! Defina sua senha para acessar a plataforma." : "Digite sua nova senha abaixo"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" variant="cta" className="w-full" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Redefinir Senha"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-primary hover:underline text-sm">Voltar ao login</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
