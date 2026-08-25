export const BREAKFAST_LOCALES = ["pt", "es", "en", "ar", "fr", "zh", "ja"] as const;

export type BreakfastLocale = (typeof BREAKFAST_LOCALES)[number];

export const BREAKFAST_LOCALE_LABELS: Record<BreakfastLocale, string> = {
  pt: "Português",
  es: "Español",
  en: "English",
  ar: "العربية",
  fr: "Français",
  zh: "中文",
  ja: "日本語",
};

export type BreakfastLocaleContent = {
  label: string;
  title: string;
  description: string;
  hours: string;
  note: string;
  imageAlt: string;
  badges: string[];
};

export type BreakfastContent = {
  enabled: boolean;
  locales: Record<BreakfastLocale, BreakfastLocaleContent>;
};

export type BreakfastContentInput = Partial<Omit<BreakfastContent, "locales">> & {
  locales?: Partial<Record<BreakfastLocale, Partial<BreakfastLocaleContent>>>;
} & Record<string, unknown>;

export const BREAKFAST_LOCALE_DEFAULTS: Record<BreakfastLocale, BreakfastLocaleContent> = {
  pt: {
    label: "Café da manhã",
    title: "Café da manhã árabe artesanal",
    description:
      "Feito à mão todas as manhãs e já incluído na estadia: coalhada seca, geleias caseiras, bolo quentinho, café passado na hora, leite, manteiga e pães caseiros — além de ovos fresquinhos. É o nosso abraço matinal em forma de mesa.",
    hours: "",
    note: "Preparado com carinho na Vila",
    imageAlt: "Café da manhã árabe artesanal",
    badges: ["Café passado na hora", "Pães caseiros", "Ovos fresquinhos"],
  },
  es: {
    label: "Desayuno",
    title: "Desayuno árabe artesanal",
    description:
      "Incluido en la estadía y preparado artesanalmente cada día: cuajada seca, mermeladas caseras, pastel, café, leche, mantequilla y panes caseros — además de huevos fresquitos. Es nuestra forma cariñosa de decir buenos días.",
    hours: "",
    note: "Preparado con cariño en la Vila",
    imageAlt: "Desayuno árabe artesanal",
    badges: ["Café recién hecho", "Panes caseros", "Huevos frescos"],
  },
  en: {
    label: "Breakfast",
    title: "Artisanal Arabic breakfast",
    description:
      "Included in your stay and prepared by hand every morning: dried laban, homemade jams, warm cake, freshly brewed coffee, milk, butter and homemade breads — plus fresh eggs. It is our morning welcome served at the table.",
    hours: "",
    note: "Prepared with care at the Vila",
    imageAlt: "Artisanal Arabic breakfast",
    badges: ["Freshly brewed coffee", "Homemade breads", "Fresh eggs"],
  },
  ar: {
    label: "الفطور",
    title: "فطور عربي منزلي",
    description:
      "مشمول في الإقامة ويُحضّر يدويًا كل صباح: لبنة، مربيات منزلية، كعك دافئ، قهوة طازجة، حليب، زبدة وخبز منزلي — مع بيض طازج. هذه طريقتنا الودودة لقول صباح الخير.",
    hours: "",
    note: "محضّر بعناية في الفيلا",
    imageAlt: "فطور عربي منزلي",
    badges: ["قهوة طازجة", "خبز منزلي", "بيض طازج"],
  },
  fr: {
    label: "Petit-déjeuner",
    title: "Petit-déjeuner arabe artisanal",
    description:
      "Inclus dans le séjour et préparé à la main chaque jour : laban séché, confitures maison, gâteau, café, lait, beurre et pains maison — plus des œufs frais. C’est notre façon affectueuse de vous dire bonjour.",
    hours: "",
    note: "Préparé avec soin à la Vila",
    imageAlt: "Petit-déjeuner arabe artisanal",
    badges: ["Café fraîchement préparé", "Pains maison", "Œufs frais"],
  },
  zh: {
    label: "早餐",
    title: "手工阿拉伯早餐",
    description:
      "住宿已包含每日手工准备的早餐：干酪、手工果酱、热蛋糕、现煮咖啡、牛奶、黄油和自制面包，还有新鲜鸡蛋。这是我们用餐桌表达早安的方式。",
    hours: "",
    note: "在Vila用心准备",
    imageAlt: "手工阿拉伯早餐",
    badges: ["现煮咖啡", "自制面包", "新鲜鸡蛋"],
  },
  ja: {
    label: "Breakfast",
    title: "Artisanal Arabic breakfast",
    description:
      "Included in your stay and prepared by hand every morning: dried laban, homemade jams, warm cake, freshly brewed coffee, milk, butter and homemade breads — plus fresh eggs. It is our morning welcome served at the table.",
    hours: "",
    note: "Prepared with care at the Vila",
    imageAlt: "Artisanal Arabic breakfast",
    badges: ["Freshly brewed coffee", "Homemade breads", "Fresh eggs"],
  },
};

