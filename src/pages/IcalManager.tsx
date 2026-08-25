import { useEffect, useState } from 'react'
import { RefreshCw, Save, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/providers/trpc'
import { useLanguage } from '@/i18n/LanguageContext'

type RoomId = 'luxo' | 'marrok' | 'sonhos'
const ROOMS: RoomId[] = ['luxo', 'marrok', 'sonhos']

type FormState = Record<RoomId, { url: string; enabled: boolean }>

export default function IcalManager() {
  const { d, intlLocale } = useLanguage()
  const utils = trpc.useUtils()

  const config = trpc.availability.icalConfig.useQuery()
  const status = trpc.availability.status.useQuery(undefined, { refetchInterval: 15_000 })
  const [form, setForm] = useState<FormState | null>(null)
  const [saved, setSaved] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (config.data && !form) setForm(config.data as FormState)
  }, [config.data, form])

  const save = trpc.availability.setIcalConfig.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      utils.availability.status.invalidate()
    },
  })
  const syncNow = trpc.availability.syncNow.useMutation({
    onSuccess: () => utils.availability.status.invalidate(),
  })

  const lastSync = status.data?.lastSync
    ? new Intl.DateTimeFormat(intlLocale, { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(status.data.lastSync),
      )
    : '—'

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="font-serif-display text-2xl font-semibold">{d.admin.icalTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.admin.icalHint}</p>

        <p className="mt-3 text-xs text-muted-foreground">
          {d.admin.icalLastSync}: <strong>{lastSync}</strong>
          {status.data?.rooms && (
            <>
              {' · '}
              {ROOMS.map((r) => `${r}: ${status.data!.rooms[r] ?? 0}`).join(' · ')}
            </>
          )}
        </p>

        {!form ? (
          <p className="mt-5 text-sm text-muted-foreground">…</p>
        ) : (
          <div className="mt-5 space-y-4">
            {ROOMS.map((room) => (
              <div key={room} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm font-semibold">{d.rooms.items[room].name}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {form[room].enabled ? d.admin.icalEnabled : d.admin.icalDisabled}
                    </span>
                    <Switch
                      checked={form[room].enabled}
                      onCheckedChange={(v) =>
                        setForm({ ...form, [room]: { ...form[room], enabled: v } })
                      }
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    dir="ltr"
                    placeholder="https://ical.booking.com/v1/export?t=…"
                    value={form[room].url}
                    onChange={(e) =>
                      setForm({ ...form, [room]: { ...form[room], url: e.target.value } })
                    }
                  />
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-primary text-primary-foreground"
                disabled={save.isPending}
                onClick={() => save.mutate(form)}
              >
                <Save className="me-2 h-4 w-4" />
                {saved ? '✓' : d.admin.save}
              </Button>
              <Button
                variant="outline"
                disabled={syncNow.isPending || syncing}
                onClick={() => {
                  setSyncing(true)
                  syncNow.mutate(undefined, { onSettled: () => setSyncing(false) })
                }}
              >
                <RefreshCw className={`me-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {d.admin.icalSyncNow}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
