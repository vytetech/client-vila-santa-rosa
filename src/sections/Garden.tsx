import { Flower2 } from 'lucide-react'
import { PublicPhoto } from '@/components/PublicPhoto'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { trpc } from '@/providers/trpc'
import { PHOTO_SLOTS } from '@contracts/site-photos'

const PHOTOS = [
  { src: '/images/jardim-1.webp', span: 'sm:col-span-2' },
  { src: '/images/jardim-2.webp', span: 'sm:col-span-2' },
  { src: '/images/jardim-3.webp', span: '' },
  { src: '/images/jardim-4.webp', span: '' },
  { src: '/images/jardim-7.webp', span: '' },
  { src: '/images/jardim-8.webp', span: '' },
  { src: '/images/jardim-5.webp', span: 'sm:col-span-2' },
  { src: '/images/jardim-6.webp', span: 'sm:col-span-2' },
]

export default function Garden() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()
  const dynamicPhotos = trpc.photos.list.useQuery(
    { slot: PHOTO_SLOTS.jardim },
    { staleTime: 30_000 },
  )
  const photos =
    dynamicPhotos.data && dynamicPhotos.data.length > 0
      ? dynamicPhotos.data.map((p, index) => ({
          src: p.path,
          alt: p.alt || d.garden.kicker,
          fallbackSrc: PHOTOS[index % PHOTOS.length].src,
          span: index % 6 === 0 || index % 6 === 1 ? 'sm:col-span-2' : '',
        }))
      : PHOTOS.map((p) => ({ ...p, alt: d.garden.kicker, fallbackSrc: p.src }))

  return (
    <section id="jardim" ref={ref} className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            <Flower2 className="h-4 w-4" /> {d.garden.kicker}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold leading-tight sm:text-5xl">
            {d.garden.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{d.garden.text}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {photos.map((p, i) => (
            <div
              key={p.src}
              className={`reveal group overflow-hidden rounded-2xl ${p.span}`}
              style={{ transitionDelay: `${(i % 4) * 60}ms` }}
            >
              <PublicPhoto
                src={p.src}
                fallbackSrc={p.fallbackSrc}
                alt={p.alt}
                data-photo-slot={PHOTO_SLOTS.jardim}
                loading="lazy"
                className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
