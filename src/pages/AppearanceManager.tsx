import { useEffect, useMemo, useState } from 'react'
import { Palette, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/providers/trpc'
import {
  THEME_BODY_FONTS,
  THEME_COLOR_KEYS,
  THEME_DEFAULTS,
  THEME_HEADING_FONTS,
  isHexColor,
  type ThemeColorKey,
  type ThemeConfig,
} from '@contracts/theme'

const COLOR_LABELS: Record<ThemeColorKey, string> = {
  primaryColor: 'Cor principal',
  secondaryColor: 'Cor secundária',
  accentColor: 'Cor de destaque',
  backgroundLight: 'Cor de fundo claro',
  backgroundDark: 'Cor de fundo escuro',
  textPrimary: 'Cor de texto principal',
  textSecondary: 'Cor de texto secundário',
  buttonColor: 'Cor de botões',
  buttonHoverColor: 'Cor de botões hover',
}

function normalizeHex(value: string) {
  return value.startsWith('#') ? value.toUpperCase() : `#${value}`.toUpperCase()
}

export default function AppearanceManager() {
  const utils = trpc.useUtils()
  const theme = trpc.settings.theme.useQuery()
  const [form, setForm] = useState<ThemeConfig>(THEME_DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!theme.data || loaded) return
    setForm(theme.data)
    setLoaded(true)
  }, [theme.data, loaded])

  const invalidFields = useMemo(
    () => THEME_COLOR_KEYS.filter((key) => !isHexColor(form[key])),
    [form],
  )

  const save = trpc.settings.setTheme.useMutation({
    onSuccess: () => {
      setFeedback('✓ Salvo')
      utils.settings.theme.invalidate()
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  const reset = trpc.settings.resetTheme.useMutation({
    onSuccess: (data) => {
      setForm(data.theme)
      setFeedback('✓ Padrão restaurado')
      utils.settings.theme.invalidate()
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="flex items-center gap-2 font-serif-display text-2xl font-semibold">
          <Palette className="h-5 w-5 text-primary" /> Aparência
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajuste cores e fontes do site com valores controlados, sem CSS livre.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {THEME_COLOR_KEYS.map((key) => (
                <div key={key} className="space-y-2">
                  <Label>{COLOR_LABELS[key]}</Label>
                  <div className="flex gap-2">
                    <Input
                      aria-label={`${COLOR_LABELS[key]} seletor`}
                      type="color"
                      value={isHexColor(form[key]) ? form[key] : THEME_DEFAULTS[key]}
                      onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value.toUpperCase() }))}
                      className="h-10 w-14 shrink-0 p-1"
                    />
                    <Input
                      value={form[key]}
                      onChange={(e) => setForm((current) => ({ ...current, [key]: normalizeHex(e.target.value) }))}
                      className={isHexColor(form[key]) ? '' : 'border-destructive'}
                      placeholder="#D84B81"
                      dir="ltr"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fonte de títulos</Label>
                <select
                  value={form.headingFont}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      headingFont: e.target.value as ThemeConfig['headingFont'],
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {THEME_HEADING_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Fonte de textos/corpo</Label>
                <select
                  value={form.bodyFont}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      bodyFont: e.target.value as ThemeConfig['bodyFont'],
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {THEME_BODY_FONTS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {invalidFields.length > 0 && (
              <p className="text-sm font-medium text-destructive">
                Use cores no formato #RRGGBB.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={save.isPending || invalidFields.length > 0}
                onClick={() => save.mutate(form)}
              >
                <Save className="h-4 w-4" /> {feedback || 'Salvar alterações'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={reset.isPending}
                onClick={() => {
                  if (window.confirm('Restaurar a aparência padrão da Vila Santa Rosa?')) {
                    reset.mutate()
                  }
                }}
              >
                <RotateCcw className="h-4 w-4" /> Restaurar padrão
              </Button>
            </div>
          </div>

          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{
              backgroundColor: form.backgroundLight,
              color: form.textPrimary,
              fontFamily: `${form.bodyFont}, system-ui, sans-serif`,
            }}
          >
            <span
              className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${form.accentColor}33`, color: form.primaryColor }}
            >
              Prévia
            </span>
            <h3
              className="mt-4 text-3xl font-semibold leading-tight"
              style={{ fontFamily: `${form.headingFont}, Georgia, serif` }}
            >
              Vila Santa Rosa
            </h3>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: form.textSecondary }}>
              Um bloco de exemplo com título, texto, botão e badge para validar a identidade visual antes de salvar.
            </p>
            <button
              type="button"
              className="mt-5 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: form.buttonColor }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = form.buttonHoverColor
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = form.buttonColor
              }}
            >
              Reservar agora
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
