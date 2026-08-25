import { PHOTO_SLOTS } from "./site-photos";

export type GalleryPhotoRecord = {
  id?: number;
  slot: string;
  path: string;
  alt?: string | null;
  sort?: number;
};

export type GalleryFallbackPhoto = {
  src: string;
  alt: string;
  span?: string;
};

export type GalleryItem = {
  src: string;
  fallbackSrc: string;
  alt: string;
  span: string;
  source: "dynamic" | "fallback";
};

export function createGalleryItems(
  dynamicPhotos: GalleryPhotoRecord[] | null | undefined,
  fallbackPhotos: GalleryFallbackPhoto[],
  defaultAlt = "Vila Santa Rosa",
): GalleryItem[] {
  const galleryPhotos = (dynamicPhotos ?? []).filter(
    (photo) => photo.slot === PHOTO_SLOTS.galeria,
  );

  if (galleryPhotos.length === 0) {
    return fallbackPhotos.map((photo) => ({
      src: photo.src,
      fallbackSrc: photo.src,
      alt: photo.alt || defaultAlt,
      span: photo.span ?? "",
      source: "fallback",
    }));
  }

  return galleryPhotos.map((photo, index) => ({
    src: photo.path,
    fallbackSrc: fallbackPhotos[index % fallbackPhotos.length]?.src ?? fallbackPhotos[0]?.src ?? "",
    alt: photo.alt?.trim() || defaultAlt,
    span: index === 0 ? "sm:col-span-2 sm:row-span-2" : index === 4 ? "sm:row-span-2" : "",
    source: "dynamic",
  }));
}
