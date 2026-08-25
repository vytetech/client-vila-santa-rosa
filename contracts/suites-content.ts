import { BREAKFAST_LOCALES, type BreakfastLocale } from "./breakfast-content";

export const SUITE_IDS = ["luxo", "marrok", "sonhos"] as const;

export type SuiteId = (typeof SUITE_IDS)[number];
export type SuiteLocale = BreakfastLocale;

export const SUITE_PHOTO_SLOTS: Record<SuiteId, string> = {
  luxo: "suite:luxo",
  marrok: "suite:marrok",
  sonhos: "suite:sonhos",
};

export type SuiteLocaleContent = {
  publicName: string;
  subtitle: string;
  shortDescription: string;
  fullDescription: string;
  location: string;
  type: string;
  bedType: string;
  info: string;
  amenities: string[];
  auxiliaryText: string;
};

export type SuiteContentItem = {
  roomId: SuiteId;
  enabled: boolean;
  maxGuests: number;
  maxPets: number;
  order: number;
  locales: Record<SuiteLocale, SuiteLocaleContent>;
};

export type SuitesContent = Record<SuiteId, SuiteContentItem>;

const enDefaults = {
  luxo: {
    publicName: "Luxo Suite",
    subtitle: "Upper-floor suite with city view",
    shortDescription: "Independent suite with king bed, comfort and privacy.",
    fullDescription:
      "A private upper-floor suite designed for couples who want comfort, calm and a view of the city after a day in Ilhabela.",
    location: "1st floor, city view",
    type: "Independent suite",
    bedType: "King bed",
    info: "Private bathroom and independent entrance",
    amenities: ["King bed", "Air conditioning", "Flat-screen TV", "Minibar", "Wi-Fi 6"],
    auxiliaryText: "Comfort and privacy for two guests.",
  },
  marrok: {
    publicName: "Marrok Suite",
    subtitle: "Ground-floor suite with Moroccan inspiration",
    shortDescription: "Independent suite with queen bed and warm Moroccan details.",
    fullDescription:
      "A cozy ground-floor suite with Moroccan-inspired atmosphere, private bathroom and practical comfort for a relaxed stay.",
    location: "Ground floor",
    type: "Independent suite",
    bedType: "Queen bed",
    info: "Moroccan inspiration and private bathroom",
    amenities: ["Queen bed", "Moroccan inspiration", "Air conditioning", "Minibar", "Wi-Fi 6"],
    auxiliaryText: "The most reserved suite for a calm stay.",
  },
  sonhos: {
    publicName: "Sonhos Suite",
    subtitle: "Ground-floor suite with garden view",
    shortDescription: "Independent suite with garden view and a light, welcoming atmosphere.",
    fullDescription:
      "A peaceful suite close to the garden, with private bathroom and the essentials for a quiet stay in Ilhabela.",
    location: "Ground floor",
    type: "Independent suite",
    bedType: "Double bed",
    info: "Garden view and private bathroom",
    amenities: ["Double bed", "Garden view", "Air conditioning", "Flat-screen TV", "Private bathroom"],
    auxiliaryText: "A quiet corner near the garden.",
  },
} satisfies Record<SuiteId, SuiteLocaleContent>;

const ptDefaults = {
  luxo: {
    publicName: "Suíte Luxo",
    subtitle: "Suíte no 1º andar com vista da cidade",
    shortDescription: "Suíte independente com cama king, conforto e privacidade.",
    fullDescription:
      "Uma suíte privativa no 1º andar, pensada para casais que buscam conforto, calma e vista da cidade depois de um dia em Ilhabela.",
    location: "1º andar, vista da cidade",
    type: "Suíte independente",
    bedType: "Cama king",
    info: "Banheiro privativo e entrada independente",
    amenities: ["Cama king", "Ar-condicionado", "TV de tela plana", "Frigobar", "Wi-Fi 6"],
    auxiliaryText: "Conforto e privacidade para dois hóspedes.",
  },
  marrok: {
    publicName: "Suíte Marrok",
    subtitle: "Suíte térrea com inspiração marroquina",
    shortDescription: "Suíte independente com cama queen e detalhes marroquinos acolhedores.",
    fullDescription:
      "Uma suíte térrea aconchegante, com atmosfera de inspiração marroquina, banheiro privativo e conforto prático para relaxar.",
    location: "Térreo",
    type: "Suíte independente",
    bedType: "Cama queen",
    info: "Inspiração marroquina e banheiro privativo",
    amenities: ["Cama queen", "Inspiração marroquina", "Ar-condicionado", "Frigobar", "Wi-Fi 6"],
    auxiliaryText: "A suíte mais reservada para uma estadia tranquila.",
  },
  sonhos: {
    publicName: "Suíte Sonhos",
    subtitle: "Suíte térrea com vista do jardim",
    shortDescription: "Suíte independente com vista do jardim e atmosfera leve.",
    fullDescription:
      "Uma suíte tranquila próxima ao jardim, com banheiro privativo e o essencial para uma estadia acolhedora em Ilhabela.",
    location: "Térreo",
    type: "Suíte independente",
    bedType: "Cama de casal",
    info: "Vista do jardim e banheiro privativo",
    amenities: ["Cama de casal", "Vista do jardim", "Ar-condicionado", "TV de tela plana", "Banheiro privativo"],
    auxiliaryText: "Um canto tranquilo perto do jardim.",
  },
} satisfies Record<SuiteId, SuiteLocaleContent>;

