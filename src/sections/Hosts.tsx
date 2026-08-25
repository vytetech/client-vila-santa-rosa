import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'

const HOST_IMAGE = '/images/host-domingos-real.webp'

export default function Hosts() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()
  const host = d.hosts.items[0]
  if (!host) return null

  return (
    <section id="anfitrioes" ref={ref} className="bg-muted/50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {d.hosts.kicker}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold sm:text-5xl">
            {d.hosts.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{d.hosts.text}</p>
        </div>

        <div className="mx-auto mt-14 max-w-sm">
          <div className="reveal group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-xl">
            <div className="overflow-hidden">
              <img
                src={HOST_IMAGE}
                alt={host.name}
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="font-serif-display text-2xl font-semibold">{host.name}</h3>
              <p className="mt-1 text-sm font-semibold text-primary">{host.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{host.bio}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
