import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Éviter les conflits de port avec le serveur API
    port: 5173,
    // Réduire le nombre de logs dans la console
    hmr: {
      overlay: false
    }
  },
  // Réduire les logs dans la console
  logLevel: 'error'
});
