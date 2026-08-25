import { getDb } from "./connection";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";
import { getIcalLinks } from "../ical-sync";

export type SuiteId = "luxo" | "marrok" | "sonhos";
export type IcalSuiteConfig = { url: string; enabled: boolean };
export type IcalConfig = Record<SuiteId, IcalSuiteConfig>;

const ICAL_CONFIG_KEY = "icalConfig";

function defaults(): IcalConfig {
  const urls = getIcalLinks();
  return {
    luxo: { url: urls.luxo, enabled: true },
    marrok: { url: urls.marrok, enabled: true },
    sonhos: { url: urls.sonhos, enabled: true },
  };
}

export async function getIcalConfig(): Promise<IcalConfig> {
  const base = defaults();
  try {
    const row = await getDb().query.settings.findFirst({
      where: eq(settings.key, ICAL_CONFIG_KEY),
    });
    if (!row) return base;
    const parsed = JSON.parse(row.value) as Partial<Record<SuiteId, Partial<IcalSuiteConfig>>>;
    for (const s of ["luxo", "marrok", "sonhos"] as SuiteId[]) {
      const c = parsed[s];
      if (!c) continue;
      if (typeof c.url === "string" && c.url) base[s].url = c.url;
      if (typeof c.enabled === "boolean") base[s].enabled = c.enabled;
    }
    return base;
  } catch {
    return base;
  }
}

export async function setIcalConfig(config: IcalConfig) {
  await getDb()
    .insert(settings)
    .values({ key: ICAL_CONFIG_KEY, value: JSON.stringify(config) })
    .onDuplicateKeyUpdate({ set: { value: JSON.stringify(config) } });
}
