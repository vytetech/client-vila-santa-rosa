/**
 * Booking.com iCal sync — por suíte, configurável no painel admin.
 *
 * Every SYNC_INTERVAL_MS the server downloads the enabled iCal feeds
 * and caches the booked day ranges in memory. URLs e o interruptor
 * on/off de cada suíte são editáveis em /admin (aba iCal).
 */

import { getIcalConfig, type IcalConfig } from "./queries/ical-config";

const DEFAULT_ICAL_URLS: Record<string, string> = {
  luxo: "https://ical.booking.com/v1/export?t=297a0f48-0169-4aa0-a9ac-63d627007479",
  marrok: "https://ical.booking.com/v1/export?t=4076d8fe-3385-4c4b-8d92-65b15ebb8542",
  sonhos: "https://ical.booking.com/v1/export?t=a78042c6-53e9-4f4d-8018-06dc5f623c3e",
};

const SYNC_INTERVAL_MS = 60 * 1000; // 1 minute (owner requirement)

type DayRange = { start: string; end: string }; // "yyyy-mm-dd", end exclusive

const cache: Record<string, Set<string>> = {
  luxo: new Set(),
  marrok: new Set(),
  sonhos: new Set(),
};
let lastSync: Date | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function toKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseICalDate(v: string): Date {
  // "20260716" (VALUE=DATE) or "20260716T004658Z"
  const y = Number(v.slice(0, 4));
  const m = Number(v.slice(4, 6)) - 1;
  const d = Number(v.slice(6, 8));
  return new Date(Date.UTC(y, m, d));
}

function expandRange(start: Date, endExclusive: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() < endExclusive.getTime()) {
    keys.push(toKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function parseRanges(ics: string): DayRange[] {
  const ranges: DayRange[] = [];
  const events = ics.split("BEGIN:VEVENT").slice(1);
  for (const ev of events) {
    const dtStart = /DTSTART[^:\r\n]*:(\d{8})/.exec(ev);
    const dtEnd = /DTEND[^:\r\n]*:(\d{8})/.exec(ev);
    if (dtStart && dtEnd) {
      ranges.push({ start: dtStart[1], end: dtEnd[1] });
    }
  }
  return ranges;
}

async function syncRoom(roomId: string, url: string): Promise<void> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`iCal ${roomId}: HTTP ${res.status}`);
  const ics = await res.text();
  const days = new Set<string>();
  for (const r of parseRanges(ics)) {
    for (const key of expandRange(parseICalDate(r.start), parseICalDate(r.end))) {
      days.add(key);
    }
  }
  cache[roomId] = days;
}

export async function syncAllCalendars(): Promise<void> {
  const config = await getIcalConfig();
  const rooms: Array<keyof IcalConfig> = ["luxo", "marrok", "sonhos"];
  const jobs = rooms
    .filter((room) => config[room].enabled && config[room].url)
    .map((room) => syncRoom(room, config[room].url));
  const results = await Promise.allSettled(jobs);
  const ok = results.filter((r) => r.status === "fulfilled").length;
  if (ok > 0) lastSync = new Date();
  console.log(
    `[ical-sync] ${ok}/${jobs.length} suites sincronizadas às ${lastSync?.toISOString()}`,
  );
}

export function startCalendarSync(): void {
  if (timer) return;
  void syncAllCalendars().catch((e) => console.error("[ical-sync]", e));
  timer = setInterval(() => {
    void syncAllCalendars().catch((e) => console.error("[ical-sync]", e));
  }, SYNC_INTERVAL_MS);
}

export function getBookedDays(roomId: string): string[] {
  return Array.from(cache[roomId] ?? []).sort();
}

export function getSyncStatus() {
  return {
    lastSync,
    rooms: Object.fromEntries(
      Object.entries(cache).map(([k, v]) => [k, v.size]),
    ),
  };
}

/** Per-suite Booking.com iCal export URLs (defaults for the admin panel). */
export function getIcalLinks(): Record<string, string> {
  return { ...DEFAULT_ICAL_URLS };
}
