import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockMfaEnroll = vi.fn();
const mockMfaChallenge = vi.fn();
const mockMfaVerify = vi.fn();
const mockMfaListFactors = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
      mfa: {
        enroll: (...args: any[]) => mockMfaEnroll(...args),
        challenge: (...args: any[]) => mockMfaChallenge(...args),
        verify: (...args: any[]) => mockMfaVerify(...args),
        listFactors: (...args: any[]) => mockMfaListFactors(...args),
      },
    },
  },
}));

import { useAuth } from "@/hooks/useAuth";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
  });

  it("signUp passes email, password, and full_name correctly", async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: "1" } }, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signUp("test@test.com", "Pass123!", "John Doe");
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "Pass123!",
      options: {
        data: { full_name: "John Doe" },
        emailRedirectTo: window.location.origin,
      },
    });
  });

  it("signIn calls signInWithPassword", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: null, error: { message: "Invalid" } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const res = await act(async () => {
      return result.current.signIn("bad@test.com", "wrong");
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "bad@test.com",
      password: "wrong",
    });
    expect(res?.error).toBeTruthy();
  });

  it("signOut calls supabase.auth.signOut", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("resetPassword uses correct redirectTo", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.resetPassword("test@test.com");
    });

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@test.com", {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  });

  it("enrollMFA calls mfa.enroll with totp", async () => {
    mockMfaEnroll.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.enrollMFA();
    });

    expect(mockMfaEnroll).toHaveBeenCalledWith({ factorType: "totp" });
  });

  it("verifyMFA calls mfa.verify with correct params", async () => {
    mockMfaVerify.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.verifyMFA("factor-1", "challenge-1", "123456");
    });

    expect(mockMfaVerify).toHaveBeenCalledWith({
      factorId: "factor-1",
      challengeId: "challenge-1",
      code: "123456",
    });
  });
});
