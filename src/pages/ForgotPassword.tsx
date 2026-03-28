import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getSafeAuthError } from "@/lib/safe-error";
import { AuthBrandingPanel } from "@/pages/Login";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(values.email);
      if (error) {
        toast({ variant: "destructive", title: "Erro", description: getSafeAuthError(error) });
        return;
      }
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthBrandingPanel />
        <div className="flex flex-col items-center justify-center px-6 py-12 bg-background">
          <Card className="card-elevated w-full max-w-md text-center animate-scale-in">
            <CardHeader>
              <CardTitle>Verifique seu email</CardTitle>
              <CardDescription>Se uma conta existir, enviamos um link para redefinir sua senha.</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Link to="/login" className="text-primary hover:underline text-sm">Voltar ao login</Link>
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
            <CardTitle className="text-xl font-semibold tracking-tight">Redefinir Senha</CardTitle>
            <CardDescription>Insira seu email para receber um link de redefinição</CardDescription>
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
                <Button type="submit" variant="cta" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar Link"}
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
