import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxy requests from /api/google-places to Google Places API
      '/api/google-places': {
        target: 'https://maps.googleapis.com/maps/api/place',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-places/, ''), // Remove base path
        secure: false, // Consider setting to true if target is HTTPS and valid cert
      },
    },
  },
})
