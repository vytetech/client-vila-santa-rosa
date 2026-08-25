import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Copy,
  Check,
  Gift,
  LogOut,
  Star,
  UserRound,
  Clock,
  CheckCircle2,
  XCircle,
  PawPrint,
  LayoutDashboard,
  MessageCircle,
  BedDouble,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/providers/trpc'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/hooks/useSite'

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const { d } = useLanguage()
  const map = {
    pending: { label: d.account.statusPending, cls: 'bg-amber-100 text-amber-800', Icon: Clock },
    approved: { label: d.account.statusApproved, cls: 'bg-green-100 text-green-800', Icon: CheckCircle2 },
    rejected: { label: d.account.statusRejected, cls: 'bg-red-100 text-red-800', Icon: XCircle },
  } as const
  const { label, cls, Icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  )
}

export default function Account() {
  const { d, intlLocale } = useLanguage()
  const site = useSite()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSent, setReviewSent] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const utils = trpc.useUtils()
  const me = trpc.guest.me.useQuery(undefined, { retry: false })
  const referrals = trpc.referrals.mine.useQuery(undefined, {
    retry: false,
    enabled: !!me.data,
  })
  const myReviews = trpc.reviews.mine.useQuery(undefined, {
    retry: false,
    enabled: !!me.data,
  })
  const myBookings = trpc.bookings.mine.useQuery(undefined, {
    retry: false,
    enabled: !!me.data,
  })
  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => utils.bookings.mine.invalidate(),
  })

  const loginMut = trpc.guest.login.useMutation({
    onSuccess: () => {
      setError('')
      utils.guest.me.invalidate()
    },
    onError: (e) =>
      setError(e.message.includes('invalid') ? d.account.invalidCreds : e.message),
  })
  const forgotMut = trpc.guest.forgotPassword.useMutation({
    onSuccess: () => setForgotSent(true),
  })
  const logoutMut = trpc.guest.logout.useMutation({
    onSuccess: () => utils.guest.me.invalidate(),
  })
  const reviewMut = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setReviewSent(true)
      setReviewText('')
      utils.reviews.mine.invalidate()
    },
  })

  useEffect(() => {
    document.title = `Vila Santa Rosa — ${d.account.title}`
  }, [d])

  // Owners logging in with their admin e-mail land straight on the dashboard.
  useEffect(() => {
    if (me.data?.role === 'admin') navigate('/admin', { replace: true })
  }, [me.data?.role, navigate])

  const referralLink = me.data
    ? `${window.location.origin}/conta?ref=${me.data.referralCode}`
    : ''

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    loginMut.mutate({
      username: String(fd.get('username')),
      password: String(fd.get('password')),
    })
  }


  const fmtDate = (date: Date | string) =>
    new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(date),
    )

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Simple top bar */}
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Vila Santa Rosa" className="h-9 w-auto" />
            <span className="font-serif-display text-xl font-semibold">Vila Santa Rosa</span>
          </Link>
          {me.data && (
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link to="/#reservas">
                  <BedDouble className="me-2 h-4 w-4" /> {d.account.goBook}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => logoutMut.mutate()}>
                <LogOut className="me-2 h-4 w-4" /> {d.account.logout}
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {!me.data ? (
          /* ------------------------- AUTH FORMS ------------------------- */
          <div className="mx-auto max-w-md">
            <h1 className="text-center font-serif-display text-4xl font-semibold">
              {d.account.title}
            </h1>
            <p className="mt-2 text-center text-muted-foreground">{d.account.needLogin}</p>

            <Card className="mt-4">
              <CardContent className="p-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="l-user">{d.account.username}</Label>
                        <Input id="l-user" name="username" required autoComplete="username" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="l-pass">{d.account.password}</Label>
                        <Input
                          id="l-pass"
                          name="password"
                          type="password"
                          required
                          autoComplete="current-password"
                        />
                      </div>
                      {error && <p className="text-sm text-red-600">{error}</p>}
                      <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground"
                        disabled={loginMut.isPending}
                      >
                        {d.account.loginBtn}
                      </Button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(!forgotOpen)}
                      className="mt-3 w-full text-center text-sm text-primary underline-offset-2 hover:underline"
                    >
                      {d.account.forgotPassword}
                    </button>
                    {forgotOpen && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          const email = new FormData(e.currentTarget).get('forgotEmail') as string
                          forgotMut.mutate({ email })
                        }}
                        className="mt-3 space-y-3 rounded-xl border bg-muted/40 p-4"
                      >
                        <p className="text-xs text-muted-foreground">{d.account.forgotHint}</p>
                        <Input
                          name="forgotEmail"
                          type="email"
                          required
                          placeholder={d.account.email}
                          dir="ltr"
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full"
                          disabled={forgotMut.isPending}
                        >
                          {d.account.forgotSubmit}
                        </Button>
                        {forgotSent && (
                          <p className="text-center text-sm font-medium text-green-700">
                            {d.account.forgotSent}
                          </p>
                        )}
                      </form>
                    )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ------------------------- DASHBOARD ------------------------- */
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <UserRound className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="font-serif-display text-3xl font-semibold">
                  {d.account.welcome}
                  {me.data.fullName.split(' ')[0]}!
                </h1>
                <p className="text-sm text-muted-foreground">
                  {d.account.memberSince} {fmtDate(me.data.createdAt)}
                </p>
                {me.data.hasPet && me.data.petName && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <PawPrint className="h-3.5 w-3.5" />
                    {me.data.petName}
                    {me.data.petBreed ? ` · ${me.data.petBreed}` : ''}
                  </p>
                )}
              </div>
            </div>

            {me.data.role === 'admin' && (
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground"
                onClick={() => navigate('/admin')}
              >
                <LayoutDashboard className="me-2 h-5 w-5" /> {d.account.adminPanel}
              </Button>
            )}

            {/* Welcome message right after registration */}
            {welcome && (
              <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-6">
                  <h2 className="font-serif-display text-2xl font-semibold text-primary">
                    {d.account.welcomeTitle}
                  </h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {d.account.welcomeText}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button asChild>
                      <Link to="/#reservas">
                        <BedDouble className="me-2 h-4 w-4" /> {d.account.goBook}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWelcome(false)}
                    >
                      ✕
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WhatsApp number confirmation */}
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-serif-display text-xl font-semibold">
                    <MessageCircle className="h-5 w-5 text-[#25D366]" />
                    {d.account.whatsappConfirm}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {d.account.whatsappConfirmHint}
                  </p>
                </div>
                <Button asChild className="shrink-0 bg-[#25D366] text-white hover:bg-[#20bd5a]">
                  <a
                    href={`https://wa.me/${site.whatsappPrimary}?text=${encodeURIComponent(
                      `Olá! Confirmo meu WhatsApp — usuário: ${me.data.username}, nome: ${me.data.fullName}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="me-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Referral card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h2 className="font-serif-display text-2xl font-semibold">
                    {d.account.referralTitle}
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {d.account.referralHint}
                </p>

                <div className="mt-4 flex gap-2">
                  <Input readOnly value={referralLink} dir="ltr" className="font-mono text-sm" />
                  <Button onClick={copyLink} variant="outline" className="shrink-0">
                    {copied ? (
                      <>
                        <Check className="me-2 h-4 w-4 text-green-600" /> {d.account.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="me-2 h-4 w-4" /> {d.account.copy}
                      </>
                    )}
                  </Button>
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${d.account.referralShareMsg} ${referralLink}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#20bd5a]"
                >
                  <MessageCircle className="h-4 w-4" /> {d.account.shareWhatsApp}
                </a>
                <p className="mt-2 text-sm">
                  {d.account.yourCode}:{' '}
                  <strong className="font-mono tracking-wider">{me.data.referralCode}</strong>
                </p>

                {/* Progress */}
                {referrals.data && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{d.account.progressTitle}</span>
                      <span>
                        {referrals.data.confirmed} {d.account.ofThree}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, (referrals.data.confirmed / 3) * 100)}%`,
                        }}
                      />
                    </div>
                    {referrals.data.hasLifetimeDiscount ? (
                      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">
                        <CheckCircle2 className="h-4 w-4" /> {d.account.lifetimeActive}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {d.account.lifetimePendingPrefix} {3 - referrals.data.confirmed}{' '}
                        {d.account.lifetimePendingSuffix}
                      </p>
                    )}

                    {referrals.data.items.length > 0 && (
                      <ul className="mt-4 space-y-2 border-t pt-4 text-sm">
                        {referrals.data.items.map((r) => (
                          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">{r.guestName}</span>
                            <span className="text-muted-foreground" dir="ltr">
                              {r.checkIn} → {r.checkOut}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                      {d.account.howItWorks}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My bookings */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-serif-display text-2xl font-semibold">
                  {d.account.myBookings}
                </h2>
                {myBookings.data && myBookings.data.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {myBookings.data.map((b) => {
                      const statusColor =
                        b.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : b.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                      const statusLabel =
                        b.status === 'confirmed'
                          ? d.account.bkConfirmed
                          : b.status === 'cancelled'
                            ? d.account.bkCancelled
                            : d.account.bkPending
                      const proofText = encodeURIComponent(
                        `Olá! Segue o comprovante de pagamento da minha reserva na Vila Santa Rosa (${d.rooms.items[b.roomId as 'luxo' | 'marrok' | 'sonhos']?.name ?? b.roomId}, ${fmtDate(b.checkIn)} → ${fmtDate(b.checkOut)}) — ${me.data?.fullName}.`,
                      )
                      const confirmText = encodeURIComponent(
                        `Olá! Gostaria de confirmar que minha reserva está tudo certo (${d.rooms.items[b.roomId as 'luxo' | 'marrok' | 'sonhos']?.name ?? b.roomId}, ${fmtDate(b.checkIn)} → ${fmtDate(b.checkOut)}) — ${me.data?.fullName}.`,
                      )
                      return (
                        <li key={b.id} className="rounded-xl border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold">
                                {d.rooms.items[b.roomId as 'luxo' | 'marrok' | 'sonhos']?.name ??
                                  b.roomId}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.guests}{' '}
                                {d.booking.guestSuffix}
                                {b.pets > 0 ? ` · ${b.pets} ${d.booking.petSuffix}` : ''}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          {b.status !== 'cancelled' && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button asChild size="sm" variant="outline">
                                <a
                                  href={`https://wa.me/${site.whatsappSecondary}?text=${proofText}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <MessageCircle className="me-1.5 h-3.5 w-3.5" />
                                  {d.account.sendProof}
                                </a>
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <a
                                  href={`https://wa.me/${site.whatsappPrimary}?text=${confirmText}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <CheckCircle2 className="me-1.5 h-3.5 w-3.5" />
                                  {d.account.requestConfirm}
                                </a>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => cancelBooking.mutate({ id: b.id })}
                                disabled={cancelBooking.isPending}
                              >
                                <XCircle className="me-1.5 h-3.5 w-3.5" />
                                {d.account.cancelBooking}
                              </Button>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">{d.account.noBookings}</p>
                )}
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {d.account.proofHint} {d.account.cancelPolicyNote}
                </p>
              </CardContent>
            </Card>

            {/* Reviews card */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-serif-display text-2xl font-semibold">{d.account.myReviews}</h2>

                {reviewSent && (
                  <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
                    {d.account.reviewSent}
                  </p>
                )}

                {myReviews.data && myReviews.data.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {myReviews.data.map((r) => (
                      <li key={r.id} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex gap-0.5 text-amber-500">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-current" />
                            ))}
                          </div>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">{d.account.noReviews}</p>
                )}

                {/* New review form */}
                <form
                  className="mt-6 space-y-4 border-t pt-6"
                  onSubmit={(e) => {
                    e.preventDefault()
                    reviewMut.mutate({ rating, text: reviewText })
                  }}
                >
                  <h3 className="font-semibold">{d.account.writeReview}</h3>
                  <div className="space-y-2">
                    <Label>{d.account.yourRating}</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          aria-label={`${n}`}
                        >
                          <Star
                            className={`h-7 w-7 ${
                              n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rev-text">{d.account.yourReview}</Label>
                    <Textarea
                      id="rev-text"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={4}
                      required
                      minLength={10}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground"
                    disabled={reviewMut.isPending}
                  >
                    {d.account.submitReview}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
