import { build } from 'esbuild';

await build({
  entryPoints: ['dist/main.js'],
  bundle: true,
  platform: 'node',
  format: 'cjs',                 
  outfile: 'bin/bundle.js',
  external: [
    'better-sqlite3', 
    'puppeteer', 
    '@puppeteer/browsers',
    'bindings'                   
  ],
  banner: {
    js: `
const { createRequire } = require('node:module');
require = createRequire(process.execPath);
    `
  }
  // BANNER RIMOSSO
});