import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eraser, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/providers/trpc'
import { useLanguage } from '@/i18n/LanguageContext'

type RoomId = 'luxo' | 'marrok' | 'sonhos'
const ROOMS: RoomId[] = ['luxo', 'marrok', 'sonhos']
const DAY_MS = 24 * 60 * 60 * 1000

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MinNightsCalendar() {
  const { d, intlLocale } = useLanguage()
  const utils = trpc.useUtils()

  const [roomId, setRoomId] = useState<RoomId>('luxo')
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string[]>([])
  const [minInput, setMinInput] = useState('')
  const [maxInput, setMaxInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [defaultsForm, setDefaultsForm] = useState({ luxo: '', marrok: '', sonhos: '' })
  const [maxDefaultsForm, setMaxDefaultsForm] = useState({ luxo: '', marrok: '', sonhos: '' })
  const [defaultsSaved, setDefaultsSaved] = useState(false)
  const [maxDefaultsSaved, setMaxDefaultsSaved] = useState(false)

  const from = toKey(month)
  const endMonth = new Date(month.getFullYear(), month.getMonth() + 2, 1)
  const to = toKey(endMonth)

  const defaults = trpc.minNights.defaults.useQuery()
  const maxDefaults = trpc.minNights.maxDefaults.useQuery()
  const overrides = trpc.minNights.forWindow.useQuery({ roomId, from, to })
  const maxOverrides = trpc.minNights.maxForWindow.useQuery({ roomId, from, to })
  const defaultMin = defaults.data?.[roomId] ?? 2
  const defaultMax = maxDefaults.data?.[roomId] ?? 14

  const setRange = trpc.minNights.setRange.useMutation({
    onSuccess: (r) => {
      setFeedback(`✓ ${r.count}`)
      setTimeout(() => setFeedback(''), 2500)
      setSelected([])
      setMinInput('')
      utils.minNights.forWindow.invalidate()
    },
  })
  const clearOne = trpc.minNights.clear.useMutation({
    onSuccess: () => utils.minNights.forWindow.invalidate(),
  })
  const saveDefaults = trpc.minNights.setDefaults.useMutation({
    onSuccess: () => {
      setDefaultsSaved(true)
      setTimeout(() => setDefaultsSaved(false), 2500)
      utils.minNights.defaults.invalidate()
    },
  })
  const saveMaxDefaults = trpc.minNights.setMaxDefaults.useMutation({
    onSuccess: () => {
      setMaxDefaultsSaved(true)
      setTimeout(() => setMaxDefaultsSaved(false), 2500)
      utils.minNights.maxDefaults.invalidate()
    },
  })
  const setMaxRange = trpc.minNights.setMaxRange.useMutation({
    onSuccess: (r) => {
      setFeedback(`✓ ${r.count}`)
      setTimeout(() => setFeedback(''), 2500)
      setSelected([])
      setMaxInput('')
      utils.minNights.maxForWindow.invalidate()
    },
  })

  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 7) // a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(intlLocale, { weekday: 'narrow' }).format(
        new Date(base.getTime() + i * DAY_MS),
      ),
    )
  }, [intlLocale])

  const toggleDay = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  const applyMin = () => {
    const minNights = Math.round(Number(minInput))
    if (!minNights || minNights < 1 || selected.length === 0) return
    setRange.mutate({ roomId, dates: selected, minNights })
  }

  const applyMax = () => {
    const maxNights = Math.round(Number(maxInput))
    if (!maxNights || maxNights < 1 || selected.length === 0) return
    setMaxRange.mutate({ roomId, dates: selected, maxNights })
  }

  const renderMonth = (offset: 0 | 1) => {
    const first = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    const startWeekday = first.getDay()
    const cells: (Date | null)[] = [
      ...Array.from({ length: startWeekday }, () => null),
      ...Array.from(
        { length: daysInMonth },
        (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1),
      ),
    ]
    return (
      <div key={offset} className="min-w-[290px]">
        <h4 className="mb-2 text-center font-serif-display text-lg font-semibold capitalize">
          {new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric' }).format(first)}
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((w, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const key = toKey(day)
            const isPast = day.getTime() < today.getTime()
            const override = overrides.data?.[key]
            const value = override ?? defaultMin
            const maxValue = maxOverrides.data?.[key] ?? defaultMax
            const isSel = selected.includes(key)
            return (
              <button
                key={i}
                type="button"
                disabled={isPast}
                onClick={() => toggleDay(key)}
                className={[
                  'flex h-11 flex-col items-center justify-center rounded-md border text-xs transition-colors',
                  isPast
                    ? 'cursor-not-allowed border-transparent text-muted-foreground/30'
                    : isSel
                      ? 'border-primary bg-primary text-primary-foreground'
                      : override
                        ? 'border-teal-500 bg-teal-50 hover:bg-teal-100'
                        : 'border-border hover:border-primary/50',
                ].join(' ')}
              >
                <span className={isSel ? 'font-semibold' : ''}>{day.getDate()}</span>
                {!isPast && (
                  <span
                    className={[
                      'text-[10px] leading-tight',
                      isSel
                        ? 'text-primary-foreground/90'
                        : override
                          ? 'font-semibold text-teal-700'
                          : 'text-muted-foreground/70',
                    ].join(' ')}
                  >
                    {value}–{maxValue} {d.admin.nightsShort}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="font-serif-display text-2xl font-semibold">
          {d.admin.minNightsCalTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.admin.minNightsCalHint}</p>

        {/* Suite defaults */}
        <form
          className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveDefaults.mutate({
              luxo: Number(defaultsForm.luxo) || defaults.data?.luxo || 2,
              marrok: Number(defaultsForm.marrok) || defaults.data?.marrok || 2,
              sonhos: Number(defaultsForm.sonhos) || defaults.data?.sonhos || 2,
            })
          }}
        >
          <p className="w-full text-sm font-medium">{d.admin.minNightsDefaults}</p>
          {ROOMS.map((r) => (
            <div key={r} className="w-28 space-y-1">
              <Label htmlFor={`min-${r}`} className="text-xs capitalize">
                {d.rooms.items[r].name}
              </Label>
              <Input
                id={`min-${r}`}
                type="number"
                min="1"
                max="60"
                step="1"
                dir="ltr"
                value={defaultsForm[r]}
                onChange={(e) => setDefaultsForm({ ...defaultsForm, [r]: e.target.value })}
                placeholder={String(defaults.data?.[r] ?? 2)}
              />
            </div>
          ))}
          <Button
            type="submit"
            className="bg-primary text-primary-foreground"
            disabled={saveDefaults.isPending}
          >
            {defaultsSaved ? '✓' : d.admin.save}
          </Button>
        </form>

        {/* Suite maximum defaults (2–14 nights rule lives here) */}
        <form
          className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMaxDefaults.mutate({
              luxo: Number(maxDefaultsForm.luxo) || maxDefaults.data?.luxo || 14,
              marrok: Number(maxDefaultsForm.marrok) || maxDefaults.data?.marrok || 14,
              sonhos: Number(maxDefaultsForm.sonhos) || maxDefaults.data?.sonhos || 14,
            })
          }}
        >
          <p className="w-full text-sm font-medium">{d.admin.maxNightsDefaults}</p>
          {ROOMS.map((r) => (
            <div key={r} className="w-28 space-y-1">
              <Label htmlFor={`max-${r}`} className="text-xs capitalize">
                {d.rooms.items[r].name}
              </Label>
              <Input
                id={`max-${r}`}
                type="number"
                min="1"
                max="365"
                step="1"
                dir="ltr"
                value={maxDefaultsForm[r]}
                onChange={(e) => setMaxDefaultsForm({ ...maxDefaultsForm, [r]: e.target.value })}
                placeholder={String(maxDefaults.data?.[r] ?? 14)}
              />
            </div>
          ))}
          <Button
            type="submit"
            className="bg-primary text-primary-foreground"
            disabled={saveMaxDefaults.isPending}
          >
            {maxDefaultsSaved ? '✓' : d.admin.save}
          </Button>
        </form>

        {/* Suite selector */}
        <div className="mt-5 flex flex-wrap gap-2">
          {ROOMS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRoomId(r)
                setSelected([])
              }}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                roomId === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70',
              ].join(' ')}
            >
              {d.rooms.items[r].name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {d.admin.minNightsDefaultLabel}: <strong>{defaultMin}</strong> ·{' '}
          {d.admin.customDays}: <strong>{Object.keys(overrides.data ?? {}).length}</strong>
        </p>

        {/* Month navigation */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            disabled={month.getTime() <= new Date(today.getFullYear(), today.getMonth(), 1).getTime()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-8">
          {renderMonth(0)}
          {renderMonth(1)}
        </div>

        {/* Action bar — mínimo e máximo de noites para os dias selecionados */}
        <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border bg-muted/40 p-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {d.admin.selectedDays}: <strong>{selected.length}</strong>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="60"
                step="1"
                dir="ltr"
                placeholder={d.admin.minForSelected}
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                disabled={selected.length === 0}
              />
              <Input
                type="number"
                min="1"
                max="365"
                step="1"
                dir="ltr"
                placeholder={d.admin.maxForSelected}
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                disabled={selected.length === 0}
              />
            </div>
          </div>
          <Button
            onClick={applyMin}
            disabled={selected.length === 0 || !minInput || setRange.isPending}
            className="bg-primary text-primary-foreground"
          >
            <Save className="me-2 h-4 w-4" />
            {feedback || d.admin.applyMin}
          </Button>
          <Button
            onClick={applyMax}
            disabled={selected.length === 0 || !maxInput || setMaxRange.isPending}
            variant="secondary"
          >
            <Save className="me-2 h-4 w-4" />
            {feedback || d.admin.applyMax}
          </Button>
          {selected.length === 1 && overrides.data?.[selected[0]] && (
            <Button
              variant="outline"
              onClick={() => {
                clearOne.mutate({ roomId, date: selected[0] })
                setSelected([])
              }}
            >
              <Eraser className="me-2 h-4 w-4" /> {d.admin.clearPrice}
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{d.admin.minNightsOverrideNote}</p>
      </CardContent>
    </Card>
  )
}