const esDefaults = {
  luxo: {
    ...enDefaults.luxo,
    publicName: "Suite Luxo",
    subtitle: "Suite en el primer piso con vista a la ciudad",
    shortDescription: "Suite independiente con cama king, confort y privacidad.",
    location: "Primer piso, vista a la ciudad",
    type: "Suite independiente",
    bedType: "Cama king",
    amenities: ["Cama king", "Aire acondicionado", "TV de pantalla plana", "Minibar", "Wi-Fi 6"],
  },
  marrok: {
    ...enDefaults.marrok,
    publicName: "Suite Marrok",
    subtitle: "Suite en planta baja con inspiración marroquí",
    shortDescription: "Suite independiente con cama queen y detalles marroquíes.",
    location: "Planta baja",
    type: "Suite independiente",
    bedType: "Cama queen",
    amenities: ["Cama queen", "Inspiración marroquí", "Aire acondicionado", "Minibar", "Wi-Fi 6"],
  },
  sonhos: {
    ...enDefaults.sonhos,
    publicName: "Suite Sonhos",
    subtitle: "Suite en planta baja con vista al jardín",
    shortDescription: "Suite independiente con vista al jardín y ambiente acogedor.",
    location: "Planta baja",
    type: "Suite independiente",
    bedType: "Cama doble",
    amenities: ["Cama doble", "Vista al jardín", "Aire acondicionado", "TV de pantalla plana", "Baño privado"],
  },
} satisfies Record<SuiteId, SuiteLocaleContent>;

export const SUITE_LOCALE_DEFAULTS: Record<SuiteLocale, Record<SuiteId, SuiteLocaleContent>> = {
  pt: ptDefaults,
  es: esDefaults,
  en: enDefaults,
  ar: enDefaults,
  fr: enDefaults,
  zh: enDefaults,
  ja: enDefaults,
};

export const SUITES_DEFAULTS: SuitesContent = Object.fromEntries(
  SUITE_IDS.map((roomId, index) => [
    roomId,
    {
      roomId,
      enabled: true,
      maxGuests: 2,
      maxPets: 1,
      order: index,
      locales: Object.fromEntries(
        BREAKFAST_LOCALES.map((locale) => [locale, SUITE_LOCALE_DEFAULTS[locale][roomId]]),
      ) as Record<SuiteLocale, SuiteLocaleContent>,
    },
  ]),
) as SuitesContent;

function sanitizeLocaleContent(
  data: Partial<SuiteLocaleContent> | undefined,
  fallback: SuiteLocaleContent,
): SuiteLocaleContent {
  return {
    publicName: typeof data?.publicName === "string" ? data.publicName.trim() : fallback.publicName,
    subtitle: typeof data?.subtitle === "string" ? data.subtitle.trim() : fallback.subtitle,
    shortDescription:
      typeof data?.shortDescription === "string" ? data.shortDescription.trim() : fallback.shortDescription,
    fullDescription:
      typeof data?.fullDescription === "string" ? data.fullDescription.trim() : fallback.fullDescription,
    location: typeof data?.location === "string" ? data.location.trim() : fallback.location,
    type: typeof data?.type === "string" ? data.type.trim() : fallback.type,
    bedType: typeof data?.bedType === "string" ? data.bedType.trim() : fallback.bedType,
    info: typeof data?.info === "string" ? data.info.trim() : fallback.info,
    amenities: Array.isArray(data?.amenities)
      ? data.amenities.map((item) => String(item).trim()).filter(Boolean).slice(0, 16)
      : [...fallback.amenities],
    auxiliaryText:
      typeof data?.auxiliaryText === "string" ? data.auxiliaryText.trim() : fallback.auxiliaryText,
  };
}

