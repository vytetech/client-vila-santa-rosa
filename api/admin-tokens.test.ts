import { describe, expect, it } from "vitest";
import { adminTokenTtlSeconds } from "./lib/admin-session";

describe("admin session ttl", () => {
  it("defaults admin sessions to two hours", () => {
    expect(adminTokenTtlSeconds()).toBe(120 * 60);
  });
});
