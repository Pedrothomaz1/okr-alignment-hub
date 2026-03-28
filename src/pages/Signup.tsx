import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { signupSchema, type SignupFormValues } from "@/lib/validations";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getSafeAuthError } from "@/lib/safe-error";
import { AuthBrandingPanel } from "@/pages/Login";

export default function Signup() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(values.email, values.password, values.fullName);
      if (error) {
        toast({ variant: "destructive", title: "Falha no cadastro", description: getSafeAuthError(error) });
        return;
      }
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthBrandingPanel />
        <div className="flex flex-col items-center justify-center px-6 py-12 bg-background">
          <Card className="card-elevated w-full max-w-md text-center animate-scale-in">
            <CardHeader>
              <CardTitle>Verifique seu email</CardTitle>
              <CardDescription>Enviamos um link de confirmação para o seu email. Verifique para continuar.</CardDescription>
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
            <CardTitle className="text-xl font-semibold tracking-tight">Criar Conta</CardTitle>
            <CardDescription>Cadastre-se para começar</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl><Input placeholder="João Silva" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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
                  {isLoading ? "Criando conta..." : "Cadastrar"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm">
            <p className="text-muted-foreground">
              Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
