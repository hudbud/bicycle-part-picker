import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Accounts live in the Worker. To use them with `vite`, run `npx wrangler@4 dev` alongside and
// start vite with API_URL=http://localhost:8787. Without it the app runs browser-only.
const api = process.env.API_URL

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: api ? { proxy: { '/api': api } } : undefined,
})
