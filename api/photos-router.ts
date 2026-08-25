import { z } from "zod";
import { adminQuery, createRouter, publicQuery } from "./middleware";
import { addPhoto, deletePhoto, getPhotos, updatePhoto } from "./queries/photos";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { detectImageExt } from "./lib/upload-validation";
import { SITE_PHOTO_SLOTS, isSitePhotoSlot } from "@contracts/site-photos";
import { isDatabaseConfigured } from "./queries/connection";
import { deletePhotoCaptions } from "./queries/settings";

const publicRoot = path.resolve(process.cwd(), "dist/public");
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || path.join(publicRoot, "images/uploads"));

const slotSchema = z.enum(SITE_PHOTO_SLOTS);

export const photosRouter = createRouter({
  /** Public — photos of a slot (empty when DB not configured). */
  list: publicQuery
    .input(z.object({ slot: slotSchema }))
    .query(async ({ input }) => {
      if (!isDatabaseConfigured()) {
        return [];
      }
      return getPhotos(input.slot);
    }),

  /** Admin — every slot with its photos. */
  all: adminQuery.query(async () => {
    const { getDb } = await import("./queries/connection");
    const { sitePhotos } = await import("@db/schema");
    const { asc } = await import("drizzle-orm");
    return getDb()
      .select()
      .from(sitePhotos)
      .orderBy(asc(sitePhotos.slot), asc(sitePhotos.sort), asc(sitePhotos.id));
  }),

  /** Admin — upload a photo (base64 data URL from the browser). */
  upload: adminQuery
    .input(
      z.object({
        slot: slotSchema,
        alt: z.string().max(255).optional(),
        filename: z.string().max(120),
        dataUrl: z.string().max(15 * 1024 * 1024), // ~10 MB de imagem
      }),
    )
    .mutation(async ({ input }) => {
      if (!isSitePhotoSlot(input.slot)) {
        throw new Error("Grupo de foto inválido.");
      }
      const m = input.dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
      if (!m) throw new Error("Formato inválido — envie JPG, PNG ou WebP.");
      const buf = Buffer.from(m[2], "base64");
      if (buf.length > 10 * 1024 * 1024) throw new Error("Imagem muito grande (máx. 10 MB).");
      const ext = detectImageExt(buf);
      if (!ext) throw new Error("Arquivo de imagem inválido — envie JPG, PNG ou WebP.");

      fs.mkdirSync(uploadsDir, { recursive: true });
      const base = input.filename
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 60) || "foto";
      const name = `${base}-${randomUUID()}.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, name), buf);

      const publicPath = `/images/uploads/${name}`;
      await addPhoto(input.slot, publicPath, input.alt ?? "");
      return { path: publicPath };
    }),

  /** Admin — edit alt text, order or slot. */
  update: adminQuery
    .input(
      z.object({
        id: z.number().int(),
        alt: z.string().max(255).optional(),
        sort: z.number().int().optional(),
        slot: slotSchema.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePhoto(id, data);
      return { success: true };
    }),

  /** Admin — delete photo (registry + file from disk). */
  remove: adminQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const filePath = await deletePhoto(input.id);
      await deletePhotoCaptions(input.id);
      if (filePath && filePath.startsWith("/images/uploads/")) {
        try {
          fs.unlinkSync(path.join(uploadsDir, path.basename(filePath)));
        } catch {
          /* arquivo já ausente */
        }
      }
      return { success: true };
    }),
});
