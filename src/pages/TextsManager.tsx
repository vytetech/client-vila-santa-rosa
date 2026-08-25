import { useEffect, useMemo, useState } from 'react'
import { Save, Search, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/providers/trpc'
import { useLanguage } from '@/i18n/LanguageContext'
import { translations, type Locale } from '@/i18n/translations'

type Entry = { key: string; original: string; current: string }

function flatten(obj: unknown, prefix: string, out: Entry[], overrides: Record<string, string>) {
  if (typeof obj !== 'object' || obj === null) return
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') {
      out.push({ key: path, original: v, current: overrides[path] ?? '' })
    } else {
      flatten(v, path, out, overrides)
    }
  }
}

const LOCALES: { id: Locale; label: string }[] = [
  { id: 'pt', label: 'Português' },
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
  { id: 'fr', label: 'Français' },
  { id: 'zh', label: '中文' },
  { id: 'ja', label: '日本語' },
]

export default function TextsManager() {
  const { d } = useLanguage()
  const utils = trpc.useUtils()

  const textsQ = trpc.settings.texts.useQuery()
  const [loc, setLoc] = useState<Locale>('pt')
  const [search, setSearch] = useState('')
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const overrides = useMemo(() => {
    const all = textsQ.data ?? {}
    const prefix = `${loc}.`
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(all)) {
      if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v
    }
    return out
  }, [textsQ.data, loc])

  const entries = useMemo(() => {
    const out: Entry[] = []
    flatten(translations[loc], '', out, overrides)
    return out
  }, [loc, overrides])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return entries.filter(
        (e) =>
          overrides[e.key] !== undefined ||
          e.key.startsWith('hero.') ||
          e.key.startsWith('about.') ||
          e.key === 'hosts.items.0.bio',
      )
    }
    return entries.filter(
      (e) => e.key.toLowerCase().includes(q) || e.original.toLowerCase().includes(q),
    )
  }, [entries, search, overrides])

  useEffect(() => {
    setEdits({})
  }, [loc])

  const setTexts = trpc.settings.setTexts.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      setEdits({})
      utils.settings.texts.invalidate()
    },
  })

  const save = () => {
    const all = { ...(textsQ.data ?? {}) }
    for (const [path, value] of Object.entries(edits)) {
      const full = `${loc}.${path}`
      if (value === '' || value === entries.find((e) => e.key === path)?.original) {
        delete all[full]
      } else {
        all[full] = value
      }
    }
    setTexts.mutate({ overrides: all })
  }

  const resetOne = (path: string) => setEdits({ ...edits, [path]: '' })

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="font-serif-display text-2xl font-semibold">{d.admin.textsTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.admin.textsHint}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {LOCALES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLoc(l.id)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                loc === l.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              ].join(' ')}
            >
              {l.label}
            </button>
          ))}
          <div className="relative ms-auto">
            <Search className="absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-56 ps-8"
              placeholder={d.admin.textsSearch}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pe-2">
          {filtered.map((e) => {
            const edited = edits[e.key] ?? overrides[e.key] ?? ''
            const isOverridden = overrides[e.key] !== undefined
            return (
              <div key={e.key} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-[11px] text-muted-foreground">{e.key}</code>
                  {isOverridden && (
                    <button
                      type="button"
                      onClick={() => resetOne(e.key)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" /> {d.admin.textsReset}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground/80">{e.original}</p>
                <Textarea
                  className="mt-2 text-sm"
                  rows={e.original.length > 120 ? 3 : 1}
                  placeholder={e.original}
                  value={edited}
                  onChange={(ev) => setEdits({ ...edits, [e.key]: ev.target.value })}
                />
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">{d.admin.photosEmpty}</p>
          )}
        </div>

        <Button
          className="mt-4 bg-primary text-primary-foreground"
          disabled={Object.keys(edits).length === 0 || setTexts.isPending}
          onClick={save}
        >
          <Save className="me-2 h-4 w-4" />
          {saved ? '✓' : d.admin.save}
        </Button>
      </CardContent>
    </Card>
  )
}
