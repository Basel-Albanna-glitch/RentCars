import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Noto_Sans_SC, Noto_Sans_JP } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers/Providers";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const chineseFont = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-chinese",
  display: "swap",
  weight: ["400", "500", "700"],
});

const japaneseFont = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-japanese",
  display: "swap",
  weight: ["400", "500", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const common = (messages as any).common;

  return {
    title: {
      default: common.siteName,
      template: `%s | ${common.siteName}`,
    },
    description: common.siteTagline,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}`])
      ),
    },
    openGraph: {
      type: "website",
      locale,
      siteName: common.siteName,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const isRTL = locale === "ar";

  const fontClass =
    locale === "ar"
      ? arabicFont.variable
      : locale === "zh"
      ? chineseFont.variable
      : locale === "ja"
      ? japaneseFont.variable
      : inter.variable;

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${fontClass} ${inter.variable}`}
    >
      <body
        className={`${
          locale === "ar" ? "font-arabic" : "font-sans"
        } bg-white text-dark-950 antialiased`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>{children}</Providers>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#141414",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "14px",
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
