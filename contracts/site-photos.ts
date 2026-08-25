export const PHOTO_SLOTS = {
  hero: "hero",
  galeria: "galeria",
  quartos: "quartos",
  cafe: "cafe",
  jardim: "jardim",
  suiteLuxo: "suite:luxo",
  suiteMarrok: "suite:marrok",
  suiteSonhos: "suite:sonhos",
} as const;

export const SITE_PHOTO_SLOTS = [
  PHOTO_SLOTS.galeria,
  PHOTO_SLOTS.quartos,
  PHOTO_SLOTS.cafe,
  PHOTO_SLOTS.jardim,
  PHOTO_SLOTS.hero,
  PHOTO_SLOTS.suiteLuxo,
  PHOTO_SLOTS.suiteMarrok,
  PHOTO_SLOTS.suiteSonhos,
] as const;

export type SitePhotoSlot = (typeof SITE_PHOTO_SLOTS)[number];

export const SITE_PHOTO_SLOT_LABELS: Record<SitePhotoSlot, string> = {
  galeria: "Galeria",
  quartos: "Quartos",
  cafe: "Cafe",
  jardim: "Jardim",
  hero: "Hero",
  "suite:luxo": "Suite Luxo",
  "suite:marrok": "Suite Marrok",
  "suite:sonhos": "Suite Sonhos",
};

export function isSitePhotoSlot(slot: string): slot is SitePhotoSlot {
  return (SITE_PHOTO_SLOTS as readonly string[]).includes(slot);
}
