import { describe, expect, it } from "vitest";
import {
  BREAKFAST_LOCALES,
  isBreakfastLocaleComplete,
  resolveBreakfastLocale,
  sanitizeBreakfastContent,
} from "@contracts/breakfast-content";

describe("breakfast content settings", () => {
  it("migrates legacy top-level content into Portuguese without breaking public rendering", () => {
    expect(sanitizeBreakfastContent({ title: "Cafe" })).toMatchObject({
      enabled: true,
      locales: {
        pt: {
          title: "Cafe",
        },
      },
    });
  });

  it("removes empty badges and caps the list per locale", () => {
    const content = sanitizeBreakfastContent({
      locales: {
        pt: {
          badges: ["Cafe", "", "  Paes  ", "Ovos", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        },
      },
    });

    expect(content.locales.pt.badges).toEqual(["Cafe", "Paes", "Ovos", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("supports every public locale configured for the site", () => {
    const content = sanitizeBreakfastContent({});

    expect(Object.keys(content.locales).sort()).toEqual([...BREAKFAST_LOCALES].sort());
    for (const locale of BREAKFAST_LOCALES) {
      expect(isBreakfastLocaleComplete(content.locales[locale])).toBe(true);
    }
  });

  it("resolves each locale and falls back to Portuguese when a translation is missing", () => {
    const content = sanitizeBreakfastContent({
      locales: {
        pt: { title: "Titulo PT", badges: ["Cafe PT"] },
        en: { title: "", badges: [] },
      },
    });

    expect(resolveBreakfastLocale(content, "pt").title).toBe("Titulo PT");
    expect(resolveBreakfastLocale(content, "en").title).toBe("Titulo PT");
    expect(resolveBreakfastLocale(content, "en").badges).toEqual(["Cafe PT"]);
    content.locales.en = { ...content.locales.en, title: "", badges: [] };
    expect(resolveBreakfastLocale(content, "en").title).toBe("Titulo PT");
    expect(resolveBreakfastLocale(content, "en").badges).toEqual(["Cafe PT"]);
  });

  it("persists enabled=false without deleting content", () => {
    const content = sanitizeBreakfastContent({ enabled: false });

    expect(content.enabled).toBe(false);
    expect(content.locales.pt.title).toBeTruthy();
  });
});
