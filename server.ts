import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distServerPath = path.resolve(__dirname, 'dist', 'server.js');

async function main() {
  const isProd = process.env.NODE_ENV === 'production';
  const isDevScript = process.env.npm_lifecycle_event === 'dev';

  // 1. If production bundle exists and not in dev script, load the compiled bundle
  if (fs.existsSync(distServerPath) && (isProd || !isDevScript)) {
    const bundleUrl = pathToFileURL(distServerPath).href;
    const mod = await import(bundleUrl);
    if (mod.startServer) {
      await mod.startServer();
    }
    return;
  }

  // 2. In dev (or fallback), dynamically load TypeScript implementation
  try {
    const { startServer } = await import('./server/app.ts');
    await startServer();
  } catch (err: any) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
      // If run via vanilla node without tsx and dist/server.js is missing, spawn tsx
      const { spawn } = await import('child_process');
      const child = spawn(process.execPath, ['--import', 'tsx', __filename], {
        stdio: 'inherit',
        env: { ...process.env, _TSX_BOOTSTRAPPED: 'true' },
      });
      child.on('exit', (code, signal) => {
        if (signal) process.kill(process.pid, signal);
        else process.exit(code ?? 0);
      });
    } else {
      console.error('Fatal server startup error:', err);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('Fatal startup failure:', err);
  process.exit(1);
});
