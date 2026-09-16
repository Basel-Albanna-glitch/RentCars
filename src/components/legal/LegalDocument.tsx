import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChevronLeft } from "lucide-react";

export interface LegalSection {
  title: string;
  body: string;
}

interface LegalDocumentProps {
  locale: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdatedLabel: string;
  lastUpdated: string;
  backLabel: string;
}

export function LegalDocument({
  locale,
  title,
  intro,
  sections,
  lastUpdatedLabel,
  lastUpdated,
  backLabel,
}: LegalDocumentProps) {
  const isAr = locale === "ar";

  return (
    <>
      <Navbar />

      <header className="bg-dark-950 pt-32 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-700 rounded-full opacity-10 blur-3xl" />
        <div className="container-wide relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-white">{title}</h1>
          <p className="text-gray-500 text-sm mt-3">
            {lastUpdatedLabel}: {lastUpdated}
          </p>
        </div>
      </header>

      <main className="bg-gray-50 py-14 min-h-[40vh]">
        <div className="container-wide max-w-3xl">
          <div className="card p-6 sm:p-10">
            <p className="text-gray-600 leading-relaxed">{intro}</p>

            <div className="mt-10 space-y-9">
              {sections.map((section, i) => (
                <section key={section.title}>
                  <h2 className="font-bold text-dark-950 text-lg flex items-baseline gap-3">
                    <span className="text-primary-700 text-sm font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed mt-3">{section.body}</p>
                </section>
              ))}
            </div>
          </div>

          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 transition-colors mt-8"
          >
            <ChevronLeft className={isAr ? "w-4 h-4 rotate-180" : "w-4 h-4"} />
            {backLabel}
          </Link>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
