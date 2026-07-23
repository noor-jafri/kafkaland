import { defineConfig } from 'vite';

function keepServerOnlyMarkdownPrivate() {
  return {
    name: 'kafkaland-server-only-markdown',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url, 'http://vite.invalid').pathname;
          for (let i = 0; i < 3; i++) {
            const decoded = decodeURIComponent(pathname);
            if (decoded === pathname) break;
            pathname = decoded;
          }
          pathname = pathname.replaceAll('\\', '/');
        } catch {
          response.statusCode = 400;
          response.end('Bad request');
          return;
        }
        // Cover ordinary URLs, encoded paths, and Vite's /@fs/ development route.
        if (/(?:^|\/)(?:wiki|game-levels)(?:\/|$)/.test(pathname)) {
          response.statusCode = 404;
          response.setHeader('cache-control', 'no-store');
          response.end('Not found');
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [keepServerOnlyMarkdownPrivate()],
  // Three.js makes the single game entry slightly larger than Vite's generic
  // 500 kB warning threshold; its compressed production payload is about 132 kB.
  build: {
    chunkSizeWarningLimit: 550,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: false,
      },
    },
  },
});
