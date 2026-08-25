import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { PublicPhoto } from '@/components/PublicPhoto'
import { trpc } from '@/providers/trpc'
import { createGalleryItems } from '@contracts/gallery-photos'
import { PHOTO_SLOTS } from '@contracts/site-photos'

export default function Gallery() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()
  const dynamicPhotos = trpc.photos.list.useQuery(
    { slot: PHOTO_SLOTS.galeria },
    { staleTime: 30_000 },
  )

  const fallbackPhotos = [
    { src: '/images/jardim-1.webp', alt: d.gallery.alts.garden, span: 'sm:col-span-2 sm:row-span-2' },
    { src: '/images/jardim-2.webp', alt: d.gallery.alts.garden },
    { src: '/images/suite-luxo-4.webp', alt: d.gallery.alts.suite },
    { src: '/images/cafe-1.webp', alt: d.gallery.alts.breakfast },
    { src: '/images/cafe-5.webp', alt: d.gallery.alts.breakfast, span: 'sm:row-span-2' },
    { src: '/images/cafe-3.webp', alt: d.gallery.alts.breakfast },
    { src: '/images/suite-luxo-2.webp', alt: d.gallery.alts.suite },
    { src: '/images/jardim-4.webp', alt: d.gallery.alts.garden },
    { src: '/images/marrok-6.webp', alt: d.gallery.alts.double },
    { src: '/images/marrok-1.webp', alt: d.gallery.alts.double },
    { src: '/images/marrok-11.webp', alt: d.gallery.alts.double },
    { src: '/images/marrok-9.webp', alt: d.gallery.alts.double },
    { src: '/images/suite-luxo-3.webp', alt: d.gallery.alts.suite },
    { src: '/images/sonhos-1.webp', alt: d.gallery.alts.family },
    { src: '/images/sonhos-4.webp', alt: d.gallery.alts.family },
    { src: '/images/suite-luxo-1.webp', alt: d.gallery.alts.suite },
    { src: '/images/cafe-2.webp', alt: d.gallery.alts.breakfast },
    { src: '/images/marrok-5.webp', alt: d.gallery.alts.double },
    { src: '/images/marrok-8.webp', alt: d.gallery.alts.double },
    { src: '/images/sonhos-3.webp', alt: d.gallery.alts.family },
    { src: '/images/cafe-4.webp', alt: d.gallery.alts.breakfast },
  ]
  const photos = createGalleryItems(dynamicPhotos.data, fallbackPhotos, 'Vila Santa Rosa')

  return (
    <section id="galeria" ref={ref} className="bg-secondary/5 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {d.gallery.kicker}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold sm:text-5xl">
            {d.gallery.title}
          </h2>
        </div>

        <div className="reveal mt-14 grid auto-rows-[180px] grid-cols-1 gap-4 sm:grid-cols-3 sm:auto-rows-[220px]">
          {photos.map((p) => (
            <div
              key={p.src + p.alt}
              className={`group relative overflow-hidden rounded-2xl ${p.span ?? ''}`}
            >
              <PublicPhoto
                src={p.src}
                fallbackSrc={p.fallbackSrc}
                alt={p.alt}
                width={800}
                height={600}
                loading="lazy"
                data-photo-slot={PHOTO_SLOTS.galeria}
                data-photo-source={p.source}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
              <p className="absolute bottom-3 start-4 translate-y-2 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {p.alt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
