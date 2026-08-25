import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Star, Quote, ShieldCheck, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { trpc } from '@/providers/trpc'

type TestimonialCard = {
  id: string
  name: string
  text: string
  rating: number
  source: 'site' | 'booking'
}

function getVisibleCount(width: number) {
  if (width >= 1024) return 3
  if (width >= 640) return 2
  return 1
}

function useVisibleTestimonials() {
  const [visible, setVisible] = useState(3)

  useEffect(() => {
    const update = () => setVisible(getVisibleCount(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return visible
}

export default function Testimonials() {
  const ref = useReveal<HTMLElement>()
  const { d, intlLocale } = useLanguage()
  const visibleCount = useVisibleTestimonials()
  const [pageStart, setPageStart] = useState(0)
  // Approved admin reviews feed the public testimonials section.
  const highlights = trpc.reviews.publicList.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  })
  const pricing = trpc.settings.pricing.useQuery(undefined, { staleTime: 60_000, retry: false })
  const bookingScore = pricing.data?.bookingRating ?? 9.9

  const dbItems = useMemo(() => highlights.data ?? [], [highlights.data])
  const useDb = dbItems.length > 0
  const testimonials = useMemo<TestimonialCard[]>(
    () =>
      useDb
        ? dbItems.map((r) => ({
            id: String(r.id),
            name: r.authorName,
            text: r.text,
            rating: r.rating,
            source: r.source,
          }))
        : d.testimonials.items.map((t, index) => ({
            id: `fallback-${index}-${t.name}`,
            name: t.name,
            text: t.text,
            rating: 5,
            source: 'site',
          })),
    [d.testimonials.items, dbItems, useDb],
  )
  const maxStart = Math.max(0, testimonials.length - visibleCount)
  const showControls = testimonials.length > visibleCount
  const currentStart = Math.min(pageStart, maxStart)

  useEffect(() => {
    setPageStart((current) => Math.min(current, maxStart))
  }, [maxStart])

  const fmtScore = (v: number) =>
    new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1 }).format(v)

  const goPrevious = () => setPageStart((current) => Math.max(0, current - visibleCount))
  const goNext = () => setPageStart((current) => Math.min(maxStart, current + visibleCount))

  return (
    <section ref={ref} className="bg-primary py-14 text-primary-foreground sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="mx-auto max-w-2xl text-center sm:mx-0 sm:text-left">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
              {d.testimonials.kicker}
            </p>
            <h2 className="font-serif-display text-4xl font-semibold sm:text-5xl">
              {d.testimonials.title}
            </h2>
          </div>
          {showControls && (
            <div className="flex justify-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Depoimentos anteriores"
                onClick={goPrevious}
                disabled={currentStart === 0}
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Próximos depoimentos"
                onClick={goNext}
                disabled={currentStart >= maxStart}
                className="border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          )}
        </div>

        <div className="mt-14 overflow-hidden" data-testid="testimonials-carousel">
          <div
            className="flex flex-nowrap gap-6 transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(calc(-${currentStart} * ((100% - ${(visibleCount - 1) * 1.5}rem) / ${visibleCount} + 1.5rem)))`,
            }}
          >
            {testimonials.map((item) => (
              <Card
                key={item.id}
                className="shrink-0 border-0 bg-white/10 text-white backdrop-blur"
                style={{
                  flexBasis: `calc((100% - ${(visibleCount - 1) * 1.5}rem) / ${visibleCount})`,
                }}
              >
                <CardContent className="flex h-full min-h-[330px] flex-col p-7">
                  <Quote className="h-8 w-8 text-amber-300 rtl:-scale-x-100" />
                  {item.source === 'booking' ? (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-lg bg-amber-300 px-2.5 py-1 text-sm font-bold text-primary">
                        {fmtScore(item.rating)}
                      </span>
                      <span className="text-xs font-medium text-white/70">
                        {d.testimonials.bookingBadge}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex gap-0.5 text-amber-300">
                        {Array.from({ length: Math.min(5, Math.round(item.rating)) }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </span>
                      <span className="text-xs font-medium text-white/70">
                        {d.testimonials.bookingBadge}
                      </span>
                    </div>
                  )}
                  <p className="mt-4 line-clamp-6 leading-relaxed text-white/90">“{item.text}”</p>
                  <div className="mt-auto pt-6">
                    <p className="font-serif-display text-lg font-semibold">{item.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {showControls && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: Math.ceil(testimonials.length / visibleCount) }).map((_, index) => {
                const active = currentStart >= index * visibleCount && currentStart < (index + 1) * visibleCount
                return (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Página ${index + 1} de depoimentos`}
                    onClick={() => setPageStart(Math.min(maxStart, index * visibleCount))}
                    className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${
                      active ? 'w-8 bg-amber-300' : 'w-2.5 bg-white/35 hover:bg-white/60'
                    }`}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Trust badges — verified profiles + secure booking */}
        <div className="reveal mt-14 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://www.booking.com/Share-SoWwmX"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
          >
            <span className="rounded-md bg-amber-300 px-2 py-0.5 text-xs font-bold text-primary">
              {fmtScore(bookingScore)}
            </span>
            Booking.com
            <ExternalLink className="h-3.5 w-3.5 text-white/60" />
          </a>
          <a
            href="https://share.google/7i3g3P3B21kVGU78l"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
          >
            <span className="flex gap-0.5 text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </span>
            Google Reviews
            <ExternalLink className="h-3.5 w-3.5 text-white/60" />
          </a>
          <span className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-3 text-sm font-medium backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            {d.testimonials.secureBooking}
          </span>
        </div>

      </div>
    </section>
  )
}
