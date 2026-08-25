import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import {
  cancelOwnBooking,
  createBookingRequest,
  listAllBookings,
  listBookingsByAccount,
  setBookingStatus,
} from "./queries/bookings";
import { getEffectiveMaxNights, getEffectiveMinNights } from "./queries/min-nights";
import { getSuitePrices } from "./queries/settings";
import { getStayOverrides } from "./queries/date-prices";
import { hasBlockedDateInStay } from "./queries/blocked-dates";
import { validateCoupon } from "./queries/coupons";
import { getBookedDays } from "./ical-sync";
import { rateLimit, clientIp } from "./ratelimit";
import {
  assertStayWindow,
  calculateNights,
  datesInStay,
  getNightlyDirectPrices,
  rangeTouchesSet,
} from "./lib/booking-rules";
import { buildBookingStats } from "./lib/admin-stats";
import { calculateBookingPricing } from "@contracts/pricing";

const ROOMS = ["luxo", "marrok", "sonhos"] as const;
const PET_FEE_HIGH = 80;
const PET_FEE_LOW = 50;

export const bookingRouter = createRouter({
  /** Public — a visitor (logged in or not) sends a booking request. */
  create: publicQuery
    .input(
      z.object({
        guestName: z.string().min(2).max(255),
        roomId: z.enum(ROOMS),
        checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        guests: z.number().int().min(1).max(4),
        pets: z.number().int().min(0).max(5).default(0),
        phone: z.string().max(64).optional().or(z.literal("")),
        couponCode: z.string().max(64).optional().or(z.literal("")),
        paymentMethod: z.enum(["pix", "card", "paypal"]).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ip = clientIp(ctx.req.headers);
      if (!rateLimit(`booking:${ip}`, 20, 10 * 60 * 1000)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }

      const nights = calculateNights(input.checkIn, input.checkOut);
      const [minNights, maxNights] = await Promise.all([
        getEffectiveMinNights(input.roomId, input.checkIn, input.checkOut),
        getEffectiveMaxNights(input.roomId, input.checkIn, input.checkOut),
      ]);
      assertStayWindow(nights, minNights, maxNights);

      if (await hasBlockedDateInStay(input.roomId, input.checkIn, input.checkOut)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "blocked_dates" });
      }
      if (stayTouchesBookedDay(input.roomId, input.checkIn, input.checkOut)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "booked_dates" });
      }

      const couponCode = input.couponCode?.trim();
      const couponResult = couponCode ? await validateCoupon(couponCode) : null;
      if (couponResult && !couponResult.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: couponResult.reason });
      }
      const coupon = couponResult?.ok ? couponResult.coupon : null;

      const [suitePrices, overrides] = await Promise.all([
        getSuitePrices(),
        getStayOverrides(input.roomId, input.checkIn, input.checkOut),
      ]);
      const defaultNightly = suitePrices[input.roomId] ?? suitePrices.marrok;
      const pricing = calculateBookingPricing({
        nightlyDirectPrices: getNightlyDirectPrices(
          input.checkIn,
          input.checkOut,
          defaultNightly,
          overrides,
        ),
        pets: input.pets,
        petFee: calculatePetFee(input.checkIn, input.checkOut, input.pets),
        couponPercent: coupon?.percent,
        paymentMethod: input.paymentMethod ?? null,
      });

      const id = await createBookingRequest({
        accountId: ctx.guest?.id,
        guestName: input.guestName,
        roomId: input.roomId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        pets: input.pets,
        phone: input.phone || undefined,
        couponCode: coupon?.code,
        paymentMethod: input.paymentMethod ?? undefined,
        platformSubtotalCents: pricing.platformSubtotalCents,
        lodgingSubtotalCents: pricing.lodgingSubtotalCents,
        petFeeCents: pricing.petFeeCents,
        couponDiscountCents: pricing.couponDiscountCents,
        totalCents: pricing.totalCents,
        depositBaseCents: pricing.depositBaseCents,
        paymentFeeCents: pricing.paymentFeeCents,
        depositDueCents: pricing.depositDueCents,
        pricingSnapshot: JSON.stringify(pricing),
      });
      return { id, pricing, coupon: coupon ? { code: coupon.code, percent: coupon.percent } : null };
    }),

  /** Logged-in guest — his own bookings. */
  mine: publicQuery.query(({ ctx }) => {
    if (!ctx.guest) return [];
    return listBookingsByAccount(ctx.guest.id);
  }),

  /** Guest cancels his own booking (paid or not — owner's rule). */
  cancel: publicQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.guest) throw new TRPCError({ code: "UNAUTHORIZED" });
      await cancelOwnBooking(input.id, ctx.guest.id);
      return { success: true };
    }),

  adminList: adminQuery.query(() => listAllBookings()),

  stats: adminQuery.query(async () => {
    const all = await listAllBookings();
    const prices = await getSuitePrices();
    return buildBookingStats(all, prices);
  }),

  setStatus: adminQuery
    .input(z.object({ id: z.number().int(), status: z.enum(["pending", "confirmed", "cancelled"]) }))
    .mutation(async ({ input }) => {
      await setBookingStatus(input.id, input.status);
      return { success: true };
    }),
});

function stayTouchesBookedDay(roomId: string, checkIn: string, checkOut: string) {
  return rangeTouchesSet(checkIn, checkOut, new Set(getBookedDays(roomId)));
}

function calculatePetFee(checkIn: string, checkOut: string, pets: number) {
  if (pets <= 0) return 0;
  return datesInStay(checkIn, checkOut).reduce((total, day) => {
    const month = Number(day.slice(5, 7));
    return total + (month >= 9 || month <= 3 ? PET_FEE_HIGH : PET_FEE_LOW) * pets;
  }, 0);
}
