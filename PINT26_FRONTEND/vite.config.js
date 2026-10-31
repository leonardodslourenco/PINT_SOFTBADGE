import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Permite acesso externo
    port: 3001, // Define a porta do frontend
    strictPort: true, // Garante que a porta definida será usada
    allowedHosts: ["webapp.softbadge.pt"], // Permite acesso externo pelo domínio
  },
})