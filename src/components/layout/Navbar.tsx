"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Menu, X, Globe, ChevronDown, Car, User,
  LogOut, Settings, Heart, Calendar, Star
} from "lucide-react";

const locales = [
  { code: "ar", label: "العربية", flag: "🇯🇴" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const isRTL = locale === "ar";

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHomePage = pathname === `/${locale}`;

  function switchLocale(newLocale: string) {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setLangOpen(false);
  }

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/cars`, label: t("cars") },
    { href: `/${locale}/branches`, label: t("branches") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || !isHomePage
          ? "bg-dark-950/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      )}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center group-hover:bg-primary-600 transition-colors">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">
                {locale === "ar" ? "الجنوب رنت كار" : "South Rent Car"}
              </p>
              <p className="text-primary-400 text-xs">
                {locale === "ar" ? "تأجير سيارات سياحية" : "Tourism Car Rental"}
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === link.href
                    ? "text-primary-400 bg-primary-900/20"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-3">

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                <Globe className="w-4 h-4" />
                <span>{locales.find(l => l.code === locale)?.flag}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", langOpen && "rotate-180")} />
              </button>

              {langOpen && (
                <div className="absolute top-full mt-2 w-44 bg-dark-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                  style={{ [isRTL ? "left" : "right"]: 0 }}>
                  {locales.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLocale(l.code)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors",
                        l.code === locale ? "text-primary-400 bg-primary-900/20" : "text-gray-300"
                      )}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all text-sm"
                >
                  <div className="w-6 h-6 bg-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {session.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="max-w-24 truncate">{session.user?.name}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", userOpen && "rotate-180")} />
                </button>

                {userOpen && (
                  <div className="absolute top-full mt-2 w-52 bg-dark-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    style={{ [isRTL ? "left" : "right"]: 0 }}>
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white font-medium text-sm truncate">{session.user?.name}</p>
                      <p className="text-gray-400 text-xs truncate">{session.user?.email}</p>
                    </div>
                    <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm" onClick={() => setUserOpen(false)}>
                      <Calendar className="w-4 h-4" />
                      {t("dashboard")}
                    </Link>
                    <Link href={`/${locale}/dashboard/favorites`} className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm" onClick={() => setUserOpen(false)}>
                      <Heart className="w-4 h-4" />
                      {locale === "ar" ? "المفضلة" : "Favorites"}
                    </Link>
                    {(session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "SUPER_ADMIN" ? (
                      <Link href={`/admin`} className="flex items-center gap-3 px-4 py-3 text-primary-400 hover:text-primary-300 hover:bg-primary-900/20 transition-colors text-sm" onClick={() => setUserOpen(false)}>
                        <Settings className="w-4 h-4" />
                        {t("admin")}
                      </Link>
                    ) : null}
                    <div className="border-t border-white/10">
                      <button
                        onClick={() => { signOut({ callbackUrl: `/${locale}` }); setUserOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-colors text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={`/${locale}/login`} className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 text-sm font-medium transition-all">
                  {t("login")}
                </Link>
                <Link href={`/${locale}/register`} className="btn-primary text-sm py-2 px-4">
                  {t("register")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-dark-950 border-t border-white/10 animate-slide-up">
          <div className="container-wide py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  pathname === link.href
                    ? "text-primary-400 bg-primary-900/20"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Language switcher mobile */}
            <div className="border-t border-white/10 pt-3 mt-3">
              <p className="text-gray-500 text-xs px-4 mb-2">{t("language")}</p>
              <div className="grid grid-cols-3 gap-2">
                {locales.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { switchLocale(l.code); setMobileOpen(false); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                      l.code === locale ? "bg-primary-900/20 text-primary-400" : "text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <span>{l.flag}</span>
                    <span className="text-xs">{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auth mobile */}
            <div className="border-t border-white/10 pt-3 mt-3 flex gap-2">
              {session ? (
                <button
                  onClick={() => { signOut({ callbackUrl: `/${locale}` }); setMobileOpen(false); }}
                  className="btn-primary w-full text-sm py-2"
                >
                  {t("logout")}
                </button>
              ) : (
                <>
                  <Link href={`/${locale}/login`} className="btn-secondary flex-1 text-sm py-2" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
                  <Link href={`/${locale}/register`} className="btn-primary flex-1 text-sm py-2" onClick={() => setMobileOpen(false)}>{t("register")}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
