import { HeartHandshake, ShieldCheck, Car, Baby, MoonStar, DoorOpen } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'

const ICONS = [HeartHandshake, Baby, Car, ShieldCheck, MoonStar, DoorOpen]

export default function Rules() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()

  return (
    <section ref={ref} className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {d.rules.kicker}
          </p>
          <h2 className="font-serif-display text-3xl font-semibold sm:text-4xl">
            {d.rules.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.rules.items.map((item, i) => {
            const Icon = ICONS[i]
            return (
              <div
                key={item.title}
                className="reveal rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 font-serif-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
