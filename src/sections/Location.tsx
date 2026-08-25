import { Suspense, lazy } from 'react'
import { MapPin, Waves, ShoppingCart, UtensilsCrossed, Pill, TreePine } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { SITE, SITE_ADDRESS_LINE } from '@/config/site'

const LocationMap = lazy(() => import('@/components/LocationMap'))

export default function Location() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()

  const cats = [
    { icon: ShoppingCart, data: d.location.cats.markets },
    { icon: UtensilsCrossed, data: d.location.cats.restaurants },
    { icon: Pill, data: d.location.cats.pharmacies },
  ]

  return (
    <section id="localizacao" ref={ref} className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text side */}
          <div className="reveal">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {d.location.kicker}
            </p>
            <h2 className="font-serif-display text-4xl font-semibold leading-tight sm:text-5xl">
              {d.location.title}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {d.location.text}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Waves className="h-4 w-4" /> {d.location.beachBadge}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                <TreePine className="h-4 w-4" /> {d.location.waterfallBadge}
              </span>
            </div>

            <p className="mt-8 flex items-start gap-3 rounded-2xl border bg-card p-5 text-sm leading-relaxed shadow-sm">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>
                <strong>{SITE.address.street}</strong>
                <br />
                {SITE_ADDRESS_LINE.replace(`${SITE.address.street} — `, '')}, Brasil
              </span>
            </p>
          </div>

          {/* Nearby commerce */}
          <div className="reveal space-y-5">
            {cats.map((cat) => (
              <div
                key={cat.data.title}
                className="flex items-center gap-5 rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <cat.icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif-display text-xl font-semibold">{cat.data.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {cat.data.items.join(' · ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Suspense fallback={null}>
          <LocationMap />
        </Suspense>
      </div>
    </section>
  )
}
