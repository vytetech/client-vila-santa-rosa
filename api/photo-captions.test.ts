import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { resolvePhotoCaption, sanitizePhotoCaptions } from "@contracts/photo-captions";

describe("photo captions", () => {
  it("keeps captions multilingual and separate from alt text", () => {
    const captions = sanitizePhotoCaptions({
      15: { pt: "Bolo caseiro", en: "Homemade cake", es: "Pastel casero", ar: "كعكة منزلية" },
    });

    expect(resolvePhotoCaption(captions, 15, "pt")).toBe("Bolo caseiro");
    expect(resolvePhotoCaption(captions, 15, "en")).toBe("Homemade cake");
    expect(resolvePhotoCaption(captions, 15, "fr")).toBe("Bolo caseiro");
  });

  it("does not render a caption for photos without caption data", () => {
    expect(resolvePhotoCaption({}, 10, "pt")).toBe("");
    expect(resolvePhotoCaption({ 10: { pt: "" } }, 10, "en")).toBe("");
  });

  it("removes orphan caption data when a photo is deleted", () => {
    const source = fs.readFileSync(new URL("./photos-router.ts", import.meta.url), "utf8");

    expect(source).toContain("deletePhotoCaptions(input.id)");
  });

  it("keeps caption mutations admin-only and public captions read-only", () => {
    const source = fs.readFileSync(new URL("./settings-router.ts", import.meta.url), "utf8");

    expect(source).toContain("photoCaptions: publicQuery.query");
    expect(source).toContain("setPhotoCaption: adminQuery");
    expect(source).not.toContain("setPhotoCaption: publicQuery");
  });
});
