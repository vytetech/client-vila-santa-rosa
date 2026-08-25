import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { translations, type Dict, type Locale } from './translations'
import { trpc } from '@/providers/trpc'

const STORAGE_KEY = 'vsr-locale'
const SUPPORTED: Locale[] = ['pt', 'es', 'en', 'ar', 'fr', 'zh', 'ja']
const SUPPORTED_SET = new Set<string>(SUPPORTED)

interface LanguageCtx {
  locale: Locale
  setLocale: (l: Locale) => void
  d: Dict
  dir: 'ltr' | 'rtl'
  /** e.g. pt-BR / es-ES / en-US / ar-EG — for Intl formatting */
  intlLocale: string
}

const INTL_LOCALES: Record<Locale, string> = {
  pt: 'pt-BR',
  es: 'es-ES',
  en: 'en-US',
  // Levantine Arabic → Shami month names (كانون الثاني، شباط، آذار…), Latin digits
  ar: 'ar-SY-u-nu-latn',
  fr: 'fr-FR',
  zh: 'zh-CN',
  ja: 'ja-JP',
}

const HTML_LANG: Record<Locale, string> = {
  pt: 'pt-BR',
  es: 'es',
  en: 'en',
  ar: 'ar',
  fr: 'fr',
  zh: 'zh-CN',
  ja: 'ja',
}

/**
 * Auto-detect the visitor's language from the device/browser.
 * Supported device languages win; anything else falls back to English
 * (owner's rule — e.g. an Italian phone sees the site in English).
 * A saved manual choice always takes priority.
 */
function detectLocale(): Locale {
  const pathLocale = window.location.pathname.split('/').filter(Boolean)[0] as Locale | undefined
  if (pathLocale && SUPPORTED.includes(pathLocale)) return pathLocale

  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && SUPPORTED.includes(saved)) return saved
  } catch {
    // localStorage unavailable
  }
  const navs: string[] =
    (navigator.languages as string[] | undefined) ??
    (navigator.language ? [navigator.language] : [])
  for (const raw of navs) {
    const n = (raw || '').toLowerCase()
    if (n.startsWith('pt')) return 'pt'
    if (n.startsWith('es')) return 'es'
    if (n.startsWith('ar')) return 'ar'
    if (n.startsWith('fr')) return 'fr'
    if (n.startsWith('zh')) return 'zh'
    if (n.startsWith('ja')) return 'ja'
    if (n.startsWith('en')) return 'en'
  }
  return 'en'
}

const Ctx = createContext<LanguageCtx>(null as unknown as LanguageCtx)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)
  const location = useLocation()
  const navigate = useNavigate()

  const setLocale = (l: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore
    }
    const segments = location.pathname.split('/').filter(Boolean)
    if (!segments.length || SUPPORTED_SET.has(segments[0])) {
      navigate(`/${l}/${location.hash}`, { replace: false })
    }
    setLocaleState(l)
  }

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale]
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  useEffect(() => {
    const pathLocale = location.pathname.split('/').filter(Boolean)[0] as Locale | undefined
    if (pathLocale && SUPPORTED.includes(pathLocale) && pathLocale !== locale) {
      setLocaleState(pathLocale)
      try {
        localStorage.setItem(STORAGE_KEY, pathLocale)
      } catch {
        // ignore
      }
    }
  }, [locale, location.pathname])

  // Textos editados pelo dono no painel admin — aplicados sobre os
  // textos padrão. Chave: "<locale>.<caminho>", ex.: "pt.hero.tagline".
  const overridesQ = trpc.settings.texts.useQuery(undefined, {
    refetchInterval: 15_000,
    retry: false,
  })

  const d = useMemo<Dict>(() => {
    const base = translations[locale]
    const overrides = overridesQ.data ?? {}
    const prefix = `${locale}.`
    const relevant = Object.entries(overrides).filter(([k]) => k.startsWith(prefix))
    if (!relevant.length) return base
    const clone = JSON.parse(JSON.stringify(base)) as Record<string, unknown>
    for (const [key, value] of relevant) {
      const path = key.slice(prefix.length).split('.')
      let node = clone
      for (let i = 0; i < path.length - 1; i++) {
        const next = node[path[i]]
        if (typeof next !== 'object' || next === null) break
        node = next as Record<string, unknown>
      }
      const leaf = path[path.length - 1]
      if (typeof node[leaf] === 'string') node[leaf] = value
    }
    return clone as unknown as Dict
  }, [locale, overridesQ.data])

  return (
    <Ctx.Provider
      value={{
        locale,
        setLocale,
        d,
        dir: locale === 'ar' ? 'rtl' : 'ltr',
        intlLocale: INTL_LOCALES[locale],
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useLanguage() {
  return useContext(Ctx)
}
