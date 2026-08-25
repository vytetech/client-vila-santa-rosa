import { getDb, isDatabaseConfigured } from "./connection";
import { reviews, type Review } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export async function listApprovedReviews() {
  if (!isDatabaseConfigured()) return [];
  return getDb().query.reviews.findMany({
    where: eq(reviews.status, "approved"),
    orderBy: [desc(reviews.createdAt)],
  });
}

/** Public home reviews: only owner-approved rows, best-rated first, capped at 30. */
export async function listHomeHighlights() {
  if (!isDatabaseConfigured()) return [];
  return getDb().query.reviews.findMany({
    where: eq(reviews.status, "approved"),
    orderBy: [desc(reviews.rating), desc(reviews.createdAt)],
    limit: 30,
  });
}

export function selectPublicReviewsForHome(rows: Review[]) {
  return rows
    .filter((row) => row.status === "approved")
    .sort((a, b) => b.rating - a.rating || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);
}

export async function createBookingReview(data: {
  authorName: string;
  rating: number; // 1..10 (Booking scale)
  text: string;
}) {
  await getDb().insert(reviews).values({
    authorName: data.authorName,
    rating: data.rating,
    text: data.text,
    source: "booking",
    status: "approved",
  });
}

export async function updateReview(data: {
  id: number;
  authorName: string;
  rating: number;
  text: string;
  source: "site" | "booking";
  status: "pending" | "approved" | "rejected";
}) {
  await getDb()
    .update(reviews)
    .set({
      authorName: data.authorName,
      rating: data.rating,
      text: data.text,
      source: data.source,
      status: data.status,
    })
    .where(eq(reviews.id, data.id));
}

export async function deleteReview(id: number) {
  await getDb().delete(reviews).where(eq(reviews.id, id));
}

export async function listAllReviews() {
  return getDb().query.reviews.findMany({
    orderBy: [desc(reviews.createdAt)],
  });
}

export async function listReviewsByAccount(accountId: number) {
  return getDb().query.reviews.findMany({
    where: eq(reviews.accountId, accountId),
    orderBy: [desc(reviews.createdAt)],
  });
}

export async function createReview(data: {
  accountId: number;
  authorName: string;
  rating: number;
  text: string;
}) {
  await getDb().insert(reviews).values(data);
}

export async function setReviewStatus(id: number, status: "approved" | "rejected") {
  await getDb().update(reviews).set({ status }).where(eq(reviews.id, id));
}
