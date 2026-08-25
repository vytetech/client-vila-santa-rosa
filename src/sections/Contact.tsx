import { useState } from 'react'
import { MapPin, Phone, Clock, CheckCircle2, MessageCircle, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useReveal } from '@/hooks/useReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { SITE } from '@/config/site'

const INFO_ICONS = [MapPin, Phone, Phone, Clock]

export default function Contact() {
  const ref = useReveal<HTMLElement>()
  const { d } = useLanguage()
  const [sent, setSent] = useState(false)
  const contactInfo = [
    {
      label: d.contact.info[0]?.label ?? 'Endereço',
      value: `${SITE.address.street} — ${SITE.address.neighborhood}, ${SITE.address.city}/${SITE.address.state}`,
    },
    { label: d.contact.info[1]?.label ?? 'WhatsApp', value: SITE.phones.primary },
    { label: d.contact.info[2]?.label ?? 'WhatsApp', value: SITE.phones.secondary },
    {
      label: d.contact.info[3]?.label ?? 'Check-in / Check-out',
      value: `${SITE.checkinTime}–00:00 / 04:00–${SITE.checkoutTime}`,
    },
  ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contato" ref={ref} className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {d.contact.kicker}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold sm:text-5xl">
            {d.contact.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{d.contact.subtitle}</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            {d.contact.askUs}
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-5">
          {/* Contact info */}
          <div className="reveal space-y-6 lg:col-span-2">
            {contactInfo.map((item, i) => {
              const Icon = INFO_ICONS[i]
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p
                      className="mt-0.5 font-medium"
                      dir={item.value.startsWith('+') ? 'ltr' : undefined}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              )
            })}

            <Button
              asChild
              size="lg"
              className="mt-4 w-full bg-[#25D366] text-white hover:bg-[#20bd5a] sm:w-auto"
            >
              <a
                href={`https://wa.me/${SITE.phones.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de informações sobre a Vila Santa Rosa.')}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="me-2 h-5 w-5" />
                {d.contact.whatsapp}
              </a>
            </Button>

            {/* Direct call buttons — especially handy on mobile */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button asChild size="lg" variant="outline" className="border-primary/40">
                <a href={`tel:${SITE.phones.primaryTel}`}>
                  <Phone className="me-2 h-4 w-4" /> {SITE.phones.primary.replace('+55 ', '')}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/40">
                <a href={`tel:${SITE.phones.secondaryTel}`}>
                  <Phone className="me-2 h-4 w-4" /> {SITE.phones.secondary.replace('+55 ', '')}
                </a>
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl shadow-lg">
              <img
                src="/images/jardim-2.webp"
                alt={d.contact.imgAlt}
                width={1200}
                height={675}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
            </div>

            {/* Google Maps */}
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-serif-display text-xl font-semibold">{d.contact.mapTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {d.contact.mapText}
              </p>
              <Button asChild className="mt-4 w-full bg-primary text-primary-foreground">
                <a
                  href={SITE.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation className="me-2 h-5 w-5" /> {d.contact.mapBtn}
                </a>
              </Button>
            </div>
          </div>

          {/* Message form */}
          <div className="reveal rounded-2xl border bg-card p-6 shadow-lg sm:p-8 lg:col-span-3">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
                <h3 className="mt-6 font-serif-display text-3xl font-semibold">
                  {d.contact.form.successTitle}
                </h3>
                <p className="mt-3 max-w-md text-muted-foreground">
                  {d.contact.form.successText}
                </p>
                <Button variant="outline" className="mt-8" onClick={() => setSent(false)}>
                  {d.contact.form.again}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ct-nome">{d.contact.form.name}</Label>
                    <Input id="ct-nome" placeholder={d.contact.form.namePh} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ct-email">{d.contact.form.email}</Label>
                    <Input
                      id="ct-email"
                      type="email"
                      placeholder={d.contact.form.emailPh}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ct-msg">{d.contact.form.message}</Label>
                  <Textarea
                    id="ct-msg"
                    placeholder={d.contact.form.messagePh}
                    rows={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {d.contact.form.submit}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
