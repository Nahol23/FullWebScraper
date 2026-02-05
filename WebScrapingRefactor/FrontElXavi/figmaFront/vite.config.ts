import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ⬇️ L'unica cosa fondamentale per Shadcn
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000, // Mantiene il tuo sito sulla porta 3000
    open: true, // Apre il browser in automatico
  },
})