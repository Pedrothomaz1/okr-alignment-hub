import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").filter(Boolean);

// In-memory rate limiter (per Edge Function instance)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per user per window
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

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeCsvField(value: string): string {
  let safe = value;
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = "'" + safe;
  }
  return safe.replace(/"/g, '""');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_\sáéíóúãõâêôç]/g, "").slice(0, 100);
}

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
    const { cycle_id, format = "csv" } = body;

    if (!cycle_id || typeof cycle_id !== "string" || !UUID_REGEX.test(cycle_id)) {
      return new Response(JSON.stringify({ error: "cycle_id must be a valid UUID" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (!["csv", "html"].includes(format)) {
      return new Response(JSON.stringify({ error: "format must be 'csv' or 'html'" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const { data: cycle } = await supabase
      .from("cycles")
      .select("*")
      .eq("id", cycle_id)
      .single();

    if (!cycle) {
      return new Response(JSON.stringify({ error: "Cycle not found" }), {
        status: 404,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const { data: objectives } = await supabase
      .from("objectives")
      .select("*, key_results(*), owner:profiles!objectives_owner_id_fkey(full_name)")
      .eq("cycle_id", cycle_id)
      .order("created_at");

    if (format === "csv") {
      const rows: string[] = [];
      rows.push("Objetivo,Tipo,Responsável,Progresso (%),Key Result,KR Tipo,Valor Atual,Valor Alvo,Status KR");

      for (const obj of objectives || []) {
        const ownerName = obj.owner?.full_name || "—";
        if (!obj.key_results || obj.key_results.length === 0) {
          rows.push(
            `"${sanitizeCsvField(obj.title)}","${sanitizeCsvField(obj.objective_type)}","${sanitizeCsvField(ownerName)}",${obj.progress},"—","—","—","—","—"`
          );
        } else {
          for (const kr of obj.key_results) {
            rows.push(
              `"${sanitizeCsvField(obj.title)}","${sanitizeCsvField(obj.objective_type)}","${sanitizeCsvField(ownerName)}",${obj.progress},"${sanitizeCsvField(kr.title)}","${sanitizeCsvField(kr.kr_type)}",${kr.current_value},${kr.target_value},"${sanitizeCsvField(kr.status)}"`
            );
          }
        }
      }

      const csv = rows.join("\n");
      const safeName = sanitizeFilename(cycle.name);
      return new Response(csv, {
        headers: {
          ...headers,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="relatorio-${safeName}.csv"`,
        },
      });
    }

    // HTML format (for print/PDF)
    const objectiveRows = (objectives || [])
      .map((obj) => {
        const ownerName = escapeHtml(obj.owner?.full_name || "—");
        const krs = (obj.key_results || [])
          .map(
            (kr: any) =>
              `<tr><td></td><td></td><td></td><td></td><td>${escapeHtml(kr.title)}</td><td>${escapeHtml(kr.kr_type)}</td><td>${escapeHtml(String(kr.current_value))}</td><td>${escapeHtml(String(kr.target_value))}</td><td>${escapeHtml(kr.status)}</td></tr>`
          )
          .join("");
        return `<tr><td>${escapeHtml(obj.title)}</td><td>${escapeHtml(obj.objective_type)}</td><td>${ownerName}</td><td>${obj.progress}%</td><td colspan="5"></td></tr>${krs}`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório — ${escapeHtml(cycle.name)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 2rem; color: #1a1a1a; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  p { color: #666; margin-bottom: 1.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>Relatório: ${escapeHtml(cycle.name)}</h1>
<p>${escapeHtml(cycle.start_date)} — ${escapeHtml(cycle.end_date)} · Status: ${escapeHtml(cycle.status)}</p>
<table>
<thead><tr><th>Objetivo</th><th>Tipo</th><th>Responsável</th><th>Progresso</th><th>Key Result</th><th>KR Tipo</th><th>Atual</th><th>Alvo</th><th>Status KR</th></tr></thead>
<tbody>${objectiveRows}</tbody>
</table>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch (err) {
    console.error("generate-report error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), ...SECURITY_HEADERS, "Content-Type": "application/json" },
    });
  }
});
