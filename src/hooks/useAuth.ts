import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  // MFA / 2FA
  const enrollMFA = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    return { data, error };
  }, []);

  const challengeMFA = useCallback(async (factorId: string) => {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    return { data, error };
  }, []);

  const verifyMFA = useCallback(async (factorId: string, challengeId: string, code: string) => {
    const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    return { data, error };
  }, []);

  const listMFAFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { data, error };
  }, []);

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    enrollMFA,
    challengeMFA,
    verifyMFA,
    listMFAFactors,
  };
}
