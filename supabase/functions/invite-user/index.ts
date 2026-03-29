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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate JWT using getClaims (doesn't require active session)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
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

    // Parse request body
    const { email, full_name, role } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a temporary password
    const tempPassword =
      crypto.randomUUID().slice(0, 8) +
      "A1!" +
      crypto.randomUUID().slice(0, 4);

    // Create user via admin API
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || "",
        },
      });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Assign role if specified (and not 'member' which is auto-assigned by trigger)
    if (
      role &&
      role !== "member" &&
      ["admin", "okr_master", "manager"].includes(role)
    ) {
      await adminClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role });
    }

    // Send password reset email so user can set their own password
    const { error: resetError } =
      await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: email.toLowerCase().trim(),
      });

    if (resetError) {
      console.warn("Could not send recovery email:", resetError.message);
    }

    // Audit log
    await adminClient.from("audit_logs").insert({
      actor_id: callerId,
      entity_type: "user",
      entity_id: newUser.user.id,
      action: "INVITE",
      metadata: { email, role: role || "member", full_name },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        message: "User created successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("invite-user error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
