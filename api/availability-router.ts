import { z } from "zod";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import {
  getBookedDays,
  getIcalLinks,
  getSyncStatus,
  syncAllCalendars,
} from "./ical-sync";
import { blockDateRange, getBlockedDays, unblockDate } from "./queries/blocked-dates";
import { getIcalConfig, setIcalConfig } from "./queries/ical-config";

const roomEnum = z.enum(["luxo", "marrok", "sonhos"]);
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export const availabilityRouter = createRouter({
  /** Booked days per suite, synced from the Booking.com iCal feeds. */
  booked: publicQuery
    .input(z.object({ room: z.enum(["luxo", "marrok", "sonhos"]).optional() }))
    .query(({ input }) => {
      if (input?.room) {
        return { room: input.room, days: getBookedDays(input.room) };
      }
      return {
        luxo: getBookedDays("luxo"),
        marrok: getBookedDays("marrok"),
        sonhos: getBookedDays("sonhos"),
      };
    }),

  /** Public — days the owner closed manually. */
  blockedDays: publicQuery
    .input(
      z.object({
        roomId: roomEnum,
        from: z.string().regex(dateRe),
        to: z.string().regex(dateRe),
      }),
    )
    .query(async ({ input }) => {
      try {
        return Array.from(await getBlockedDays(input.roomId, input.from, input.to));
      } catch {
        return [];
      }
    }),

  /** Admin — close dates manually (booking becomes impossible). */
  block: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        dates: z.array(z.string().regex(dateRe)).min(1).max(730),
      }),
    )
    .mutation(async ({ input }) => {
      await blockDateRange(input.roomId, input.dates);
      return { success: true, count: input.dates.length };
    }),

  /** Admin — re-open a manually closed date. */
  unblock: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        date: z.string().regex(dateRe),
      }),
    )
    .mutation(async ({ input }) => {
      await unblockDate(input.roomId, input.date);
      return { success: true };
    }),

  /** When the last successful sync happened (ISO date or null). */
  status: publicQuery.query(() => getSyncStatus()),

  /** Per-suite Booking.com iCal export URLs (owner only). */
  icalLinks: adminQuery.query(() => getIcalLinks()),

  /** Owner — full per-suite iCal config (URL + on/off). */
  icalConfig: adminQuery.query(async () => {
    try {
      return await getIcalConfig();
    } catch {
      return null;
    }
  }),

  /** Owner — save iCal config and re-sync immediately. */
  setIcalConfig: adminQuery
    .input(
      z.object({
        luxo: z.object({ url: z.string().max(500), enabled: z.boolean() }),
        marrok: z.object({ url: z.string().max(500), enabled: z.boolean() }),
        sonhos: z.object({ url: z.string().max(500), enabled: z.boolean() }),
      }),
    )
    .mutation(async ({ input }) => {
      await setIcalConfig(input);
      await syncAllCalendars().catch(() => undefined);
      return { success: true };
    }),

  /** Force an immediate re-sync (used after boot and for testing). */
  syncNow: publicQuery.mutation(async () => {
    await syncAllCalendars();
    return getSyncStatus();
  }),
});
