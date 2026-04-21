import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/overpass": {
        target: "https://overpass.kumi.systems",
        changeOrigin: true,
        rewrite: () => "/api/interpreter",
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Prevent duplicate React instances (fixes react-leaflet context errors)
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
