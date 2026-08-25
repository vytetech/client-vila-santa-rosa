import { type SuiteId } from "./suites-content";

export type SuitePhotoRecord = {
  id?: number;
  slot?: string;
  path: string;
  alt?: string | null;
  sort?: number;
};

export type SuiteCarouselPhoto = {
  key: string;
  id?: number;
  slot?: string;
  src: string;
  fallbackSrc: string;
  alt: string;
  source: "dynamic" | "fallback";
};

export function suitePhotoAlt(suiteName: string) {
  return `${suiteName} - Vila Santa Rosa`;
}

export function createSuiteCarouselPhotos(
  roomId: SuiteId,
  dynamicPhotos: SuitePhotoRecord[],
  fallbackImages: string[],
  suiteName: string
): SuiteCarouselPhoto[] {
  const fallbackAlt = suitePhotoAlt(suiteName);
  const safeFallbackImages = fallbackImages.filter(Boolean);
  const validDynamicPhotos = dynamicPhotos.filter(photo => Boolean(photo.path));

  if (validDynamicPhotos.length > 0) {
    return validDynamicPhotos.map((photo, index) => ({
      key: photo.id
        ? `${roomId}-dynamic-${photo.id}`
        : `${roomId}-dynamic-${photo.path}`,
      id: photo.id,
      slot: photo.slot,
      src: photo.path,
      fallbackSrc:
        safeFallbackImages[Math.min(index, safeFallbackImages.length - 1)] ??
        safeFallbackImages[0] ??
        photo.path,
      alt: photo.alt?.trim() || fallbackAlt,
      source: "dynamic",
    }));
  }

  return safeFallbackImages.map((src, index) => ({
    key: `${roomId}-fallback-${index}`,
    src,
    fallbackSrc: src,
    alt: fallbackAlt,
    source: "fallback",
  }));
}
