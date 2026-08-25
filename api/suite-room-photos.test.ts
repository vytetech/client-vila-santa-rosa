import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createSuiteCarouselPhotos,
  type SuitePhotoRecord,
} from "@contracts/suite-room-photos";
import { SUITE_PHOTO_SLOTS, type SuiteId } from "@contracts/suites-content";

const fallbackImages: Record<SuiteId, string[]> = {
  luxo: ["/images/suite-luxo-2.webp", "/images/suite-luxo-1.webp"],
  marrok: ["/images/marrok-6.webp"],
  sonhos: ["/images/sonhos-1.webp", "/images/sonhos-2.webp"],
};

function photo(
  roomId: SuiteId,
  name: string,
  overrides: Partial<SuitePhotoRecord> = {}
): SuitePhotoRecord {
  return {
    id: overrides.id ?? 1,
    slot: overrides.slot ?? SUITE_PHOTO_SLOTS[roomId],
    path: `https://uploads.test/images/uploads/${name}`,
    alt: overrides.alt ?? `${roomId} alt`,
    sort: overrides.sort ?? 0,
  };
}

describe("suite public carousel photo selection", () => {
  it("renders one image for a suite with one dynamic photo", () => {
    const items = createSuiteCarouselPhotos(
      "luxo",
      [photo("luxo", "luxo-1.webp")],
      fallbackImages.luxo,
      "Suíte Luxo"
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      src: "https://uploads.test/images/uploads/luxo-1.webp",
      source: "dynamic",
    });
  });

  it("keeps all four dynamic photos reachable by the carousel", () => {
    const items = createSuiteCarouselPhotos(
      "sonhos",
      [
        photo("sonhos", "sonhos-1.webp", { id: 1 }),
        photo("sonhos", "sonhos-2.webp", { id: 2 }),
        photo("sonhos", "sonhos-3.webp", { id: 3 }),
        photo("sonhos", "sonhos-4.webp", { id: 4 }),
      ],
      fallbackImages.sonhos,
      "Suíte Sonhos"
    );

    expect(items.map(item => item.src)).toEqual([
      "https://uploads.test/images/uploads/sonhos-1.webp",
      "https://uploads.test/images/uploads/sonhos-2.webp",
      "https://uploads.test/images/uploads/sonhos-3.webp",
      "https://uploads.test/images/uploads/sonhos-4.webp",
    ]);
  });

  it("preserves the first ordered photo as the primary cover", () => {
    const items = createSuiteCarouselPhotos(
      "marrok",
      [
        photo("marrok", "primary.webp", { id: 10, sort: 0 }),
        photo("marrok", "secondary.webp", { id: 11, sort: 1 }),
      ],
      fallbackImages.marrok,
      "Suíte Marrok"
    );

    expect(items[0].src).toBe(
      "https://uploads.test/images/uploads/primary.webp"
    );
  });

  it("reflects reorder from the API order without sorting again in the frontend", () => {
    const reordered = [
      photo("luxo", "second-now-primary.webp", { id: 2, sort: 0 }),
      photo("luxo", "former-primary.webp", { id: 1, sort: 1 }),
    ];

    expect(
      createSuiteCarouselPhotos(
        "luxo",
        reordered,
        fallbackImages.luxo,
        "Suíte Luxo"
      )[0].src
    ).toBe("https://uploads.test/images/uploads/second-now-primary.webp");
  });

  it("reflects deletion by rendering only remaining dynamic photos", () => {
    const items = createSuiteCarouselPhotos(
      "sonhos",
      [photo("sonhos", "remaining.webp", { id: 2 })],
      fallbackImages.sonhos,
      "Suíte Sonhos"
    );

    expect(items.map(item => item.src)).toEqual([
      "https://uploads.test/images/uploads/remaining.webp",
    ]);
  });

  it("uses suite-specific fallback when dynamic photos are absent", () => {
    const items = createSuiteCarouselPhotos(
      "marrok",
      [],
      fallbackImages.marrok,
      "Suíte Marrok"
    );

    expect(items).toEqual([
      {
        key: "marrok-fallback-0",
        src: "/images/marrok-6.webp",
        fallbackSrc: "/images/marrok-6.webp",
        alt: "Suíte Marrok - Vila Santa Rosa",
        source: "fallback",
      },
    ]);
  });

  it("does not leak fallback photos between suites with partial dynamic data", () => {
    const luxo = createSuiteCarouselPhotos(
      "luxo",
      [photo("luxo", "luxo.webp")],
      fallbackImages.luxo,
      "Suíte Luxo"
    );
    const marrok = createSuiteCarouselPhotos(
      "marrok",
      [],
      fallbackImages.marrok,
      "Suíte Marrok"
    );

    expect(luxo.map(item => item.src)).not.toContain("/images/marrok-6.webp");
    expect(marrok.map(item => item.src)).not.toContain(
      "/images/suite-luxo-2.webp"
    );
  });

  it("keeps suite slots separated for dynamic photos", () => {
    const luxo = createSuiteCarouselPhotos(
      "luxo",
      [photo("luxo", "luxo.webp")],
      fallbackImages.luxo,
      "Suíte Luxo"
    );
    const sonhos = createSuiteCarouselPhotos(
      "sonhos",
      [photo("sonhos", "sonhos.webp")],
      fallbackImages.sonhos,
      "Suíte Sonhos"
    );

    expect(luxo[0].slot).toBe("suite:luxo");
    expect(sonhos[0].slot).toBe("suite:sonhos");
  });

  it("uses saved alt text and falls back to suite name when missing", () => {
    const items = createSuiteCarouselPhotos(
      "luxo",
      [
        photo("luxo", "with-alt.webp", { alt: "Alt salvo" }),
        photo("luxo", "without-alt.webp", { id: 2, alt: "" }),
      ],
      fallbackImages.luxo,
      "Suíte Luxo"
    );

    expect(items.map(item => item.alt)).toEqual([
      "Alt salvo",
      "Suíte Luxo - Vila Santa Rosa",
    ]);
  });

  it("has existing local fallback files so image fallback does not return 404", () => {
    const publicDir = path.resolve(process.cwd(), "public");
    const localFallbacks = Object.values(fallbackImages).flat();

    expect(
      localFallbacks.every(src => fs.existsSync(path.join(publicDir, src)))
    ).toBe(true);
  });
});
