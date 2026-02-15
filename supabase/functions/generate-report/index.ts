import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { cycle_id, format = "csv" } = await req.json();
    if (!cycle_id) {
      return new Response(JSON.stringify({ error: "cycle_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch cycle
    const { data: cycle } = await supabase
      .from("cycles")
      .select("*")
      .eq("id", cycle_id)
      .single();

    if (!cycle) {
      return new Response(JSON.stringify({ error: "Cycle not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch objectives with key results
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
            `"${obj.title}","${obj.objective_type}","${ownerName}",${obj.progress},"—","—","—","—","—"`
          );
        } else {
          for (const kr of obj.key_results) {
            rows.push(
              `"${obj.title}","${obj.objective_type}","${ownerName}",${obj.progress},"${kr.title}","${kr.kr_type}",${kr.current_value},${kr.target_value},"${kr.status}"`
            );
          }
        }
      }

      const csv = rows.join("\n");
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="relatorio-${cycle.name}.csv"`,
        },
      });
    }

    // HTML format (for print/PDF)
    const objectiveRows = (objectives || [])
      .map((obj) => {
        const ownerName = obj.owner?.full_name || "—";
        const krs = (obj.key_results || [])
          .map(
            (kr: any) =>
              `<tr><td></td><td></td><td></td><td></td><td>${kr.title}</td><td>${kr.kr_type}</td><td>${kr.current_value}</td><td>${kr.target_value}</td><td>${kr.status}</td></tr>`
          )
          .join("");
        return `<tr><td>${obj.title}</td><td>${obj.objective_type}</td><td>${ownerName}</td><td>${obj.progress}%</td><td colspan="5"></td></tr>${krs}`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório — ${cycle.name}</title>
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
<h1>Relatório: ${cycle.name}</h1>
<p>${cycle.start_date} — ${cycle.end_date} · Status: ${cycle.status}</p>
<table>
<thead><tr><th>Objetivo</th><th>Tipo</th><th>Responsável</th><th>Progresso</th><th>Key Result</th><th>KR Tipo</th><th>Atual</th><th>Alvo</th><th>Status KR</th></tr></thead>
<tbody>${objectiveRows}</tbody>
</table>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("generate-report error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
