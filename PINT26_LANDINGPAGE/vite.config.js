import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Permite acesso externo
    port: 3002, // Define a porta do microsite
    strictPort: true, // Garante que a porta definida será usada
    allowedHosts: ["softbadge.pt", "www.softbadge.pt"], // Permite acesso externo pelos domínios
  },
})