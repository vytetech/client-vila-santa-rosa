import { getDb, isDatabaseConfigured } from "./connection";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";
import { sanitizeThemeConfig, THEME_DEFAULTS, type ThemeConfig } from "@contracts/theme";
import {
  BREAKFAST_DEFAULTS,
  sanitizeBreakfastContent,
  type BreakfastContent,
} from "@contracts/breakfast-content";
import { sanitizePhotoCaptions, type PhotoCaptions } from "@contracts/photo-captions";
import { sanitizeSuitesContent, SUITES_DEFAULTS, type SuitesContent } from "@contracts/suites-content";

const BOOKING_RATING_KEY = "bookingComRating";
const DEFAULT_BOOKING_RATING = 9.9;

/** Per-suite Booking.com nightly rates (before the 5% direct discount). */
export type SuitePrices = Record<"luxo" | "marrok" | "sonhos", number>;

const SUITE_PRICES_KEY = "suitePrices";
const DEFAULT_SUITE_PRICES: SuitePrices = {
  luxo: 550,
  marrok: 450,
  sonhos: 380,
};

export async function getSuitePrices(): Promise<SuitePrices> {
  if (!isDatabaseConfigured()) return DEFAULT_SUITE_PRICES;
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, SUITE_PRICES_KEY),
  });
  if (!row) return DEFAULT_SUITE_PRICES;
  try {
    const parsed = JSON.parse(row.value) as Partial<SuitePrices>;
    return {
      luxo: Number(parsed.luxo) || DEFAULT_SUITE_PRICES.luxo,
      marrok: Number(parsed.marrok) || DEFAULT_SUITE_PRICES.marrok,
      sonhos: Number(parsed.sonhos) || DEFAULT_SUITE_PRICES.sonhos,
    };
  } catch {
    return DEFAULT_SUITE_PRICES;
  }
}

export async function setSuitePrices(prices: SuitePrices) {
  await getDb()
    .insert(settings)
    .values({ key: SUITE_PRICES_KEY, value: JSON.stringify(prices) })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(prices) } });
}

/** Legacy single-price getter — kept for backward compatibility. */
export async function getBookingNightly(): Promise<number> {
  const suitePrices = await getSuitePrices();
  // Return the middle price as the "default" for legacy callers
  return suitePrices.marrok;
}

export async function getBookingRating(): Promise<number> {
  if (!isDatabaseConfigured()) return DEFAULT_BOOKING_RATING;
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, BOOKING_RATING_KEY),
  });
  const value = row ? Number(row.value) : NaN;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_BOOKING_RATING;
}

export async function setBookingRating(rating: number) {
  await getDb()
    .insert(settings)
    .values({ key: BOOKING_RATING_KEY, value: String(rating) })
    .onDuplicateKeyUpdate({ set: { value: String(rating) } });
}

/** Legacy single-price setter — now writes to the middle suite. */
export async function setBookingNightly(price: number) {
  const current = await getSuitePrices();
  await setSuitePrices({ ...current, marrok: price });
}


const ICAL_URL_KEY = "bookingIcalUrl";
const BLOCKED_DATES_KEY = "blockedDates";

export async function getIcalUrl(): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, ICAL_URL_KEY),
  });
  return row?.value ?? null;
}

export async function setIcalUrl(url: string) {
  await getDb()
    .insert(settings)
    .values({ key: ICAL_URL_KEY, value: url })
    .onDuplicateKeyUpdate({ set: { value: url } });
}

/** Persisted cache of blocked dates ("YYYY-MM-DD") parsed from iCal. */
export async function getBlockedDates(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, BLOCKED_DATES_KEY),
  });
  if (!row) return [];
  try {
    const arr = JSON.parse(row.value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function setBlockedDates(dates: string[]) {
  await getDb()
    .insert(settings)
    .values({ key: BLOCKED_DATES_KEY, value: JSON.stringify(dates) })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(dates) } });
}

/* ------------------------------------------------------------------ */
/* Editable site data (owner changes these in the admin panel)         */
/* ------------------------------------------------------------------ */

export const SITE_DEFAULTS = {
  whatsappPrimary: "5512988051401",
  whatsappSecondary: "5511986981444",
  pixKey: "vilasantarosailhabela@gmail.com",
  pixOwner: "Ahmad Taha",
  paypalEmail: "a1989a2029@gmail.com",
  tudoAppUrl: "",
} as const;

export type SiteData = { [K in keyof typeof SITE_DEFAULTS]: string };

const SITE_KEY = "siteData";

export async function getSiteData(): Promise<SiteData> {
  if (!isDatabaseConfigured()) return { ...SITE_DEFAULTS };
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, SITE_KEY),
  });
  if (!row) return { ...SITE_DEFAULTS };
  try {
    return { ...SITE_DEFAULTS, ...JSON.parse(row.value) };
  } catch {
    return { ...SITE_DEFAULTS };
  }
}

export async function setSiteData(data: SiteData) {
  await getDb()
    .insert(settings)
    .values({ key: SITE_KEY, value: JSON.stringify(data) })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(data) } });
}

