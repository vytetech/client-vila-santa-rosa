import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("admin reviews management", () => {
  it("exposes complete admin-only CRUD mutations", () => {
    const source = fs.readFileSync(new URL("./review-router.ts", import.meta.url), "utf8");

    expect(source).toContain("adminList: adminQuery");
    expect(source).toContain("addBooking: adminQuery");
    expect(source).toContain("update: adminQuery");
    expect(source).toContain("remove: adminQuery");
    expect(source).toContain("approve: adminQuery");
    expect(source).toContain("reject: adminQuery");
    expect(source).not.toContain("remove: publicQuery");
    expect(source).not.toContain("update: publicQuery");
  });

  it("keeps a public read-only testimonials query", () => {
    const source = fs.readFileSync(new URL("./review-router.ts", import.meta.url), "utf8");

    expect(source).toContain("publicList: publicQuery.query");
    expect(source).toContain("listHomeHighlights()");
  });

  it("validates review editing payloads", () => {
    const source = fs.readFileSync(new URL("./review-router.ts", import.meta.url), "utf8");

    expect(source).toContain("authorName: z.string().min(2).max(255)");
    expect(source).toContain("rating: z.number().min(1).max(10)");
    expect(source).toContain("text: z.string().min(4).max(2000)");
    expect(source).toContain('source: z.enum(["site", "booking"])');
    expect(source).toContain('status: z.enum(["pending", "approved", "rejected"])');
  });
});
