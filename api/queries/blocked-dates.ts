import { getDb } from "./connection";
import { blockedDates } from "@db/schema";
import { and, eq, gte, lt } from "drizzle-orm";
import { datesInStay } from "../lib/booking-rules";

/** Blocked days for a suite within a window, as a Set of "YYYY-MM-DD". */
export async function getBlockedDays(
  roomId: string,
  from: string,
  to: string,
): Promise<Set<string>> {
  const rows = await getDb()
    .select()
    .from(blockedDates)
    .where(
      and(
        eq(blockedDates.roomId, roomId),
        gte(blockedDates.date, from),
        lt(blockedDates.date, to),
      ),
    );
  return new Set(rows.map((r) => r.date));
}

export async function blockDateRange(roomId: string, dates: string[]) {
  const uniqueDates = [...new Set(dates)];
  if (!uniqueDates.length) return;
  await getDb()
    .insert(blockedDates)
    .values(uniqueDates.map((date) => ({ roomId, date })))
    .onDuplicateKeyUpdate({ set: { roomId } });
}

export async function hasBlockedDateInStay(roomId: string, checkIn: string, checkOut: string) {
  const blocked = await getBlockedDays(roomId, checkIn, checkOut);
  return datesInStay(checkIn, checkOut).some((day) => blocked.has(day));
}

export async function unblockDate(roomId: string, date: string) {
  await getDb()
    .delete(blockedDates)
    .where(and(eq(blockedDates.roomId, roomId), eq(blockedDates.date, date)));
}
