import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema, resetPasswordSchema, otpSchema } from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "any" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "any" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("does not enforce password complexity on login", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "simple" });
    expect(result.success).toBe(true);
  });
});

describe("signupSchema", () => {
  const validData = {
    email: "user@example.com",
    password: "Str0ng!Pass",
    fullName: "João Silva",
  };

  it("accepts valid signup data", () => {
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects password without uppercase", () => {
    const result = signupSchema.safeParse({ ...validData, password: "str0ng!pass" });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = signupSchema.safeParse({ ...validData, password: "STR0NG!PASS" });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = signupSchema.safeParse({ ...validData, password: "Strong!Pass" });
    expect(result.success).toBe(false);
  });

  it("rejects password without special char", () => {
    const result = signupSchema.safeParse({ ...validData, password: "Str0ngPass1" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = signupSchema.safeParse({ ...validData, password: "S1!a" });
    expect(result.success).toBe(false);
  });

  it("rejects name with special chars (injection attempt)", () => {
    const result = signupSchema.safeParse({ ...validData, fullName: '<script>alert("xss")</script>' });
    expect(result.success).toBe(false);
  });

  it("rejects name with numbers", () => {
    const result = signupSchema.safeParse({ ...validData, fullName: "User123" });
    expect(result.success).toBe(false);
  });

  it("accepts accented names", () => {
    const result = signupSchema.safeParse({ ...validData, fullName: "José María Ñoño" });
    expect(result.success).toBe(true);
  });

  it("accepts hyphenated names", () => {
    const result = signupSchema.safeParse({ ...validData, fullName: "Mary-Jane O'Brien" });
    expect(result.success).toBe(true);
  });

  it("rejects name exceeding 100 chars", () => {
    const result = signupSchema.safeParse({ ...validData, fullName: "A".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = resetPasswordSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = resetPasswordSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("otpSchema", () => {
  it("accepts 6-digit code", () => {
    const result = otpSchema.safeParse({ code: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects non-numeric code", () => {
    const result = otpSchema.safeParse({ code: "abcdef" });
    expect(result.success).toBe(false);
  });

  it("rejects code shorter than 6 digits", () => {
    const result = otpSchema.safeParse({ code: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects code longer than 6 digits", () => {
    const result = otpSchema.safeParse({ code: "1234567" });
    expect(result.success).toBe(false);
  });
});
