import { getDb, isDatabaseConfigured } from "./connection";
import { settings, suiteDateMinNights } from "@db/schema";
import { and, eq, gte, lt } from "drizzle-orm";

export type SuiteMinNights = Record<"luxo" | "marrok" | "sonhos", number>;
export type SuiteMaxNights = Record<"luxo" | "marrok" | "sonhos", number>;

const SUITE_MIN_KEY = "suiteMinNights";
const SUITE_MAX_KEY = "suiteMaxNights";
export const DEFAULT_SUITE_MIN: SuiteMinNights = { luxo: 2, marrok: 2, sonhos: 2 };
export const DEFAULT_SUITE_MAX: SuiteMaxNights = { luxo: 14, marrok: 14, sonhos: 14 };

/* ---------------- defaults: minimum ---------------- */

/** Default minimum nights per suite (owner-configurable). */
export async function getSuiteMinNights(): Promise<SuiteMinNights> {
  if (!isDatabaseConfigured()) return DEFAULT_SUITE_MIN;
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, SUITE_MIN_KEY),
  });
  if (!row) return DEFAULT_SUITE_MIN;
  try {
    const p = JSON.parse(row.value) as Partial<SuiteMinNights>;
    return {
      luxo: clampMin(p.luxo),
      marrok: clampMin(p.marrok),
      sonhos: clampMin(p.sonhos),
    };
  } catch {
    return DEFAULT_SUITE_MIN;
  }
}

function clampMin(v: unknown): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 60 ? n : 2;
}

export async function setSuiteMinNights(values: SuiteMinNights) {
  await getDb()
    .insert(settings)
    .values({ key: SUITE_MIN_KEY, value: JSON.stringify(values) })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(values) } });
}

/* ---------------- defaults: maximum ---------------- */

/** Default maximum nights per suite (owner-configurable). */
export async function getSuiteMaxNights(): Promise<SuiteMaxNights> {
  if (!isDatabaseConfigured()) return DEFAULT_SUITE_MAX;
  const row = await getDb().query.settings.findFirst({
    where: eq(settings.key, SUITE_MAX_KEY),
  });
  if (!row) return DEFAULT_SUITE_MAX;
  try {
    const p = JSON.parse(row.value) as Partial<SuiteMaxNights>;
    return {
      luxo: clampMax(p.luxo),
      marrok: clampMax(p.marrok),
      sonhos: clampMax(p.sonhos),
    };
  } catch {
    return DEFAULT_SUITE_MAX;
  }
}

function clampMax(v: unknown): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : 14;
}

export async function setSuiteMaxNights(values: SuiteMaxNights) {
  await getDb()
    .insert(settings)
    .values({ key: SUITE_MAX_KEY, value: JSON.stringify(values) })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(values) } });
}

/* ---------------- per-date overrides ---------------- */

/** Overrides between two dates as { "YYYY-MM-DD": minNights }. */
export async function getDateMinNights(
  roomId: string,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  if (!isDatabaseConfigured()) return {};
  const rows = await getDb()
    .select()
    .from(suiteDateMinNights)
    .where(
      and(
        eq(suiteDateMinNights.roomId, roomId),
        gte(suiteDateMinNights.date, from),
        lt(suiteDateMinNights.date, to),
      ),
    );
  return Object.fromEntries(
    rows.flatMap((r) => (r.minNights == null ? [] : [[r.date, r.minNights]])),
  );
}

/** Per-date maximum overrides between two dates. */
export async function getDateMaxNights(
  roomId: string,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  if (!isDatabaseConfigured()) return {};
  const rows = await getDb()
    .select()
    .from(suiteDateMinNights)
    .where(
      and(
        eq(suiteDateMinNights.roomId, roomId),
        gte(suiteDateMinNights.date, from),
        lt(suiteDateMinNights.date, to),
      ),
    );
  return Object.fromEntries(
    rows.filter((r) => r.maxNights != null).map((r) => [r.date, r.maxNights as number]),
  );
}

