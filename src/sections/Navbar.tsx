import { useEffect, useState } from "react";
import { Menu, X, Sun, Moon, Globe, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";
import { LOCALES } from "@/i18n/translations";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { locale, setLocale, d } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const links = [
    { href: "#inicio", label: d.nav.home },
    { href: "#pousada", label: d.nav.about },
    { href: "#acomodacoes", label: d.nav.rooms },
    { href: "#reservas", label: d.nav.booking },
    { href: "#comodidades", label: d.nav.amenities },
    { href: "#localizacao", label: d.nav.location },
    { href: "#galeria", label: d.nav.gallery },
    { href: "#contato", label: d.nav.contact },
  ];

  const textColor = scrolled ? "text-foreground/80" : "text-white/90";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="flex items-center gap-2">
          <img
            src="/images/logo.png"
            alt="Vila Santa Rosa"
            className="h-9 w-auto shrink-0"
          />
          <span
            className={`font-serif-display text-xl font-semibold tracking-wide sm:text-2xl ${
              scrolled ? "text-foreground" : "text-white"
            }`}
          >
            Vila Santa Rosa
          </span>
        </a>

        <nav className="hidden items-center gap-5 2xl:gap-7 xl:flex">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap text-sm font-medium transition-colors hover:opacity-80 ${textColor}`}
            >
              {l.label}
            </a>
          ))}

          {/* Language — globe button with elegant dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={d.nav.language}
                title={d.nav.language}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  scrolled
                    ? "bg-muted/70 text-foreground hover:bg-muted"
                    : "bg-white/10 text-white backdrop-blur hover:bg-white/20"
                }`}
              >
                <Globe className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-52 rounded-2xl p-2 shadow-xl"
            >
              {LOCALES.map(l => (
                <DropdownMenuItem
                  key={l.code}
                  onSelect={() => setLocale(l.code)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    locale === l.code ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-left">
                    {l.label}
                  </span>
                  {locale === l.code && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Modo claro" : "Modo escuro"}
              title={isDark ? "Modo claro" : "Modo escuro"}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                scrolled
                  ? "bg-muted/70 text-foreground hover:bg-muted"
                  : "bg-white/10 text-white backdrop-blur hover:bg-white/20"
              }`}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          )}

          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a href="#reservas">{d.nav.cta}</a>
          </Button>
        </nav>

        <div className="flex items-center gap-2 xl:hidden">
          {/* Language — globe button (mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={d.nav.language}
                title={d.nav.language}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  scrolled || open
                    ? "bg-muted/70 text-foreground hover:bg-muted"
                    : "bg-white/10 text-white backdrop-blur hover:bg-white/20"
                }`}
              >
                <Globe className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-52 rounded-2xl p-2 shadow-xl"
            >
              {LOCALES.map(l => (
                <DropdownMenuItem
                  key={l.code}
                  onSelect={() => {
                    setLocale(l.code);
                    setOpen(false);
                  }}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    locale === l.code ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-left">
                    {l.label}
                  </span>
                  {locale === l.code && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Modo claro" : "Modo escuro"}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                scrolled || open
                  ? "bg-muted/70 text-foreground hover:bg-muted"
                  : "bg-white/10 text-white backdrop-blur hover:bg-white/20"
              }`}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          )}
          <button
            className={`${scrolled || open ? "text-foreground" : "text-white"}`}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t bg-background px-4 pb-6 pt-2 xl:hidden">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-base font-medium text-foreground/80"
            >
              {l.label}
            </a>
          ))}

          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {d.nav.language}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  locale === l.code
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground/70"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <Button
            asChild
            className="mt-4 w-full bg-primary text-primary-foreground"
          >
            <a href="#reservas" onClick={() => setOpen(false)}>
              {d.nav.cta}
            </a>
          </Button>
        </nav>
      )}
    </header>
  );
}
