import { getDb } from "./connection";
import { sitePhotos } from "@db/schema";
import { asc, eq } from "drizzle-orm";

export type { SitePhoto } from "@db/schema";

/** All photos of a slot, ordered for display. */
export async function getPhotos(slot: string) {
  return getDb()
    .select()
    .from(sitePhotos)
    .where(eq(sitePhotos.slot, slot))
    .orderBy(asc(sitePhotos.sort), asc(sitePhotos.id));
}

export async function addPhoto(slot: string, path: string, alt = "") {
  const existing = await getPhotos(slot);
  const sort = existing.length ? Math.max(...existing.map((p) => p.sort)) + 1 : 0;
  await getDb().insert(sitePhotos).values({ slot, path, alt, sort });
}

export async function updatePhoto(id: number, data: { alt?: string; sort?: number; slot?: string }) {
  await getDb().update(sitePhotos).set(data).where(eq(sitePhotos.id, id));
}

export async function deletePhoto(id: number) {
  const rows = await getDb().select().from(sitePhotos).where(eq(sitePhotos.id, id)).limit(1);
  await getDb().delete(sitePhotos).where(eq(sitePhotos.id, id));
  return rows[0]?.path ?? null;
}
