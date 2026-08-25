import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  THEME_DEFAULTS,
  isHexColor,
  sanitizeThemeConfig,
} from "@contracts/theme";

describe("visual identity theme settings", () => {
  it("keeps the Vila Santa Rosa visual defaults as fallback", () => {
    expect(sanitizeThemeConfig({})).toEqual(THEME_DEFAULTS);
  });

  it("accepts only #RRGGBB color values and controlled fonts", () => {
    const theme = sanitizeThemeConfig({
      primaryColor: "#123abc",
      secondaryColor: "red",
      headingFont: "Lora",
      bodyFont: "Inter",
    });

    expect(theme.primaryColor).toBe("#123ABC");
    expect(theme.secondaryColor).toBe(THEME_DEFAULTS.secondaryColor);
    expect(theme.headingFont).toBe("Lora");
    expect(theme.bodyFont).toBe("Inter");
    expect(isHexColor("#D84B81")).toBe(true);
    expect(isHexColor("#GGGGGG")).toBe(false);
  });

  it("protects write/reset procedures with adminQuery and keeps read public", () => {
    const source = fs.readFileSync(new URL("./settings-router.ts", import.meta.url), "utf8");

    expect(source).toContain("theme: publicQuery.query");
    expect(source).toContain("setTheme: adminQuery");
    expect(source).toContain("resetTheme: adminQuery");
    expect(source).not.toContain("setTheme: publicQuery");
    expect(source).not.toContain("resetTheme: publicQuery");
  });

  it("does not expose free CSS, HTML, script, or external font URLs in the contract", () => {
    const contract = fs.readFileSync(new URL("../contracts/theme.ts", import.meta.url), "utf8");

    expect(contract).not.toMatch(/cssText|styleTag|innerHTML|script|url\(/i);
  });
});
