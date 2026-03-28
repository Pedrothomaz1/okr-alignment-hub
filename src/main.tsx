import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root")!);

// Fallback values for published builds where env vars may not be injected.
// These are publishable/anon keys — safe to include in client-side code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://hmvipnpfejduneusoekn.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdmlwbnBmZWpkdW5ldXNvZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDgyOTcsImV4cCI6MjA4NjQyNDI5N30.xMhQXWFN_tnw0wWoSOkxw_rWpEEAfAKJ3Mvmj7rZiAk";

if (!supabaseUrl || !supabaseKey) {
  root.render(
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Erro de configuração</h1>
        <p style={{ color: "#666" }}>Variáveis de ambiente não encontradas. Tente republicar o site.</p>
      </div>
    </div>
  );
} else {
  // Inject env vars globally so the auto-generated client.ts can use them
  if (!import.meta.env.VITE_SUPABASE_URL) {
    (import.meta as any).env.VITE_SUPABASE_URL = supabaseUrl;
    (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY = supabaseKey;
  }

  Promise.all([
    import("next-themes"),
    import("./App"),
    import("./index.css"),
  ]).then(([{ ThemeProvider }, { default: App }]) => {
    root.render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    );
  });
}
