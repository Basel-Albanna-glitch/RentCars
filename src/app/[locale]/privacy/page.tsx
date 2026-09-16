import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

// Bump this whenever the policy text itself changes.
const LAST_UPDATED = "2026-01-15";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: t("title") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tLegal] = await Promise.all([
    getTranslations("legal.privacy"),
    getTranslations("legal"),
  ]);

  const sections = [
    { title: t("collectTitle"), body: t("collectBody") },
    { title: t("useTitle"), body: t("useBody") },
    { title: t("shareTitle"), body: t("shareBody") },
    { title: t("securityTitle"), body: t("securityBody") },
    { title: t("rightsTitle"), body: t("rightsBody") },
    { title: t("contactTitle"), body: t("contactBody") },
  ];

  return (
    <LegalDocument
      locale={locale}
      title={t("title")}
      intro={t("intro")}
      sections={sections}
      lastUpdatedLabel={tLegal("lastUpdated")}
      lastUpdated={LAST_UPDATED}
      backLabel={tLegal("backHome")}
    />
  );
}
