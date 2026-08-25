import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import {
  confirmReferral,
  countConfirmedReferrals,
  createReferral,
  findReferralById,
  listAllReferrals,
  listReferralsByReferrer,
} from "./queries/referrals";
import { findAccountByReferralCode, grantLifetimeDiscount } from "./queries/guests";

export const referralRouter = createRouter({
  /** Logged-in guest: my referrals + progress toward the lifetime 5%. */
  mine: publicQuery.query(async ({ ctx }) => {
    if (!ctx.guest) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required" });
    }
    const items = await listReferralsByReferrer(ctx.guest.id);
    const confirmed = await countConfirmedReferrals(ctx.guest.id);
    return {
      items,
      confirmed,
      needed: 3,
      hasLifetimeDiscount: ctx.guest.hasLifetimeDiscount,
      referralCode: ctx.guest.referralCode,
    };
  }),

  /* ---------- owner (admin) ---------- */
  adminList: adminQuery.query(() => listAllReferrals()),

  /** Owner registers a referred booking manually (name + stay dates). */
  adminAdd: adminQuery
    .input(
      z.object({
        referralCode: z.string().min(1),
        guestName: z.string().min(2).max(255),
        checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(async ({ input }) => {
      const referrer = await findAccountByReferralCode(input.referralCode.toUpperCase());
      if (!referrer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "referrer_not_found" });
      }
      await createReferral({
        referrerAccountId: referrer.id,
        guestName: input.guestName,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        status: "confirmed",
      });
      const confirmed = await countConfirmedReferrals(referrer.id);
      if (confirmed >= 3 && !referrer.hasLifetimeDiscount) {
        await grantLifetimeDiscount(referrer.id);
      }
      return { success: true, confirmed };
    }),

  adminConfirm: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const referral = await findReferralById(input.id);
      if (!referral) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await confirmReferral(input.id);
      const confirmed = await countConfirmedReferrals(referral.referrerAccountId);
      if (confirmed >= 3) {
        await grantLifetimeDiscount(referral.referrerAccountId);
      }
      return { success: true, confirmed };
    }),
});
