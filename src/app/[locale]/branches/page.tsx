import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { MapPin, Phone, Mail, MessageCircle, Car, Navigation, AlertCircle } from "lucide-react";

export default async function BranchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("branches");
  const isAr = locale === "ar";

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { cars: { where: { status: "AVAILABLE" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <Navbar />

      <header className="bg-dark-950 pt-32 pb-14 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-700 rounded-full opacity-10 blur-3xl" />
        <div className="container-wide relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-white">{t("title")}</h1>
          <p className="text-gray-400 text-lg mt-3">{t("subtitle")}</p>
        </div>
      </header>

      <main className="bg-gray-50 py-14 min-h-[50vh]">
        <div className="container-wide grid md:grid-cols-2 gap-6">
          {branches.map((branch) => {
            const name = isAr ? branch.nameAr : branch.name;
            const address = isAr ? branch.addressAr : branch.address;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`;

            return (
              <article key={branch.id} className="card p-6 flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-dark-950">{name}</h2>
                    <p className="text-gray-500 text-sm mt-1">{address}</p>
                  </div>
                  <span className="badge badge-available flex items-center gap-1.5 flex-shrink-0">
                    <Car className="w-3 h-3" />
                    {branch._count.cars} {t("carsAvailable")}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <a
                    href={`tel:${branch.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 text-gray-600 hover:text-primary-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span dir="ltr">{branch.phone}</span>
                  </a>

                  <a
                    href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-primary-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span dir="ltr">{branch.whatsapp}</span>
                  </a>

                  <a
                    href={`mailto:${branch.email}`}
                    className="flex items-center gap-3 text-gray-600 hover:text-primary-700 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    {branch.email}
                  </a>

                  {branch.emergencyPhone && (
                    <p className="flex items-center gap-3 text-gray-600">
                      <AlertCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span>
                        {isAr ? "خط الطوارئ" : "Emergency"}:{" "}
                        <span dir="ltr">{branch.emergencyPhone}</span>
                      </span>
                    </p>
                  )}

                  <p className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    {branch.city}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 mt-auto pt-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm py-2.5 flex-1"
                  >
                    <Navigation className="w-4 h-4" />
                    {t("getDirections")}
                  </a>
                  <Link
                    href={`/${locale}/cars?city=${encodeURIComponent(branch.city)}`}
                    className="btn-primary text-sm py-2.5 flex-1"
                  >
                    <Car className="w-4 h-4" />
                    {isAr ? "سيارات هذا الفرع" : "See cars here"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
