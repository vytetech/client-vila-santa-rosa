import { describe, expect, it } from "vitest";
import type { Review } from "@db/schema";
import { selectPublicReviewsForHome } from "./queries/reviews";

function review(overrides: Partial<Review>): Review {
  return {
    id: overrides.id ?? 1,
    accountId: overrides.accountId ?? null,
    authorName: overrides.authorName ?? "Hospede",
    rating: overrides.rating ?? 10,
    text: overrides.text ?? "Avaliacao criada pelo admin",
    source: overrides.source ?? "booking",
    status: overrides.status ?? "approved",
    createdAt: overrides.createdAt ?? new Date("2026-08-22T12:00:00"),
  };
}

describe("public reviews for home", () => {
  it("returns approved admin reviews even below the old Booking score threshold", () => {
    const rows = [review({ id: 1, rating: 7, status: "approved", source: "booking" })];

    expect(selectPublicReviewsForHome(rows).map((row) => row.id)).toEqual([1]);
  });

  it("does not return pending or rejected reviews", () => {
    const rows = [
      review({ id: 1, status: "approved" }),
      review({ id: 2, status: "pending" }),
      review({ id: 3, status: "rejected" }),
    ];

    expect(selectPublicReviewsForHome(rows).map((row) => row.id)).toEqual([1]);
  });

  it("reflects changed text, delete-by-absence and reload from persisted rows", () => {
    const created = [review({ id: 1, text: "Texto inicial" })];
    const changed = [review({ id: 1, text: "Texto alterado" })];
    const deleted: Review[] = [];

    expect(selectPublicReviewsForHome(created)[0]?.text).toBe("Texto inicial");
    expect(selectPublicReviewsForHome(changed)[0]?.text).toBe("Texto alterado");
    expect(selectPublicReviewsForHome(deleted)).toEqual([]);
  });

  it("orders multiple approved reviews by rating and then creation date", () => {
    const rows = [
      review({ id: 1, rating: 8, createdAt: new Date("2026-08-20T12:00:00") }),
      review({ id: 2, rating: 10, createdAt: new Date("2026-08-19T12:00:00") }),
      review({ id: 3, rating: 8, createdAt: new Date("2026-08-21T12:00:00") }),
    ];

    expect(selectPublicReviewsForHome(rows).map((row) => row.id)).toEqual([2, 3, 1]);
  });
});
