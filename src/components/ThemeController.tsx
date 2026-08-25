import { useEffect } from 'react'
import { trpc } from '@/providers/trpc'
import { THEME_DEFAULTS, type ThemeConfig } from '@contracts/theme'

const CSS_VAR_MAP: Record<keyof Omit<ThemeConfig, 'headingFont' | 'bodyFont'>, string> = {
  primaryColor: '--theme-primary',
  secondaryColor: '--theme-secondary',
  accentColor: '--theme-accent',
  backgroundLight: '--theme-background-light',
  backgroundDark: '--theme-background-dark',
  textPrimary: '--theme-text-primary',
  textSecondary: '--theme-text-secondary',
  buttonColor: '--theme-button',
  buttonHoverColor: '--theme-button-hover',
}

function hexToHsl(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function applyThemeConfig(theme: ThemeConfig, root: HTMLElement = document.documentElement) {
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP) as [keyof typeof CSS_VAR_MAP, string][]) {
    root.style.setProperty(cssVar, hexToHsl(theme[key]))
  }
  root.style.setProperty('--font-heading', `'${theme.headingFont}'`)
  root.style.setProperty('--font-body', `'${theme.bodyFont}'`)
}

export default function ThemeController() {
  const theme = trpc.settings.theme.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  })

  useEffect(() => {
    applyThemeConfig(theme.data ?? THEME_DEFAULTS)
  }, [theme.data])

  return null
}
