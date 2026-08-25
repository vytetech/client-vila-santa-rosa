import { Car, Check, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { WHATSAPP_PRIMARY } from '@/data/rooms'

export default function Tours() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()

  const waUrl = `https://wa.me/${WHATSAPP_PRIMARY}?text=${encodeURIComponent(d.tours.whatsappMsg)}`

  return (
    <section id="passeios" ref={ref} className="bg-muted/40 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="reveal overflow-hidden rounded-3xl border bg-card shadow-lg">
          <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 p-8 sm:p-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {d.tours.kicker}
            </p>
            <div className="flex items-start gap-4">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 sm:flex">
                <Car className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="font-serif-display text-3xl font-semibold leading-tight sm:text-4xl">
                  {d.tours.title}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {d.tours.text}
                </p>
              </div>
            </div>

            <ul className="mt-6 grid gap-2 sm:grid-cols-3">
              {d.tours.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm font-medium">
                  <Check className="h-4 w-4 shrink-0 text-primary" /> {h}
                </li>
              ))}
            </ul>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['/images/castelhanos-1.webp', '/images/castelhanos-2.webp', '/images/castelhanos-3.webp', '/images/castelhanos-4.webp'].map((src) => (
                <div key={src} className="overflow-hidden rounded-2xl shadow">
                  <img src={src} alt="Praia dos Castelhanos" className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-start gap-4 border-t border-primary/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {d.tours.note}
              </p>
              <Button asChild size="lg" className="shrink-0 bg-[#25D366] text-white hover:bg-[#20bd5a]">
                <a href={waUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="me-2 h-5 w-5" /> {d.tours.cta}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
