import { BarChart3, CalendarCheck, Moon, Wallet, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/providers/trpc'
import { useLanguage } from '@/i18n/LanguageContext'

export default function StatsDashboard() {
  const { d, intlLocale } = useLanguage()
  const stats = trpc.bookings.stats.useQuery(undefined, { refetchInterval: 30_000 })

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(v)
  const fmtNum = (v: number) => new Intl.NumberFormat(intlLocale).format(v)

  if (!stats.data) {
    return <p className="text-sm text-muted-foreground">…</p>
  }
  const s = stats.data

  const cards = [
    { Icon: CalendarCheck, label: d.admin.statsTotal, value: fmtNum(s.total) },
    { Icon: Clock, label: d.admin.statsPending, value: fmtNum(s.pending) },
    { Icon: Moon, label: d.admin.statsNights, value: fmtNum(s.bookedNights) },
    { Icon: Wallet, label: d.admin.statsRevenue, value: fmtMoney(s.revenue) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-serif-display text-xl font-semibold">
          <BarChart3 className="h-5 w-5 text-primary" /> {d.admin.statsTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{d.admin.statsHint}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <c.Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-2xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-serif-display text-lg font-semibold">
            {d.admin.statsMonthly}
          </h3>
          {s.monthly.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{d.admin.statsEmpty}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pe-4 text-start">{d.admin.statsMonth}</th>
                    <th className="py-2 pe-4 text-start">{d.admin.statsBookings}</th>
                    <th className="py-2 pe-4 text-start">{d.admin.statsNights}</th>
                    <th className="py-2 text-start">{d.admin.statsRevenue}</th>
                  </tr>
                </thead>
                <tbody>
                  {s.monthly.map((m) => (
                    <tr key={m.month} className="border-b last:border-0">
                      <td className="py-2.5 pe-4 font-medium">{m.month}</td>
                      <td className="py-2.5 pe-4">{fmtNum(m.bookings)}</td>
                      <td className="py-2.5 pe-4">{fmtNum(m.nights)}</td>
                      <td className="py-2.5 font-semibold text-primary">
                        {fmtMoney(m.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
