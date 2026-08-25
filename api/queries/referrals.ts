import { getDb } from "./connection";
import { referrals } from "@db/schema";
import { and, count, desc, eq } from "drizzle-orm";

export async function listReferralsByReferrer(referrerAccountId: number) {
  return getDb().query.referrals.findMany({
    where: eq(referrals.referrerAccountId, referrerAccountId),
    orderBy: [desc(referrals.createdAt)],
  });
}

export async function listAllReferrals() {
  return getDb().query.referrals.findMany({
    orderBy: [desc(referrals.createdAt)],
  });
}

export async function createReferral(data: {
  referrerAccountId: number;
  guestName: string;
  checkIn?: string;
  checkOut?: string;
  status: "pending" | "confirmed";
}) {
  await getDb().insert(referrals).values(data);
}

export async function confirmReferral(id: number) {
  await getDb()
    .update(referrals)
    .set({ status: "confirmed" })
    .where(eq(referrals.id, id));
}

export async function countConfirmedReferrals(referrerAccountId: number) {
  const [row] = await getDb()
    .select({ value: count() })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerAccountId, referrerAccountId),
        eq(referrals.status, "confirmed"),
      ),
    );
  return row?.value ?? 0;
}

export async function findReferralById(id: number) {
  return getDb().query.referrals.findFirst({ where: eq(referrals.id, id) });
}
