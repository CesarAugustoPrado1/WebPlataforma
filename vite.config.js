import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

// Plugin de dev: hace correr las funciones de /api localmente (sin Vercel CLI),
// emulando la interfaz req.query / res.status().json() de Vercel.
function apiDevServer() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        const url = new URL(req.url, 'http://localhost');
        const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
        const file = path.join(process.cwd(), 'api', `${name}.js`);
        if (!fs.existsSync(file)) return next();
        const moduleId = `/api/${name}.js`; // ruta relativa a la raíz para ssrLoadModule

        // Adaptadores estilo Vercel.
        req.query = Object.fromEntries(url.searchParams.entries());
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(obj));
          return res;
        };
        try {
          const mod = await server.ssrLoadModule(moduleId);
          await mod.default(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevServer()],
  server: { port: 5173 },
});
