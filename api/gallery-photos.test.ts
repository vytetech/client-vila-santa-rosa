import { describe, expect, it } from "vitest";
import { createGalleryItems, type GalleryFallbackPhoto, type GalleryPhotoRecord } from "@contracts/gallery-photos";

const upload = (name: string) => `https://uploads.test/images/uploads/${name}`;

const fallback: GalleryFallbackPhoto[] = [
  { src: "/images/jardim-1.webp", alt: "Jardim", span: "sm:col-span-2 sm:row-span-2" },
  { src: "/images/cafe-1.webp", alt: "Cafe" },
  { src: "/images/suite-luxo-4.webp", alt: "Suite" },
];

function dynamic(path: string, overrides: Partial<GalleryPhotoRecord> = {}): GalleryPhotoRecord {
  return {
    id: overrides.id ?? 1,
    slot: overrides.slot ?? "galeria",
    path,
    alt: overrides.alt ?? "Foto dinâmica",
    sort: overrides.sort ?? 0,
  };
}

describe("public gallery photo selection", () => {
  it("uses static fallback when there are no dynamic gallery photos", () => {
    const items = createGalleryItems([], fallback);

    expect(items).toHaveLength(3);
    expect(items.every((item) => item.source === "fallback")).toBe(true);
    expect(items.map((item) => item.src)).toEqual(fallback.map((item) => item.src));
  });

  it("uses only one dynamic photo when one gallery photo exists", () => {
    const items = createGalleryItems([dynamic(upload("one.webp"))], fallback);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      src: upload("one.webp"),
      source: "dynamic",
    });
    expect(items.map((item) => item.src)).not.toContain("/images/jardim-1.webp");
  });

  it("uses only multiple dynamic photos when gallery photos exist", () => {
    const items = createGalleryItems(
      [
        dynamic(upload("one.webp"), { id: 1 }),
        dynamic(upload("two.webp"), { id: 2 }),
        dynamic(upload("three.webp"), { id: 3 }),
      ],
      fallback,
    );

    expect(items).toHaveLength(3);
    expect(items.every((item) => item.source === "dynamic")).toBe(true);
    expect(items.map((item) => item.src)).toEqual([
      upload("one.webp"),
      upload("two.webp"),
      upload("three.webp"),
    ]);
  });

  it("models partial delete by rendering only remaining dynamic photos", () => {
    const items = createGalleryItems(
      [dynamic(upload("two.webp"), { id: 2 }), dynamic(upload("three.webp"), { id: 3 })],
      fallback,
    );

    expect(items.map((item) => item.src)).toEqual([
      upload("two.webp"),
      upload("three.webp"),
    ]);
  });

  it("models deleting the last dynamic photo by returning to fallback", () => {
    const items = createGalleryItems([], fallback);

    expect(items.every((item) => item.source === "fallback")).toBe(true);
  });

  it("does not render photos from other slots in the gallery", () => {
    const items = createGalleryItems(
      [
        dynamic(upload("garden.webp"), { slot: "jardim" }),
        dynamic(upload("room.webp"), { slot: "quartos" }),
        dynamic(upload("cafe.webp"), { slot: "cafe" }),
        dynamic(upload("hero.webp"), { slot: "hero" }),
      ],
      fallback,
    );

    expect(items.every((item) => item.source === "fallback")).toBe(true);
    expect(items.map((item) => item.src)).not.toContain(upload("garden.webp"));
  });

  it("keeps backend order and does not reorder dynamic photos in the component", () => {
    const sortedByQuery = [
      dynamic(upload("sort-0-id-5.webp"), { id: 5, sort: 0 }),
      dynamic(upload("sort-1-id-2.webp"), { id: 2, sort: 1 }),
      dynamic(upload("sort-1-id-9.webp"), { id: 9, sort: 1 }),
    ];

    expect(createGalleryItems(sortedByQuery, fallback).map((item) => item.src)).toEqual([
      upload("sort-0-id-5.webp"),
      upload("sort-1-id-2.webp"),
      upload("sort-1-id-9.webp"),
    ]);
  });
});
