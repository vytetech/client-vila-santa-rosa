// ─────────────────────────────────────────────────────────────
// Post-install safety net (runs after npm ci / npm install).
//
// If dist/ is missing (e.g. a source-only deploy), this builds it
// automatically so the server can always start. If dist/ already
// exists (pre-built deploy), it does nothing.
//
// This script NEVER fails the install — it only warns.
// ─────────────────────────────────────────────────────────────
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const boot = path.join(root, 'dist', 'boot.js')
const indexHtml = path.join(root, 'dist', 'public', 'index.html')
const isRailwayOrCi =
  process.env.CI === 'true' ||
  Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_ENVIRONMENT_NAME ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_ID,
  )

if (existsSync(boot) && existsSync(indexHtml)) {
  console.log('✔ dist/ already present — skipping build.')
  process.exit(0)
}

if (isRailwayOrCi) {
  console.log('ℹ CI/Railway install detected — skipping postinstall build.')
  process.exit(0)
}

console.log('ℹ dist/ not found — building production bundle…')
try {
  execSync('npm run build:full', { cwd: root, stdio: 'inherit' })
  if (existsSync(boot) && existsSync(indexHtml)) {
    console.log('✔ dist/ built successfully.')
    process.exit(0)
  }
  console.warn('⚠ build finished but dist/ is still incomplete.')
} catch (e) {
  console.warn('⚠ Could not auto-build dist/ (dev dependencies may be missing).')
  console.warn('  If this is a production deploy, the pre-built dist/ should be')
  console.warn('  included in the upload. The app will fail to start without it.')
}
// Never block npm install
process.exit(0)
