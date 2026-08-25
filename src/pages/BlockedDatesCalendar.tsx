import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, LockOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/providers/trpc'
import { useLanguage } from '@/i18n/LanguageContext'

type RoomId = 'luxo' | 'marrok' | 'sonhos'
const ROOMS: RoomId[] = ['luxo', 'marrok', 'sonhos']
const DAY_MS = 24 * 60 * 60 * 1000

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BlockedDatesCalendar() {
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
  const [feedback, setFeedback] = useState('')

  const from = toKey(month)
  const endMonth = new Date(month.getFullYear(), month.getMonth() + 2, 1)
  const to = toKey(endMonth)

  const blocked = trpc.availability.blockedDays.useQuery({ roomId, from, to })
  const block = trpc.availability.block.useMutation({
    onSuccess: (r) => {
      setFeedback(`✓ ${r.count}`)
      setTimeout(() => setFeedback(''), 2500)
      setSelected([])
      utils.availability.blockedDays.invalidate()
    },
    onError: (error) => setFeedback(error.message || 'Erro ao bloquear datas.'),
  })
  const unblock = trpc.availability.unblock.useMutation({
    onSuccess: () => {
      setSelected([])
      utils.availability.blockedDays.invalidate()
    },
    onError: (error) => setFeedback(error.message || 'Erro ao desbloquear data.'),
  })

  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 7)
    return Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(intlLocale, { weekday: 'narrow' }).format(
        new Date(base.getTime() + i * DAY_MS),
      ),
    )
  }, [intlLocale])

  const blockedSet = useMemo(() => new Set(blocked.data ?? []), [blocked.data])

  const toggleDay = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

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
            const isBlocked = blockedSet.has(key)
            const isSel = selected.includes(key)
            return (
              <button
                key={i}
                type="button"
                disabled={isPast}
                onClick={() => toggleDay(key)}
                className={[
                  'flex h-11 items-center justify-center rounded-md border text-sm transition-colors',
                  isPast
                    ? 'cursor-not-allowed border-transparent text-muted-foreground/30'
                    : isBlocked
                      ? 'border-red-400 bg-red-100 font-semibold text-red-700 line-through'
                      : isSel
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50',
                ].join(' ')}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const selectedBlocked = selected.filter((k) => blockedSet.has(k))
  const selectedOpen = selected.filter((k) => !blockedSet.has(k))

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="font-serif-display text-2xl font-semibold">{d.admin.blockedTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.admin.blockedHint}</p>

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

        {/* Month nav */}
        <div className="mt-5 flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
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
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            {d.admin.selectedDays}: <strong>{selected.length}</strong>
          </span>
          <Button
            onClick={() => block.mutate({ roomId, dates: selectedOpen })}
            disabled={selectedOpen.length === 0 || block.isPending}
            className="bg-destructive text-destructive-foreground"
          >
            <Lock className="me-2 h-4 w-4" />
            {feedback || d.admin.blockDates}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              for (const date of selectedBlocked) unblock.mutate({ roomId, date })
            }}
            disabled={selectedBlocked.length === 0 || unblock.isPending}
          >
            <LockOpen className="me-2 h-4 w-4" /> {d.admin.unblockDates}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
