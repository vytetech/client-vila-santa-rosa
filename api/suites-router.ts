import { z } from "zod";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import { getPhotoCaptions, getSuitesContent, setSuitesContent } from "./queries/settings";
import { getPhotos } from "./queries/photos";
import {
  SUITE_IDS,
  SUITE_PHOTO_SLOTS,
  sanitizeSuitesContent,
  type SuiteId,
} from "@contracts/suites-content";
import { PHOTO_SLOTS } from "@contracts/site-photos";
import { isDatabaseConfigured } from "./queries/connection";

const localeContentSchema = z.object({
  publicName: z.string().max(160),
  subtitle: z.string().max(240),
  shortDescription: z.string().max(500),
  fullDescription: z.string().max(1600),
  location: z.string().max(160),
  type: z.string().max(160),
  bedType: z.string().max(160),
  info: z.string().max(240),
  amenities: z.array(z.string().max(80)).max(16),
  auxiliaryText: z.string().max(240),
});

const suiteItemSchema = z.object({
  roomId: z.enum(SUITE_IDS),
  enabled: z.boolean(),
  maxGuests: z.number().int().min(1).max(12),
  maxPets: z.number().int().min(0).max(10),
  order: z.number().int().min(0).max(100),
  locales: z.record(z.string(), localeContentSchema),
});

async function getSuitePhotos(roomId: SuiteId) {
  if (!isDatabaseConfigured()) return [];
  const suitePhotos = await getPhotos(SUITE_PHOTO_SLOTS[roomId]);
  if (suitePhotos.length > 0) return suitePhotos;
  const legacyPhotos = await getPhotos(PHOTO_SLOTS.quartos);
  const index = SUITE_IDS.indexOf(roomId);
  return legacyPhotos[index] ? [legacyPhotos[index]] : [];
}

export const suitesRouter = createRouter({
  publicList: publicQuery.query(async () => {
    const content = await getSuitesContent();
    const captions = await getPhotoCaptions();
    const suites = await Promise.all(
      SUITE_IDS.map(async (roomId) => ({
        ...content[roomId],
        photos: await getSuitePhotos(roomId),
      })),
    );
    return {
      suites: suites.filter((suite) => suite.enabled).sort((a, b) => a.order - b.order),
      captions,
    };
  }),

  adminList: adminQuery.query(async () => {
    const content = await getSuitesContent();
    const suites = await Promise.all(
      SUITE_IDS.map(async (roomId) => ({
        ...content[roomId],
        photos: await getSuitePhotos(roomId),
        photoSlot: SUITE_PHOTO_SLOTS[roomId],
      })),
    );
    return suites.sort((a, b) => a.order - b.order);
  }),

  updateAll: adminQuery
    .input(z.record(z.enum(SUITE_IDS), suiteItemSchema))
    .mutation(async ({ input }) => {
      await setSuitesContent(sanitizeSuitesContent(input));
      return { success: true };
    }),
});
