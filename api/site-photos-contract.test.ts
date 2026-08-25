import { describe, expect, it } from "vitest";
import { PHOTO_SLOTS, SITE_PHOTO_SLOTS, isSitePhotoSlot } from "@contracts/site-photos";

describe("site photo slot contract", () => {
  it("uses the same slot ids required by admin, API and public sections", () => {
    expect(PHOTO_SLOTS).toEqual({
      hero: "hero",
      galeria: "galeria",
      quartos: "quartos",
      cafe: "cafe",
      jardim: "jardim",
      suiteLuxo: "suite:luxo",
      suiteMarrok: "suite:marrok",
      suiteSonhos: "suite:sonhos",
    });
    expect(SITE_PHOTO_SLOTS).toEqual([
      "galeria",
      "quartos",
      "cafe",
      "jardim",
      "hero",
      "suite:luxo",
      "suite:marrok",
      "suite:sonhos",
    ]);
  });

  it("accepts the real production jardim slot and rejects variants", () => {
    expect(isSitePhotoSlot("jardim")).toBe(true);
    expect(isSitePhotoSlot("suite:luxo")).toBe(true);
    expect(isSitePhotoSlot("garden")).toBe(false);
    expect(isSitePhotoSlot("Jardim")).toBe(false);
    expect(isSitePhotoSlot("jardins")).toBe(false);
  });
});
