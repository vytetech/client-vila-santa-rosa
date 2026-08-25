import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_LOCALE, LOCALES, SEO, localeUrl } from './seo-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../dist/public')

function fail(message) {
  console.error(`seo-validate: ${message}`)
  process.exit(1)
}

function expectIncludes(html, value, context) {
  if (!html.includes(value)) fail(`${context}: missing ${value}`)
}

const titles = new Set()

for (const locale of LOCALES) {
  const file = resolve(distDir, locale.code, 'index.html')
  if (!existsSync(file)) fail(`missing /${locale.code}/ index.html`)
  const html = readFileSync(file, 'utf-8')
  const meta = SEO[locale.code]
  expectIncludes(html, `<html lang="${locale.lang}" dir="${locale.dir}">`, locale.code)
  expectIncludes(html, `<title>${meta.title}</title>`, locale.code)
  expectIncludes(html, `name="description" content="${meta.description}"`, locale.code)
  expectIncludes(html, `<link rel="canonical" href="${localeUrl(locale.code)}" />`, locale.code)
  expectIncludes(html, '<h1', locale.code)
  expectIncludes(html, '"@type":["LodgingBusiness","BedAndBreakfast"]', locale.code)
  for (const alt of LOCALES) {
    expectIncludes(html, `hreflang="${alt.hreflang}" href="${localeUrl(alt.code)}"`, locale.code)
  }
  expectIncludes(html, `hreflang="x-default" href="${localeUrl(DEFAULT_LOCALE)}"`, locale.code)
  if (html.includes('O café da manhã está incluído?')) fail(`${locale.code}: removed FAQ question found`)
  if (titles.has(meta.title)) fail(`${locale.code}: duplicate title ${meta.title}`)
  titles.add(meta.title)
}

const sitemap = readFileSync(resolve(distDir, 'sitemap.xml'), 'utf-8')
for (const locale of LOCALES) expectIncludes(sitemap, `<loc>${localeUrl(locale.code)}</loc>`, 'sitemap')

const robots = readFileSync(resolve(distDir, 'robots.txt'), 'utf-8')
expectIncludes(robots, 'Sitemap: https://www.vilasantarosa.com/sitemap.xml', 'robots')
expectIncludes(robots, 'Disallow: /admin', 'robots')

for (const route of ['admin', 'conta', 'pagamento']) {
  const file = resolve(distDir, route, 'index.html')
  if (!existsSync(file)) fail(`missing private noindex shell /${route}/`)
  expectIncludes(readFileSync(file, 'utf-8'), 'noindex, nofollow', route)
}

console.log('seo-validate: PASS')
