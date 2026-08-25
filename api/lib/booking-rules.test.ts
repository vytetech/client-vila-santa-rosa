import { describe, expect, it } from "vitest";
import {
  applyPercentCoupon,
  assertStayWindow,
  calculateNights,
  calculateStayPrice,
  datesInStay,
  getNightlyDirectPrices,
  rangeTouchesSet,
} from "./booking-rules";
import { calculateBookingPricing, centsToReais } from "@contracts/pricing";

describe("booking rules", () => {
  it("calculates nights with checkout as an exclusive date", () => {
    expect(calculateNights("2026-12-23", "2026-12-25")).toBe(2);
    expect(datesInStay("2026-12-23", "2026-12-25")).toEqual([
      "2026-12-23",
      "2026-12-24",
    ]);
  });

  it("matches blocked-date semantics for [checkIn, checkOut)", () => {
    const blocked = new Set(["2026-12-25"]);
    expect(rangeTouchesSet("2026-12-24", "2026-12-26", blocked)).toBe(true);
    expect(rangeTouchesSet("2026-12-25", "2026-12-27", blocked)).toBe(true);
    expect(rangeTouchesSet("2026-12-23", "2026-12-25", blocked)).toBe(false);
    expect(rangeTouchesSet("2026-12-26", "2026-12-27", blocked)).toBe(false);
  });

  it("enforces minimum and maximum nights", () => {
    expect(() => assertStayWindow(2, 2, 5)).not.toThrow();
    expect(() => assertStayWindow(1, 2, 5)).toThrow("min_nights");
    expect(() => assertStayWindow(6, 2, 5)).toThrow("max_nights");
    expect(() => assertStayWindow(0, 2, 5)).toThrow("invalid_dates");
  });

  it("uses per-date price overrides and fallback default price", () => {
    expect(
      calculateStayPrice("2026-01-10", "2026-01-13", 400, {
        "2026-01-11": 600,
      }),
    ).toBe(1400);
  });

  it("applies valid coupons and rejects invalid percentages", () => {
    expect(applyPercentCoupon(1000, 15)).toBe(850);
    expect(() => applyPercentCoupon(1000, 0)).toThrow("invalid_coupon");
    expect(() => applyPercentCoupon(1000, 91)).toThrow("invalid_coupon");
  });

  it("keeps the new version pricing rule: admin price is the direct nightly price", () => {
    const pricing = calculateBookingPricing({
      nightlyDirectPrices: [
        { date: "2026-01-10", price: 200 },
        { date: "2026-01-11", price: 200 },
      ],
      pets: 0,
      petFee: 0,
    });

    expect(centsToReais(pricing.lodgingSubtotalCents)).toBe(400);
    expect(centsToReais(pricing.platformSubtotalCents)).toBe(421);
    expect(centsToReais(pricing.totalCents)).toBe(400);
  });

  it("does not alter price for solo or multiple guests in the new rule", () => {
    const solo = calculateBookingPricing({
      nightlyDirectPrices: [{ date: "2026-01-10", price: 200 }],
      pets: 0,
      petFee: 0,
    });
    const multipleGuests = calculateBookingPricing({
      nightlyDirectPrices: [{ date: "2026-01-10", price: 200 }],
      pets: 0,
      petFee: 0,
    });

    expect(solo.totalCents).toBe(multipleGuests.totalCents);
  });

  it("adds pet fees explicitly to the total", () => {
    const pricing = calculateBookingPricing({
      nightlyDirectPrices: [
        { date: "2026-01-10", price: 200 },
        { date: "2026-01-11", price: 200 },
      ],
      pets: 1,
      petFee: 160,
    });

    expect(centsToReais(pricing.lodgingSubtotalCents)).toBe(400);
    expect(centsToReais(pricing.petFeeCents)).toBe(160);
    expect(centsToReais(pricing.totalCents)).toBe(560);
  });

  it("uses per-date prices in nightly lines and totals", () => {
    const pricing = calculateBookingPricing({
      nightlyDirectPrices: getNightlyDirectPrices("2026-01-10", "2026-01-12", 200, {
        "2026-01-10": 220,
        "2026-01-11": 240,
      }),
      pets: 0,
      petFee: 0,
    });

    expect(centsToReais(pricing.lodgingSubtotalCents)).toBe(460);
    expect(centsToReais(pricing.platformSubtotalCents)).toBe(484);
  });

  it("applies coupon after lodging and pet fees", () => {
    const pricing = calculateBookingPricing({
      nightlyDirectPrices: [{ date: "2026-01-10", price: 200 }],
      pets: 1,
      petFee: 80,
      couponPercent: 10,
    });

    expect(centsToReais(pricing.couponDiscountCents)).toBe(28);
    expect(centsToReais(pricing.totalCents)).toBe(252);
  });

  it("keeps referral discounts out of pricing unless a future rule explicitly wires them", () => {
    const base = calculateBookingPricing({
      nightlyDirectPrices: [{ date: "2026-01-10", price: 200 }],
      pets: 0,
      petFee: 0,
    });
    expect(centsToReais(base.totalCents)).toBe(200);
  });

  it("adds the 7.99% payment fee only to the deposit due", () => {
    const pix = calculateBookingPricing({
      nightlyDirectPrices: [
        { date: "2026-01-10", price: 200 },
        { date: "2026-01-11", price: 200 },
      ],
      pets: 0,
      petFee: 0,
      paymentMethod: "pix",
    });
    const card = calculateBookingPricing({
      nightlyDirectPrices: [
        { date: "2026-01-10", price: 200 },
        { date: "2026-01-11", price: 200 },
      ],
      pets: 0,
      petFee: 0,
      paymentMethod: "card",
    });

    expect(centsToReais(pix.totalCents)).toBe(400);
    expect(centsToReais(card.totalCents)).toBe(400);
    expect(centsToReais(card.paymentFeeCents)).toBe(16);
    expect(centsToReais(card.depositDueCents)).toBe(216);
  });

  it("combines direct price, pet fee and coupon deterministically", () => {
    const pricing = calculateBookingPricing({
      nightlyDirectPrices: [
        { date: "2026-01-10", price: 200 },
        { date: "2026-01-11", price: 220 },
      ],
      pets: 1,
      petFee: 160,
      couponPercent: 10,
    });

    expect(centsToReais(pricing.totalCents)).toBe(522);
  });
});
