import { z } from "zod";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import {
  deleteDatePrice,
  getDatePrices,
  setDatePrice,
  setDatePriceRange,
} from "./queries/date-prices";

const roomEnum = z.enum(["luxo", "marrok", "sonhos"]);
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export const datePricesRouter = createRouter({
  /** Public — the booking flow reads overrides for the selected stay. */
  forStay: publicQuery
    .input(
      z.object({
        roomId: roomEnum,
        checkIn: z.string().regex(dateRe),
        checkOut: z.string().regex(dateRe),
      }),
    )
    .query(async ({ input }) => {
      return getDatePrices(input.roomId, input.checkIn, input.checkOut);
    }),

  /** Admin — list overrides for a month grid. */
  forMonth: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        /** first day of the 2-month window, "YYYY-MM-01" */
        from: z.string().regex(dateRe),
        to: z.string().regex(dateRe),
      }),
    )
    .query(async ({ input }) => {
      return getDatePrices(input.roomId, input.from, input.to);
    }),

  /** Admin — set one date's price. */
  setOne: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        date: z.string().regex(dateRe),
        price: z.number().int().positive().max(100000),
      }),
    )
    .mutation(async ({ input }) => {
      await setDatePrice(input.roomId, input.date, input.price);
      return { success: true };
    }),

  /** Admin — set the same price for many dates (range selection). */
  setRange: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        dates: z.array(z.string().regex(dateRe)).min(1).max(730),
        price: z.number().int().positive().max(100000),
      }),
    )
    .mutation(async ({ input }) => {
      await setDatePriceRange(input.roomId, input.dates, input.price);
      return { success: true, count: input.dates.length };
    }),

  /** Admin — clear an override (date returns to the default suite rate). */
  clear: adminQuery
    .input(
      z.object({
        roomId: roomEnum,
        date: z.string().regex(dateRe),
      }),
    )
    .mutation(async ({ input }) => {
      await deleteDatePrice(input.roomId, input.date);
      return { success: true };
    }),
});
