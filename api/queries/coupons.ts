import { getDb } from "./connection";
import { coupons, type Coupon } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export type CouponValidation =
  | { ok: true; coupon: Coupon }
  | {
      ok: false;
      reason: "invalid_coupon" | "coupon_not_started" | "expired_coupon";
    };

export interface CouponLike {
  active: boolean;
  validFrom?: string | Date | null;
  validUntil?: string | Date | null;
}

export async function listCoupons() {
  return getDb().query.coupons.findMany({
    orderBy: [desc(coupons.createdAt)],
  });
}

export async function getCouponById(id: number) {
  return getDb().query.coupons.findFirst({
    where: eq(coupons.id, id),
  });
}

export async function createCoupon(
  code: string,
  percent: number,
  validFrom?: string | null,
  validUntil?: string | null
) {
  const normalized = code.trim().toUpperCase();
  const [row] = await getDb()
    .insert(coupons)
    .values({
      code: normalized,
      percent,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
    })
    .$returningId();
  return row.id;
}

export async function updateCoupon(
  id: number,
  data: {
    code?: string;
    percent?: number;
    active?: boolean;
    validFrom?: string | null;
    validUntil?: string | null;
  }
) {
  const values: Partial<typeof coupons.$inferInsert> = {};
  if (data.code !== undefined) values.code = data.code.trim().toUpperCase();
  if (data.percent !== undefined) values.percent = data.percent;
  if (data.active !== undefined) values.active = data.active;
  if (data.validFrom !== undefined) values.validFrom = data.validFrom || null;
  if (data.validUntil !== undefined)
    values.validUntil = data.validUntil || null;
  if (Object.keys(values).length === 0) return;
  await getDb().update(coupons).set(values).where(eq(coupons.id, id));
}

export async function setCouponActive(id: number, active: boolean) {
  await getDb().update(coupons).set({ active }).where(eq(coupons.id, id));
}

export async function deleteCoupon(id: number) {
  await getDb().delete(coupons).where(eq(coupons.id, id));
}

/** Returns the active coupon for a code, or null. */
export async function findActiveCoupon(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const row = await getDb().query.coupons.findFirst({
    where: eq(coupons.code, normalized),
  });
  if (!row || !row.active) return null;
  if (!evaluateCoupon(row).ok) return null;
  return row;
}

export async function validateCoupon(
  code: string,
  today = localDateKey()
): Promise<CouponValidation> {
  const normalized = code.trim().toUpperCase();
  if (!normalized)
    return { ok: false as const, reason: "invalid_coupon" as const };
  const row = await getDb().query.coupons.findFirst({
    where: eq(coupons.code, normalized),
  });
  if (!row) return { ok: false as const, reason: "invalid_coupon" as const };
  const result = evaluateCoupon(row, today);
  if (!result.ok) return result;
  return { ok: true as const, coupon: row };
}

export function evaluateCoupon(
  row: CouponLike | null | undefined,
  today = localDateKey()
) {
  if (!row || !row.active) {
    return { ok: false as const, reason: "invalid_coupon" as const };
  }
  if (isCouponNotStarted(row.validFrom, today)) {
    return { ok: false as const, reason: "coupon_not_started" as const };
  }
  if (isCouponExpired(row.validUntil, today)) {
    return { ok: false as const, reason: "expired_coupon" as const };
  }
  return { ok: true as const };
}

export function validateCouponDateRange(
  validFrom?: string | null,
  validUntil?: string | null
) {
  if (validFrom && validUntil && validFrom > validUntil) {
    return { ok: false as const, reason: "invalid_date_range" as const };
  }
  return { ok: true as const };
}

export function isCouponNotStarted(
  validFrom?: string | Date | null,
  today = localDateKey()
) {
  const dateKey = toDateKey(validFrom);
  return Boolean(dateKey && today < dateKey);
}

export function isCouponExpired(
  validUntil?: string | Date | null,
  today = localDateKey()
) {
  const dateKey = toDateKey(validUntil);
  return Boolean(dateKey && today > dateKey);
}

export function toDateKey(value?: string | Date | null) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