/* ---------------- Site text overrides (admin edits any text) ---------------- */

const TEXTS_KEY = "siteTexts";

export type TextOverrides = Record<string, string>;

export async function getTextOverrides(): Promise<TextOverrides> {
  if (!isDatabaseConfigured()) return {};
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, TEXTS_KEY),
  });
  if (!row) return {};
  try {
    return JSON.parse(row.value) as TextOverrides;
  } catch {
    return {};
  }
}

export async function setTextOverrides(overrides: TextOverrides) {
  await getDb()
    .insert(settings)
    .values({ key: TEXTS_KEY, value: JSON.stringify(overrides) })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(overrides) } });
}

/* ---------------- Analytics / marketing IDs ---------------- */

const ANALYTICS_KEY = "analyticsIds";

export type AnalyticsIds = {
  gaId: string;
  gscVerification: string;
  metaPixelId: string;
};

const ANALYTICS_DEFAULTS: AnalyticsIds = {
  gaId: "",
  gscVerification: "",
  metaPixelId: "",
};

export async function getAnalyticsIds(): Promise<AnalyticsIds> {
  if (!isDatabaseConfigured()) return { ...ANALYTICS_DEFAULTS };
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, ANALYTICS_KEY),
  });
  if (!row) return { ...ANALYTICS_DEFAULTS };
  try {
    return { ...ANALYTICS_DEFAULTS, ...JSON.parse(row.value) };
  } catch {
    return { ...ANALYTICS_DEFAULTS };
  }
}

export async function setAnalyticsIds(data: AnalyticsIds) {
  await getDb()
    .insert(settings)
    .values({ key: ANALYTICS_KEY, value: JSON.stringify(data) })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(data) } });
}

/* ---------------- Visual identity / theme ---------------- */

const THEME_KEY = "themeConfig";

export async function getThemeConfig(): Promise<ThemeConfig> {
  if (!isDatabaseConfigured()) return { ...THEME_DEFAULTS };
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, THEME_KEY),
  });
  if (!row) return { ...THEME_DEFAULTS };
  try {
    return sanitizeThemeConfig(JSON.parse(row.value) as Partial<ThemeConfig>);
  } catch {
    return { ...THEME_DEFAULTS };
  }
}

export async function setThemeConfig(data: ThemeConfig) {
  const value = JSON.stringify(sanitizeThemeConfig(data));
  await getDb()
    .insert(settings)
    .values({ key: THEME_KEY, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

/* ---------------- Breakfast section content ---------------- */

const BREAKFAST_KEY = "breakfastContent";

export async function getBreakfastContent(): Promise<BreakfastContent> {
  if (!isDatabaseConfigured()) return { ...BREAKFAST_DEFAULTS };
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, BREAKFAST_KEY),
  });
  if (!row) return { ...BREAKFAST_DEFAULTS };
  try {
    return sanitizeBreakfastContent(JSON.parse(row.value));
  } catch {
    return { ...BREAKFAST_DEFAULTS };
  }
}

export async function setBreakfastContent(data: BreakfastContent) {
  const value = JSON.stringify(sanitizeBreakfastContent(data));
  await getDb()
    .insert(settings)
    .values({ key: BREAKFAST_KEY, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

/* ---------------- Suite editorial content ---------------- */

const SUITES_KEY = "suitesContent";

export async function getSuitesContent(): Promise<SuitesContent> {
  if (!isDatabaseConfigured()) return sanitizeSuitesContent(SUITES_DEFAULTS);
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, SUITES_KEY),
  });
  if (!row) return sanitizeSuitesContent(SUITES_DEFAULTS);
  try {
    return sanitizeSuitesContent(JSON.parse(row.value));
  } catch {
    return sanitizeSuitesContent(SUITES_DEFAULTS);
  }
}

export async function setSuitesContent(data: SuitesContent) {
  const value = JSON.stringify(sanitizeSuitesContent(data));
  await getDb()
    .insert(settings)
    .values({ key: SUITES_KEY, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

/* ---------------- Per-photo visual captions ---------------- */

const PHOTO_CAPTIONS_KEY = "photoCaptions";

export async function getPhotoCaptions(): Promise<PhotoCaptions> {
  if (!isDatabaseConfigured()) return {};
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, PHOTO_CAPTIONS_KEY),
  });
  if (!row) return {};
  try {
    return sanitizePhotoCaptions(JSON.parse(row.value));
  } catch {
    return {};
  }
}

export async function setPhotoCaptions(data: PhotoCaptions) {
  const value = JSON.stringify(sanitizePhotoCaptions(data));
  await getDb()
    .insert(settings)
    .values({ key: PHOTO_CAPTIONS_KEY, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function setPhotoCaption(photoId: number, locale: string, caption: string) {
  const current = await getPhotoCaptions();
  const id = String(photoId);
  current[id] = { ...(current[id] ?? {}), [locale]: caption.trim().slice(0, 100) };
  await setPhotoCaptions(current);
}

export async function deletePhotoCaptions(photoId: number) {
  const current = await getPhotoCaptions();
  delete current[String(photoId)];
  await setPhotoCaptions(current);
}
