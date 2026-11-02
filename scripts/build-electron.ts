import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';

async function buildElectron() {
  const outDir = path.resolve('dist-electron');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Bundle electron/main.ts -> dist-electron/main.cjs
  console.log('Building Electron main process...');
  await esbuild.build({
    entryPoints: ['electron/main.ts'],
    outfile: 'dist-electron/main.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['electron'],
    sourcemap: true,
    define: {
      'import.meta.url': 'importMetaUrlFallback',
    },
    banner: {
      js: 'const importMetaUrlFallback = typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : "";',
    },
  });

  // 2. Bundle electron/preload.ts -> dist-electron/preload.cjs
  console.log('Building Electron preload script...');
  await esbuild.build({
    entryPoints: ['electron/preload.ts'],
    outfile: 'dist-electron/preload.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['electron'],
    sourcemap: true,
  });

  console.log('Electron build finished successfully in dist-electron/');
}

buildElectron().catch((err) => {
  console.error('Electron build failed:', err);
  process.exit(1);
});
