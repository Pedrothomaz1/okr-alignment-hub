import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";

interface MFASetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function MFASetup({ onComplete, onSkip }: MFASetupProps) {
  const { enrollMFA, challengeMFA, verifyMFA } = useAuth();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"init" | "verify">("init");
  const [isLoading, setIsLoading] = useState(false);

  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await enrollMFA();
      if (error || !data) {
        toast({ variant: "destructive", title: "MFA Error", description: error?.message ?? "Failed to enroll" });
        return;
      }
      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
      setStep("verify");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsLoading(true);
    try {
      const { data: challenge, error: challengeErr } = await challengeMFA(factorId);
      if (challengeErr || !challenge) {
        toast({ variant: "destructive", title: "Error", description: challengeErr?.message ?? "Challenge failed" });
        return;
      }
      const { error: verifyErr } = await verifyMFA(factorId, challenge.id, code);
      if (verifyErr) {
        toast({ variant: "destructive", title: "Invalid code", description: verifyErr.message });
        return;
      }
      toast({ title: "2FA enabled", description: "Two-factor authentication has been set up successfully." });
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <Card className="card-elevated w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">Set Up 2FA</CardTitle>
          <CardDescription>
            {step === "init"
              ? "Secure your account with two-factor authentication"
              : "Scan the QR code with your authenticator app, then enter the code"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {step === "init" ? (
            <>
              <button onClick={handleEnroll} disabled={isLoading} className="btn-cta w-full">
                {isLoading ? "Setting up..." : "Enable 2FA"}
              </button>
              {onSkip && (
                <Button variant="ghost" onClick={onSkip} className="w-full">
                  Skip for now
                </Button>
              )}
            </>
          ) : (
            <>
              {qrCode && <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48 rounded-lg border" />}
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <button onClick={handleVerify} disabled={code.length !== 6 || isLoading} className="btn-cta w-full">
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
