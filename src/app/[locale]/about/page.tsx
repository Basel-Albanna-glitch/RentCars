import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { Award, ShieldCheck, Headphones, ChevronRight } from "lucide-react";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tHome] = await Promise.all([
    getTranslations("about"),
    getTranslations("home.hero.stats"),
  ]);
  const isAr = locale === "ar";

  const [carCount, customerCount, branchCount] = await Promise.all([
    prisma.car.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.branch.count({ where: { isActive: true } }),
  ]);

  const stats = [
    { value: `${carCount}+`, label: tHome("cars") },
    { value: `${customerCount}+`, label: tHome("customers") },
    { value: `${branchCount}`, label: tHome("branches") },
    { value: "5+", label: tHome("years") },
  ];

  const values = [
    { icon: Award, ...{ title: t("values.quality.title"), desc: t("values.quality.desc") } },
    { icon: ShieldCheck, ...{ title: t("values.trust.title"), desc: t("values.trust.desc") } },
    { icon: Headphones, ...{ title: t("values.service.title"), desc: t("values.service.desc") } },
  ];

  return (
    <>
      <Navbar />

      <header className="bg-dark-950 pt-32 pb-14 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-700 rounded-full opacity-10 blur-3xl" />
        <div className="container-wide relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-white">{t("title")}</h1>
          <p className="text-gray-400 text-lg mt-3 max-w-2xl">{t("subtitle")}</p>
        </div>
      </header>

      <main>
        {/* Story */}
        <section className="bg-white py-16">
          <div className="container-wide grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="section-title">{t("storyTitle")}</h2>
              <p className="text-gray-600 leading-relaxed mt-6">{t("storyBody1")}</p>
              <p className="text-gray-600 leading-relaxed mt-4">{t("storyBody2")}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-dark-950">{t("missionTitle")}</h3>
              <p className="text-gray-600 leading-relaxed mt-4">{t("missionBody")}</p>

              <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-200">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl font-bold text-primary-700">{stat.value}</p>
                    <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-gray-50 py-16">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="section-title">{t("valuesTitle")}</h2>
              <p className="section-subtitle">{t("valuesSubtitle")}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {values.map((value) => (
                <div key={value.title} className="card p-8 text-center">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <value.icon className="w-7 h-7 text-primary-700" />
                  </div>
                  <h3 className="font-bold text-dark-950 text-lg mb-3">{value.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dark-950 py-16 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-700 rounded-full opacity-10 blur-3xl" />
          <div className="container-wide relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">{t("ctaTitle")}</h2>
            <p className="text-gray-400 text-lg mt-4">{t("ctaBody")}</p>
            <Link href={`/${locale}/cars`} className="btn-primary mt-8 py-4 px-10 text-base">
              {t("ctaBtn")}
              <ChevronRight className={isAr ? "w-5 h-5 rotate-180" : "w-5 h-5"} />
            </Link>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </>
  );
}
