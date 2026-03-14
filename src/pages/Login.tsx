import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/lib/validations";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getSafeAuthError } from "@/lib/safe-error";
import { MFAVerify } from "@/components/auth/MFAVerify";

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
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <Card className="card-elevated w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-2xl font-bold text-gradient">OKR Platform</div>
          <CardTitle className="text-xl font-semibold tracking-tight">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
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
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <button type="submit" className="btn-cta w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
          <p className="text-muted-foreground">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
