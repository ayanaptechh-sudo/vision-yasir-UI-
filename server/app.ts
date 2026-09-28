import 'dotenv/config';
import express from 'express';
import path from 'path';
import apiRoutes from './routes/api';

export async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security Headers Middleware (Section 17 & 29)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Request logger for security inspection
  app.use((req, res, next) => {
    if (!req.path.startsWith('/@') && !req.path.startsWith('/src') && !req.path.startsWith('/node_modules')) {
      const timestamp = new Date().toISOString().substring(11, 19);
      // console.log(`[${timestamp}] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API router
  app.use('/api', apiRoutes);

  // Health check endpoints for deployment probes (Cloud Run / Applet Health)
  const healthHandler = (req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: 'UP',
      app: 'AuthShield 360',
      tagline: 'VerifyVault - Identity Beyond Passwords',
      timestamp: new Date().toISOString(),
    });
  };
  app.get('/api/health', healthHandler);
  app.get('/healthz', healthHandler);
  app.get('/_health', healthHandler);
  app.get('/health', healthHandler);

  // Serve static files from public folder (favicon, icons, images)
  const publicPath = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicPath));

  // Integrate Vite for frontend in dev; serve static dist in prod
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving from dist directory
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return new Promise<void>((resolve) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n======================================================`);
      console.log(`🛡️  AUTHSHIELD 360 - VerifyVault`);
      console.log(`🔒  Identity Beyond Passwords | SOC Subsystem Online`);
      console.log(`🚀  Server running on http://0.0.0.0:${PORT}`);
      console.log(`======================================================\n`);
      resolve();
    });
  });
}
