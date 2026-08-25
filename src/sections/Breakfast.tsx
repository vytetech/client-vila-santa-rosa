import { Coffee, Croissant, EggFried, Sparkles } from 'lucide-react'
import { PublicPhoto } from '@/components/PublicPhoto'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { trpc } from '@/providers/trpc'
import { buildBreakfastPhotos } from '@contracts/breakfast-photos'
import { BREAKFAST_DEFAULTS, resolveBreakfastLocale } from '@contracts/breakfast-content'
import { resolvePhotoCaption } from '@contracts/photo-captions'
import { PHOTO_SLOTS } from '@contracts/site-photos'

const FALLBACK_IMAGES = ['/images/cafe-1.webp', '/images/cafe-5.webp', '/images/cafe-3.webp']

export default function Breakfast() {
  const ref = useReveal<HTMLElement>()
  const { locale } = useLanguage()
  const content = trpc.settings.breakfast.useQuery(undefined, {
    staleTime: 15_000,
    retry: false,
  })
  const cafePhotos = trpc.photos.list.useQuery({ slot: PHOTO_SLOTS.cafe }, { staleTime: 30_000 })
  const captions = trpc.settings.photoCaptions.useQuery(undefined, { staleTime: 30_000 })
  const saved = content.data ?? BREAKFAST_DEFAULTS
  const resolved = resolveBreakfastLocale(saved, locale)
  const photos = buildBreakfastPhotos({
    dynamicPhotos: cafePhotos.data ?? [],
    fallbackImages: FALLBACK_IMAGES,
    fallbackAlt: resolved.imageAlt || 'Café da manhã da Vila Santa Rosa',
  })
  const [mainPhoto, ...galleryPhotos] = photos
  const mainCaption = resolvePhotoCaption(captions.data ?? {}, mainPhoto?.id, locale)
  const icons = [Coffee, Croissant, EggFried]
  const badges = resolved.badges.map((label, index) => ({ Icon: icons[index % icons.length], label }))

  if (saved.enabled === false) return null

  return (
    <section id="cafe-da-manha" ref={ref} className="bg-muted/40 py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-8">
        <div className="reveal order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-2xl shadow-xl">
            <PublicPhoto
              src={mainPhoto?.src ?? FALLBACK_IMAGES[0]}
              fallbackSrc={FALLBACK_IMAGES[0]}
              alt={mainPhoto?.alt || 'Café da manhã da Vila Santa Rosa'}
              data-photo-slot={PHOTO_SLOTS.cafe}
              className="aspect-[4/3] w-full object-cover sm:aspect-[5/4]"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-5 text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                {resolved.note}
              </span>
            </div>
          </div>
          {mainCaption && (
            <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
              {mainCaption}
            </p>
          )}

          {galleryPhotos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {galleryPhotos.map((photo) => {
                const caption = resolvePhotoCaption(captions.data ?? {}, photo.id, locale)
                return (
                  <figure key={photo.key} className="min-w-0">
                    <PublicPhoto
                      src={photo.src}
                      fallbackSrc={photo.fallbackSrc}
                      alt={photo.alt || 'Café da manhã da Vila Santa Rosa'}
                      data-photo-slot={PHOTO_SLOTS.cafe}
                      className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md"
                      loading="lazy"
                    />
                    {caption && (
                      <figcaption className="mt-2 text-center text-xs font-medium text-muted-foreground">
                        {caption}
                      </figcaption>
                    )}
                  </figure>
                )
              })}
            </div>
          )}
        </div>

        <div className="reveal order-1 lg:order-2">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            <Coffee className="h-4 w-4" /> {resolved.label}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold leading-tight sm:text-5xl">
            {resolved.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {resolved.description}
          </p>
          {resolved.hours && (
            <p className="mt-5 inline-flex items-center rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              {resolved.hours}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {badges.map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              >
                <Icon className="h-4 w-4" /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
