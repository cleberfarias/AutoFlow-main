import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Determine base for GitHub Pages project or default to '/'
    // If running on GitHub Actions, GITHUB_REPOSITORY will be like "owner/repo"
    // so we use the repo name as base: '/repo/'
    const githubRepo = process.env.GITHUB_REPOSITORY || '';
    const base = githubRepo ? `/${githubRepo.split('/')[1]}/` : '/';

    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Dev proxy to avoid CORS and allow cookies to be sent to ChatGuru running on a different port
        proxy: {
          '/api': {
            target: env.VITE_CHATGURU_API_BASE_URL || 'http://localhost:5000',
            changeOrigin: true,
            secure: false,
            // preserve path and allow cookies
            // Note: in production, ChatGuru should be on the same origin or handled by proper reverse proxy
          }
        }
      },
      plugins: [react()],
      // Do not embed secret keys at build time. Keys must remain only in server environment variables.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
