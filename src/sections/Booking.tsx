import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Moon,
  ShieldAlert,
  Users,
  CheckCircle2,
  Wallet,
  MessageCircle,
  PawPrint,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBookingRoom } from "@/hooks/useBookingRoom";
import { translations } from "@/i18n/translations";
import { trpc } from "@/providers/trpc";
import { ROOM_DATA, type RoomId } from "@/data/rooms";
import { useSite } from "@/hooks/useSite";
import {
  MAX_PETS,
  PET_FEE_HIGH,
  PET_FEE_LOW,
  petFeeTotal,
  splitNightsBySeason,
} from "@/lib/petFee";
import {
  PAYMENT_FEE_BPS,
  basisPointsOfCents,
  calculateBookingPricing,
  centsToReais,
  type PaymentMethod,
} from "@contracts/pricing";

/* ---------- date helpers ---------- */
const DAY_MS = 86_400_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function sameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Blocked dates ("YYYY-MM-DD") come from the Booking.com iCal sync. */
export type BlockedSet = Set<string>;
const EMPTY_ICAL: Record<"luxo" | "marrok" | "sonhos", string[]> = {
  luxo: [],
  marrok: [],
  sonhos: [],
};

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function uniqueValue(values: number[]) {
  if (values.length === 0) return null;
  const [first] = values;
  return values.every(value => value === first) ? first : null;
}

function nightlyDisplay(values: number[], fmtMoney: (value: number) => string) {
  const unique = uniqueValue(values);
  if (unique !== null) return fmtMoney(unique);
  if (values.length === 0) return "—";
  return `${fmtMoney(Math.min(...values))}–${fmtMoney(Math.max(...values))}`;
}

/* ---------- single month grid ---------- */
interface MonthProps {
  month: Date;
  today: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  onPick: (d: Date) => void;
  weekdays: string[];
  monthName: string;
  fmtNum: (n: number) => string;
  blocked: BlockedSet;
}

