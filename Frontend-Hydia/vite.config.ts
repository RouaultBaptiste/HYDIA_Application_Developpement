import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // This enables both localhost and network access
    port: 8081,
    strictPort: false,
    open: true, // Automatically open browser
    // Add historyApiFallback for client-side routing
    middlewareMode: false,
  },
  preview: {
    port: 8081,
    strictPort: false,
    host: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add base configuration for proper routing
  base: "/",
  // Add build configuration for SPA routing
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
}));
