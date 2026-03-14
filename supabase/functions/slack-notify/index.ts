import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").filter(Boolean);
const ALLOWED_WEBHOOK_DOMAIN = "hooks.slack.com";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || "");
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function isValidSlackWebhook(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === "https:" && url.hostname === ALLOWED_WEBHOOK_DOMAIN;
  } catch {
    return false;
  }
}

// In-memory rate limiter (per Edge Function instance)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max requests per user per window
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const headers = { ...corsHeaders, ...SECURITY_HEADERS };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    const body = await req.json();
    const { webhook_url, event_type, message } = body;

    if (!webhook_url || typeof webhook_url !== "string") {
      return new Response(
        JSON.stringify({ error: "webhook_url is required" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    if (!isValidSlackWebhook(webhook_url)) {
      return new Response(
        JSON.stringify({ error: "webhook_url must be a valid https://hooks.slack.com URL" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    if (!message || typeof message !== "string" || message.length > 3000) {
      return new Response(
        JSON.stringify({ error: "message must be a string with max 3000 characters" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    if (event_type && (typeof event_type !== "string" || event_type.length > 100)) {
      return new Response(
        JSON.stringify({ error: "event_type must be a string with max 100 characters" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const safeEventType = (event_type || "Notificação").slice(0, 100);
    const safeMessage = message.slice(0, 3000);

    const slackPayload = {
      text: safeMessage,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${safeEventType}*\n${safeMessage}`,
          },
        },
      ],
    };

    const slackRes = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });

    if (!slackRes.ok) {
      const errText = await slackRes.text();
      console.error("Slack webhook failed:", slackRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to send notification" }),
        { status: 502, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    await slackRes.text();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("slack-notify error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), ...SECURITY_HEADERS, "Content-Type": "application/json" },
    });
  }
});
