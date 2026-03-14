import { z } from "zod";

const passwordSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter ao menos um número")
  .regex(/[^A-Za-z0-9]/, "A senha deve conter ao menos um caractere especial");

export const loginSchema = z.object({
  email: z.string().email("Endereço de email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const signupSchema = z.object({
  email: z.string().email("Endereço de email inválido"),
  password: passwordSchema,
  fullName: z.string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[\p{L}\s'-]+$/u, "Nome contém caracteres inválidos"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Endereço de email inválido"),
});

export const otpSchema = z.object({
  code: z.string().length(6, "Código deve ter 6 dígitos").regex(/^\d{6}$/, "Código deve conter apenas números"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
