import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eraser, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/providers/trpc'
import { useLanguage } from '@/i18n/LanguageContext'

type RoomId = 'luxo' | 'marrok' | 'sonhos'
const ROOMS: RoomId[] = ['luxo', 'marrok', 'sonhos']
const DAY_MS = 24 * 60 * 60 * 1000

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PriceCalendar() {
  const { d, intlLocale } = useLanguage()
  const utils = trpc.useUtils()
  const pricing = trpc.settings.pricing.useQuery()

  const [roomId, setRoomId] = useState<RoomId>('luxo')
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string[]>([])
  const [priceInput, setPriceInput] = useState('')
  const [feedback, setFeedback] = useState('')

  const from = toKey(month)
  const endMonth = new Date(month.getFullYear(), month.getMonth() + 2, 1)
  const to = toKey(endMonth)

  const overrides = trpc.datePrices.forMonth.useQuery({ roomId, from, to })
  const defaultNightly = pricing.data?.suitePrices?.[roomId] ?? 0

  const setRange = trpc.datePrices.setRange.useMutation({
    onSuccess: (r) => {
      setFeedback(`✓ ${r.count}`)
      setTimeout(() => setFeedback(''), 2500)
      setSelected([])
      setPriceInput('')
      utils.datePrices.forMonth.invalidate()
    },
  })
  const clearOne = trpc.datePrices.clear.useMutation({
    onSuccess: () => utils.datePrices.forMonth.invalidate(),
  })

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(v)

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

  const applyPrice = () => {
    const price = Math.round(Number(priceInput))
    if (!price || price <= 0 || selected.length === 0) return
    setRange.mutate({ roomId, dates: selected, price })
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
            const price = override ?? defaultNightly
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
                        ? 'border-amber-400 bg-amber-50 hover:bg-amber-100'
                        : 'border-border hover:border-primary/50',
                ].join(' ')}
              >
                <span className={isSel ? 'font-semibold' : ''}>{day.getDate()}</span>
                {!isPast && price > 0 && (
                  <span
                    className={[
                      'text-[10px] leading-tight',
                      isSel
                        ? 'text-primary-foreground/90'
                        : override
                          ? 'font-semibold text-amber-700'
                          : 'text-muted-foreground/70',
                    ].join(' ')}
                  >
                    {Math.round(price)}
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
          {d.admin.priceCalendarTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.admin.priceCalendarHint}</p>

        {/* Suite selector */}
        <div className="mt-4 flex flex-wrap gap-2">
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
          {d.admin.defaultNightly}: <strong>{fmtMoney(defaultNightly)}</strong> ·{' '}
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

        {/* Action bar */}
        <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border bg-muted/40 p-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {d.admin.selectedDays}: <strong>{selected.length}</strong>
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              dir="ltr"
              placeholder={d.admin.priceForSelected}
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              disabled={selected.length === 0}
            />
          </div>
          <Button
            onClick={applyPrice}
            disabled={selected.length === 0 || !priceInput || setRange.isPending}
            className="bg-primary text-primary-foreground"
          >
            <Save className="me-2 h-4 w-4" />
            {feedback || d.admin.applyPrice}
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
        <p className="mt-2 text-xs text-muted-foreground">{d.admin.overrideNote}</p>
      </CardContent>
    </Card>
  )
}
