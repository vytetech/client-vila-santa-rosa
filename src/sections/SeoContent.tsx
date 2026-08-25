import { SEO_COPY } from '@/config/seoCopy'
import { useLanguage } from '@/i18n/LanguageContext'

export default function SeoContent() {
  const { locale } = useLanguage()
  const copy = SEO_COPY[locale]

  return (
    <section className="bg-muted/40 py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article>
          <h2 className="font-serif-display text-3xl font-semibold sm:text-4xl">
            {copy.localTitle}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{copy.localLead}</p>
        </article>
        <article>
          <h2 className="font-serif-display text-3xl font-semibold sm:text-4xl">
            {copy.natureTitle}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{copy.natureText}</p>
        </article>
      </div>
    </section>
  )
}
