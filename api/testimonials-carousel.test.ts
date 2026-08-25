import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("testimonials carousel", () => {
  const source = fs.readFileSync(new URL("../src/sections/Testimonials.tsx", import.meta.url), "utf8");

  it("uses responsive visible counts for desktop, tablet and mobile", () => {
    expect(source).toContain("if (width >= 1024) return 3");
    expect(source).toContain("if (width >= 640) return 2");
    expect(source).toContain("return 1");
  });

  it("keeps all testimonials in one horizontal row without fake cards", () => {
    expect(source).toContain("flex flex-nowrap");
    expect(source).toContain("shrink-0");
    expect(source).not.toContain("placeholder");
    expect(source).not.toContain("fake");
  });

  it("adds accessible previous and next controls", () => {
    expect(source).toContain('aria-label="Depoimentos anteriores"');
    expect(source).toContain('aria-label="Próximos depoimentos"');
    expect(source).toContain("goPrevious");
    expect(source).toContain("goNext");
  });

  it("hides controls when the amount is not greater than the visible count", () => {
    expect(source).toContain("const showControls = testimonials.length > visibleCount");
  });

  it("limits long testimonial text to keep cards visually consistent", () => {
    expect(source).toContain("line-clamp-6");
    expect(source).toContain("min-h-[330px]");
  });
});
