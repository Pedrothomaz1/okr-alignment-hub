// Safe wrapper around the auto-generated Supabase client.
// Prevents the app from crashing when env vars are missing (e.g. published build
// created before variables were injected).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let client: SupabaseClient<Database> | null = null;

try {
  // Dynamic import would be ideal but breaks tree-shaking.
  // Instead we guard the static import with a try/catch so the module
  // graph doesn't explode when createClient receives undefined.
  const mod = await import("@/integrations/supabase/client");
  client = mod.supabase;
} catch {
  console.error(
    "[supabase-safe] Failed to initialise Supabase client. " +
      "VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY may be missing."
  );
}

export const supabase = client;
