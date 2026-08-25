import { describe, expect, it } from "vitest";
import {
  evaluateCoupon,
  isCouponExpired,
  isCouponNotStarted,
  toDateKey,
  validateCouponDateRange,
} from "./queries/coupons";

describe("coupon calendar expiration", () => {
  it("keeps coupons without start or expiration valid", () => {
    expect(
      evaluateCoupon(
        { active: true, validFrom: null, validUntil: null },
        "2026-12-31"
      )
    ).toEqual({
      ok: true,
    });
    expect(isCouponExpired(null, "2026-12-31")).toBe(false);
  });

  it("keeps coupons valid when they start today", () => {
    expect(isCouponNotStarted("2026-12-31", "2026-12-31")).toBe(false);
    expect(
      evaluateCoupon({ active: true, validFrom: "2026-12-31" }, "2026-12-31")
    ).toEqual({
      ok: true,
    });
  });

  it('rejects coupons that start tomorrow with "coupon_not_started"', () => {
    expect(isCouponNotStarted("2027-01-01", "2026-12-31")).toBe(true);
    expect(
      evaluateCoupon({ active: true, validFrom: "2027-01-01" }, "2026-12-31")
    ).toEqual({
      ok: false,
      reason: "coupon_not_started",
    });
  });

  it("keeps coupons valid after their start date", () => {
    expect(
      evaluateCoupon({ active: true, validFrom: "2026-12-30" }, "2026-12-31")
    ).toEqual({
      ok: true,
    });
  });

  it("keeps coupons with future expiration valid", () => {
    expect(isCouponExpired("2027-01-01", "2026-12-31")).toBe(false);
  });

  it("keeps coupons valid through the validUntil date", () => {
    expect(isCouponExpired("2026-12-31", "2026-12-31")).toBe(false);
    expect(
      evaluateCoupon({ active: true, validUntil: "2026-12-31" }, "2026-12-31")
    ).toEqual({
      ok: true,
    });
  });

  it("expires coupons on the day after validUntil", () => {
    expect(isCouponExpired("2026-12-30", "2026-12-31")).toBe(true);
  });

  it("formats Date values with local calendar fields instead of UTC slicing", () => {
    expect(toDateKey(new Date(2026, 11, 31, 23, 30))).toBe("2026-12-31");
  });

  it("rejects missing or inactive coupons as invalid", () => {
    expect(evaluateCoupon(null, "2026-12-31")).toEqual({
      ok: false,
      reason: "invalid_coupon",
    });
    expect(
      evaluateCoupon({ active: false, validUntil: "2027-01-01" }, "2026-12-31")
    ).toEqual({
      ok: false,
      reason: "invalid_coupon",
    });
  });

  it('rejects expired coupons with "expired_coupon"', () => {
    expect(
      evaluateCoupon({ active: true, validUntil: "2026-12-30" }, "2026-12-31")
    ).toEqual({
      ok: false,
      reason: "expired_coupon",
    });
  });

  it("rejects invalid date ranges", () => {
    expect(validateCouponDateRange("2026-10-01", "2026-09-30")).toEqual({
      ok: false,
      reason: "invalid_date_range",
    });
  });

  it("keeps coupons valid inside a complete inclusive range", () => {
    expect(
      evaluateCoupon(
        { active: true, validFrom: "2026-09-01", validUntil: "2026-09-30" },
        "2026-09-30"
      )
    ).toEqual({ ok: true });
  });
});
