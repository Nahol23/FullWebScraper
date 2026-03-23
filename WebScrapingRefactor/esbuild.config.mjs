import { build } from 'esbuild';

await build({
  entryPoints: ['dist/main.js'], // Il file di partenza (sostituisce la prima parte del comando)
  bundle: true,                  // Sostituisce --bundle
  platform: 'node',              // Sostituisce --platform=node
  outfile: 'bin/bundle.js',      // Sostituisce --outfile
  external: ['better-sqlite3', 'puppeteer'], // Sostituisce i due --external
  banner: {
    js: "const { createRequire } = require('node:module'); require = createRequire(__filename);"
  }
});