import { useState } from 'react'
import { Link } from 'react-router'
import {
  Star,
  Check,
  X,
  Tag,
  MessageSquareText,
  LogIn,
  Settings2,
  CalendarCheck,
  CalendarDays,
  Images,
  Type,
  CalendarSync,
  TicketPercent,
  BarChart3,
  LineChart,
  Users,
  Coffee,
  Palette,
  BedDouble,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react'
import PriceCalendar from '@/pages/PriceCalendar'
import MinNightsCalendar from '@/pages/MinNightsCalendar'
import PhotosManager from '@/pages/PhotosManager'
import BlockedDatesCalendar from '@/pages/BlockedDatesCalendar'
import TextsManager from '@/pages/TextsManager'
import IcalManager from '@/pages/IcalManager'
import CouponsManager from '@/pages/CouponsManager'
import StatsDashboard from '@/pages/StatsDashboard'
import UsersManager from '@/pages/UsersManager'
import BreakfastManager from '@/pages/BreakfastManager'
import AppearanceManager from '@/pages/AppearanceManager'
import SuitesManager from '@/pages/SuitesManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/hooks/useSite'

type Tab =
  | 'pricing'
  | 'calendar'
  | 'photos'
  | 'texts'
  | 'ical'
  | 'reviews'
  | 'bookings'
  | 'coupons'
  | 'stats'
  | 'analytics'
  | 'site'
  | 'users'
  | 'breakfast'
  | 'appearance'
  | 'suites'

export default function Admin() {
  const { d, intlLocale } = useLanguage()
  const { user, isLoading } = useAuth()
  const [tab, setTab] = useState<Tab>('pricing')
  const [price, setPrice] = useState('')
  const [saved, setSaved] = useState(false)
  const [suitePricesForm, setSuitePricesForm] = useState({ luxo: '', marrok: '', sonhos: '' })
  const [suitePricesSaved, setSuitePricesSaved] = useState(false)
  const [ratingInput, setRatingInput] = useState('')
  const [ratingSaved, setRatingSaved] = useState(false)
  const [bkForm, setBkForm] = useState({ authorName: '', rating: '', text: '' })
  const [bkMsg, setBkMsg] = useState('')
  const [reviewEdits, setReviewEdits] = useState<
    Record<
      number,
      {
        authorName: string
        rating: string
        text: string
        source: 'site' | 'booking'
        status: 'pending' | 'approved' | 'rejected'
      }
    >
  >({})
  const currentSite = useSite()
  const [siteForm, setSiteForm] = useState({ ...currentSite })
  const [siteSaved, setSiteSaved] = useState(false)
  const analyticsQuery = trpc.settings.analytics.useQuery(undefined, { retry: false })
  const [analyticsForm, setAnalyticsForm] = useState({ gaId: '', gscVerification: '', metaPixelId: '' })
  const [analyticsSaved, setAnalyticsSaved] = useState(false)
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false)
  if (analyticsQuery.data && !analyticsLoaded) {
    setAnalyticsForm(analyticsQuery.data)
    setAnalyticsLoaded(true)
  }

  const utils = trpc.useUtils()
  const guestMe = trpc.guest.me.useQuery(undefined, { retry: false })
  const adminCheck = trpc.settings.adminCheck.useQuery(undefined, { retry: false })
  const isAdmin =
    user?.role === 'admin' ||
    guestMe.data?.role === 'admin' ||
    adminCheck.data?.isAdmin === true

  const pricing = trpc.settings.pricing.useQuery()
  const reviews = trpc.reviews.adminList.useQuery(undefined, { enabled: isAdmin })

  const savePrice = trpc.settings.setBookingPrice.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      utils.settings.pricing.invalidate()
    },
  })
  const saveSuitePrices = trpc.settings.setSuitePrices.useMutation({
    onSuccess: () => {
      setSuitePricesSaved(true)
      setTimeout(() => setSuitePricesSaved(false), 2500)
      utils.settings.pricing.invalidate()
    },
  })
  const saveRating = trpc.settings.setBookingRating.useMutation({
    onSuccess: () => {
      setRatingSaved(true)
      setTimeout(() => setRatingSaved(false), 2500)
      utils.settings.pricing.invalidate()
    },
  })
  const invalidateReviews = () => {
    utils.reviews.adminList.invalidate()
    utils.reviews.highlights.invalidate()
    utils.reviews.publicList.invalidate()
  }
  const approve = trpc.reviews.approve.useMutation({
    onSuccess: invalidateReviews,
  })
  const reject = trpc.reviews.reject.useMutation({
    onSuccess: invalidateReviews,
  })
  const addBooking = trpc.reviews.addBooking.useMutation({
    onSuccess: () => {
      setBkMsg(d.admin.bookingAdded)
      setBkForm({ authorName: '', rating: '', text: '' })
      invalidateReviews()
      setTimeout(() => setBkMsg(''), 3000)
    },
  })
  const updateReview = trpc.reviews.update.useMutation({
    onSuccess: (_data, variables) => {
      setReviewEdits((current) => {
        const next = { ...current }
        delete next[variables.id]
        return next
      })
      invalidateReviews()
    },
  })
  const removeReview = trpc.reviews.remove.useMutation({
    onSuccess: invalidateReviews,
  })
  const bookings = trpc.bookings.adminList.useQuery(undefined, { enabled: isAdmin })
  const setBkStatus = trpc.bookings.setStatus.useMutation({
    onSuccess: () => utils.bookings.adminList.invalidate(),
  })
  const saveSite = trpc.settings.setSite.useMutation({
    onSuccess: () => {
      setSiteSaved(true)
      setTimeout(() => setSiteSaved(false), 2500)
      utils.settings.site.invalidate()
    },
  })
  const saveAnalytics = trpc.settings.setAnalytics.useMutation({
    onSuccess: () => {
      setAnalyticsSaved(true)
      setTimeout(() => setAnalyticsSaved(false), 2500)
      utils.settings.analytics.invalidate()
    },
  })

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(v)

  const tabs: { id: Tab; label: string; Icon: typeof Tag }[] = [
    { id: 'pricing', label: d.admin.pricing, Icon: Tag },
    { id: 'calendar', label: d.admin.calendarTab, Icon: CalendarDays },
    { id: 'photos', label: d.admin.photosTab, Icon: Images },
    { id: 'suites', label: 'Suítes', Icon: BedDouble },
    { id: 'breakfast', label: 'Café', Icon: Coffee },
    { id: 'appearance', label: 'Aparência', Icon: Palette },
    { id: 'texts', label: d.admin.textsTab, Icon: Type },
    { id: 'ical', label: 'iCal', Icon: CalendarSync },
    { id: 'bookings', label: d.admin.bookingsTab, Icon: CalendarCheck },
    { id: 'reviews', label: d.admin.reviewsTab, Icon: MessageSquareText },
    { id: 'coupons', label: d.admin.couponsTab, Icon: TicketPercent },
    { id: 'stats', label: d.admin.statsTab, Icon: BarChart3 },
    { id: 'analytics', label: d.admin.analyticsTab, Icon: LineChart },
    { id: 'site', label: d.admin.siteTab, Icon: Settings2 },
    { id: 'users', label: 'Usuários', Icon: Users },
  ]

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Vila Santa Rosa" className="h-9 w-auto" />
            <span className="font-serif-display text-xl font-semibold">Vila Santa Rosa</span>
          </Link>
          <span className="text-sm font-medium text-muted-foreground">{d.admin.title}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {isLoading || guestMe.isLoading || adminCheck.isLoading ? null : !isAdmin ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{d.admin.needAdmin}</p>
              <Button asChild className="mt-6 bg-primary text-primary-foreground">
                <Link to="/conta">
                  <LogIn className="me-2 h-4 w-4" /> {d.admin.loginAdmin}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {tabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    tab === id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground/70 hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {/* ---------------- Pricing ---------------- */}
            {tab === 'pricing' && (
              <Card className="mt-6 max-w-lg">
                <CardContent className="p-6">
                  <h2 className="font-serif-display text-2xl font-semibold">{d.admin.pricing}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Defina o preço da diária de cada suíte. O site calcula
                    automaticamente o desconto de 5% para reserva direta.
                  </p>
                  <form
                    className="mt-5 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const prices = {
                        luxo: Number(suitePricesForm.luxo) || pricing.data?.suitePrices.luxo || 550,
                        marrok: Number(suitePricesForm.marrok) || pricing.data?.suitePrices.marrok || 450,
                        sonhos: Number(suitePricesForm.sonhos) || pricing.data?.suitePrices.sonhos || 380,
                      }
                      saveSuitePrices.mutate(prices)
                    }}
                  >
                    {(['luxo', 'marrok', 'sonhos'] as const).map((suite) => {
                      const current = pricing.data?.suitePrices[suite]
                      const direct = Number(suitePricesForm[suite]) || current || 0
                      return (
                        <div key={suite} className="space-y-2 rounded-lg border p-3">
                          <Label htmlFor={`price-${suite}`} className="capitalize">
                            Suíte {suite} — diária (R$/noite)
                          </Label>
                          <Input
                            id={`price-${suite}`}
                            type="number"
                            min="1"
                            step="1"
                            value={suitePricesForm[suite]}
                            onChange={(e) =>
                              setSuitePricesForm({ ...suitePricesForm, [suite]: e.target.value })
                            }
                            placeholder={String(current ?? '')}
                            dir="ltr"
                          />
                          <p className="text-xs text-muted-foreground">
                            Aparece no site:{' '}
                            <strong className="text-primary">{fmtMoney(direct)}</strong>
                          </p>
                        </div>
                      )
                    })}
                    <Button
                      type="submit"
                      className="bg-primary text-primary-foreground"
                      disabled={saveSuitePrices.isPending}
                    >
                      {suitePricesSaved ? '✓ Salvo!' : d.admin.save}
                    </Button>
                  </form>

                  {/* Legacy single price (kept for backward compat) */}
                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-serif-display text-lg font-semibold text-muted-foreground">
                      Preço único (legado)
                    </h3>
                    <form
                      className="mt-4 space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        savePrice.mutate({ price: Number(price) })
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="price">{d.admin.priceLabel}</Label>
                        <Input
                          id="price"
                          type="number"
                          min="1"
                          step="1"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder={String(pricing.data?.bookingNightly ?? 420)}
                          dir="ltr"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        disabled={savePrice.isPending}
                      >
                        {saved ? '✓' : d.admin.save}
                      </Button>
                    </form>
                  </div>

                  {/* Review rating */}
                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-serif-display text-xl font-semibold">
                      {d.admin.bookingRating}
                    </h3>
                    <form
                      className="mt-4 space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveRating.mutate({ rating: Number(ratingInput) })
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="bk-rating">{d.admin.ratingLabel}</Label>
                        <Input
                          id="bk-rating"
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          required
                          value={ratingInput}
                          onChange={(e) => setRatingInput(e.target.value)}
                          placeholder={String(pricing.data?.bookingRating ?? 9.9)}
                          dir="ltr"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="bg-primary text-primary-foreground"
                        disabled={saveRating.isPending}
                      >
                        {ratingSaved ? d.admin.ratingUpdated : d.admin.save}
                      </Button>
                    </form>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* ---------------- Reviews ---------------- */}
            {tab === 'calendar' && (
              <div className="mt-6 space-y-10">
                <section>
                  <h2 className="mb-3 font-serif-display text-xl font-semibold">
                    {d.admin.priceCalendarTab}
                  </h2>
                  <PriceCalendar />
                </section>
                <section>
                  <h2 className="mb-3 font-serif-display text-xl font-semibold">
                    {d.admin.minNightsCalTab}
                  </h2>
                  <MinNightsCalendar />
                </section>
                <section>
                  <h2 className="mb-3 font-serif-display text-xl font-semibold">
                    {d.admin.blockedTab}
                  </h2>
                  <BlockedDatesCalendar />
                </section>
              </div>
            )}

            {tab === 'photos' && <PhotosManager />}

            {tab === 'suites' && <SuitesManager />}

            {tab === 'breakfast' && <BreakfastManager />}

            {tab === 'appearance' && <AppearanceManager />}

            {tab === 'texts' && <TextsManager />}

            {tab === 'ical' && <IcalManager />}

            {tab === 'reviews' && (
              <div className="mt-6 space-y-4">
                {/* Quick-add a verified review. Approved admin reviews show on home. */}
                <Card className="border-primary/30">
                  <CardContent className="p-5">
                    <h3 className="font-serif-display text-xl font-semibold">
                      {d.admin.addBookingTitle}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{d.admin.addBookingHint}</p>
                    <form
                      className="mt-4 space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        addBooking.mutate({
                          authorName: bkForm.authorName,
                          rating: Number(bkForm.rating),
                          text: bkForm.text,
                        })
                      }}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{d.admin.bookingAuthor}</Label>
                          <Input
                            value={bkForm.authorName}
                            onChange={(e) =>
                              setBkForm((f) => ({ ...f, authorName: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{d.admin.bookingScore}</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            step="0.1"
                            value={bkForm.rating}
                            onChange={(e) => setBkForm((f) => ({ ...f, rating: e.target.value }))}
                            required
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{d.admin.bookingText}</Label>
                        <Input
                          value={bkForm.text}
                          onChange={(e) => setBkForm((f) => ({ ...f, text: e.target.value }))}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="bg-primary text-primary-foreground"
                        disabled={addBooking.isPending}
                      >
                        {d.admin.addBookingBtn}
                      </Button>
                      {bkMsg && <p className="text-sm text-primary">{bkMsg}</p>}
                    </form>
                  </CardContent>
                </Card>

                {reviews.data?.length === 0 && (
                  <p className="text-muted-foreground">{d.admin.noReviews}</p>
                )}
                {reviews.data?.map((r) => {
                  const edit = reviewEdits[r.id]
                  return (
                    <Card key={r.id}>
                      <CardContent className="p-5">
                        {edit ? (
                          <div className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Nome do hóspede</Label>
                                <Input
                                  value={edit.authorName}
                                  onChange={(e) =>
                                    setReviewEdits({
                                      ...reviewEdits,
                                      [r.id]: { ...edit, authorName: e.target.value },
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Nota</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  step="0.1"
                                  value={edit.rating}
                                  onChange={(e) =>
                                    setReviewEdits({
                                      ...reviewEdits,
                                      [r.id]: { ...edit, rating: e.target.value },
                                    })
                                  }
                                  dir="ltr"
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Origem</Label>
                                <select
                                  className="h-9 rounded-md border bg-background px-3 text-sm"
                                  value={edit.source}
                                  onChange={(e) =>
                                    setReviewEdits({
                                      ...reviewEdits,
                                      [r.id]: { ...edit, source: e.target.value as 'site' | 'booking' },
                                    })
                                  }
                                >
                                  <option value="booking">Booking</option>
                                  <option value="site">Site</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                  className="h-9 rounded-md border bg-background px-3 text-sm"
                                  value={edit.status}
                                  onChange={(e) =>
                                    setReviewEdits({
                                      ...reviewEdits,
                                      [r.id]: {
                                        ...edit,
                                        status: e.target.value as 'pending' | 'approved' | 'rejected',
                                      },
                                    })
                                  }
                                >
                                  <option value="approved">Aprovada</option>
                                  <option value="pending">Pendente</option>
                                  <option value="rejected">Rejeitada</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Comentário</Label>
                              <Textarea
                                rows={4}
                                value={edit.text}
                                onChange={(e) =>
                                  setReviewEdits({
                                    ...reviewEdits,
                                    [r.id]: { ...edit, text: e.target.value },
                                  })
                                }
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="bg-primary text-primary-foreground"
                                disabled={updateReview.isPending}
                                onClick={() =>
                                  updateReview.mutate({
                                    id: r.id,
                                    authorName: edit.authorName,
                                    rating: Number(edit.rating),
                                    text: edit.text,
                                    source: edit.source,
                                    status: edit.status,
                                  })
                                }
                              >
                                <Save className="me-1 h-4 w-4" /> Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setReviewEdits((current) => {
                                    const next = { ...current }
                                    delete next[r.id]
                                    return next
                                  })
                                }
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">
                                  {r.authorName}
                                  <span className="ms-2 rounded-full bg-[#003087]/10 px-2 py-0.5 text-xs font-semibold text-[#003087]">
                                    {r.source === 'booking' ? 'Booking' : 'Site'} · {r.rating}
                                    {r.source === 'booking' ? '/10' : '/5'}
                                  </span>
                                </p>
                                {r.source === 'site' && (
                                  <div className="mt-1 flex gap-0.5 text-amber-500">
                                    {Array.from({ length: Math.min(5, Math.round(r.rating)) }).map((_, i) => (
                                      <Star key={i} className="h-4 w-4 fill-current" />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    r.status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : r.status === 'pending'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {r.status === 'approved'
                                    ? d.admin.statusApproved
                                    : r.status === 'pending'
                                      ? d.admin.statusPending
                                      : d.admin.statusRejected}
                                </span>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">{r.text}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {r.status !== 'approved' && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 text-white hover:bg-green-700"
                                  onClick={() => approve.mutate({ id: r.id })}
                                >
                                  <Check className="me-1 h-4 w-4" /> {d.admin.approve}
                                </Button>
                              )}
                              {r.status !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => reject.mutate({ id: r.id })}
                                >
                                  <X className="me-1 h-4 w-4" /> Despublicar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setReviewEdits({
                                    ...reviewEdits,
                                    [r.id]: {
                                      authorName: r.authorName,
                                      rating: String(r.rating),
                                      text: r.text,
                                      source: r.source,
                                      status: r.status,
                                    },
                                  })
                                }
                              >
                                <Pencil className="me-1 h-4 w-4" /> Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={removeReview.isPending}
                                onClick={() => {
                                  if (window.confirm('Deseja realmente excluir esta avaliação?')) {
                                    removeReview.mutate({ id: r.id })
                                  }
                                }}
                              >
                                <Trash2 className="me-1 h-4 w-4" /> Excluir
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}


            {/* ---------------- Bookings ---------------- */}
            {tab === 'bookings' && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h2 className="font-serif-display text-2xl font-semibold">
                    {d.admin.bookingsTab}
                  </h2>
                  {bookings.data?.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {d.admin.noBookingsAdmin}
                    </p>
                  )}
                  <ul className="mt-4 space-y-3">
                    {bookings.data?.map((b) => {
                      const statusColor =
                        b.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : b.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                      return (
                        <li key={b.id} className="rounded-xl border p-4 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold">{b.guestName}</p>
                              <p className="text-muted-foreground">
                                {d.rooms.items[b.roomId as 'luxo' | 'marrok' | 'sonhos']?.name ??
                                  b.roomId}{' '}
                                · <span dir="ltr">{b.checkIn} → {b.checkOut}</span> · {b.guests}{' '}
                                {d.booking.guestSuffix}
                                {b.pets > 0 ? ` · ${b.pets} ${d.booking.petSuffix}` : ''}
                                {b.phone ? ` · ${b.phone}` : ''}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}
                            >
                              {b.status === 'confirmed'
                                ? d.admin.statusApproved
                                : b.status === 'cancelled'
                                  ? d.admin.statusRejected
                                  : d.admin.statusPending}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {b.status !== 'confirmed' && (
                              <Button
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700"
                                onClick={() =>
                                  setBkStatus.mutate({ id: b.id, status: 'confirmed' })
                                }
                                disabled={setBkStatus.isPending}
                              >
                                <Check className="me-1.5 h-3.5 w-3.5" /> {d.admin.confirmBooking}
                              </Button>
                            )}
                            {b.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  setBkStatus.mutate({ id: b.id, status: 'cancelled' })
                                }
                                disabled={setBkStatus.isPending}
                              >
                                <X className="me-1.5 h-3.5 w-3.5" /> {d.admin.rejectBooking}
                              </Button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* ---------------- Site data ---------------- */}
            {tab === 'site' && (
              <Card className="mt-6 max-w-2xl">
                <CardContent className="p-6">
                  <h2 className="font-serif-display text-2xl font-semibold">
                    {d.admin.siteTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{d.admin.siteHint}</p>
                  <form
                    className="mt-5 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      saveSite.mutate(siteForm)
                    }}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{d.admin.wa1Label}</Label>
                        <Input
                          value={siteForm.whatsappPrimary}
                          onChange={(e) =>
                            setSiteForm((f) => ({ ...f, whatsappPrimary: e.target.value }))
                          }
                          required
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{d.admin.wa2Label}</Label>
                        <Input
                          value={siteForm.whatsappSecondary}
                          onChange={(e) =>
                            setSiteForm((f) => ({ ...f, whatsappSecondary: e.target.value }))
                          }
                          required
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{d.admin.pixKeyLabel2}</Label>
                        <Input
                          value={siteForm.pixKey}
                          onChange={(e) => setSiteForm((f) => ({ ...f, pixKey: e.target.value }))}
                          required
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{d.admin.pixOwnerLabel}</Label>
                        <Input
                          value={siteForm.pixOwner}
                          onChange={(e) =>
                            setSiteForm((f) => ({ ...f, pixOwner: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{d.admin.paypalLabel}</Label>
                        <Input
                          type="email"
                          value={siteForm.paypalEmail}
                          onChange={(e) =>
                            setSiteForm((f) => ({ ...f, paypalEmail: e.target.value }))
                          }
                          required
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{d.admin.tudoLabel}</Label>
                        <Input
                          value={siteForm.tudoAppUrl}
                          onChange={(e) =>
                            setSiteForm((f) => ({ ...f, tudoAppUrl: e.target.value }))
                          }
                          dir="ltr"
                          placeholder="https://"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="bg-primary text-primary-foreground"
                      disabled={saveSite.isPending}
                    >
                      {siteSaved ? d.admin.siteSaved : d.admin.save}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ---------------- Analytics / marketing ---------------- */}
            {tab === 'analytics' && (
              <Card className="mt-6 max-w-2xl">
                <CardContent className="p-6">
                  <h2 className="font-serif-display text-2xl font-semibold">
                    {d.admin.analyticsTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{d.admin.analyticsHint}</p>
                  <form
                    className="mt-5 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      saveAnalytics.mutate(analyticsForm)
                    }}
                  >
                    <div className="space-y-2">
                      <Label>{d.admin.gaIdLabel}</Label>
                      <Input
                        value={analyticsForm.gaId}
                        onChange={(e) =>
                          setAnalyticsForm((f) => ({ ...f, gaId: e.target.value.trim() }))
                        }
                        dir="ltr"
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{d.admin.gscLabel}</Label>
                      <Input
                        value={analyticsForm.gscVerification}
                        onChange={(e) =>
                          setAnalyticsForm((f) => ({
                            ...f,
                            gscVerification: e.target.value.trim(),
                          }))
                        }
                        dir="ltr"
                        placeholder="google-site-verification token"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{d.admin.metaPixelLabel}</Label>
                      <Input
                        value={analyticsForm.metaPixelId}
                        onChange={(e) =>
                          setAnalyticsForm((f) => ({
                            ...f,
                            metaPixelId: e.target.value.trim(),
                          }))
                        }
                        dir="ltr"
                        placeholder="1234567890123456"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-primary text-primary-foreground"
                      disabled={saveAnalytics.isPending}
                    >
                      {analyticsSaved ? d.admin.siteSaved : d.admin.save}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ---------------- Coupons ---------------- */}
            {tab === 'coupons' && (
              <div className="mt-6">
                <CouponsManager />
              </div>
            )}

            {tab === 'users' && <UsersManager />}

            {/* ---------------- Stats dashboard ---------------- */}
            {tab === 'stats' && (
              <div className="mt-6">
                <StatsDashboard />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
