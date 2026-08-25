import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  listCoupons,
  setCouponActive,
  updateCoupon,
  validateCouponDateRange,
  validateCoupon,
} from "./queries/coupons";

const couponDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional();

function isDuplicateCouponError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; errno?: number; message?: string };
  return maybe.code === "ER_DUP_ENTRY" || maybe.errno === 1062;
}

export const couponsRouter = createRouter({
  /** Public — guest validates a coupon code at booking time. */
  validate: publicQuery
    .input(z.object({ code: z.string().min(2).max(64) }))
    .query(async ({ input }) => {
      try {
        const result = await validateCoupon(input.code);
        if (!result.ok) return { valid: false as const, reason: result.reason };
        const coupon = result.coupon;
        return {
          valid: true as const,
          code: coupon.code,
          percent: coupon.percent,
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil,
        };
      } catch {
        return { valid: false as const, reason: "invalid_coupon" as const };
      }
    }),

  /* ---------- owner (admin) ---------- */
  list: adminQuery.query(async () => {
    try {
      return await listCoupons();
    } catch {
      return [];
    }
  }),

  create: adminQuery
    .input(
      z.object({
        code: z
          .string()
          .min(3)
          .max(64)
          .regex(/^[A-Za-z0-9_-]+$/, "code_chars"),
        percent: z.number().int().min(1).max(90),
        validFrom: couponDateSchema,
        validUntil: couponDateSchema,
      })
    )
    .mutation(async ({ input }) => {
      const dateRange = validateCouponDateRange(
        input.validFrom,
        input.validUntil
      );
      if (!dateRange.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "invalid_date_range",
        });
      }
      try {
        await createCoupon(
          input.code,
          input.percent,
          input.validFrom,
          input.validUntil
        );
        return { success: true };
      } catch (error) {
        if (isDuplicateCouponError(error)) {
          throw new TRPCError({ code: "CONFLICT", message: "code_exists" });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "coupon_create_failed",
        });
      }
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number().int(),
        code: z
          .string()
          .min(3)
          .max(64)
          .regex(/^[A-Za-z0-9_-]+$/, "code_chars")
          .optional(),
        percent: z.number().int().min(1).max(90).optional(),
        active: z.boolean().optional(),
        validFrom: couponDateSchema,
        validUntil: couponDateSchema,
      })
    )
    .mutation(async ({ input }) => {
      const hasDateUpdate =
        input.validFrom !== undefined || input.validUntil !== undefined;
      const existing = hasDateUpdate ? await getCouponById(input.id) : null;
      const nextValidFrom =
        input.validFrom !== undefined ? input.validFrom : existing?.validFrom;
      const nextValidUntil =
        input.validUntil !== undefined
          ? input.validUntil
          : existing?.validUntil;
      const dateRange = validateCouponDateRange(nextValidFrom, nextValidUntil);
      if (!dateRange.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "invalid_date_range",
        });
      }
      try {
        await updateCoupon(input.id, {
          code: input.code,
          percent: input.percent,
          active: input.active,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
        });
        return { success: true };
      } catch (error) {
        if (isDuplicateCouponError(error)) {
          throw new TRPCError({ code: "CONFLICT", message: "code_exists" });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "coupon_update_failed",
        });
      }
    }),

  toggle: adminQuery
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      await setCouponActive(input.id, input.active);
      return { success: true };
    }),

  remove: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCoupon(input.id);
      return { success: true };
    }),
});
