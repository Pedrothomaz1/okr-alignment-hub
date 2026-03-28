import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root")!);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
  // Only import the app (and therefore the Supabase client) when env vars exist
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
