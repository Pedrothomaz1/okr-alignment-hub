const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Email ou senha incorretos.",
  "User already registered": "Não foi possível criar a conta. Tente outro email.",
  "Password should be at least 6 characters": "Senha muito curta.",
  "Signup requires a valid password": "Senha inválida.",
};

export function getSafeAuthError(error: { message?: string } | null): string {
  if (!error?.message) return "Ocorreu um erro. Tente novamente.";
  return AUTH_ERROR_MAP[error.message] || "Ocorreu um erro. Tente novamente.";
}

export function getSafeError(error: unknown): string {
  if (import.meta.env.DEV && error instanceof Error) {
    return error.message;
  }
  return "Ocorreu um erro. Tente novamente.";
}
