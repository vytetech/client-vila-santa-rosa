import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  SUITE_IDS,
  SUITE_PHOTO_SLOTS,
  resolveSuiteLocale,
  mergeSuiteWithDefaults,
  resolveSuiteLocaleWithDefaults,
  sanitizeSuitesContent,
} from "@contracts/suites-content";

describe("suite content management", () => {
  it("preserves operational roomIds and creates one editorial record per existing suite", () => {
    const content = sanitizeSuitesContent(undefined);

    expect(Object.keys(content).sort()).toEqual([...SUITE_IDS].sort());
    expect(content.luxo.roomId).toBe("luxo");
    expect(content.marrok.roomId).toBe("marrok");
    expect(content.sonhos.roomId).toBe("sonhos");
  });

  it("supports visibility without changing roomId or deleting content", () => {
    const content = sanitizeSuitesContent({
      luxo: {
        ...sanitizeSuitesContent(undefined).luxo,
        enabled: false,
      },
    });

    expect(content.luxo.enabled).toBe(false);
    expect(content.luxo.roomId).toBe("luxo");
    expect(content.luxo.locales.pt.publicName).toBeTruthy();
  });

  it("resolves missing translations through Portuguese fallback", () => {
    const content = sanitizeSuitesContent({
      luxo: {
        ...sanitizeSuitesContent(undefined).luxo,
        locales: {
          ...sanitizeSuitesContent(undefined).luxo.locales,
          pt: {
            ...sanitizeSuitesContent(undefined).luxo.locales.pt,
            publicName: "Nome PT",
          },
          en: {
            ...sanitizeSuitesContent(undefined).luxo.locales.en,
            publicName: "",
          },
        },
      },
    });

    expect(resolveSuiteLocale(content.luxo, "en").publicName).toBe("Nome PT");
  });

  it("falls back per suite when dynamic data is absent", () => {
    expect(mergeSuiteWithDefaults(undefined, "luxo").roomId).toBe("luxo");
    expect(mergeSuiteWithDefaults(undefined, "marrok").roomId).toBe("marrok");
    expect(mergeSuiteWithDefaults(undefined, "sonhos").roomId).toBe("sonhos");
  });

  it("does not overwrite defaults with empty dynamic fields", () => {
    const defaults = sanitizeSuitesContent(undefined);
    const dynamic = sanitizeSuitesContent({
      luxo: {
        ...defaults.luxo,
        locales: {
          ...defaults.luxo.locales,
          pt: {
            ...defaults.luxo.locales.pt,
            publicName: "",
            shortDescription: "",
            amenities: [],
          },
        },
      },
    });

    const resolved = resolveSuiteLocaleWithDefaults(dynamic.luxo, "luxo", "pt");
    expect(resolved.publicName).toBe(defaults.luxo.locales.pt.publicName);
    expect(resolved.shortDescription).toBe(defaults.luxo.locales.pt.shortDescription);
    expect(resolved.amenities).toEqual(defaults.luxo.locales.pt.amenities);
  });

  it("keeps enabled=false as the only dynamic reason to hide a suite", () => {
    const defaults = sanitizeSuitesContent(undefined);
    expect(mergeSuiteWithDefaults(undefined, "luxo").enabled).toBe(true);
    expect(mergeSuiteWithDefaults({ ...defaults.luxo, enabled: false }, "luxo").enabled).toBe(false);
  });

  it("uses dedicated suite photo slots while keeping legacy quartos fallback available", () => {
    expect(SUITE_PHOTO_SLOTS).toEqual({
      luxo: "suite:luxo",
      marrok: "suite:marrok",
      sonhos: "suite:sonhos",
    });
  });

  it("exposes public/admin suite procedures with admin-only mutations", () => {
    const source = fs.readFileSync(new URL("./suites-router.ts", import.meta.url), "utf8");

    expect(source).toContain("publicList: publicQuery.query");
    expect(source).toContain("adminList: adminQuery.query");
    expect(source).toContain("updateAll: adminQuery");
    expect(source).not.toContain("updateAll: publicQuery");
  });
});
