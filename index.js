// ─────────────────────────────────────────────────────────────
// Vila Santa Rosa — production entry file.
// Railway runs this file through `npm start`; it verifies that the production
// build exists, then hands control to the bundled server (dist/boot.js).
//
// Usage:  npm install  →  npm run build  →  npm start
// ─────────────────────────────────────────────────────────────
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverEntry = path.join(__dirname, 'dist', 'boot.js')

// Production mode — always, on the hosting panel
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

if (!existsSync(serverEntry)) {
  console.error('')
  console.error('✖ Production build not found (dist/boot.js).')
  console.error('  Run the build first:')
  console.error('    npm install')
  console.error('    npm run build')
  console.error('  Then start again:')
  console.error('    npm start')
  console.error('')
  process.exit(1)
}

await import(pathToFileURL(serverEntry).href)
