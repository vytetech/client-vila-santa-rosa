import { z } from "zod";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import {
  deleteDateMaxNight,
  deleteDateMinNight,
  getDateMaxNights,
  getDateMinNights,
  getEffectiveMaxNights,
  getEffectiveMinNights,
  getSuiteMaxNights,
  getSuiteMinNights,
  setDateMaxNightRange,
  setDateMinNightRange,
  setSuiteMaxNights,
  setSuiteMinNights,
} from "./queries/min-nights";

const roomEnum = z.enum(["luxo", "marrok", "sonhos"]);
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export const minNightsRouter = createRouter({
  /** Public — defaults per suite (booking form enforces these). */
  defaults: publicQuery.query(() => getSuiteMinNights()),

  /** Public — default maximum nights per suite. */
  maxDefaults: publicQuery.query(() => getSuiteMaxNights()),

  /** Public — effective minimum for a given stay. */
  forStay: publicQuery
    .input(
      z.object({
        roomId: roomEnum,
        checkIn: z.string().regex(dateRe),
        checkOut: z.string().regex(dateRe),
      }),
    )
    .query(({ input }) =>
      getEffectiveMinNights(input.roomId, input.checkIn, input.checkOut),
    ),

  /** Public — effective maximum for a given stay. */
  maxForStay: publicQuery
    .input(
      z.object({
        roomId: roomEnum,
        checkIn: z.string().regex(dateRe),
        checkOut: z.string().regex(dateRe),
      }),
    )
    .query(({ input }) =>
      getEffectiveMaxNights(input.roomId, input.checkIn, input.checkOut),
    ),

  /** Public — per-date overrides for the guest calendar window. */
  forWindow: publicQuery
    .input(
      z.object({
        roomId: roomEnum,
        from: z.string().regex(dateRe),
        to: z.string().regex(dateRe),
      }),
    )
    .query(({ input }) => getDateMinNights(input.roomId, input.from, input.to)),

  /** Public — per-date maximum overrides for a window. */
  maxForWindow: publicQuery
    .input(
      z.object({
        roomId: roomEnum,
        from: z.string().regex(dateRe),
        to: z.string().regex(dateRe),
      }),
    )
    .query(({ input }) => getDateMaxNights(input.roomId, input.from, input.to)),

  /** Admin — set default minimum nights for all suites at once. */
  setDefaults: adminQuery
    .input(
      z.object({
        luxo: z.number().int().min(1).max(60),
        marrok: z.number().int().min(1).max(60),
        sonhos: z.number().int().min(1).max(60),
      }),
    )
    .mutation(async ({ input }) => {
      await setSuiteMinNights(input);
      return { success: true };
    }),

  /** Admin — set default maximum nights for all suites at once. */
  setMaxDefaults: adminQuery
    .input(
      z.object({
        luxo: z.number().int().min(1).max(365),
        marrok: z.number().int().min(1).max(365),
        sonhos: z.number().int().min(1).max(365),
      }),
    )
    .mutation(async ({ input }) => {
      await setSuiteMaxNights(input);
      return { success: true };
    }),

  /** Admin — set the minimum for specific dates of a suite. */
  setRange: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        dates: z.array(z.string().regex(dateRe)).min(1).max(730),
        minNights: z.number().int().min(1).max(60),
      }),
    )
    .mutation(async ({ input }) => {
      await setDateMinNightRange(input.roomId, input.dates, input.minNights);
      return { success: true, count: input.dates.length };
    }),

  /** Admin — set the maximum for specific dates of a suite. */
  setMaxRange: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        dates: z.array(z.string().regex(dateRe)).min(1).max(730),
        maxNights: z.number().int().min(1).max(365),
      }),
    )
    .mutation(async ({ input }) => {
      await setDateMaxNightRange(input.roomId, input.dates, input.maxNights);
      return { success: true, count: input.dates.length };
    }),

  /** Admin — clear a date override (falls back to the suite default). */
  clear: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        date: z.string().regex(dateRe),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteDateMinNight(input.roomId, input.date);
      return { success: true };
    }),

  /** Admin — clear a date maximum override. */
  clearMax: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        date: z.string().regex(dateRe),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteDateMaxNight(input.roomId, input.date);
      return { success: true };
    }),
});
