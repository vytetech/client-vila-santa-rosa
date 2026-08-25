import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_LOCALE, LOCALES, SEO, SITE, SITE_URL, localeUrl } from './seo-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../dist/public')
const templatePath = resolve(distDir, 'index.html')
const snapDir = resolve(__dirname, 'snapshots')
const EMPTY_ROOT = '<div id="root"></div>'
const PRIVATE_ROUTES = ['admin', 'conta', 'pagamento', 'login', 'redefinir-senha']

if (!existsSync(templatePath)) {
  console.error('dist/public/index.html not found. Run vite build first.')
  process.exit(1)
}

const rawTemplate = readFileSync(templatePath, 'utf-8')
const template = rawTemplate.includes(EMPTY_ROOT)
  ? rawTemplate
  : rawTemplate.replace(/<div id="root">[\s\S]*<\/div>(?=\s*<script type="module")/, EMPTY_ROOT)

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function stripExistingSeo(html) {
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>/i, '')
    .replace(/\s*<meta\s+name="(?:description|keywords|robots|author|geo\.region|geo\.placename|geo\.position|ICBM|twitter:[^"]+)"[\s\S]*?>/gi, '')
    .replace(/\s*<meta\s+property="og:[^"]+"[\s\S]*?>/gi, '')
    .replace(/\s*<link\s+rel="canonical"[\s\S]*?>/gi, '')
    .replace(/\s*<link\s+rel="alternate"[\s\S]*?>/gi, '')
    .replace(/\s*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '')
}

function hreflangLinks() {
  const links = LOCALES.map((locale) => `<link rel="alternate" hreflang="${locale.hreflang}" href="${localeUrl(locale.code)}" />`)
  links.push(`<link rel="alternate" hreflang="x-default" href="${localeUrl(DEFAULT_LOCALE)}" />`)
  return links.join('\n    ')
}

function lodgingSchema(code) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LodgingBusiness', 'BedAndBreakfast'],
    name: SITE.legalName,
    alternateName: SITE.name,
    url: localeUrl(code),
    image: [SITE.image, `${SITE_URL}/images/jardim-2.webp`, `${SITE_URL}/images/suite-luxo-1.webp`, `${SITE_URL}/images/cafe-1.webp`],
    logo: SITE.logoUrl,
    description: SEO[code].description,
    telephone: SITE.phones.primary,
    priceRange: 'R$',
    currenciesAccepted: 'BRL',
    paymentAccepted: 'Pix, credit card, PayPal',
    checkinTime: SITE.checkinTime,
    checkoutTime: SITE.checkoutTime,
    petsAllowed: true,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.latitude, longitude: SITE.geo.longitude },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Independent suites', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Free Wi-Fi', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Garden', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Pet friendly', value: true },
    ],
  }
}

function faqSchema(code) {
  const faq = SEO[code].faq
  if (!faq.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

function imageSchema(code) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: SITE.image,
    url: SITE.image,
    name: `${SITE.name} - Ilhabela`,
    caption: SEO[code].description,
  }
}

function seoHead(code) {
  const locale = LOCALES.find((item) => item.code === code)
  const meta = SEO[code]
  const canonical = localeUrl(code)
  const schemas = [lodgingSchema(code), imageSchema(code), faqSchema(code)].filter(Boolean)
  return `<title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="keywords" content="${escapeHtml(meta.keywords)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="author" content="${escapeHtml(SITE.legalName)}" />
    <link rel="canonical" href="${canonical}" />
    ${hreflangLinks()}
    <meta name="geo.region" content="BR-SP" />
    <meta name="geo.placename" content="${escapeHtml(`${SITE.address.neighborhood}, ${SITE.address.city}, Sao Paulo, Brasil`)}" />
    <meta name="geo.position" content="${SITE.geo.latitude};${SITE.geo.longitude}" />
    <meta name="ICBM" content="${SITE.geo.latitude}, ${SITE.geo.longitude}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(SITE.legalName)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${SITE.image}" />
    <meta property="og:image:alt" content="Vila Santa Rosa em Ilhabela" />
    <meta property="og:locale" content="${locale.ogLocale}" />
    ${LOCALES.filter((item) => item.code !== code).map((item) => `<meta property="og:locale:alternate" content="${item.ogLocale}" />`).join('\n    ')}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${SITE.image}" />
    ${schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('\n    ')}`
}

function withSeo(code, content) {
  const locale = LOCALES.find((item) => item.code === code)
  return stripExistingSeo(template)
    .replace(EMPTY_ROOT, () => `<div id="root">${content}</div>`)
    .replace(/<html[^>]*>/i, `<html lang="${locale.lang}" dir="${locale.dir}">`)
    .replace(/<meta name="theme-color"/i, `${seoHead(code)}\n\n    <meta name="theme-color"`)
}

function privateShell(slug) {
  return stripExistingSeo(template)
    .replace(/<html[^>]*>/i, '<html lang="pt-BR" dir="ltr">')
    .replace(/<meta name="theme-color"/i, `<title>Vila Santa Rosa</title>\n    <meta name="robots" content="noindex, nofollow" />\n    <link rel="canonical" href="${SITE_URL}/${slug}" />\n\n    <meta name="theme-color"`)
}

for (const locale of LOCALES) {
  const snapPath = resolve(snapDir, `${locale.code}.html`)
  if (!existsSync(snapPath)) {
    console.error(`Missing snapshot for locale ${locale.code}: ${snapPath}`)
    console.error('Run npm run test:snapshots locally to refresh prerender snapshots.')
    process.exit(1)
  }
  const dir = resolve(distDir, locale.code)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'index.html'), withSeo(locale.code, readFileSync(snapPath, 'utf-8')))
}

writeFileSync(templatePath, withSeo(DEFAULT_LOCALE, readFileSync(resolve(snapDir, `${DEFAULT_LOCALE}.html`), 'utf-8')))

for (const route of PRIVATE_ROUTES) {
  const dir = resolve(distDir, route)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'index.html'), privateShell(route))
}

writeFileSync(
  resolve(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LOCALES.map((locale) => `  <url>
    <loc>${localeUrl(locale.code)}</loc>
${LOCALES.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${localeUrl(alt.code)}" />`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${localeUrl(DEFAULT_LOCALE)}" />
  </url>`).join('\n')}
</urlset>
`,
)

writeFileSync(
  resolve(distDir, 'robots.txt'),
  `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /conta
Disallow: /conta/
Disallow: /pagamento
Disallow: /pagamento/
Disallow: /login
Disallow: /login/
Disallow: /redefinir-senha
Disallow: /redefinir-senha/

Sitemap: ${SITE_URL}/sitemap.xml
`,
)

console.log(`SEO prerender complete: ${LOCALES.map((item) => `/${item.code}/`).join(', ')}`)
