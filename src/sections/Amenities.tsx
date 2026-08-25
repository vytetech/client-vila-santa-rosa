import {
  Coffee,
  GlassWater,
  Wifi,
  Flower2,
  Armchair,
  Martini,
  ShowerHead,
  PawPrint,
  Sparkles,
  BedDouble,
  KeyRound,
  HandHeart,
} from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'

const ICONS = [
  Coffee,
  GlassWater,
  Wifi,
  Flower2,
  Armchair,
  Martini,
  ShowerHead,
  PawPrint,
  Sparkles,
  BedDouble,
  KeyRound,
  HandHeart,
]

export default function Amenities() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()

  return (
    <section id="comodidades" ref={ref} className="bg-muted/50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {d.amenities.kicker}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold sm:text-5xl">
            {d.amenities.title}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {d.amenities.items.map((a, i) => {
            const Icon = ICONS[i]
            return (
              <div
                key={a.title}
                className="reveal rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-serif-display text-xl font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
