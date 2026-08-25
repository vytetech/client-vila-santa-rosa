import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("breakfast admin module integration", () => {
  it("keeps breakfast content writes admin-only and public reads read-only", () => {
    const source = fs.readFileSync(new URL("./settings-router.ts", import.meta.url), "utf8");

    expect(source).toContain("breakfast: publicQuery.query");
    expect(source).toContain("setBreakfast: adminQuery");
    expect(source).toContain("enabled: z.boolean()");
    expect(source).toContain("locales: z.record");
    expect(source).not.toContain("setBreakfast: publicQuery");
  });

  it("centralizes Cafe photos management in the Breakfast admin screen", () => {
    const source = fs.readFileSync(new URL("../src/pages/BreakfastManager.tsx", import.meta.url), "utf8");

    expect(source).toContain("trpc.photos.list.useQuery({ slot: PHOTO_SLOTS.cafe })");
    expect(source).toContain("trpc.photos.upload.useMutation");
    expect(source).toContain("trpc.photos.update.useMutation");
    expect(source).toContain("trpc.photos.remove.useMutation");
    expect(source).toContain("trpc.settings.setPhotoCaption.useMutation");
    expect(source).toContain("Definir principal");
    expect(source).toContain("Descrição curta");
  });

  it("does not keep a disconnected breakfast image path field", () => {
    const source = fs.readFileSync(new URL("../src/pages/BreakfastManager.tsx", import.meta.url), "utf8");

    expect(source).not.toContain("imagePath");
    expect(source).not.toContain("Caminho da imagem enviada");
  });

  it("public Breakfast section uses settings content, locale fallback and enabled toggle", () => {
    const source = fs.readFileSync(new URL("../src/sections/Breakfast.tsx", import.meta.url), "utf8");

    expect(source).toContain("resolveBreakfastLocale(saved, locale)");
    expect(source).toContain("if (saved.enabled === false) return null");
    expect(source).toContain("buildBreakfastPhotos");
    expect(source).not.toContain("d.breakfast");
  });
});
