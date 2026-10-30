import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  build: {
    target: 'es2018',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('@tanstack')) {
              return 'query-vendor'
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor'
            }
            if (id.includes('i18next')) {
              return 'i18n-vendor'
            }
            if (id.includes('date-fns')) {
              return 'date-vendor'
            }
          }
        },
      },
    },
  },
})
