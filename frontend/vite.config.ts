import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ["zestful-achievement-production-2f02.up.railway.app"],
    host: "0.0.0.0",
    port: 3000,
  },
});