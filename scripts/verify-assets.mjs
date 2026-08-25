import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const textExt = new Set(['.html', '.css', '.ts', '.tsx', '.js', '.jsx', '.json', '.webmanifest'])
const assetExt = /\.(png|jpe?g|webp|svg|ico|gif|avif)$/i
const ignoredDirs = new Set(['node_modules', 'dist', '.git'])
const refs = new Map()

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (textExt.has(path.extname(entry.name))) {
      scanFile(full)
    }
  }
}

function addRef(file, ref) {
  if (!assetExt.test(ref)) return
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith('data:')) return
  if (!refs.has(ref)) refs.set(ref, new Set())
  refs.get(ref).add(path.relative(root, file))
}

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8')
  const patterns = [
    /(?:src|href|content)=["']([^"']+)["']/g,
    /url\(["']?([^"')]+)["']?\)/g,
    /["'](\/images\/[^"']+)["']/g,
    /["'](\/icons\/[^"']+)["']/g,
    /["'](\/favicon[^"']*)["']/g,
  ]

  for (const re of patterns) {
    for (const match of text.matchAll(re)) {
      addRef(file, match[1].split(/[?#]/)[0])
    }
  }
}

function resolveRef(ref) {
  if (ref.startsWith('/')) return path.join(root, 'public', ref)
  return path.join(root, ref)
}

walk(root)

const missing = []
for (const [ref, files] of refs) {
  if (!fs.existsSync(resolveRef(ref))) {
    missing.push({ ref, files: [...files].sort() })
  }
}

if (missing.length) {
  console.error('Missing internal assets:')
  for (const item of missing) {
    console.error(`- ${item.ref} referenced by ${item.files.join(', ')}`)
  }
  process.exit(1)
}

console.log(`Asset references checked: ${refs.size}`)
console.log('Missing internal assets: 0')