export async function setDateMinNight(roomId: string, date: string, minNights: number) {
  const db = getDb();
  const existing = await db
    .select()
    .from(suiteDateMinNights)
    .where(and(eq(suiteDateMinNights.roomId, roomId), eq(suiteDateMinNights.date, date)))
    .limit(1);
  if (existing.length) {
    await db
      .update(suiteDateMinNights)
      .set({ minNights })
      .where(and(eq(suiteDateMinNights.roomId, roomId), eq(suiteDateMinNights.date, date)));
  } else {
    await db.insert(suiteDateMinNights).values({ roomId, date, minNights });
  }
}

export async function setDateMaxNight(roomId: string, date: string, maxNights: number) {
  const db = getDb();
  const existing = await db
    .select()
    .from(suiteDateMinNights)
    .where(and(eq(suiteDateMinNights.roomId, roomId), eq(suiteDateMinNights.date, date)))
    .limit(1);
  if (existing.length) {
    await db
      .update(suiteDateMinNights)
      .set({ maxNights })
      .where(and(eq(suiteDateMinNights.roomId, roomId), eq(suiteDateMinNights.date, date)));
  } else {
    await db
      .insert(suiteDateMinNights)
      .values({ roomId, date, minNights: DEFAULT_SUITE_MIN[roomId as keyof SuiteMinNights] ?? 2, maxNights });
  }
}

export async function setDateMinNightRange(
  roomId: string,
  dates: string[],
  minNights: number,
) {
  for (const date of dates) {
    await setDateMinNight(roomId, date, minNights);
  }
}

export async function setDateMaxNightRange(
  roomId: string,
  dates: string[],
  maxNights: number,
) {
  for (const date of dates) {
    await setDateMaxNight(roomId, date, maxNights);
  }
}

export async function deleteDateMinNight(roomId: string, date: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(suiteDateMinNights)
    .where(and(eq(suiteDateMinNights.roomId, roomId), eq(suiteDateMinNights.date, date)))
    .limit(1);
  if (existing[0]?.maxNights != null) {
    await db
      .update(suiteDateMinNights)
      .set({ minNights: null })
      .where(and(eq(suiteDateMinNights.roomId, roomId), eq(suiteDateMinNights.date, date)));
    return;
  }
  await db
    .delete(suiteDateMinNights)
    .where(and(eq(suiteDateMinNights.roomId, roomId), eq(suiteDateMinNights.date, date)));
}

export async function deleteDateMaxNight(roomId: string, date: string) {
  await getDb()
    .update(suiteDateMinNights)
    .set({ maxNights: null })
    .where(and(eq(suiteDateMinNights.roomId, roomId), eq(suiteDateMinNights.date, date)));
}

/**
 * Effective minimum nights for a stay: the strictest (largest) value among
 * the suite default and any per-date override covering nights of the stay.
 */
export async function getEffectiveMinNights(
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<number> {
  const suiteDefaults = await getSuiteMinNights();
  const base = suiteDefaults[roomId as keyof SuiteMinNights] ?? 2;
  if (!isDatabaseConfigured()) return base;
  const rows = await getDb()
    .select()
    .from(suiteDateMinNights)
    .where(
      and(
        eq(suiteDateMinNights.roomId, roomId),
        gte(suiteDateMinNights.date, checkIn),
        lt(suiteDateMinNights.date, checkOut),
      ),
    );
  return rows.reduce((acc, r) => Math.max(acc, r.minNights ?? acc), base);
}

/**
 * Effective maximum nights for a stay: the strictest (smallest) value among
 * the suite default and any per-date override covering nights of the stay.
 */
export async function getEffectiveMaxNights(
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<number> {
  const suiteMaxes = await getSuiteMaxNights();
  const base = suiteMaxes[roomId as keyof SuiteMaxNights] ?? 14;
  if (!isDatabaseConfigured()) return base;
  const rows = await getDb()
    .select()
    .from(suiteDateMinNights)
    .where(
      and(
        eq(suiteDateMinNights.roomId, roomId),
        gte(suiteDateMinNights.date, checkIn),
        lt(suiteDateMinNights.date, checkOut),
      ),
    );
  return rows.reduce(
    (acc, r) => (r.maxNights != null ? Math.min(acc, r.maxNights) : acc),
    base,
  );
}
