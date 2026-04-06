import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;

    // Check admin role
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, full_name, role, resend } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Formato de email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // --- RESEND MODE ---
    if (resend) {
      // Find existing user
      const { data: existingProfiles } = await adminClient
        .from("profiles")
        .select("id, full_name")
        .eq("email", normalizedEmail)
        .limit(1);

      if (!existingProfiles || existingProfiles.length === 0) {
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Resend invite
      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { full_name: existingProfiles[0].full_name || "" },
      });

      if (inviteError) {
        console.error("Resend invite error:", inviteError.message);
        return new Response(
          JSON.stringify({ error: inviteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Audit log
      await adminClient.from("audit_logs").insert({
        actor_id: callerId,
        entity_type: "user",
        entity_id: existingProfiles[0].id,
        action: "RESEND_INVITE",
        metadata: { email: normalizedEmail },
      });

      return new Response(
        JSON.stringify({ success: true, message: "Convite reenviado com sucesso." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- NEW INVITE MODE ---
    const { data: existingProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
      return new Response(
        JSON.stringify({ error: "Usuário com este email já existe" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { full_name: full_name || "" },
      });

    if (inviteError) {
      console.error("Invite error:", inviteError.message);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = inviteData.user.id;

    if (role && role !== "member" && ["admin", "okr_master", "manager"].includes(role)) {
      await adminClient.from("user_roles").insert({ user_id: newUserId, role });
    }

    await adminClient.from("audit_logs").insert({
      actor_id: callerId,
      entity_type: "user",
      entity_id: newUserId,
      action: "INVITE",
      metadata: { email: normalizedEmail, role: role || "member", full_name },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        message: "Usuário convidado com sucesso. Um email foi enviado.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("invite-user error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
