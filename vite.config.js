import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: false,
      proxy: {
        '/api': {
          // local BE by default; `npm run dev:remote` points to deployed API via .env.remote
          target: env.API_PROXY_TARGET || 'https://localhost:44385/',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
