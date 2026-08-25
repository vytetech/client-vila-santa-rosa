import { getDb } from "./connection";
import { suiteDatePrices } from "@db/schema";
import { and, eq, gte, lt } from "drizzle-orm";

/** Returns overrides for one suite between two dates as { "YYYY-MM-DD": price }. */
export async function getDatePrices(
  roomId: string,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const rows = await getDb()
    .select()
    .from(suiteDatePrices)
    .where(
      and(
        eq(suiteDatePrices.roomId, roomId),
        gte(suiteDatePrices.date, from),
        lt(suiteDatePrices.date, to),
      ),
    );
  return Object.fromEntries(rows.map((r) => [r.date, r.price]));
}

/** Upsert a single date price. */
export async function setDatePrice(roomId: string, date: string, price: number) {
  const db = getDb();
  const existing = await db
    .select()
    .from(suiteDatePrices)
    .where(and(eq(suiteDatePrices.roomId, roomId), eq(suiteDatePrices.date, date)))
    .limit(1);
  if (existing.length) {
    await db
      .update(suiteDatePrices)
      .set({ price })
      .where(and(eq(suiteDatePrices.roomId, roomId), eq(suiteDatePrices.date, date)));
  } else {
    await db.insert(suiteDatePrices).values({ roomId, date, price });
  }
}

/** Upsert many dates at once (same price). */
export async function setDatePriceRange(
  roomId: string,
  dates: string[],
  price: number,
) {
  for (const date of dates) {
    await setDatePrice(roomId, date, price);
  }
}

/** Remove an override (fall back to the suite's default rate). */
export async function deleteDatePrice(roomId: string, date: string) {
  await getDb()
    .delete(suiteDatePrices)
    .where(and(eq(suiteDatePrices.roomId, roomId), eq(suiteDatePrices.date, date)));
}

/** Average override for a stay [checkIn, checkOut); dates without override return null per night. */
export async function getStayOverrides(
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<Record<string, number>> {
  return getDatePrices(roomId, checkIn, checkOut);
}