export function sanitizeSuitesContent(data: Partial<SuitesContent> | undefined): SuitesContent {
  const source = data ?? {};
  return Object.fromEntries(
    SUITE_IDS.map((roomId, index) => {
      const item = source[roomId] as Partial<SuiteContentItem> | undefined;
      const fallback = SUITES_DEFAULTS[roomId];
      return [
        roomId,
        {
          roomId,
          enabled: typeof item?.enabled === "boolean" ? item.enabled : fallback.enabled,
          maxGuests: Number.isInteger(item?.maxGuests) ? Number(item?.maxGuests) : fallback.maxGuests,
          maxPets: Number.isInteger(item?.maxPets) ? Number(item?.maxPets) : fallback.maxPets,
          order: Number.isInteger(item?.order) ? Number(item?.order) : index,
          locales: Object.fromEntries(
            BREAKFAST_LOCALES.map((locale) => [
              locale,
              sanitizeLocaleContent(item?.locales?.[locale], fallback.locales[locale]),
            ]),
          ) as Record<SuiteLocale, SuiteLocaleContent>,
        },
      ];
    }),
  ) as SuitesContent;
}

export function resolveSuiteLocale(item: SuiteContentItem, locale: string): SuiteLocaleContent {
  const requested = BREAKFAST_LOCALES.includes(locale as SuiteLocale)
    ? item.locales[locale as SuiteLocale]
    : undefined;
  const pt = item.locales.pt;
  return {
    publicName: requested?.publicName || pt.publicName,
    subtitle: requested?.subtitle || pt.subtitle,
    shortDescription: requested?.shortDescription || pt.shortDescription,
    fullDescription: requested?.fullDescription || pt.fullDescription,
    location: requested?.location || pt.location,
    type: requested?.type || pt.type,
    bedType: requested?.bedType || pt.bedType,
    info: requested?.info || pt.info,
    amenities: requested?.amenities?.length ? requested.amenities : pt.amenities,
    auxiliaryText: requested?.auxiliaryText || pt.auxiliaryText,
  };
}

function mergeText(dynamicValue: string | undefined, defaultValue: string) {
  return dynamicValue?.trim() || defaultValue;
}

export function resolveSuiteLocaleWithDefaults(
  dynamicItem: SuiteContentItem | undefined,
  roomId: SuiteId,
  locale: string,
): SuiteLocaleContent {
  const defaultItem = SUITES_DEFAULTS[roomId];
  const defaultCurrent = resolveSuiteLocale(defaultItem, locale);
  if (!dynamicItem) return defaultCurrent;
  const dynamicCurrent = resolveSuiteLocale(dynamicItem, locale);
  return {
    publicName: mergeText(dynamicCurrent.publicName, defaultCurrent.publicName),
    subtitle: mergeText(dynamicCurrent.subtitle, defaultCurrent.subtitle),
    shortDescription: mergeText(dynamicCurrent.shortDescription, defaultCurrent.shortDescription),
    fullDescription: mergeText(dynamicCurrent.fullDescription, defaultCurrent.fullDescription),
    location: mergeText(dynamicCurrent.location, defaultCurrent.location),
    type: mergeText(dynamicCurrent.type, defaultCurrent.type),
    bedType: mergeText(dynamicCurrent.bedType, defaultCurrent.bedType),
    info: mergeText(dynamicCurrent.info, defaultCurrent.info),
    amenities: dynamicCurrent.amenities.length ? dynamicCurrent.amenities : defaultCurrent.amenities,
    auxiliaryText: mergeText(dynamicCurrent.auxiliaryText, defaultCurrent.auxiliaryText),
  };
}

export function mergeSuiteWithDefaults(dynamicItem: SuiteContentItem | undefined, roomId: SuiteId): SuiteContentItem {
  const fallback = SUITES_DEFAULTS[roomId];
  if (!dynamicItem) return fallback;
  return {
    ...fallback,
    ...dynamicItem,
    roomId,
    enabled: typeof dynamicItem.enabled === "boolean" ? dynamicItem.enabled : true,
    maxGuests: Number.isFinite(dynamicItem.maxGuests) && dynamicItem.maxGuests > 0 ? dynamicItem.maxGuests : fallback.maxGuests,
    maxPets: Number.isFinite(dynamicItem.maxPets) && dynamicItem.maxPets >= 0 ? dynamicItem.maxPets : fallback.maxPets,
    order: Number.isFinite(dynamicItem.order) ? dynamicItem.order : fallback.order,
  };
}
