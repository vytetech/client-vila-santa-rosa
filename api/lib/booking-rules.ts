import { TRPCError } from "@trpc/server";

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateNights(checkIn: string, checkOut: string) {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / DAY_MS);
}

export function datesInStay(checkIn: string, checkOut: string) {
  const out: string[] = [];
  const cursor = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  while (cursor.getTime() < end.getTime()) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function rangeTouchesSet(checkIn: string, checkOut: string, blockedDays: Set<string>) {
  return datesInStay(checkIn, checkOut).some((day) => blockedDays.has(day));
}

export function assertStayWindow(nights: number, minNights: number, maxNights: number) {
  if (nights <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "invalid_dates" });
  }
  if (nights < minNights) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "min_nights" });
  }
  if (nights > maxNights) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "max_nights" });
  }
}

export function getNightlyDirectPrices(
  checkIn: string,
  checkOut: string,
  defaultNightly: number,
  overrides: Record<string, number>,
) {
  return datesInStay(checkIn, checkOut).map((date) => ({
    date,
    price: overrides[date] ?? defaultNightly,
  }));
}

export function calculateStayPrice(
  checkIn: string,
  checkOut: string,
  defaultNightly: number,
  overrides: Record<string, number>,
) {
  return getNightlyDirectPrices(checkIn, checkOut, defaultNightly, overrides).reduce(
    (total, night) => total + night.price,
    0,
  );
}

export function applyPercentCoupon(total: number, percent: number) {
  if (!Number.isFinite(total) || total < 0) return 0;
  if (!Number.isInteger(percent) || percent < 1 || percent > 90) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "invalid_coupon" });
  }
  return Math.round(total * (1 - percent / 100));
}
