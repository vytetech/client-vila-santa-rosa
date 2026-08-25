import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { detectImageExt } from "./lib/upload-validation";

describe("photo upload safeguards", () => {
  it("detects real JPEG, PNG and WebP signatures", () => {
    expect(detectImageExt(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe("jpg");
    expect(
      detectImageExt(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("png");
    expect(detectImageExt(Buffer.from("RIFFxxxxWEBP", "ascii"))).toBe("webp");
    expect(detectImageExt(Buffer.from("not-an-image"))).toBeNull();
  });

  it("keeps administrative photo mutations behind adminQuery", () => {
    const source = fs.readFileSync(new URL("./photos-router.ts", import.meta.url), "utf8");
    expect(source).toContain("upload: adminQuery");
    expect(source).toContain("remove: adminQuery");
  });

  it("uses UPLOAD_DIR and safe UUID filenames for Railway Volume uploads", () => {
    const source = fs.readFileSync(new URL("./photos-router.ts", import.meta.url), "utf8");
    expect(source).toContain("process.env.UPLOAD_DIR");
    expect(source).toContain("randomUUID()");
    expect(source).toContain("path.basename(filePath)");
  });
});
