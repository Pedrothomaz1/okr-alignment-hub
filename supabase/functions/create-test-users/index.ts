import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
  if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { manager_id } = await req.json();

  const testUsers = [
    { email: "ana.silva.teste@example.com", full_name: "Ana Silva", password: "Test1234!" },
    { email: "carlos.souza.teste@example.com", full_name: "Carlos Souza", password: "Test1234!" },
    { email: "marina.costa.teste@example.com", full_name: "Marina Costa", password: "Test1234!" },
  ];

  const results = [];

  for (const u of testUsers) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });

    if (error) {
      results.push({ email: u.email, error: error.message });
      continue;
    }

    // Set manager_id
    await supabaseAdmin.from("profiles").update({ manager_id }).eq("id", data.user.id);
    results.push({ email: u.email, id: data.user.id, ok: true });
  }

  return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
