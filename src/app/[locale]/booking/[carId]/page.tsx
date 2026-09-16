import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { CarImage } from "@/components/cars/CarImage";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, serializeDecimals } from "@/lib/utils";
import { MapPin, Users, Fuel, Settings2 } from "lucide-react";
import "react-day-picker/style.css";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string; carId: string }>;
}) {
  const { locale, carId } = await params;
  const session = await auth();

  // The middleware already gates /booking, but a page that reads the session
  // should not assume it is there.
  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/booking/${carId}`);
  }

  const t = await getTranslations("booking");
  const isAr = locale === "ar";

  const [rawCar, rawBookings, rawSeason, user] = await Promise.all([
    prisma.car.findUnique({
      where: { id: carId },
      include: { branch: true },
    }),
    prisma.booking.findMany({
      where: {
        carId,
        status: { in: ["PENDING", "APPROVED"] },
        endDate: { gte: new Date() },
      },
      select: { startDate: true, endDate: true },
    }),
    prisma.season.findFirst({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { points: true },
    }),
  ]);

  if (!rawCar) notFound();
  if (rawCar.status !== "AVAILABLE") {
    redirect(`/${locale}/cars/${carId}`);
  }

  const car = serializeDecimals(rawCar);
  const season = rawSeason ? serializeDecimals(rawSeason) : null;
  const bookedDates = rawBookings.map((b) => ({ start: b.startDate, end: b.endDate }));

  const name = isAr ? car.nameAr : car.name;
  const branchName = isAr ? car.branch.nameAr : car.branch.name;

  const fuelLabels: Record<string, string> = isAr
    ? { PETROL: "بنزين", DIESEL: "ديزل", HYBRID: "هايبرد", ELECTRIC: "كهربائي" }
    : { PETROL: "Petrol", DIESEL: "Diesel", HYBRID: "Hybrid", ELECTRIC: "Electric" };

  const transmissionLabels: Record<string, string> = isAr
    ? { AUTOMATIC: "أوتوماتيك", MANUAL: "عادي" }
    : { AUTOMATIC: "Automatic", MANUAL: "Manual" };

  return (
    <>
      <Navbar />

      <main className="bg-gray-50 pt-28 pb-16 min-h-screen">
        <div className="container-wide">
          <h1 className="text-3xl font-bold text-dark-950 mb-8">{t("title")}</h1>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
            <BookingWizard
              car={car}
              locale={locale}
              bookedDates={bookedDates}
              activeSeason={season}
              userPoints={user?.points ?? 0}
            />

            {/* Car summary */}
            <aside className="card overflow-hidden lg:sticky lg:top-24">
              <div className="relative h-40 bg-gray-100">
                <CarImage src={car.images[0]} alt={name} sizes="340px" fallbackSize="text-5xl" />
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h2 className="font-bold text-dark-950">{name}</h2>
                  <p className="text-sm text-gray-500">
                    {car.brand} {car.model} · {car.year}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary-600" />
                    {car.seats}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-primary-600" />
                    {fuelLabels[car.fuelType] ?? car.fuelType}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-primary-600" />
                    {transmissionLabels[car.transmission] ?? car.transmission}
                  </span>
                </div>

                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  {branchName}
                </p>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("car")}</span>
                    <span className="font-bold text-primary-700">
                      {formatPrice(Number(car.dailyPrice))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("deposit")}</span>
                    <span className="text-dark-950">
                      {formatPrice(Number(car.depositAmount))}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
