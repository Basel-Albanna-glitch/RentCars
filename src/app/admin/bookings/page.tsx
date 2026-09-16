import { prisma } from "@/lib/prisma";
import { requireStaff, branchFilter } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RecentBookingsTable } from "@/components/admin/RecentBookingsTable";
import { serializeDecimals } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 15;

const statusFilters = [
  { label: "الكل", value: "" },
  { label: "بانتظار المراجعة", value: "PENDING" },
  { label: "مقبولة", value: "APPROVED" },
  { label: "مكتملة", value: "COMPLETED" },
  { label: "مرفوضة", value: "REJECTED" },
  { label: "ملغاة", value: "CANCELLED" },
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; branch?: string; customer?: string }>;
}) {
  const session = await requireStaff();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const status = params.status;
  const branchId = branchFilter(session, params.branch);

  const where: Prisma.BookingWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(branchId ? { branchId } : {}),
    ...(params.customer ? { userId: params.customer } : {}),
  };

  const [bookings, total, counts] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        car: { select: { name: true, nameAr: true, images: true } },
        user: { select: { name: true, email: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({
      by: ["status"],
      where: branchId ? { branchId } : {},
      _count: { status: true },
    }),
  ]);

  const countFor = (value: string) =>
    value
      ? counts.find((c) => c.status === value)?._count.status ?? 0
      : counts.reduce((sum, c) => sum + c._count.status, 0);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">الحجوزات</h1>
          <p className="text-gray-500 text-sm mt-1">{total} حجز مطابق للتصفية الحالية</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
          {statusFilters.map((f) => (
            <a
              key={f.value}
              href={f.value ? `/admin/bookings?status=${f.value}` : "/admin/bookings"}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                (status ?? "") === f.value
                  ? "bg-primary-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
              <span className="opacity-60 text-xs"> ({countFor(f.value)})</span>
            </a>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <RecentBookingsTable bookings={serializeDecimals(bookings)} />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <a
                key={i}
                href={`/admin/bookings?page=${i + 1}${status ? `&status=${status}` : ""}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
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
      </main>
    </div>
  );
}
