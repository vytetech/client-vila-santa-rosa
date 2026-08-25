import { authRouter } from "./auth-router";
import { availabilityRouter } from "./availability-router";
import { accountsRouter } from "./accounts-router";
import { bookingRouter } from "./booking-router";
import { datePricesRouter } from "./date-prices-router";
import { guestRouter } from "./guest-router";
import { minNightsRouter } from "./min-nights-router";
import { photosRouter } from "./photos-router";
import { couponsRouter } from "./coupons-router";
import { referralRouter } from "./referral-router";
import { reviewRouter } from "./review-router";
import { settingsRouter } from "./settings-router";
import { suitesRouter } from "./suites-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  accounts: accountsRouter,
  guest: guestRouter,
  reviews: reviewRouter,
  referrals: referralRouter,
  settings: settingsRouter,
  availability: availabilityRouter,
  bookings: bookingRouter,
  datePrices: datePricesRouter,
  minNights: minNightsRouter,
  photos: photosRouter,
  coupons: couponsRouter,
  suites: suitesRouter,
});

export type AppRouter = typeof appRouter;
