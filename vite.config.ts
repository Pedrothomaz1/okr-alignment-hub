import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fallback values for published builds where .env may not be injected.
  // These are publishable/anon keys — safe to include in client-side code.
  const fallbackEnv: Record<string, string> = {
    VITE_SUPABASE_URL: "https://hmvipnpfejduneusoekn.supabase.co",
    VITE_SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdmlwbnBmZWpkdW5ldXNvZWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDgyOTcsImV4cCI6MjA4NjQyNDI5N30.xMhQXWFN_tnw0wWoSOkxw_rWpEEAfAKJ3Mvmj7rZiAk",
  };

  // Build define replacements for any missing env var
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(fallbackEnv)) {
    if (!process.env[key]) {
      define[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }

  return {
    define,
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
          charts: ["recharts"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
        },
      },
    },
  },
});
