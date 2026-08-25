/**
 * يلتقط لقطات #root المُصيّرة لكل لغة (تشغيل: npm run test:snapshots)
 * يقدّم dist/public محليًا، يضبط localStorage('vsr-locale') ويحفظ innerHTML.
 * Não faz parte do build de produção: requer Playwright/Chromium.
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../dist/public')
const snapDir = resolve(__dirname, 'snapshots')
const LOCALES = ['pt', 'es', 'en', 'ar', 'fr', 'zh', 'ja']
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' }

const server = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0])
  if (/^\/(pt|en|es|fr|ar|zh|ja)\/?$/.test(p)) p = '/index.html'
  if (p === '/') p = '/index.html'
  const file = join(distDir, p)
  if (existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(readFileSync(file))
  } else {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(readFileSync(join(distDir, 'index.html')))
  }
})

await new Promise((r) => server.listen(4399, r))
const browser = await chromium.launch()

for (const loc of LOCALES) {
  const ctx = await browser.newContext()
  await ctx.addInitScript((l) => localStorage.setItem('vsr-locale', l), loc)
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:4399/${loc}/`, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(2500)
  const html = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? '')
  if (html.length < 1000) {
    console.error(`✗ ${loc}: لقطة فارغة (${html.length})`)
  } else {
    writeFileSync(join(snapDir, `${loc}.html`), html)
    console.log(`✓ ${loc}: ${html.length}`)
  }
  await ctx.close()
}

await browser.close()
server.close()
