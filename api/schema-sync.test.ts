import fs from "node:fs";
import { describe, expect, it } from "vitest";

type SchemaContract = Record<
  string,
  {
    columns: Record<string, string>;
    create: string;
    indexes: Array<{ name: string; unique: boolean; columns: string[] }>;
  }
>;

const { REQUIRED_SCHEMA } = (await import(
  "../scripts/" + "db-schema-sync.mjs"
)) as { REQUIRED_SCHEMA: SchemaContract };

describe("production schema sync contract", () => {
  it("covers all tables required by db/schema.ts", () => {
    expect(Object.keys(REQUIRED_SCHEMA).sort()).toEqual(
      [
        "admin_tokens",
        "blocked_dates",
        "booking_requests",
        "coupons",
        "guest_accounts",
        "guest_sessions",
        "password_resets",
        "referrals",
        "reviews",
        "settings",
        "site_photos",
        "suite_date_min_nights",
        "suite_date_prices",
        "users",
      ].sort()
    );
  });

  it("creates missing production tables and booking pricing columns", () => {
    expect(REQUIRED_SCHEMA.site_photos.columns).toMatchObject({
      slot: "VARCHAR(64) NOT NULL DEFAULT ''",
      path: "VARCHAR(255) NOT NULL DEFAULT ''",
      alt: "VARCHAR(255) NOT NULL DEFAULT ''",
      sort: "INT NOT NULL DEFAULT 0",
    });
    expect(REQUIRED_SCHEMA.blocked_dates.indexes).toContainEqual({
      name: "blocked_dates_room_date_unique",
      unique: true,
      columns: ["roomId", "date"],
    });
    expect(REQUIRED_SCHEMA.coupons.indexes).toContainEqual({
      name: "coupons_code_unique",
      unique: true,
      columns: ["code"],
    });
    expect(REQUIRED_SCHEMA.coupons.columns).toMatchObject({
      validFrom: "DATE NULL",
      validUntil: "DATE NULL",
    });
    expect(REQUIRED_SCHEMA.guest_accounts.columns).toMatchObject({
      isActive: "BOOLEAN NOT NULL DEFAULT TRUE",
    });
    for (const column of [
      "couponCode",
      "paymentMethod",
      "platformSubtotalCents",
      "lodgingSubtotalCents",
      "petFeeCents",
      "couponDiscountCents",
      "totalCents",
      "depositBaseCents",
      "paymentFeeCents",
      "depositDueCents",
      "pricingSnapshot",
    ]) {
      expect(REQUIRED_SCHEMA.booking_requests.columns).toHaveProperty(column);
    }
  });

  it("keeps the versioned SQL migration non-destructive", () => {
    const sql = fs.readFileSync(
      new URL(
        "../db/migrations/0001_production_schema_sync.sql",
        import.meta.url
      ),
      "utf8"
    );
    expect(sql).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP\s+DATABASE\b/i);
  });
});
