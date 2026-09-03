import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Serve root /data folder at /data/* during Vite dev. */
function serveDataDir(): Plugin {
  return {
    name: 'serve-data-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/data/')) {
          next();
          return;
        }
        const urlPath = req.url.split('?')[0] ?? req.url;
        const filePath = path.join(process.cwd(), urlPath);
        const dataRoot = path.join(process.cwd(), 'data');
        if (!filePath.startsWith(dataRoot + path.sep) && filePath !== dataRoot) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath);
        const types: Record<string, string> = {
          '.json': 'application/json',
          '.md': 'text/markdown',
          '.txt': 'text/plain',
        };
        res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream');
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  // Project Pages are served at https://<user>.github.io/<repo>/, so built
  // assets must be prefixed with the repo name. Dev keeps the root '/'.
  base: command === 'build' ? '/polyglot-hub/' : '/',
  plugins: [
    react(),
    serveDataDir(),
    viteStaticCopy({
      targets: [{ src: 'data', dest: '.' }],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  },
}));
