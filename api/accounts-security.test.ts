import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./utils";

describe("admin account management security", () => {
  it("stores passwords only as scrypt hashes", () => {
    const password = `S3gura-${Date.now()}`;
    const stored = hashPassword(password);

    expect(stored).not.toBe(password);
    expect(stored.split(":")).toHaveLength(2);
    expect(verifyPassword(password, stored)).toBe(true);
    expect(verifyPassword(`${password}-old`, stored)).toBe(false);
  });

  it("keeps account mutations behind adminQuery", () => {
    const source = fs.readFileSync(new URL("./accounts-router.ts", import.meta.url), "utf8");

    expect(source).toContain("list: adminQuery");
    expect(source).toContain("create: adminQuery");
    expect(source).toContain("update: adminQuery");
    expect(source).toContain("resetPassword: adminQuery");
    expect(source).toContain("remove: adminQuery");
    expect(source).not.toContain("create: publicQuery");
  });

  it("returns controlled errors for duplicate usernames and last admin protection", () => {
    const source = fs.readFileSync(new URL("./accounts-router.ts", import.meta.url), "utf8");

    expect(source).toContain('message: "username_taken"');
    expect(source).toContain('message: "last_admin_protected"');
    expect(source).toContain("countOtherActiveAdmins");
  });

  it("blocks inactive accounts during login and session lookup", () => {
    const guestRouter = fs.readFileSync(new URL("./guest-router.ts", import.meta.url), "utf8");
    const guestQueries = fs.readFileSync(new URL("./queries/guests.ts", import.meta.url), "utf8");

    expect(guestRouter).toContain("account_inactive");
    expect(guestQueries).toContain("!account?.isActive");
    expect(guestQueries).toContain("delete(guestSessions)");
  });
});
