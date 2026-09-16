import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

// Bump this whenever the terms text itself changes.
const LAST_UPDATED = "2026-01-15";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms");
  return { title: t("title") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tLegal] = await Promise.all([
    getTranslations("legal.terms"),
    getTranslations("legal"),
  ]);

  const sections = [
    { title: t("eligibilityTitle"), body: t("eligibilityBody") },
    { title: t("bookingTitle"), body: t("bookingBody") },
    { title: t("paymentTitle"), body: t("paymentBody") },
    { title: t("cancellationTitle"), body: t("cancellationBody") },
    { title: t("liabilityTitle"), body: t("liabilityBody") },
    { title: t("pointsTitle"), body: t("pointsBody") },
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
