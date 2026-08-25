import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'

export default function Faq() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()
  const [open, setOpen] = useState<number | null>(0)
  const items = d.faq?.items ?? []
  if (!items.length) return null

  return (
    <section id="faq" ref={ref} className="bg-muted/50 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            <HelpCircle className="h-4 w-4" /> {d.faq.kicker}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold sm:text-5xl">
            {d.faq.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{d.faq.subtitle}</p>
        </div>

        <div className="reveal mt-12 space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-start"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif-display text-lg font-semibold">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
