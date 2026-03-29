import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthBrandingPanel } from "@/pages/Login";
import { ShieldCheck } from "lucide-react";

export default function Signup() {
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

        <Card className="card-elevated w-full max-w-md text-center animate-scale-in">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">Acesso por Convite</CardTitle>
            <CardDescription>
              O cadastro no VektorFlow é feito exclusivamente por convite do administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Se você recebeu um convite por email, use o link enviado para definir sua senha e acessar a plataforma.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-primary hover:underline text-sm">Ir para o login</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
