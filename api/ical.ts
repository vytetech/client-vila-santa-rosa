/**
 * Minimal iCal (RFC 5545) parser that extracts booked date ranges
 * from a Booking.com calendar export feed.
 */

export interface ICalEvent {
  start: string; // YYYY-MM-DD (inclusive)
  end: string; // YYYY-MM-DD (exclusive, per iCal DTEND semantics)
  summary: string;
}

function parseDate(raw: string): string | null {
  // Supports 20260701 and 20260701T000000Z formats — we only need the day
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function parseICal(text: string): ICalEvent[] {
  // Unfold continuation lines (lines starting with space/tab)
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const events: ICalEvent[] = [];
  const blocks = unfolded.split("BEGIN:VEVENT").slice(1);

  for (const block of blocks) {
    const dtStart = block.match(/DTSTART[^:\n]*:(\S+)/);
    const dtEnd = block.match(/DTEND[^:\n]*:(\S+)/);
    const summary = block.match(/SUMMARY[^:\n]*:(.*)/);
    if (!dtStart || !dtEnd) continue;
    const start = parseDate(dtStart[1].trim());
    const end = parseDate(dtEnd[1].trim());
    if (!start || !end) continue;
    events.push({ start, end, summary: summary?.[1]?.trim() ?? "" });
  }
  return events;
}

/** Expand booked ranges into individual blocked dates (DTEND is exclusive). */
export function eventsToDates(events: ICalEvent[]): string[] {
  const dates = new Set<string>();
  for (const ev of events) {
    let cursor = ev.start;
    let guard = 0;
    while (cursor < ev.end && guard < 800) {
      dates.add(cursor);
      cursor = addDays(cursor, 1);
      guard++;
    }
  }
  return Array.from(dates).sort();
}

export async function fetchIcalDates(url: string): Promise<string[]> {
  const res = await fetch(url, {
    headers: { "user-agent": "VilaSantaRosa-Site/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`iCal fetch failed: ${res.status}`);
  const text = await res.text();
  return eventsToDates(parseICal(text));
}
