import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  Flower2,
  Copy,
  Check,
  QrCode,
  CreditCard,
  ShieldAlert,
  MessageCircle,
  ArrowLeft,
  BedDouble,
  ScrollText,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { translations } from '@/i18n/translations'
import { useLanguage } from '@/i18n/LanguageContext'
import { trpc } from '@/providers/trpc'
import { useSite } from '@/hooks/useSite'
import { parseISODate, petFeeTotal, splitNightsBySeason } from '@/lib/petFee'
import {
  PAYMENT_FEE_BPS,
  basisPointsOfCents,
  calculateBookingPricing,
  centsToReais,
  type PaymentMethod,
} from '@contracts/pricing'

/** Pix & PayPal data come from the owner-editable site settings (admin panel). */
const DAY_MS = 24 * 60 * 60 * 1000

function uniqueValue(values: number[]) {
  if (values.length === 0) return null
  const [first] = values
  return values.every((value) => value === first) ? first : null
}

export default function Payment() {
  const { d, intlLocale } = useLanguage()
  const site = useSite()
  const [params] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [copiedPaypal, setCopiedPaypal] = useState(false)
  const [pixRevealed, setPixRevealed] = useState(false)
  const initialPay = params.get('pay')
  const [payMethod, setPayMethod] = useState<PaymentMethod | null>(
    initialPay === 'pix' || initialPay === 'card' || initialPay === 'paypal' ? initialPay : null,
  )

  const pricing = trpc.settings.pricing.useQuery(undefined, { refetchInterval: 15_000 })

  const roomId = params.get('room') ?? 'marrok'
  const checkIn = params.get('ci') ?? ''
  const checkOut = params.get('co') ?? ''
  const nights = Math.max(1, Number(params.get('n') ?? 1))
  const pets = Math.max(0, Number(params.get('pets') ?? 0))
  const guests = Math.max(1, Number(params.get('g') ?? 2))
  const couponCode = (params.get('coupon') ?? '').trim().toUpperCase()

  // Per-suite pricing: use the selected suite's Booking.com rate
  const suitePrices = pricing.data?.suitePrices
  const bookingNightly = suitePrices?.[roomId as keyof typeof suitePrices] ?? pricing.data?.bookingNightly ?? 420

  // Per-date price overrides (owner-set in the admin price calendar)
  const dateOverrides = trpc.datePrices.forStay.useQuery(
    { roomId: roomId as 'luxo' | 'marrok' | 'sonhos', checkIn, checkOut },
    { enabled: !!checkIn && !!checkOut, staleTime: 60_000 },
  )
  const couponQuery = trpc.coupons.validate.useQuery(
    { code: couponCode },
    { enabled: couponCode.length >= 3, retry: false, staleTime: 60_000 },
  )
  const appliedCoupon = couponCode && couponQuery.data?.valid ? couponQuery.data : null
  const nightlyDirectPrices = useMemo(() => {
    if (!checkIn || !checkOut) {
      return Array.from({ length: nights }, (_, index) => ({
        date: `fallback-${index}`,
        price: bookingNightly,
      }))
    }
    const ci = parseISODate(checkIn)
    const co = parseISODate(checkOut)
    const prices = []
    for (let t = ci.getTime(); t < co.getTime(); t += DAY_MS) {
      const key = `${new Date(t).getFullYear()}-${String(new Date(t).getMonth() + 1).padStart(2, '0')}-${String(new Date(t).getDate()).padStart(2, '0')}`
      prices.push({ date: key, price: dateOverrides.data?.[key] ?? bookingNightly })
    }
    return prices
  }, [checkIn, checkOut, dateOverrides.data, bookingNightly, nights])

  // Pet fee: R$80/night Sep–Mar · R$50/night Apr–Aug, per pet
  const season =
    pets > 0 && checkIn && checkOut
      ? splitNightsBySeason(parseISODate(checkIn), parseISODate(checkOut))
      : { high: 0, low: 0 }
  const petFee = pets > 0 ? petFeeTotal(season.high, season.low, pets) : 0

  const priceSummary = useMemo(
    () =>
      calculateBookingPricing({
        nightlyDirectPrices,
        pets,
        petFee,
        couponPercent: appliedCoupon?.percent,
        paymentMethod: payMethod,
      }),
    [nightlyDirectPrices, pets, petFee, appliedCoupon?.percent, payMethod],
  )
  const stayTotal = centsToReais(priceSummary.lodgingSubtotalCents)
  const total = centsToReais(priceSummary.totalCents)
  const deposit = centsToReais(priceSummary.depositBaseCents)
  const remaining = total - deposit
  // Card link (credit or debit) and PayPal carry the same 7.99% fee on the deposit
  const paypalDeposit = centsToReais(
    priceSummary.depositBaseCents + basisPointsOfCents(priceSummary.depositBaseCents, PAYMENT_FEE_BPS),
  )
  const debitDeposit = paypalDeposit
  const uniformDirectNightly = uniqueValue(priceSummary.lines.map((line) => line.directCents))

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(v)

  const copyKey = () => {
    navigator.clipboard.writeText(site.pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const copyPaypal = () => {
    navigator.clipboard.writeText(site.paypalEmail)
    setCopiedPaypal(true)
    setTimeout(() => setCopiedPaypal(false), 2500)
  }

  // Detailed PT confirmation message (always Portuguese — goes to the owners),
  // ending with the guest's chosen deposit payment method.
  const ptRoomName = translations.pt.rooms.items[roomId as 'luxo' | 'marrok' | 'sonhos']?.name ?? roomId
  const fmtDateBR = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '')
  const methodLabel =
    payMethod === 'pix'
      ? translations.pt.payment.payOptPix
      : payMethod === 'card'
        ? translations.pt.payment.payOptCard
        : payMethod === 'paypal'
          ? translations.pt.payment.payOptPaypal
          : ''
  const hasFee = payMethod === 'card' || payMethod === 'paypal'
  const depositChosen = hasFee ? paypalDeposit : deposit
  // Automatic request so the owners know exactly what to send back
  const methodRequest =
    payMethod === 'pix'
      ? 'Por favor, me envie a chave Pix para eu pagar o sinal de 50% da reserva.'
      : payMethod === 'card'
        ? 'Por favor, me envie o link de pagamento (cartão de crédito ou débito) para eu pagar o sinal de 50% da reserva.'
        : 'Por favor, me envie o e-mail de pagamento do PayPal para eu pagar o sinal de 50% da reserva.'
  const confirmText = [
    'Olá! Confirmei minha reserva na Vila Santa Rosa pelo site.',
    `• Suíte: ${ptRoomName}`,
    `• Check-in: ${fmtDateBR(checkIn)}`,
    `• Check-out: ${fmtDateBR(checkOut)}`,
    `• Noites: ${nights} · Hóspedes: ${guests}${pets > 0 ? ` · Pets: ${pets}` : ''}`,
    `• Total: R$ ${total}`,
    `• Sinal de 50%: R$ ${deposit} (restante de R$ ${remaining} na chegada)`,
    '',
    'Comodidades incluídas: toalhas de banho, papel higiênico Neve, shampoo, sabonete líquido e em barra, cobertores e roupa de cama completa.',
    '',
    'Regras da casa (li e concordo): proibido fumar no quarto; não consumir refeições/comida no quarto; não jogar papel higiênico ou outros resíduos no vaso sanitário; visitantes somente com autorização prévia dos proprietários.',
    '',
    `FORMA DE PAGAMENTO DO SINAL: ${methodLabel}`,
    hasFee
      ? `VALOR DO SINAL COM TAXA DE 7,99%: R$ ${depositChosen} (em vez de R$ ${deposit})`
      : `VALOR DO SINAL: R$ ${depositChosen} (Pix, sem taxas)`,
    '',
    methodRequest,
  ].join('\n')

  const waUrl = `https://wa.me/${site.whatsappPrimary}?text=${encodeURIComponent(
    `${d.payment.whatsappMsg} (${roomId}, ${checkIn} → ${checkOut}, ${nights} ${d.payment.nights}, ${d.payment.deposit50}: ${fmtMoney(deposit)})`,
  )}`
  const confirmWaUrl = `https://wa.me/${site.whatsappPrimary}?text=${encodeURIComponent(confirmText)}`

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Flower2 className="h-6 w-6 text-primary" />
            <span className="font-serif-display text-xl font-semibold">Vila Santa Rosa</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {d.payment.backHome}
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center">
          <h1 className="font-serif-display text-4xl font-semibold">{d.payment.title}</h1>
          <p className="mt-2 text-muted-foreground">{d.payment.subtitle}</p>
        </div>

        {/* Summary */}
        <Card className="mx-auto mt-8 max-w-2xl">
          <CardContent className="p-6">
            <h2 className="font-serif-display text-xl font-semibold">{d.payment.summary}</h2>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">
                  {d.rooms.items[roomId as 'luxo' | 'marrok' | 'sonhos']?.name ?? roomId}
                </span>
                <span className="font-medium">
                  {checkIn} → {checkOut} · {nights} {d.payment.nights}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">
                  {uniformDirectNightly !== null
                    ? `${fmtMoney(centsToReais(uniformDirectNightly))} × ${nights} ${d.payment.nights}`
                    : `${nights} ${d.payment.nights}`}
                </span>
                <span className="font-medium">{fmtMoney(stayTotal)}</span>
              </p>
              {appliedCoupon && (
                <p className="flex justify-between text-emerald-700 dark:text-emerald-300">
                  <span>{appliedCoupon.code} (-{appliedCoupon.percent}%)</span>
                  <span className="font-medium">
                    -{fmtMoney(centsToReais(priceSummary.couponDiscountCents))}
                  </span>
                </p>
              )}
              {pets > 0 && petFee > 0 && (
                <p className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d.payment.petFee} × {pets}
                  </span>
                  <span className="font-medium">{fmtMoney(petFee)}</span>
                </p>
              )}
              <p className="flex justify-between text-sm font-semibold">
                <span>{d.payment.totalAfterDiscount}</span>
                <span>{fmtMoney(total)}</span>
              </p>
              <p className="flex justify-between border-t pt-2 text-base font-bold">
                <span>{d.payment.deposit50}</span>
                <span className="text-primary">{fmtMoney(deposit)}</span>
              </p>
              <p className="flex justify-between text-sm text-muted-foreground">
                <span>{d.payment.remaining}</span>
                <span>{fmtMoney(remaining)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-6 grid max-w-2xl gap-6">
          {/* Included amenities */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <BedDouble className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-serif-display text-2xl font-semibold">
                  {d.payment.includedTitle}
                </h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {d.payment.includedItems}
              </p>
            </CardContent>
          </Card>

          {/* House rules */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                  <ScrollText className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="font-serif-display text-2xl font-semibold">
                  {d.payment.houseRulesTitle}
                </h2>
              </div>
              <ul className="mt-4 space-y-2.5">
                {d.payment.houseRulesItems.map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment instructions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#32BCAD]/10">
                  <Wallet className="h-6 w-6 text-[#32BCAD]" />
                </div>
                <h2 className="font-serif-display text-2xl font-semibold">
                  {d.payment.payInfoTitle}
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  <span className="font-semibold text-primary">50%</span> —{' '}
                  {d.payment.payInfoDeposit}
                </p>
                <p className="text-muted-foreground">{d.payment.payInfoBalance}</p>
                <p className="text-muted-foreground">{d.payment.payInfoIntl}</p>
              </div>
            </CardContent>
          </Card>

          {/* Deposit payment method — radio choice + WhatsApp confirmation */}
          <Card className="border-[#25D366]/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/10">
                  <MessageCircle className="h-6 w-6 text-[#25D366]" />
                </div>
                <h2 className="font-serif-display text-2xl font-semibold">
                  {d.payment.payChoiceTitle}
                </h2>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{d.payment.payChoiceHint}</p>

              <RadioGroup
                value={payMethod ?? ''}
                onValueChange={(v) => setPayMethod(v as PaymentMethod)}
                className="mt-5 space-y-3"
              >
                <label
                  htmlFor="pay-pix"
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                    payMethod === 'pix'
                      ? 'border-[#32BCAD] bg-[#32BCAD]/5'
                      : 'border-border hover:border-[#32BCAD]/50'
                  }`}
                >
                  <RadioGroupItem value="pix" id="pay-pix" />
                  <QrCode className="h-5 w-5 text-[#32BCAD]" />
                  <span className="font-medium">{d.payment.payOptPix}</span>
                  <span className="ms-auto font-bold text-[#12877a]">{fmtMoney(deposit)}</span>
                </label>

                <label
                  htmlFor="pay-card"
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                    payMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="card" id="pay-card" />
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-medium">{d.payment.payOptCard}</span>
                  <span className="ms-auto font-bold text-primary">{fmtMoney(debitDeposit)}</span>
                </label>

                <label
                  htmlFor="pay-paypal"
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                    payMethod === 'paypal'
                      ? 'border-[#003087] bg-[#003087]/5'
                      : 'border-border hover:border-[#003087]/50'
                  }`}
                >
                  <RadioGroupItem value="paypal" id="pay-paypal" />
                  <Wallet className="h-5 w-5 text-[#003087]" />
                  <span className="font-medium">{d.payment.payOptPaypal}</span>
                  <span className="ms-auto font-bold text-[#003087]">
                    {fmtMoney(paypalDeposit)}
                  </span>
                </label>
              </RadioGroup>

              <Button
                asChild={!!payMethod}
                size="lg"
                disabled={!payMethod}
                className="mt-5 w-full bg-[#25D366] text-lg text-white hover:bg-[#20bd5a] disabled:opacity-50"
              >
                {payMethod ? (
                  <a href={confirmWaUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="me-2 h-5 w-5" /> {d.payment.sendConfirm}
                  </a>
                ) : (
                  <span>
                    <MessageCircle className="me-2 inline h-5 w-5" /> {d.payment.chooseFirst}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pix */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#32BCAD]/10">
                  <QrCode className="h-6 w-6 text-[#32BCAD]" />
                </div>
                <h2 className="font-serif-display text-2xl font-semibold">{d.payment.pixTitle}</h2>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{d.payment.pixHint}</p>

              {!pixRevealed ? (
                <Button
                  size="lg"
                  onClick={() => setPixRevealed(true)}
                  className="mt-4 w-full bg-[#32BCAD] text-lg text-white hover:bg-[#2aa89a]"
                >
                  {d.payment.pixReveal}
                </Button>
              ) : (
                <>
                  <div className="mt-4 flex flex-col items-stretch gap-3 rounded-xl border-2 border-dashed border-[#32BCAD]/40 bg-[#32BCAD]/5 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {d.payment.pixKeyLabel}
                      </p>
                      <p
                        className="mt-1 break-all font-mono text-base font-bold tracking-wide"
                        dir="ltr"
                      >
                        {site.pixKey}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{site.pixOwner}</p>
                    </div>
                    <Button
                      onClick={copyKey}
                      className={`shrink-0 ${
                        copied
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-[#32BCAD] hover:bg-[#2aa89a]'
                      } text-white`}
                    >
                      {copied ? (
                        <>
                          <Check className="me-2 h-4 w-4" /> {d.payment.copied}
                        </>
                      ) : (
                        <>
                          <Copy className="me-2 h-4 w-4" /> {d.payment.copy}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="mt-3 text-center font-serif-display text-3xl font-bold text-[#12877a]">
                    {fmtMoney(deposit)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card / PayPal */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-serif-display text-2xl font-semibold">{d.payment.cardTitle}</h2>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{d.payment.cardHint}</p>

              <div className="mt-4">
                <Button asChild size="lg" className="w-full bg-[#25D366] text-white hover:bg-[#20bd5a]">
                  <a href={waUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="me-2 h-5 w-5" /> {d.payment.cardBtn}
                  </a>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {d.payment.debitNote} <span className="font-semibold">({fmtMoney(debitDeposit)})</span>
              </p>

              {/* PayPal — send to e-mail with 7.99% fee */}
              <div className="mt-5 rounded-xl border border-[#003087]/25 bg-[#003087]/5 p-4">
                <p className="text-sm text-muted-foreground">{d.payment.paypalHint}</p>
                <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {d.payment.paypalEmailLabel}
                    </p>
                    <p className="mt-1 break-all font-mono text-base font-bold" dir="ltr">
                      {site.paypalEmail}
                    </p>
                  </div>
                  <Button
                    onClick={copyPaypal}
                    variant="outline"
                    className={`shrink-0 ${copiedPaypal ? 'border-green-600 text-green-700' : ''}`}
                  >
                    {copiedPaypal ? (
                      <>
                        <Check className="me-2 h-4 w-4" /> {d.payment.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="me-2 h-4 w-4" /> {d.payment.copy}
                      </>
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-sm font-semibold text-[#003087]">
                  PayPal · {fmtMoney(paypalDeposit)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{d.payment.paypalNote}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {d.payment.cancelTitle}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                {d.payment.cancelText}
              </p>
            </div>
          </div>

          {/* Receipt + contact block */}
          <Card className="border-[#25D366]/40">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-medium leading-relaxed">{d.payment.afterPaid}</p>
              <div className="grid gap-3">
                <Button asChild className="bg-[#25D366] text-white hover:bg-[#20bd5a]">
                  <a
                    href={`https://wa.me/${site.whatsappPrimary}?text=${encodeURIComponent(d.payment.whatsappMsg)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="me-2 h-4 w-4" /> Domingos — (11) 98698-1444
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{d.payment.questionsNote}</p>
              <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                {d.payment.ownersNote}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
