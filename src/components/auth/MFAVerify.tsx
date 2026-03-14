import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

interface MFAVerifyProps {
  factorId: string;
  onSuccess: () => void;
}

export function MFAVerify({ factorId, onSuccess }: MFAVerifyProps) {
  const { challengeMFA, verifyMFA } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsLoading(true);
    try {
      const { data: challenge, error: challengeErr } = await challengeMFA(factorId);
      if (challengeErr || !challenge) {
        toast({ variant: "destructive", title: "MFA Error", description: challengeErr?.message ?? "Failed to create challenge" });
        return;
      }
      const { error: verifyErr } = await verifyMFA(factorId, challenge.id, code);
      if (verifyErr) {
        toast({ variant: "destructive", title: "Invalid code", description: verifyErr.message });
        return;
      }
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <Card className="card-elevated w-full max-w-md text-center animate-scale-in">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code from your authenticator app</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <button onClick={handleVerify} disabled={code.length !== 6 || isLoading} className="btn-cta w-full">
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
