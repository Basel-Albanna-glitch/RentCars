import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CarForm } from "@/components/admin/CarForm";
import { formatDate, formatPrice, getStatusColor } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

const bookingStatusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;

  const [car, branches] = await Promise.all([
    prisma.car.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.branch.findMany({
      where:
        session.user.role === "ADMIN" && session.user.branchId
          ? { id: session.user.branchId }
          : { isActive: true },
      select: { id: true, nameAr: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!car) notFound();

  if (
    session.user.role === "ADMIN" &&
    session.user.branchId &&
    session.user.branchId !== car.branchId
  ) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          كل السيارات
        </Link>

        <h1 className="text-2xl font-bold text-dark-950 mb-2">{car.nameAr}</h1>
        <p className="text-gray-500 text-sm mb-8">
          {car.brand} {car.model} · أُضيفت في {formatDate(car.createdAt)}
        </p>

        <CarForm
          branches={branches}
          mode="edit"
          canDelete={session.user.role === "SUPER_ADMIN"}
          initial={{
            id: car.id,
            name: car.name,
            nameAr: car.nameAr,
            brand: car.brand,
            model: car.model,
            year: car.year,
            seats: car.seats,
            fuelType: car.fuelType,
            fuelConsumption: car.fuelConsumption ?? "",
            transmission: car.transmission,
            color: car.color,
            colorAr: car.colorAr ?? "",
            description: car.description ?? "",
            descriptionAr: car.descriptionAr ?? "",
            images: car.images,
            status: car.status,
            dailyPrice: Number(car.dailyPrice),
            weeklyPrice: car.weeklyPrice ? Number(car.weeklyPrice) : null,
            monthlyPrice: car.monthlyPrice ? Number(car.monthlyPrice) : null,
            depositAmount: Number(car.depositAmount),
            branchId: car.branchId,
          }}
        />

        {car.bookings.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-6 mt-6 max-w-4xl">
            <h2 className="font-bold text-dark-950 mb-4">آخر الحجوزات على هذه السيارة</h2>
            <div className="divide-y divide-gray-100">
              {car.bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="text-sm">
                    <p className="font-medium text-primary-700">{booking.bookingNumber}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {booking.user.name} · {formatDate(booking.startDate)} —{" "}
                      {formatDate(booking.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-dark-950">
                      {formatPrice(Number(booking.totalAmount))}
                    </span>
                    <span className={`badge ${getStatusColor(booking.status)}`}>
                      {bookingStatusLabels[booking.status] ?? booking.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
