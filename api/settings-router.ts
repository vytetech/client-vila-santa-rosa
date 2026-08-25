import { z } from "zod";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import {
  getBlockedDates,
  getBookingRating,
  getIcalUrl,
  getSiteData,
  getSuitePrices,
  setBlockedDates,
  setBookingNightly,
  setBookingRating,
  setIcalUrl,
  setSiteData,
  setSuitePrices,
  getTextOverrides,
  setTextOverrides,
  getAnalyticsIds,
  setAnalyticsIds,
  getBreakfastContent,
  setBreakfastContent,
  getThemeConfig,
  setThemeConfig,
  getPhotoCaptions,
  setPhotoCaption,
} from "./queries/settings";
import { fetchIcalDates } from "./ical";
import { THEME_BODY_FONTS, THEME_DEFAULTS, THEME_HEADING_FONTS } from "@contracts/theme";
import { BREAKFAST_DEFAULTS, BREAKFAST_LOCALES } from "@contracts/breakfast-content";

const PLATFORM_REFERENCE_DISCOUNT = 0.05;

export const settingsRouter = createRouter({
  /** Public — tells the UI whether the current visitor has admin rights. */
  adminCheck: publicQuery.query(({ ctx }) => ({
    isAdmin:
      ctx.user?.role === "admin" ||
      ctx.guest?.role === "admin" ||
      ctx.adminViaToken === true,
  })),

  /** Public pricing — per-suite direct rates and platform reference discount. */
  pricing: publicQuery.query(async () => {
    const suitePrices = await getSuitePrices();
    const bookingRating = await getBookingRating();
    const bookingNightly = suitePrices.marrok; // legacy default
    return {
      suitePrices,
      bookingNightly,
      directNightly: bookingNightly,
      discount: PLATFORM_REFERENCE_DISCOUNT,
      bookingRating,
    };
  }),

  /** Owner sets all suite prices at once. */
  setSuitePrices: adminQuery
    .input(
      z.object({
        luxo: z.number().positive().max(100000),
        marrok: z.number().positive().max(100000),
        sonhos: z.number().positive().max(100000),
      }),
    )
    .mutation(async ({ input }) => {
      await setSuitePrices(input);
      return { success: true };
    }),

  /** Owner sets a single suite price. */
  setSuitePrice: adminQuery
    .input(
      z.object({
        suite: z.enum(["luxo", "marrok", "sonhos"]),
        price: z.number().positive().max(100000),
      }),
    )
    .mutation(async ({ input }) => {
      const current = await getSuitePrices();
      await setSuitePrices({ ...current, [input.suite]: input.price });
      return { success: true };
    }),

  /**
   * Public availability — blocked dates from the Booking.com iCal feed.
   * The feed is re-fetched at most every 30 minutes; the parsed result is
   * cached in the settings table so the site stays fast and works even if
   * the feed is momentarily unreachable.
   */
  availability: publicQuery.query(async () => {
    const url = await getIcalUrl();
    const cached = await getBlockedDates();
    if (!url) return { blocked: cached, synced: false as const };
    return { blocked: cached, synced: true as const };
  }),

  /** Owner sets the current Booking.com nightly rate. */
  setBookingPrice: adminQuery
    .input(z.object({ price: z.number().positive().max(100000) }))
    .mutation(async ({ input }) => {
      await setBookingNightly(input.price);
      return { success: true };
    }),

  /** Owner updates the Booking.com rating shown on the site. */
  setBookingRating: adminQuery
    .input(z.object({ rating: z.number().min(0).max(10) }))
    .mutation(async ({ input }) => {
      await setBookingRating(input.rating);
      return { success: true };
    }),

  /** Owner saves the Booking.com iCal export URL and triggers the first sync. */
  setIcal: adminQuery
    .input(z.object({ url: z.string().url().max(500) }))
    .mutation(async ({ input }) => {
      await setIcalUrl(input.url);
      const dates = await fetchIcalDates(input.url);
      await setBlockedDates(dates);
      return { success: true, blockedCount: dates.length };
    }),

  /** Re-fetch the iCal feed (called by the calendar UI, throttled server-side). */
  syncIcal: publicQuery.mutation(async () => {
    const url = await getIcalUrl();
    if (!url) return { success: false as const, reason: "no_url" };
    const dates = await fetchIcalDates(url);
    await setBlockedDates(dates);
    return { success: true as const, blockedCount: dates.length };
  }),

  /* ------------------------------------------------------------------ */
  /* Editable site data — WhatsApp numbers, Pix, PayPal, app links       */
  /* ------------------------------------------------------------------ */

  /** Public — the site renders contact/payment data from here. */
  site: publicQuery.query(() => getSiteData()),

  /** Public — textos editados pelo dono (substituem os padrões do site). */
  texts: publicQuery.query(async () => {
    try {
      return await getTextOverrides();
    } catch {
      return {};
    }
  }),

  /** Owner — replace the full text-overrides map (per locale+path). */
  setTexts: adminQuery
    .input(z.object({ overrides: z.record(z.string(), z.string()) }))
    .mutation(async ({ input }) => {
      await setTextOverrides(input.overrides);
      return { success: true, count: Object.keys(input.overrides).length };
    }),

  /** Owner updates contact & payment data. */
  setSite: adminQuery
    .input(
      z.object({
        whatsappPrimary: z.string().min(8).max(20),
        whatsappSecondary: z.string().min(8).max(20),
        pixKey: z.string().min(3).max(255),
        pixOwner: z.string().min(2).max(255),
        paypalEmail: z.string().email().max(255),
        tudoAppUrl: z.string().max(500),
      }),
    )
    .mutation(async ({ input }) => {
      await setSiteData(input);
      return { success: true };
    }),

  /** Public — analytics/marketing IDs injected by the frontend. */
  analytics: publicQuery.query(async () => {
    try {
      return await getAnalyticsIds();
    } catch {
      return { gaId: "", gscVerification: "", metaPixelId: "" };
    }
  }),

  /** Owner — set Google Analytics / Search Console / Meta Pixel IDs. */
  setAnalytics: adminQuery
    .input(
      z.object({
        gaId: z.string().max(64),
        gscVerification: z.string().max(255),
        metaPixelId: z.string().max(64),
      }),
    )
    .mutation(async ({ input }) => {
      await setAnalyticsIds(input);
      return { success: true };
    }),

  /** Public — current visual identity applied through CSS variables. */
  theme: publicQuery.query(async () => {
    try {
      return await getThemeConfig();
    } catch {
      return THEME_DEFAULTS;
    }
  }),

  /** Owner — update controlled visual identity values. */
  setTheme: adminQuery
    .input(
      z.object({
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        backgroundLight: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        backgroundDark: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        textPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        textSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        buttonColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        buttonHoverColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        headingFont: z.enum(THEME_HEADING_FONTS),
        bodyFont: z.enum(THEME_BODY_FONTS),
      }),
    )
    .mutation(async ({ input }) => {
      await setThemeConfig(input);
      return { success: true };
    }),

  /** Owner — restore Vila Santa Rosa original visual identity. */
  resetTheme: adminQuery.mutation(async () => {
    await setThemeConfig(THEME_DEFAULTS);
    return { success: true, theme: THEME_DEFAULTS };
  }),

  /** Public — owner-managed breakfast section content. */
  breakfast: publicQuery.query(async () => {
    try {
      return await getBreakfastContent();
    } catch {
      return BREAKFAST_DEFAULTS;
    }
  }),

  /** Owner — update breakfast section content. */
  setBreakfast: adminQuery
    .input(
      z.object({
        enabled: z.boolean(),
        locales: z.record(
          z.enum(BREAKFAST_LOCALES),
          z.object({
            label: z.string().max(80),
            title: z.string().max(160),
            description: z.string().max(1200),
            hours: z.string().max(160),
            note: z.string().max(160),
            imageAlt: z.string().max(255),
            badges: z.array(z.string().max(80)).max(12),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      await setBreakfastContent(input);
      return { success: true };
    }),

  /** Public — visual captions attached to site photos. */
  photoCaptions: publicQuery.query(async () => getPhotoCaptions()),

  /** Owner — set one photo caption in one locale. */
  setPhotoCaption: adminQuery
    .input(
      z.object({
        photoId: z.number().int(),
        locale: z.enum(BREAKFAST_LOCALES),
        caption: z.string().max(100),
      }),
    )
    .mutation(async ({ input }) => {
      await setPhotoCaption(input.photoId, input.locale, input.caption);
      return { success: true };
    }),
});