function MonthGrid({
  month,
  today,
  checkIn,
  checkOut,
  onPick,
  weekdays,
  monthName,
  fmtNum,
  blocked,
}: MonthProps) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const firstOffset = new Date(year, m, 1).getDay(); // 0 = Sunday

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, m, i + 1)),
  ];

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-3 text-center font-serif-display text-lg font-semibold capitalize">
        {monthName}{" "}
        <span className="text-muted-foreground">{fmtNum(year)}</span>
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted-foreground">
        {weekdays.map((w, i) => (
          <div key={i} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const past = date.getTime() < today.getTime();
          const booked = !past && blocked.has(toKey(date));
          const isIn = checkIn && sameDay(date, checkIn);
          const isOut = checkOut && sameDay(date, checkOut);
          const inRange =
            checkIn && checkOut && date > checkIn && date < checkOut && !booked;
          const disabled = past || booked;

          return (
            <button
              key={date.getTime()}
              type="button"
              disabled={disabled}
              onClick={() => onPick(date)}
              className={`flex aspect-square items-center justify-center rounded-full text-sm transition-colors ${
                isIn || isOut
                  ? "bg-primary font-semibold text-primary-foreground"
                  : inRange
                    ? "bg-primary/15 font-medium text-foreground"
                    : booked
                      ? "cursor-not-allowed bg-muted text-muted-foreground/40 line-through"
                      : past
                        ? "cursor-not-allowed text-muted-foreground/30"
                        : "text-foreground hover:bg-primary/20"
              } ${!disabled && !isIn && !isOut && sameDay(date, today) ? "ring-1 ring-primary" : ""}`}
            >
              {fmtNum(date.getDate())}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- main section ---------- */
export default function Booking() {
  const ref = useReveal<HTMLElement>();
  const { d, locale, intlLocale } = useLanguage();
  const { roomId, setRoomId } = useBookingRoom();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState(() => monthStart(new Date()));
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState("2");
  const [pets, setPets] = useState("0");
  const [sent, setSent] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod | null>(null);

  const room = ROOM_DATA.find(r => r.id === roomId) ?? ROOM_DATA[0];

  const pricing = trpc.settings.pricing.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const site = useSite();
  const createBooking = trpc.bookings.create.useMutation();

  // Per-suite pricing: use the selected suite's Booking.com rate
  const suitePrices = pricing.data?.suitePrices;
  const bookingNightly =
    suitePrices?.[roomId as keyof typeof suitePrices] ??
    pricing.data?.bookingNightly ??
    420;

  // Solo travelers (1 guest) save R$5/night

  const nights =
    checkIn && checkOut
      ? Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS)
      : 0;

  // Minimum nights: suite default + strictest per-date override in the stay
  const minDefaults = trpc.minNights.defaults.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const suiteDefaultMin =
    minDefaults.data?.[roomId as "luxo" | "marrok" | "sonhos"] ?? 2;
  const minForStay = trpc.minNights.forStay.useQuery(
    {
      roomId: roomId as "luxo" | "marrok" | "sonhos",
      checkIn: checkIn ? toKey(checkIn) : "",
      checkOut: checkOut ? toKey(checkOut) : "",
    },
    { enabled: !!checkIn && !!checkOut, staleTime: 60_000 }
  );
  const effectiveMin = minForStay.data ?? suiteDefaultMin;

  // Maximum nights: suite default (14) + strictest per-date override
  const maxDefaults = trpc.minNights.maxDefaults.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const suiteDefaultMax =
    maxDefaults.data?.[roomId as "luxo" | "marrok" | "sonhos"] ?? 14;
  const maxForStay = trpc.minNights.maxForStay.useQuery(
    {
      roomId: roomId as "luxo" | "marrok" | "sonhos",
      checkIn: checkIn ? toKey(checkIn) : "",
      checkOut: checkOut ? toKey(checkOut) : "",
    },
    { enabled: !!checkIn && !!checkOut, staleTime: 60_000 }
  );
  const effectiveMax = maxForStay.data ?? suiteDefaultMax;

  // Dias indisponíveis: sincronizados do Booking.com (iCal) + fechados
  // manualmente pelo dono no painel admin — atualiza a cada 15 s.
  const ical = trpc.availability.booked.useQuery(
    {},
    { refetchInterval: 15_000 }
  );
  const winFrom = checkIn ? toKey(checkIn) : toKey(today);
  const winToDate = new Date(today.getTime() + 370 * DAY_MS);
  const winTo = toKey(winToDate);
  const manual = trpc.availability.blockedDays.useQuery(
    {
      roomId: roomId as "luxo" | "marrok" | "sonhos",
      from: winFrom,
      to: winTo,
    },
    { refetchInterval: 15_000 }
  );
  const blockedSet = useMemo(() => {
    const s = new Set<string>();
    const all = ical.data as unknown as Record<string, string[]> | undefined;
    const icalDays =
      all?.[roomId] ?? EMPTY_ICAL[roomId as "luxo" | "marrok" | "sonhos"];
    for (const day of icalDays) s.add(day);
    for (const day of manual.data ?? []) s.add(day);
    return s;
  }, [ical.data, manual.data, roomId]);

  // Per-date price overrides (owner-set in the admin price calendar)
  const dateOverrides = trpc.datePrices.forStay.useQuery(
    {
      roomId,
      checkIn: checkIn ? toKey(checkIn) : "",
      checkOut: checkOut ? toKey(checkOut) : "",
    },
    { enabled: !!checkIn && !!checkOut, staleTime: 60_000 }
  );

  /* ---- pet fee (R$80/night Sep–Mar · R$50/night Apr–Aug, per pet) ---- */
  const petCount = Number(pets);
  const seasonNights = useMemo(
    () =>
      checkIn && checkOut
        ? splitNightsBySeason(checkIn, checkOut)
        : { high: 0, low: 0 },
    [checkIn, checkOut]
  );
  const petHighFee = seasonNights.high * PET_FEE_HIGH * petCount;
  const petLowFee = seasonNights.low * PET_FEE_LOW * petCount;
  const petFee =
    petCount > 0
      ? petFeeTotal(seasonNights.high, seasonNights.low, petCount)
      : 0;

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(v);

  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const couponQuery = trpc.coupons.validate.useQuery(
    { code: couponCode },
    { enabled: couponCode.length >= 3, retry: false, staleTime: 60_000 }
  );
  const appliedCoupon =
    couponCode && couponQuery.data?.valid ? couponQuery.data : null;

  const nightlyDirectPrices = useMemo(() => {
    if (!checkIn || !checkOut) return [];
    const prices = [];
    for (let t = checkIn.getTime(); t < checkOut.getTime(); t += DAY_MS) {
      const date = toKey(new Date(t));
      prices.push({
        date,
        price: dateOverrides.data?.[date] ?? bookingNightly,
      });
    }
    return prices;
  }, [checkIn, checkOut, dateOverrides.data, bookingNightly]);

  const priceSummary = useMemo(
    () =>
      calculateBookingPricing({
        nightlyDirectPrices,
        pets: petCount,
        petFee,
        couponPercent: appliedCoupon?.percent,
        paymentMethod: payMethod,
      }),
    [nightlyDirectPrices, petCount, petFee, appliedCoupon?.percent, payMethod]
  );

  const directTotal = centsToReais(priceSummary.lodgingSubtotalCents);
  const couponDiscount = centsToReais(priceSummary.couponDiscountCents);
  const directSavings = centsToReais(priceSummary.directSavingsCents);
  const grandTotal = centsToReais(priceSummary.totalCents);
  const depositBase = centsToReais(priceSummary.depositBaseCents);
  const depositFee = centsToReais(priceSummary.depositDueCents);
  const cardOrPaypalDeposit = centsToReais(
    priceSummary.depositBaseCents +
      basisPointsOfCents(priceSummary.depositBaseCents, PAYMENT_FEE_BPS)
  );
  const platformNightlyLabel = nightlyDisplay(
    priceSummary.lines.map(line => line.platformCents),
    value => fmtMoney(centsToReais(value))
  );
  const directNightlyLabel = nightlyDisplay(
    priceSummary.lines.map(line => line.directCents),
    value => fmtMoney(centsToReais(value))
  );
  const uniformDirectNightly = uniqueValue(
    priceSummary.lines.map(line => line.directCents)
  );

  const fmtNum = (n: number) =>
    new Intl.NumberFormat(intlLocale, { useGrouping: false }).format(n);

  const fmtDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat(intlLocale, {
          day: "numeric",
          month: "short",
        }).format(date)
      : d.booking.notSelected;

  const pick = (date: Date) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    if (date.getTime() <= checkIn.getTime()) {
      setCheckIn(date);
      return;
    }
    // Não permite atravessar um dia bloqueado/fechado
    for (let t = checkIn.getTime(); t < date.getTime(); t += DAY_MS) {
      if (blockedSet.has(toKey(new Date(t)))) {
        setCheckIn(date);
        setCheckOut(null);
        return;
      }
    }
    // Enforce the minimum stay: push check-out forward when needed
    if (date.getTime() - checkIn.getTime() < suiteDefaultMin * DAY_MS) {
      setCheckOut(new Date(checkIn.getTime() + suiteDefaultMin * DAY_MS));
      return;
    }
    setCheckOut(date);
  };

  const canPrev = view.getTime() > monthStart(today).getTime();
  // allow bookings up to the end of 2055
  const maxMonth = new Date(2055, 11, 1);
  const canNext = view.getTime() < maxMonth.getTime();

  const months = [view, addMonths(view, 1)];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (nights === 0 || !checkIn || !checkOut) return;
    if (nights < effectiveMin) return;
    if (nights > effectiveMax) return;

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("bk-name") ?? "");
    const phone = String(fd.get("bk-phone") ?? "");

    // ── Bilingual WhatsApp confirmation: guest's site language first, Portuguese second ──
    const ptBk = translations.pt.booking;
    const gBk = d.booking; // guest's chosen language
    const fmtMoneyBRL = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const fmtDateLocale = (dt: Date) => dt.toLocaleDateString(intlLocale);
    const fmtDatePT = (dt: Date) => dt.toLocaleDateString("pt-BR");
    const nightsWord = (n: number, bk: typeof ptBk) =>
      `${n} ${n === 1 ? bk.waNightSingular : bk.waNightPlural}`;

    // room name in each language (fallback PT)
    const roomNameGuest =
      d.rooms.items[roomId]?.name ?? translations.pt.rooms.items[roomId].name;
    const roomNamePT = translations.pt.rooms.items[roomId].name;

    const hasFee = payMethod === "card" || payMethod === "paypal";
    const depositShown = hasFee ? depositFee : depositBase;
    const depositLabel = (bk: typeof ptBk) =>
      `${bk.waDeposit} ${hasFee ? bk.waDepositFee : bk.waDepositNoFee}`;
    const methodRequestFor = (bk: typeof ptBk) =>
      payMethod === "pix"
        ? bk.waMethodPix
        : payMethod === "card"
          ? bk.waMethodCard
          : bk.waMethodPaypal;

    const buildMsg = (
      bk: typeof ptBk,
      roomName: string,
      dateFmt: (d: Date) => string
    ) =>
      [
        bk.waHello,
        bk.waTitle,
        `${bk.waGuestName}: ${name}`,
        `${bk.waSuite}: ${roomName}`,
        `${bk.waCheckIn}: ${dateFmt(checkIn)} (14:00)`,
        `${bk.waCheckOut}: ${dateFmt(checkOut)} (12:00)`,
        `${bk.waNights}: ${nightsWord(nights, bk)}`,
        `${bk.waGuests}: ${guests}`,
        ...(petCount > 0 ? [`${bk.waPets}: ${petCount}`] : []),
        `${bk.waTotal}: ${fmtMoneyBRL(grandTotal)}`,
        `${depositLabel(bk)}: ${fmtMoneyBRL(depositShown)} (${methodRequestFor(bk)})`,
        bk.waPolicy,
        bk.waProof,
        bk.waSupport,
        bk.waFinal,
        bk.waBye,
      ].join("\n\n");

    const guestMsg = buildMsg(gBk, roomNameGuest, fmtDateLocale);
    const ptMsg = buildMsg(ptBk, roomNamePT, fmtDatePT);
    const text =
      locale === "pt"
        ? ptMsg
        : `${guestMsg}\n\n(Versão em Português)\n\n${ptMsg}`;
    setSummaryText(text);

    // Save the booking request (linked to the account when logged in)
    createBooking.mutate({
      guestName: name || "Hóspede",
      roomId,
      checkIn: checkIn.toISOString().slice(0, 10),
      checkOut: checkOut.toISOString().slice(0, 10),
      guests: Number(guests),
      pets: petCount,
      phone,
      couponCode: appliedCoupon?.code,
      paymentMethod: payMethod,
    });

    window.open(
      `https://wa.me/${site.whatsappPrimary}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
    setSent(true);
  };

  const reset = () => {
    setSent(false);
    setCheckIn(null);
    setCheckOut(null);
  };

  return (
    <section id="reservas" ref={ref} className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {d.booking.kicker}
          </p>
          <div className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-accent/15 px-5 py-2 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40">
            {d.booking.directBadge}
          </div>
          <h2 className="font-serif-display text-4xl font-semibold sm:text-5xl">
            {d.booking.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {d.booking.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          {/* Calendar */}
          <div className="reveal min-w-0 rounded-2xl border bg-card p-5 shadow-lg sm:p-7 lg:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => canPrev && setView(addMonths(view, -1))}
                disabled={!canPrev}
                aria-label={d.booking.prevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              </button>
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                {d.booking.hint}
              </p>
              <button
                type="button"
                onClick={() => canNext && setView(addMonths(view, 1))}
                disabled={!canNext}
                aria-label={d.booking.nextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5 rtl:rotate-180" />
              </button>
            </div>

            <div className="flex flex-col gap-8 sm:flex-row sm:gap-6">
              {months.map(m => (
                <MonthGrid
                  key={m.getTime()}
                  month={m}
                  today={today}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onPick={pick}
                  weekdays={d.calendar.weekdays}
                  monthName={d.calendar.months[m.getMonth()]}
                  fmtNum={fmtNum}
                  blocked={blockedSet}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary" />{" "}
                {d.booking.legendSelected}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border border-primary/40" />{" "}
                {d.booking.legendAvailable}
              </span>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
              <Moon className="h-3.5 w-3.5 text-primary/70" />
              {d.booking.minNightsNote.replace("{n}", fmtNum(effectiveMin))}
              {" · "}
              {d.booking.maxNightsNote.replace("{n}", fmtNum(effectiveMax))}
            </p>
          </div>

          {/* Summary + form */}
          <div className="reveal min-w-0 lg:col-span-2">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-lg">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
                <h3 className="mt-6 font-serif-display text-3xl font-semibold">
                  {d.booking.successTitle}
                </h3>
                <p className="mt-3 text-muted-foreground">
                  {d.booking.successText}
                </p>
                <div className="mt-6 w-full rounded-xl bg-muted p-4 text-sm">
                  <p className="flex justify-between">
                    <span>{d.booking.checkIn}</span>
                    <strong>{fmtDate(checkIn)}</strong>
                  </p>
                  <p className="mt-1 flex justify-between">
                    <span>{d.booking.checkOut}</span>
                    <strong>{fmtDate(checkOut)}</strong>
                  </p>
                  <p className="mt-1 flex justify-between">
                    <span>{d.rooms.items[roomId].name}</span>
                    <strong>
                      {fmtNum(nights)} {d.booking.nightsLabel}
                    </strong>
                  </p>
                </div>
                <p className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
                  {d.booking.paymentNotice}
                </p>

                {/* Portuguese summary to BOTH WhatsApp numbers */}
                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {d.booking.summaryPtNote}
                </p>
                <div className="mt-2 grid w-full gap-2">
                  <Button
                    asChild
                    className="bg-[#25D366] text-white hover:bg-[#20bd5a]"
                  >
                    <a
                      href={`https://wa.me/${site.whatsappPrimary}?text=${encodeURIComponent(summaryText)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="me-2 h-4 w-4" />{" "}
                      {d.booking.sendToDomingos}
                    </a>
                  </Button>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="mt-4 w-full bg-primary text-primary-foreground"
                >
                  <a
                    href={`/pagamento?room=${roomId}&ci=${checkIn?.toISOString().slice(0, 10)}&co=${checkOut?.toISOString().slice(0, 10)}&n=${nights}&pets=${petCount}&g=${guests}&pay=${payMethod ?? "pix"}${appliedCoupon ? `&coupon=${encodeURIComponent(appliedCoupon.code)}` : ""}`}
                  >
                    <Wallet className="me-2 h-5 w-5" /> {d.payment.title}
                  </a>
                </Button>

                <Button variant="outline" className="mt-4" onClick={reset}>
                  {d.booking.again}
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex h-full min-w-0 flex-col rounded-2xl border bg-card p-6 shadow-lg sm:p-7"
              >
                <h3 className="flex items-center gap-2 font-serif-display text-2xl font-semibold">
                  {d.booking.summaryTitle}
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-3 text-center min-[360px]:grid-cols-3">
                  <div className="rounded-xl bg-muted p-3">
                    <p className="text-xs text-muted-foreground">
                      {d.booking.checkIn}
                    </p>
                    <p className="mt-1 font-semibold">{fmtDate(checkIn)}</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <p className="text-xs text-muted-foreground">
                      {d.booking.checkOut}
                    </p>
                    <p className="mt-1 font-semibold">{fmtDate(checkOut)}</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Moon className="h-3.5 w-3.5" /> {d.booking.nightsLabel}
                    </p>
                    <p className="mt-1 font-semibold">{fmtNum(nights)}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{d.booking.roomLabel}</Label>
                    <Select
                      value={roomId}
                      onValueChange={v => setRoomId(v as RoomId)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_DATA.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {d.rooms.items[r.id].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {d.booking.guestsLabel}
                    </Label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: room.maxGuests }, (_, i) =>
                          String(i + 1)
                        ).map(n => (
                          <SelectItem key={n} value={n}>
                            {fmtNum(Number(n))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <PawPrint className="h-3.5 w-3.5" /> {d.booking.petsLabel}
                    </Label>
                    <Select value={pets} onValueChange={setPets}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: MAX_PETS + 1 }, (_, i) =>
                          String(i)
                        ).map(n => (
                          <SelectItem key={n} value={n}>
                            {fmtNum(Number(n))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Estimativa da estadia — valores calculados pela regra de pricing existente */}
                <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <p className="text-sm font-semibold">
                    {d.booking.estimateTitle}
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="grid gap-1 text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
                      <span className="min-w-0 text-xs font-medium sm:text-sm">
                        {d.booking.platformRate}
                      </span>
                      <span className="break-words text-sm line-through sm:text-right sm:text-base">
                        {nights > 0 ? platformNightlyLabel : "—"}
                      </span>
                    </p>
                    <p className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
                      <span className="flex min-w-0 items-center gap-1.5 font-medium text-primary">
                        <Tag className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 text-xs sm:text-sm">
                          {d.booking.directRate}
                        </span>
                      </span>
                      <span className="break-words text-base font-semibold text-primary sm:text-right sm:text-lg">
                        {nights > 0 ? directNightlyLabel : "—"}
                      </span>
                    </p>
                    <p className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 sm:text-sm">
                        {d.booking.savingRate}
                      </span>
                      <span className="w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 sm:justify-self-end">
                        −5%
                      </span>
                    </p>

                    {/* Subtotal: preço direto × noites */}
                    {nights > 0 && (
                      <p className="grid gap-1 border-t border-primary/20 pt-2 text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
                        <span>
                          {fmtNum(nights)} {d.booking.nightsLabel}
                          {uniformDirectNightly !== null
                            ? ` × ${fmtMoney(centsToReais(uniformDirectNightly))}`
                            : ""}
                        </span>
                        <span className="font-medium text-foreground sm:text-right">
                          {fmtMoney(directTotal)}
                        </span>
                      </p>
                    )}

                    {nights > 0 && (
                      <div className="border-t border-primary/20 pt-2">
                        {appliedCoupon ? (
                          <p className="flex items-baseline justify-between text-sm text-emerald-700 dark:text-emerald-300">
                            <span>
                              {appliedCoupon.code} (-
                              {fmtNum(appliedCoupon.percent)}%)
                              <button
                                type="button"
                                className="ms-2 text-xs text-muted-foreground underline"
                                onClick={() => {
                                  setCouponCode("");
                                  setCouponInput("");
                                }}
                              >
                                remover
                              </button>
                            </span>
                            <span className="font-semibold">
                              -{fmtMoney(couponDiscount)}
                            </span>
                          </p>
                        ) : (
                          <div className="grid gap-2 min-[380px]:grid-cols-[minmax(0,1fr)_auto]">
                            <Input
                              value={couponInput}
                              onChange={e =>
                                setCouponInput(e.target.value.toUpperCase())
                              }
                              placeholder="Cupom"
                              className="h-9 min-w-0 text-sm uppercase"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9"
                              disabled={
                                couponInput.trim().length < 3 ||
                                couponQuery.isFetching
                              }
                              onClick={() =>
                                setCouponCode(couponInput.trim().toUpperCase())
                              }
                            >
                              Aplicar
                            </Button>
                          </div>
                        )}
                        {couponCode &&
                          couponQuery.data &&
                          !couponQuery.data.valid && (
                            <p className="mt-1.5 text-xs text-destructive">
                              {couponQuery.data.reason === "expired_coupon"
                                ? d.booking.couponExpired
                                : couponQuery.data.reason ===
                                    "coupon_not_started"
                                  ? d.booking.couponNotStarted
                                  : d.booking.couponInvalid}
                            </p>
                          )}
                      </div>
                    )}

                    {/* Pet fee breakdown */}
                    {nights > 0 && petCount > 0 && (
                      <>
                        {seasonNights.high > 0 && (
                          <p className="flex items-baseline justify-between text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <PawPrint className="h-3.5 w-3.5 text-primary/70" />
                              {fmtNum(petCount)} {d.booking.petSuffix} ×{" "}
                              {fmtNum(seasonNights.high)}{" "}
                              {d.booking.nightsLabel} × {fmtMoney(PET_FEE_HIGH)}
                              <span className="text-xs">
                                ({d.booking.petSeasonShort})
                              </span>
                            </span>
                            <span className="font-medium text-foreground">
                              {fmtMoney(petHighFee)}
                            </span>
                          </p>
                        )}
                        {seasonNights.low > 0 && (
                          <p className="flex items-baseline justify-between text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <PawPrint className="h-3.5 w-3.5 text-primary/70" />
                              {fmtNum(petCount)} {d.booking.petSuffix} ×{" "}
                              {fmtNum(seasonNights.low)} {d.booking.nightsLabel}{" "}
                              × {fmtMoney(PET_FEE_LOW)}
                              <span className="text-xs">
                                ({d.booking.petOffShort})
                              </span>
                            </span>
                            <span className="font-medium text-foreground">
                              {fmtMoney(petLowFee)}
                            </span>
                          </p>
                        )}
                      </>
                    )}

                    <p className="grid gap-1 border-t border-primary/20 pt-2 text-base font-bold sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4">
                      <span>{d.booking.grandTotal}</span>
                      <span className="sm:text-right">
                        {nights > 0 ? (
                          <span className="text-primary">
                            {fmtMoney(grandTotal)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </span>
                    </p>
                    {/* Economia total vs. plataforma (5% direto + cupom) */}
                    {nights > 0 && directSavings + couponDiscount > 0 && (
                      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {d.booking.youSave}{" "}
                        {fmtMoney(directSavings + couponDiscount)}
                      </p>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {d.booking.directNote}
                  </p>
                  {petCount > 0 && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                      <PawPrint className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
                      {d.booking.petFeeInfo}
                    </p>
                  )}
                </div>

                {/* Payment rules */}
                <div className="mt-5 flex items-start gap-3 rounded-xl border bg-muted p-4">
                  <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      {d.booking.paymentTitle}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {d.booking.paymentText}
                    </p>
                  </div>
                </div>

                {/* Cancellation policy */}
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {d.booking.cancellationTitle}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                      {d.booking.cancellationText}
                    </p>
                  </div>
                </div>

                {/* Guest details */}
                <div className="mt-5 space-y-4">
                  <p className="text-sm font-semibold">{d.booking.formTitle}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bk-name">{d.booking.formName}</Label>
                      <Input
                        id="bk-name"
                        name="bk-name"
                        placeholder={d.booking.formNamePh}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bk-email">{d.booking.formEmail}</Label>
                      <Input
                        id="bk-email"
                        name="bk-email"
                        type="email"
                        placeholder={d.booking.formEmailPh}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bk-phone">{d.booking.formPhone}</Label>
                    <Input
                      id="bk-phone"
                      name="bk-phone"
                      type="tel"
                      placeholder={d.booking.formPhonePh}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bk-msg">{d.booking.formMessage}</Label>
                    <Textarea
                      id="bk-msg"
                      name="bk-msg"
                      placeholder={d.booking.formMessagePh}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Deposit payment method — required before sending */}
                <div className="mt-6 space-y-2">
                  <Label>{d.payment.payChooseTitle}</Label>
                  <RadioGroup
                    value={payMethod ?? ""}
                    onValueChange={v =>
                      setPayMethod(v as "pix" | "card" | "paypal")
                    }
                    className="space-y-2"
                  >
                    <label
                      htmlFor="bk-pay-pix"
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${
                        payMethod === "pix"
                          ? "border-[#32BCAD] bg-[#32BCAD]/5"
                          : "border-border hover:border-[#32BCAD]/50"
                      }`}
                    >
                      <RadioGroupItem value="pix" id="bk-pay-pix" />
                      <span className="text-sm font-medium">
                        {d.payment.payChooseShortPix}
                      </span>
                      <span className="ms-auto text-sm font-bold text-[#12877a]">
                        {fmtMoney(depositBase)}
                      </span>
                    </label>
                    <label
                      htmlFor="bk-pay-card"
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${
                        payMethod === "card"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="card" id="bk-pay-card" />
                      <span className="text-sm font-medium">
                        {d.payment.payChooseShortCard}
                      </span>
                      <span className="ms-auto text-sm font-bold text-primary">
                        {fmtMoney(cardOrPaypalDeposit)}
                      </span>
                    </label>
                    <label
                      htmlFor="bk-pay-paypal"
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${
                        payMethod === "paypal"
                          ? "border-[#003087] bg-[#003087]/5"
                          : "border-border hover:border-[#003087]/50"
                      }`}
                    >
                      <RadioGroupItem value="paypal" id="bk-pay-paypal" />
                      <span className="text-sm font-medium">
                        {d.payment.payChooseShortPaypal}
                      </span>
                      <span className="ms-auto text-sm font-bold text-[#003087]">
                        {fmtMoney(cardOrPaypalDeposit)}
                      </span>
                    </label>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={nights === 0 || !payMethod}
                  className="mt-6 w-full bg-[#25D366] text-white hover:bg-[#20bd5a] disabled:opacity-50"
                >
                  <MessageCircle className="me-2 h-5 w-5" />
                  {nights === 0
                    ? d.booking.selectDatesFirst
                    : !payMethod
                      ? d.payment.chooseFirst
                      : d.booking.submit}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
