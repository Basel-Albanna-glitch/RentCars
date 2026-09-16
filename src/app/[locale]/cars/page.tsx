import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CarCard } from "@/components/cars/CarCard";
import { CarFilters } from "@/components/cars/CarFilters";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";
import { SearchX } from "lucide-react";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 9;

interface CarsSearchParams {
  city?: string;
  from?: string;
  to?: string;
  seats?: string;
  transmission?: string;
  fuelType?: string;
  sort?: string;
  page?: string;
}

/** The ids the signed-in visitor has saved, so the hearts start filled. */
async function favoriteCarIds() {
  const session = await auth();
  if (!session) return new Set<string>();

  const rows = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { carId: true },
  });
  return new Set(rows.map((r) => r.carId));
}

/**
 * A car is unavailable for a requested window if it already has a PENDING or
 * APPROVED booking that overlaps it. Two ranges overlap when each one starts
 * before the other ends.
 */
async function bookedCarIds(from?: string, to?: string) {
  if (!from || !to) return [];

  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const conflicts = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "APPROVED"] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: { carId: true },
  });

  return conflicts.map((c) => c.carId);
}

export default async function CarsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CarsSearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("cars");

  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const [unavailable, favorites] = await Promise.all([
    bookedCarIds(sp.from, sp.to),
    favoriteCarIds(),
  ]);

  const where: Prisma.CarWhereInput = {
    status: "AVAILABLE",
    ...(sp.city ? { branch: { city: sp.city } } : {}),
    ...(sp.seats ? { seats: { gte: parseInt(sp.seats) } } : {}),
    ...(sp.transmission ? { transmission: sp.transmission as never } : {}),
    ...(sp.fuelType ? { fuelType: sp.fuelType as never } : {}),
    ...(unavailable.length ? { id: { notIn: unavailable } } : {}),
  };

  const orderBy: Prisma.CarOrderByWithRelationInput =
    sp.sort === "price_asc"
      ? { dailyPrice: "asc" }
      : sp.sort === "price_desc"
      ? { dailyPrice: "desc" }
      : { createdAt: "desc" };

  const [cars, total, branches] = await Promise.all([
    prisma.car.findMany({
      where,
      include: { branch: { select: { name: true, nameAr: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.car.count({ where }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { city: true },
      distinct: ["city"],
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Carry the active filters into the pagination links.
  function pageHref(n: number) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (v && k !== "page") qs.set(k, v);
    }
    qs.set("page", String(n));
    return `/${locale}/cars?${qs.toString()}`;
  }

  return (
    <>
      <Navbar />

      {/* Page header */}
      <header className="bg-dark-950 pt-32 pb-14 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-700 rounded-full opacity-10 blur-3xl" />
        <div className="container-wide relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-white">{t("title")}</h1>
          <p className="text-gray-400 text-lg mt-3">{t("subtitle")}</p>
        </div>
      </header>

      <main className="bg-gray-50 py-10 min-h-[50vh]">
        <div className="container-wide grid lg:grid-cols-[280px_1fr] gap-8 items-start">
          <CarFilters
            locale={locale}
            cities={branches.map((b) => b.city)}
            selected={sp}
          />

          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 text-sm">
                {total} {locale === "ar" ? "سيارة" : total === 1 ? "car" : "cars"}
              </p>
            </div>

            {cars.length === 0 ? (
              <div className="card p-16 text-center">
                <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {locale === "ar"
                    ? "لا توجد سيارات مطابقة لبحثك"
                    : "No cars match your search"}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {serializeDecimals(cars).map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    locale={locale}
                    isFavorite={favorites.has(car.id)}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => (
                  <a
                    key={i}
                    href={pageHref(i + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      page === i + 1
                        ? "bg-primary-700 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
                    }`}
                  >
                    {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
