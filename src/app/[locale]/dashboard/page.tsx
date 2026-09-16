import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CarImage } from "@/components/cars/CarImage";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice, serializeDecimals } from "@/lib/utils";
import { CalendarDays, MapPin, Truck, Hash } from "lucide-react";

const statusBadges: Record<string, string> = {
  PENDING: "badge-pending",
  APPROVED: "badge-approved",
  REJECTED: "badge-rejected",
  COMPLETED: "badge-completed",
  CANCELLED: "badge",
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("dashboard");
  const isAr = locale === "ar";

  const bookings = serializeDecimals(
    await prisma.booking.findMany({
      where: { userId: session!.user.id },
      include: {
        car: { select: { id: true, name: true, nameAr: true, images: true, brand: true, model: true } },
        branch: { select: { name: true, nameAr: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  );

  const statusLabels: Record<string, string> = {
    PENDING: t("status.pending"),
    APPROVED: t("status.approved"),
    REJECTED: t("status.rejected"),
    COMPLETED: t("status.completed"),
    CANCELLED: t("status.cancelled"),
  };

  if (bookings.length === 0) {
    return (
      <div className="card p-16 text-center">
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-6">{t("noBookings")}</p>
        <Link href={`/${locale}/cars`} className="btn-primary">
          {t("bookNow")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{t("pointsInfo")}</p>

      {bookings.map((booking) => {
        const carName = isAr ? booking.car.nameAr : booking.car.name;
        const branchName = isAr ? booking.branch.nameAr : booking.branch.name;

        return (
          <article key={booking.id} className="card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <Link
                href={`/${locale}/cars/${booking.car.id}`}
                className="relative w-full sm:w-40 h-32 sm:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
              >
                <CarImage
                  src={booking.car.images?.[0]}
                  alt={carName}
                  sizes="160px"
                  fallbackSize="text-4xl"
                />
              </Link>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-dark-950">{carName}</h2>
                    <p className="text-gray-500 text-sm">
                      {booking.car.brand} {booking.car.model}
                    </p>
                  </div>
                  <span className={`badge ${statusBadges[booking.status] ?? ""}`}>
                    {statusLabels[booking.status] ?? booking.status}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-600">
                    <Hash className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span className="font-mono text-xs">{booking.bookingNumber}</span>
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <CalendarDays className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    {formatDate(booking.startDate)} — {formatDate(booking.endDate)} ({booking.totalDays}{" "}
                    {isAr ? "أيام" : "days"})
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    {branchName}
                  </p>
                  {booking.needsDelivery && (
                    <p className="flex items-center gap-2 text-gray-600">
                      <Truck className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      {booking.deliveryAddress ?? (isAr ? "توصيل مطلوب" : "Delivery requested")}
                    </p>
                  )}
                </div>

                {booking.adminNote && (
                  <p className="text-sm bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-600">
                    {booking.adminNote}
                  </p>
                )}
              </div>

              <div className="sm:w-40 sm:text-end flex sm:flex-col justify-between sm:justify-start gap-2 border-t sm:border-t-0 sm:border-s border-gray-100 pt-4 sm:pt-0 sm:ps-5">
                <div>
                  <p className="text-xs text-gray-400">{isAr ? "الإجمالي" : "Total"}</p>
                  <p className="font-bold text-primary-700 text-lg">
                    {formatPrice(Number(booking.totalAmount))}
                  </p>
                </div>
                {booking.pointsEarned > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">{t("points")}</p>
                    <p className="font-medium text-amber-600 text-sm">+{booking.pointsEarned}</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
