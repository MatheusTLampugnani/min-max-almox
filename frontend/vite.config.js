import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Subcaminho de publicação (ex.: VITE_BASE_PATH=minmax → /minmax/). Vazio = raiz do domínio
const base = `/${(process.env.VITE_BASE_PATH || '').replace(/^\/+|\/+$/g, '')}/`.replace(/\/+/g, '/');

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