export const BREAKFAST_DEFAULTS: BreakfastContent = {
  enabled: true,
  locales: BREAKFAST_LOCALE_DEFAULTS,
};

function sanitizeLocaleContent(
  data: Partial<BreakfastLocaleContent> | undefined,
  fallback: BreakfastLocaleContent,
): BreakfastLocaleContent {
  return {
    label: typeof data?.label === "string" ? data.label.trim() : fallback.label,
    title: typeof data?.title === "string" ? data.title.trim() : fallback.title,
    description:
      typeof data?.description === "string"
        ? data.description.trim()
        : fallback.description,
    hours: typeof data?.hours === "string" ? data.hours.trim() : fallback.hours,
    note: typeof data?.note === "string" ? data.note.trim() : fallback.note,
    imageAlt:
      typeof data?.imageAlt === "string"
        ? data.imageAlt.trim()
        : fallback.imageAlt,
    badges: Array.isArray(data?.badges)
      ? data.badges.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
      : [...fallback.badges],
  };
}

export function sanitizeBreakfastContent(data: BreakfastContentInput): BreakfastContent {
  const content: BreakfastContent = {
    enabled: typeof data.enabled === "boolean" ? data.enabled : true,
    locales: { ...BREAKFAST_LOCALE_DEFAULTS },
  };

  for (const locale of BREAKFAST_LOCALES) {
    const localeData =
      data.locales && typeof data.locales === "object"
        ? (data.locales as Partial<Record<BreakfastLocale, Partial<BreakfastLocaleContent>>>)[locale]
        : undefined;
    content.locales[locale] = sanitizeLocaleContent(localeData, BREAKFAST_LOCALE_DEFAULTS[locale]);
  }

  if (!data.locales && typeof data.title === "string") {
    content.locales.pt = sanitizeLocaleContent(
      {
        label: typeof data.label === "string" ? data.label : undefined,
        title: data.title,
        description: typeof data.description === "string" ? data.description : undefined,
        hours: typeof data.hours === "string" ? data.hours : undefined,
        note: typeof data.note === "string" ? data.note : undefined,
        imageAlt: typeof data.imageAlt === "string" ? data.imageAlt : undefined,
        badges: Array.isArray(data.badges) ? (data.badges as string[]) : undefined,
      },
      BREAKFAST_LOCALE_DEFAULTS.pt,
    );
  }

  return content;
}

export function resolveBreakfastLocale(
  content: BreakfastContent,
  locale: string,
): BreakfastLocaleContent {
  const requested = BREAKFAST_LOCALES.includes(locale as BreakfastLocale)
    ? content.locales[locale as BreakfastLocale]
    : undefined;
  const pt = content.locales.pt;
  return {
    label: requested?.label || pt.label,
    title: requested?.title || pt.title,
    description: requested?.description || pt.description,
    hours: requested?.hours || pt.hours,
    note: requested?.note || pt.note,
    imageAlt: requested?.imageAlt || pt.imageAlt,
    badges: requested?.badges?.length ? requested.badges : pt.badges,
  };
}

export function isBreakfastLocaleComplete(content: BreakfastLocaleContent): boolean {
  return Boolean(
    content.label.trim() &&
      content.title.trim() &&
      content.description.trim() &&
      content.note.trim() &&
      content.imageAlt.trim() &&
      content.badges.length > 0,
  );
}
