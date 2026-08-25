export const THEME_HEADING_FONTS = [
  "Cormorant Garamond",
  "Playfair Display",
  "Libre Baskerville",
  "Lora",
  "Georgia",
] as const;

export const THEME_BODY_FONTS = [
  "Jost",
  "Inter",
  "Manrope",
  "DM Sans",
  "Source Sans 3",
  "Nunito Sans",
  "Arial",
] as const;

export type ThemeHeadingFont = (typeof THEME_HEADING_FONTS)[number];
export type ThemeBodyFont = (typeof THEME_BODY_FONTS)[number];

export type ThemeConfig = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundLight: string;
  backgroundDark: string;
  textPrimary: string;
  textSecondary: string;
  buttonColor: string;
  buttonHoverColor: string;
  headingFont: ThemeHeadingFont;
  bodyFont: ThemeBodyFont;
};

export const THEME_DEFAULTS: ThemeConfig = {
  primaryColor: "#D84B81",
  secondaryColor: "#E6714C",
  accentColor: "#F4C125",
  backgroundLight: "#FDF7F8",
  backgroundDark: "#1F1418",
  textPrimary: "#39222A",
  textSecondary: "#785E66",
  buttonColor: "#D84B81",
  buttonHoverColor: "#C43F72",
  headingFont: "Cormorant Garamond",
  bodyFont: "Jost",
};

export const THEME_COLOR_KEYS = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "backgroundLight",
  "backgroundDark",
  "textPrimary",
  "textSecondary",
  "buttonColor",
  "buttonHoverColor",
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

export function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function isHeadingFont(value: string): value is ThemeHeadingFont {
  return THEME_HEADING_FONTS.includes(value as ThemeHeadingFont);
}

export function isBodyFont(value: string): value is ThemeBodyFont {
  return THEME_BODY_FONTS.includes(value as ThemeBodyFont);
}

export function sanitizeThemeConfig(data: Partial<ThemeConfig>): ThemeConfig {
  const next: ThemeConfig = { ...THEME_DEFAULTS };
  for (const key of THEME_COLOR_KEYS) {
    const value = data[key];
    if (typeof value === "string" && isHexColor(value)) {
      next[key] = value.toUpperCase();
    }
  }
  if (typeof data.headingFont === "string" && isHeadingFont(data.headingFont)) {
    next.headingFont = data.headingFont;
  }
  if (typeof data.bodyFont === "string" && isBodyFont(data.bodyFont)) {
    next.bodyFont = data.bodyFont;
  }
  return next;
}
