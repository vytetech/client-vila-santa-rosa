export type BreakfastPhotoInput = {
  id?: number;
  path: string;
  alt?: string | null;
  sort?: number | null;
};

export type BreakfastPhoto = {
  id?: number;
  key: string;
  src: string;
  alt: string;
  fallbackSrc: string;
  source: "dynamic" | "saved" | "fallback";
};

const DEFAULT_ALT = "Café da manhã da Vila Santa Rosa";

export function buildBreakfastPhotos({
  dynamicPhotos,
  fallbackImages,
  fallbackAlt = DEFAULT_ALT,
}: {
  dynamicPhotos: BreakfastPhotoInput[];
  fallbackImages: string[];
  fallbackAlt?: string;
}): BreakfastPhoto[] {
  if (dynamicPhotos.length > 0) {
    return dynamicPhotos.map((photo, index) => ({
      key: photo.id ? `dynamic-${photo.id}` : `dynamic-${photo.path}`,
      id: photo.id,
      src: photo.path,
      alt: photo.alt?.trim() || fallbackAlt,
      fallbackSrc: fallbackImages[Math.min(index, fallbackImages.length - 1)] ?? photo.path,
      source: "dynamic",
    }));
  }

  return fallbackImages.map((src, index) => ({
    key: `fallback-${index}-${src}`,
    src,
    alt: fallbackAlt,
    fallbackSrc: src,
    source: "fallback",
  }));
}
