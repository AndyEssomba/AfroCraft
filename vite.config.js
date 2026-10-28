import { defineConfig } from 'vite';

// Configuration Vite + Vitest pour AfroCraft (aucun backend, tout côté navigateur).
export default defineConfig({
  // Serveur de développement : `npm run dev`
  server: {
    open: true,
  },
  // Build de production : `npm run build`
  build: {
    target: 'esnext',
  },
  // Tests : `npm test` (vitest --run)
  test: {
    environment: 'node',
    // Ne pas échouer tant qu'aucun fichier de test n'existe (jalons initiaux)
    passWithNoTests: true,
    include: ['src/**/*.{test,spec}.js'],
  },
});