import { ChevronDown, MapPin, HeartHandshake, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PublicPhoto } from '@/components/PublicPhoto'
import { SEO_COPY } from '@/config/seoCopy'
import { useLanguage } from '@/i18n/LanguageContext'
import { trpc } from '@/providers/trpc'
import { PHOTO_SLOTS } from '@contracts/site-photos'

const FALLBACK_HERO_IMAGE = '/images/hero-real.webp'

export default function Hero() {
  const { d, locale } = useLanguage()
  const seo = SEO_COPY[locale]
  const photos = trpc.photos.list.useQuery({ slot: PHOTO_SLOTS.hero }, { staleTime: 30_000 })
  const heroPhoto = photos.data?.[0]
  const heroImage = heroPhoto?.path ?? FALLBACK_HERO_IMAGE

  return (
    <section id="inicio" className="relative flex min-h-screen items-center justify-center">
      <PublicPhoto
        src={heroImage}
        fallbackSrc={FALLBACK_HERO_IMAGE}
        alt={heroPhoto?.alt || 'Vila Santa Rosa'}
        fetchPriority="high"
        width={1920}
        height={1080}
        data-photo-slot={PHOTO_SLOTS.hero}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: 'center 42%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-16 text-center text-white">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.35em] text-amber-200">
          {d.hero.tagline}
        </p>
        <h1 className="font-serif-display text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">
          {seo.h1}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/90 sm:text-xl">
          {d.hero.subtitle}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm text-white/90 backdrop-blur">
            <MapPin className="h-4 w-4 shrink-0 text-amber-300" />
            {d.hero.locationLine}
          </span>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
          >
            <a href="#reservas">{d.hero.ctaPrimary}</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/70 bg-white/10 px-8 text-base text-white backdrop-blur hover:bg-white/20 hover:text-white"
          >
            <a href="#acomodacoes">{d.hero.ctaSecondary}</a>
          </Button>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-400/15 px-6 py-2.5 text-sm font-semibold text-amber-100 backdrop-blur">
            <HeartHandshake className="h-4 w-4 text-amber-300" />
            {d.hero.discountBadge}
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-light tracking-wide text-white/75">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {d.hero.exclusivePerks}
          </span>
        </div>
      </div>

      <a
        href="#pousada"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/80"
        aria-label="Scroll"
      >
        <ChevronDown className="h-8 w-8" />
      </a>
    </section>
  )
}
