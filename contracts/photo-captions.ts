import { BREAKFAST_LOCALES, type BreakfastLocale } from "./breakfast-content";

export type PhotoCaptions = Record<string, Partial<Record<BreakfastLocale, string>>>;

export function sanitizePhotoCaptions(data: unknown): PhotoCaptions {
  if (!data || typeof data !== "object") return {};
  const result: PhotoCaptions = {};
  for (const [photoId, captions] of Object.entries(data as Record<string, unknown>)) {
    if (!/^\d+$/.test(photoId) || !captions || typeof captions !== "object") continue;
    const next: Partial<Record<BreakfastLocale, string>> = {};
    for (const locale of BREAKFAST_LOCALES) {
      const value = (captions as Record<string, unknown>)[locale];
      if (typeof value === "string") next[locale] = value.trim().slice(0, 100);
    }
    if (Object.keys(next).length > 0) result[photoId] = next;
  }
  return result;
}

export function resolvePhotoCaption(captions: PhotoCaptions, photoId: number | undefined, locale: string): string {
  if (!photoId) return "";
  const item = captions[String(photoId)];
  if (!item) return "";
  const requested = BREAKFAST_LOCALES.includes(locale as BreakfastLocale)
    ? item[locale as BreakfastLocale]
    : "";
  return requested || item.pt || "";
}
