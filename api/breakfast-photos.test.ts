import { describe, expect, it } from "vitest";
import { buildBreakfastPhotos, type BreakfastPhotoInput } from "@contracts/breakfast-photos";

const fallbackImages = ["/images/cafe-1.webp", "/images/cafe-5.webp", "/images/cafe-3.webp"];

function photos(count: number): BreakfastPhotoInput[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    path: `/uploads/cafe-${index + 1}.webp`,
    alt: index === 1 ? "" : `Cafe ${index + 1}`,
    sort: index,
  }));
}

describe("breakfast public photo selection", () => {
  it("uses static fallback when there are zero dynamic Cafe photos", () => {
    const result = buildBreakfastPhotos({ dynamicPhotos: [], fallbackImages });

    expect(result).toHaveLength(3);
    expect(result.every((photo) => photo.source === "fallback")).toBe(true);
  });

  it("uses one dynamic photo as the principal image", () => {
    const result = buildBreakfastPhotos({ dynamicPhotos: photos(1), fallbackImages });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ src: "/uploads/cafe-1.webp", source: "dynamic" });
  });

  it("renders three dynamic photos as principal plus gallery", () => {
    const result = buildBreakfastPhotos({ dynamicPhotos: photos(3), fallbackImages });

    expect(result.map((photo) => photo.src)).toEqual([
      "/uploads/cafe-1.webp",
      "/uploads/cafe-2.webp",
      "/uploads/cafe-3.webp",
    ]);
  });

  it("renders all nine Cafe photos without a hardcoded limit of three", () => {
    const result = buildBreakfastPhotos({ dynamicPhotos: photos(9), fallbackImages });

    expect(result).toHaveLength(9);
    expect(result.at(-1)?.src).toBe("/uploads/cafe-9.webp");
  });

  it("reflects deletion by rendering the remaining amount", () => {
    const result = buildBreakfastPhotos({ dynamicPhotos: photos(9).slice(0, 8), fallbackImages });

    expect(result).toHaveLength(8);
  });

  it("preserves the order delivered by the public photos query", () => {
    const reordered = [photos(3)[2], photos(3)[0], photos(3)[1]];
    const result = buildBreakfastPhotos({ dynamicPhotos: reordered, fallbackImages });

    expect(result.map((photo) => photo.src)).toEqual([
      "/uploads/cafe-3.webp",
      "/uploads/cafe-1.webp",
      "/uploads/cafe-2.webp",
    ]);
  });

  it("uses saved alt text and falls back when alt is empty", () => {
    const result = buildBreakfastPhotos({ dynamicPhotos: photos(2), fallbackImages });

    expect(result[0].alt).toBe("Cafe 1");
    expect(result[1].alt).toBe("Café da manhã da Vila Santa Rosa");
  });
});
