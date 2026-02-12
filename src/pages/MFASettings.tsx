import { useNavigate } from "react-router-dom";
import { MFASetup } from "@/components/auth/MFASetup";

export default function MFASettings() {
  const navigate = useNavigate();
  return <MFASetup onComplete={() => navigate("/")} onSkip={() => navigate("/")} />;
}
