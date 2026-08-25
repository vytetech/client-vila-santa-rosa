import { describe, expect, it } from "vitest";
import { buildBookingStats } from "./admin-stats";

const prices = { luxo: 300, marrok: 200, sonhos: 250 };

describe("admin booking stats", () => {
  it("serializes a zero-booking dashboard", () => {
    expect(buildBookingStats([], prices)).toEqual({
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      bookedNights: 0,
      revenue: 0,
      monthly: [],
    });
  });

  it("handles pending, confirmed, cancelled and cents values", () => {
    const stats = buildBookingStats(
      [
        {
          checkIn: "2026-12-24",
          checkOut: "2026-12-26",
          roomId: "marrok",
          status: "pending",
          totalCents: 37000,
        },
        {
          checkIn: "2026-12-27",
          checkOut: "2026-12-29",
          roomId: "luxo",
          status: "confirmed",
          totalCents: 0,
        },
        {
          checkIn: "2026-12-29",
          checkOut: "2026-12-31",
          roomId: "sonhos",
          status: "cancelled",
          totalCents: 999999,
        },
      ],
      prices,
    );
    expect(stats.total).toBe(3);
    expect(stats.pending).toBe(1);
    expect(stats.confirmed).toBe(1);
    expect(stats.cancelled).toBe(1);
    expect(stats.bookedNights).toBe(4);
    expect(stats.revenue).toBe(970);
    expect(stats.monthly).toEqual([{ month: "2026-12", bookings: 2, nights: 4, revenue: 970 }]);
  });

  it("keeps historical null pricing fields valid", () => {
    const stats = buildBookingStats(
      [
        {
          checkIn: "2026-01-10",
          checkOut: "2026-01-12",
          roomId: "marrok",
          status: "confirmed",
          totalCents: null,
        },
      ],
      prices,
    );
    expect(stats.revenue).toBe(400);
    expect(JSON.parse(JSON.stringify(stats))).toEqual(stats);
  });
});
