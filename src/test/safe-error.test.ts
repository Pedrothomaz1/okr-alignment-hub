import { describe, it, expect, vi } from "vitest";
import { getSafeAuthError, getSafeError } from "@/lib/safe-error";

describe("getSafeAuthError", () => {
  it("maps known auth errors to safe messages", () => {
    expect(getSafeAuthError({ message: "Invalid login credentials" }))
      .toBe("Email ou senha incorretos.");
  });

  it("does not reveal email confirmation status", () => {
    expect(getSafeAuthError({ message: "Email not confirmed" }))
      .toBe("Email ou senha incorretos.");
  });

  it("does not reveal user existence", () => {
    expect(getSafeAuthError({ message: "User already registered" }))
      .toBe("Não foi possível criar a conta. Tente outro email.");
  });

  it("returns generic message for unknown errors", () => {
    expect(getSafeAuthError({ message: "Some internal pg error" }))
      .toBe("Ocorreu um erro. Tente novamente.");
  });

  it("returns generic message for null error", () => {
    expect(getSafeAuthError(null)).toBe("Ocorreu um erro. Tente novamente.");
  });

  it("returns generic message for error without message", () => {
    expect(getSafeAuthError({})).toBe("Ocorreu um erro. Tente novamente.");
  });
});

describe("getSafeError", () => {
  it("returns generic message in production", () => {
    vi.stubEnv("DEV", false);
    expect(getSafeError(new Error("DB connection failed"))).toBe("Ocorreu um erro. Tente novamente.");
    vi.unstubAllEnvs();
  });

  it("returns generic message for non-Error types", () => {
    expect(getSafeError("string error")).toBe("Ocorreu um erro. Tente novamente.");
    expect(getSafeError(42)).toBe("Ocorreu um erro. Tente novamente.");
    expect(getSafeError(null)).toBe("Ocorreu um erro. Tente novamente.");
  });
});
