import { calculateNights } from "./booking-rules";

type BookingLike = {
  checkIn: string;
  checkOut: string;
  roomId: string;
  status: "pending" | "confirmed" | "cancelled";
  totalCents?: number | null;
};

type SuitePrices = Record<string, number>;

export function buildBookingStats(bookings: BookingLike[], prices: SuitePrices) {
  const active = bookings.filter((booking) => booking.status !== "cancelled");
  let bookedNights = 0;
  let revenue = 0;
  const months = new Map<string, { bookings: number; nights: number; revenue: number }>();

  for (const booking of active) {
    const nights = calculateNights(booking.checkIn, booking.checkOut);
    if (!Number.isFinite(nights) || nights <= 0) continue;
    const nightly = prices[booking.roomId] ?? prices.marrok ?? 0;
    const totalCents = Number(booking.totalCents ?? 0);
    const value =
      Number.isFinite(totalCents) && totalCents > 0
        ? Math.round(totalCents / 100)
        : nights * nightly;
    bookedNights += nights;
    revenue += value;
    const key = String(booking.checkIn).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) continue;
    const month = months.get(key) ?? { bookings: 0, nights: 0, revenue: 0 };
    month.bookings += 1;
    month.nights += nights;
    month.revenue += value;
    months.set(key, month);
  }

  return {
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === "pending").length,
    confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
    cancelled: bookings.filter((booking) => booking.status === "cancelled").length,
    bookedNights,
    revenue,
    monthly: [...months.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([month, values]) => ({ month, ...values })),
  };
}
