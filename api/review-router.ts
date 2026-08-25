import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import {
  createBookingReview,
  createReview,
  deleteReview,
  listAllReviews,
  listApprovedReviews,
  listHomeHighlights,
  listReviewsByAccount,
  setReviewStatus,
  updateReview,
} from "./queries/reviews";

export const reviewRouter = createRouter({
  /** Public — only owner-approved reviews are shown on the site. */
  listApproved: publicQuery.query(() => listApprovedReviews()),

  /** Public — approved reviews, best first, max 30. */
  highlights: publicQuery.query(() => listHomeHighlights()),

  /** Public — approved reviews for testimonials. */
  publicList: publicQuery.query(() => listHomeHighlights()),

  /** Logged-in guest submits a review — stays pending until owner approval. */
  create: publicQuery
    .input(
      z.object({
        rating: z.number().int().min(1).max(5),
        text: z.string().min(10).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.guest) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required" });
      }
      await createReview({
        accountId: ctx.guest.id,
        authorName: ctx.guest.fullName,
        rating: input.rating,
        text: input.text,
      });
      return { success: true };
    }),

  mine: publicQuery.query(({ ctx }) => {
    if (!ctx.guest) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required" });
    }
    return listReviewsByAccount(ctx.guest.id);
  }),

  /* ---------- owner (admin) ---------- */
  adminList: adminQuery.query(() => listAllReviews()),

  /** Owner pastes a Booking.com review (10-scale). Published immediately. */
  addBooking: adminQuery
    .input(
      z.object({
        authorName: z.string().min(2).max(255),
        rating: z.number().min(1).max(10),
        text: z.string().min(4).max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      await createBookingReview(input);
      return { success: true };
    }),

  approve: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => setReviewStatus(input.id, "approved")),

  reject: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => setReviewStatus(input.id, "rejected")),

  update: adminQuery
    .input(
      z.object({
        id: z.number().int(),
        authorName: z.string().min(2).max(255),
        rating: z.number().min(1).max(10),
        text: z.string().min(4).max(2000),
        source: z.enum(["site", "booking"]),
        status: z.enum(["pending", "approved", "rejected"]),
      }),
    )
    .mutation(async ({ input }) => {
      await updateReview(input);
      return { success: true };
    }),

  remove: adminQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await deleteReview(input.id);
      return { success: true };
    }),
});
