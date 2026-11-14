import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

// MediaPipe's WASM must match the installed JS version exactly (see README step 2).
const MP_VERSION = JSON.parse(
  readFileSync(new URL('./node_modules/@mediapipe/tasks-vision/package.json', import.meta.url), 'utf8'),
).version;

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/; locally it is served from /.
  base: process.env.BASE_PATH || '/',
  define: { __MP_VERSION__: JSON.stringify(MP_VERSION) },
  worker: { format: 'es' },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'fonts/*'],
      manifest: {
        name: 'Mochi',
        short_name: 'Mochi',
        description: 'A cozy cat companion that notices how you are, on your device.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF6E9',
        theme_color: '#FFC8A2',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,mp3,wasm,ttf}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        // Cache AI model files the first time they're downloaded → works offline afterwards
        runtimeCaching: [{
          urlPattern: ({ url }) =>
            /huggingface\.co|hf\.co|jsdelivr\.net|storage\.googleapis\.com/.test(url.hostname),
          handler: 'CacheFirst',
          options: {
            cacheName: 'ai-models',
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
});
