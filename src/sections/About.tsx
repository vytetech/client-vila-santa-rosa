import { PublicPhoto } from '@/components/PublicPhoto'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { trpc } from '@/providers/trpc'
import { PHOTO_SLOTS } from '@contracts/site-photos'

const FALLBACK_CAFE_IMAGE = '/images/cafe-1.webp'

export default function About() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()
  const cafePhotos = trpc.photos.list.useQuery({ slot: PHOTO_SLOTS.cafe }, { staleTime: 30_000 })
  const cafeImage = cafePhotos.data?.[0]?.path ?? FALLBACK_CAFE_IMAGE
  const cafeAlt = cafePhotos.data?.[0]?.alt || d.about.altBreakfast

  return (
    <section id="pousada" ref={ref} className="py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="reveal relative">
          <img
            src="/images/jardim-2.webp"
            alt={d.about.altGarden}
            width={1200}
            height={900}
            loading="lazy"
            className="w-full rounded-2xl object-cover shadow-xl"
          />
          <PublicPhoto
            src={cafeImage}
            fallbackSrc={FALLBACK_CAFE_IMAGE}
            alt={cafeAlt}
            width={640}
            height={480}
            loading="lazy"
            data-photo-slot={PHOTO_SLOTS.cafe}
            className="absolute -bottom-10 -end-4 hidden w-2/5 rounded-2xl border-8 border-background object-cover shadow-2xl sm:block lg:-end-10"
          />
        </div>

        <div className="reveal">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {d.about.kicker}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold leading-tight sm:text-5xl">
            {d.about.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{d.about.p1}</p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{d.about.p2}</p>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80 italic">{d.about.p3}</p>

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {d.about.stats.map((s) => (
              <div key={s.label} className="text-center sm:text-start">
                <p className="font-serif-display text-4xl font-semibold text-primary">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
