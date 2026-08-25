// ─────────────────────────────────────────────────────────────
// Build step that runs on the HOSTING server (cPanel / Link Nacional).
//
// The project ships with a pre-built production bundle in dist/,
// so the server does NOT need vite/esbuild (devDependencies) —
// which are skipped in production installs and caused
// "vite: command not found" failures.
//
// If dist/ is present  → build succeeds instantly (nothing to do).
// If dist/ is missing   → it tells you to build locally first.
//
// To regenerate dist/ locally use:  npm run build:full
// ─────────────────────────────────────────────────────────────
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const boot = path.join(root, 'dist', 'boot.js')
const indexHtml = path.join(root, 'dist', 'public', 'index.html')

if (existsSync(boot) && existsSync(indexHtml)) {
  console.log('✔ Pre-built production bundle found in dist/ — nothing to build.')
  process.exit(0)
}

console.error('')
console.error('✖ dist/ not found. This project ships pre-built.')
console.error('  Build it locally first, then upload the dist/ folder:')
console.error('    npm install')
console.error('    npm run build:full')
console.error('')
process.exit(1)
