import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CarGallery } from "@/components/cars/CarGallery";
import { prisma } from "@/lib/prisma";
import { formatPrice, serializeDecimals } from "@/lib/utils";
import {
  Users, Fuel, Settings2, Palette, Calendar, Gauge,
  MapPin, Phone, ChevronLeft, ShieldCheck,
} from "lucide-react";

async function getCar(id: string) {
  return prisma.car.findUnique({
    where: { id },
    include: { branch: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const car = await getCar(id);
  if (!car) return {};

  return {
    title: locale === "ar" ? car.nameAr : car.name,
    description: (locale === "ar" ? car.descriptionAr : car.description) ?? undefined,
  };
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const raw = await getCar(id);
  if (!raw) notFound();

  const car = serializeDecimals(raw);
  const t = await getTranslations("cars.detail");
  const isAr = locale === "ar";

  const name = isAr ? car.nameAr : car.name;
  const description = (isAr ? car.descriptionAr : car.description) ?? "";
  const branchName = isAr ? car.branch.nameAr : car.branch.name;
  const branchAddress = isAr ? car.branch.addressAr : car.branch.address;

  const fuelLabels: Record<string, string> = isAr
    ? { PETROL: "بنزين", DIESEL: "ديزل", HYBRID: "هايبرد", ELECTRIC: "كهربائي" }
    : { PETROL: "Petrol", DIESEL: "Diesel", HYBRID: "Hybrid", ELECTRIC: "Electric" };

  const transmissionLabels: Record<string, string> = isAr
    ? { AUTOMATIC: "أوتوماتيك", MANUAL: "عادي" }
    : { AUTOMATIC: "Automatic", MANUAL: "Manual" };

  const specs = [
    { icon: Users, label: t("seats"), value: String(car.seats) },
    { icon: Fuel, label: t("fuel"), value: fuelLabels[car.fuelType] ?? car.fuelType },
    { icon: Settings2, label: t("transmission"), value: transmissionLabels[car.transmission] ?? car.transmission },
    { icon: Calendar, label: t("year"), value: String(car.year) },
    { icon: Palette, label: t("color"), value: (isAr ? car.colorAr : car.color) ?? car.color },
    ...(car.fuelConsumption
      ? [{ icon: Gauge, label: t("consumption"), value: car.fuelConsumption }]
      : []),
  ];

  const prices = [
    { label: t("daily"), value: car.dailyPrice, highlight: true },
    ...(car.weeklyPrice ? [{ label: t("weekly"), value: car.weeklyPrice, highlight: false }] : []),
    ...(car.monthlyPrice ? [{ label: t("monthly"), value: car.monthlyPrice, highlight: false }] : []),
  ];

  return (
    <>
      <Navbar />

      <main className="bg-gray-50 pt-28 pb-16 min-h-screen">
        <div className="container-wide">
          <Link
            href={`/${locale}/cars`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 transition-colors mb-6"
          >
            <ChevronLeft className={isAr ? "w-4 h-4 rotate-180" : "w-4 h-4"} />
            {isAr ? "كل السيارات" : "All cars"}
          </Link>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            <div className="space-y-6">
              <CarGallery images={car.images} alt={name} locale={locale} status={car.status} />

              <div className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-dark-950">{name}</h1>
                  <span className="text-gray-400">{car.year}</span>
                </div>
                <p className="text-gray-500">
                  {car.brand} {car.model}
                </p>
                {description && (
                  <p className="text-gray-600 leading-relaxed mt-5">{description}</p>
                )}
              </div>

              <div className="card p-6">
                <h2 className="font-bold text-dark-950 mb-5">{t("specs")}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <spec.icon className="w-5 h-5 text-primary-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">{spec.label}</p>
                        <p className="font-medium text-dark-950 text-sm truncate">{spec.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-bold text-dark-950 mb-4">
                  {isAr ? "فرع الاستلام" : "Pickup Branch"}
                </h2>
                <div className="space-y-3 text-sm">
                  <p className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-dark-950">{branchName}</span>
                      {" - "}
                      {branchAddress}
                    </span>
                  </p>
                  <p className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    {car.branch.phone}
                  </p>
                </div>
              </div>
            </div>

            <aside className="card p-6 space-y-5 lg:sticky lg:top-24">
              <h2 className="font-bold text-dark-950">{t("pricing")}</h2>

              <div className="space-y-3">
                {prices.map((p) => (
                  <div
                    key={p.label}
                    className={
                      p.highlight
                        ? "flex items-center justify-between rounded-xl px-4 py-3 bg-primary-50 border border-primary-200"
                        : "flex items-center justify-between rounded-xl px-4 py-3 bg-gray-50"
                    }
                  >
                    <span className={p.highlight ? "text-primary-700 font-medium" : "text-gray-500"}>
                      {p.label}
                    </span>
                    <span className={p.highlight ? "font-bold text-primary-700 text-lg" : "font-bold text-dark-950"}>
                      {formatPrice(Number(p.value))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <ShieldCheck className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-dark-950">{t("deposit")}</p>
                  <p className="text-lg font-bold text-dark-950">
                    {formatPrice(Number(car.depositAmount))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isAr
                      ? "يعاد بالكامل عند إرجاع السيارة بحالتها"
                      : "Fully refunded on undamaged return"}
                  </p>
                </div>
              </div>

              {car.status === "AVAILABLE" ? (
                <Link
                  href={`/${locale}/booking/${car.id}`}
                  className="btn-primary w-full py-4 text-base"
                >
                  {isAr ? "احجز الآن" : "Book Now"}
                </Link>
              ) : (
                <button disabled className="btn-primary w-full py-4 text-base opacity-50">
                  {isAr ? "غير متاح حالياً" : "Currently Unavailable"}
                </button>
              )}

              <p className="text-xs text-gray-400 text-center">
                {isAr ? "الحد الأدنى للحجز 3 أيام" : "Minimum rental is 3 days"}
              </p>
            </aside>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
