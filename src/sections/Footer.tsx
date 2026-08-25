import { MapPin, Phone, Smartphone } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/hooks/useSite'
import { SITE, SITE_ADDRESS_LINE } from '@/config/site'

export default function Footer() {
  const { d } = useLanguage()
  const site = useSite()

  return (
    <footer className="bg-secondary py-14 text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <img src={SITE.logo} alt="Vila Santa Rosa" width={180} height={54} className="h-9 w-auto" />
              <span className="font-serif-display text-2xl font-semibold">
                Vila Santa Rosa
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              {d.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-amber-200">
              {d.footer.contactTitle}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={SITE.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-200 hover:underline"
                >
                  {SITE_ADDRESS_LINE}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span dir="ltr">{SITE.phones.primary}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span dir="ltr">{SITE.phones.secondary}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-amber-200">
              {d.footer.followTitle}
            </h3>
            <p className="mt-4 text-sm text-white/60">{d.footer.hours}</p>
            {site.tudoAppUrl && (
              <a
                href={site.tudoAppUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-200 hover:underline"
              >
                <Smartphone className="h-4 w-4" /> {d.footer.tudoApp}
              </a>
            )}
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/80">
                {d.footer.languagesTitle}
              </p>
              <p className="mt-1.5 text-sm text-white/70">{d.footer.languages}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/15 pt-6 text-center text-sm text-white/50">
          <p className="mb-3 font-serif-display text-lg text-amber-200">{d.footer.thanks}</p>©{' '}
          {new Date().getFullYear()} {d.footer.rights}
          <p className="mt-2 text-xs text-white/45">
            Desenvolvido por{' '}
            <a
              href="https://vytetech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-amber-200/80 hover:text-amber-200 hover:underline"
            >
              VyteTech
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
