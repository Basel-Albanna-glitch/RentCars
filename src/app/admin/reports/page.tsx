import { prisma } from "@/lib/prisma";
import { requireStaff, branchFilter } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BarList, type BarRow } from "@/components/admin/BarList";
import { formatPrice } from "@/lib/utils";
import { DollarSign, Calendar, TrendingUp, Car } from "lucide-react";
import type { Prisma } from "@prisma/client";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const statusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  APPROVED: "مقبولة",
  COMPLETED: "مكتملة",
  REJECTED: "مرفوضة",
  CANCELLED: "ملغاة",
};

// The status palette is reserved for state and always ships beside its label.
const statusColors: Record<string, string> = {
  PENDING: "#d97706",
  APPROVED: "#16a34a",
  COMPLETED: "#2563eb",
  REJECTED: "#dc2626",
  CANCELLED: "#6b7280",
};

/** Revenue counts only bookings the business actually committed to. */
const EARNING_STATUSES: Prisma.BookingWhereInput = {
  status: { in: ["APPROVED", "COMPLETED"] },
};

export default async function AdminReportsPage() {
  const session = await requireStaff();
  const branchId = branchFilter(session);
  const scope: Prisma.BookingWhereInput = branchId ? { branchId } : {};

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [
    revenueAgg,
    totalBookings,
    statusCounts,
    earningBookings,
    topCarGroups,
    branchGroups,
    carTotals,
  ] = await Promise.all([
    prisma.booking.aggregate({
      where: { ...scope, ...EARNING_STATUSES },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: true,
    }),
    prisma.booking.count({ where: scope }),
    prisma.booking.groupBy({
      by: ["status"],
      where: scope,
      _count: { status: true },
    }),
    prisma.booking.findMany({
      where: { ...scope, ...EARNING_STATUSES, createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.booking.groupBy({
      by: ["carId"],
      where: scope,
      _count: { carId: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { carId: "desc" } },
      take: 5,
    }),
    prisma.booking.groupBy({
      by: ["branchId"],
      where: { ...scope, ...EARNING_STATUSES },
      _sum: { totalAmount: true },
      _count: { branchId: true },
    }),
    prisma.car.groupBy({
      by: ["status"],
      where: branchId ? { branchId } : {},
      _count: { status: true },
    }),
  ]);

  // Resolve the ids the groupBy queries returned.
  const [topCars, branches] = await Promise.all([
    prisma.car.findMany({
      where: { id: { in: topCarGroups.map((g) => g.carId) } },
      select: { id: true, nameAr: true, brand: true },
    }),
    prisma.branch.findMany({
      where: { id: { in: branchGroups.map((g) => g.branchId) } },
      select: { id: true, nameAr: true },
    }),
  ]);

  const revenue = Number(revenueAgg._sum.totalAmount ?? 0);
  const avgBooking = Number(revenueAgg._avg.totalAmount ?? 0);
  const carCount = carTotals.reduce((sum, c) => sum + c._count.status, 0);
  const bookedCars = carTotals.find((c) => c.status === "BOOKED")?._count.status ?? 0;
  const utilization = carCount > 0 ? Math.round((bookedCars / carCount) * 100) : 0;

  // Build the last 12 month buckets, then fold the bookings into them.
  const now = new Date();
  const monthly = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const booking of earningBookings) {
    const key = `${booking.createdAt.getFullYear()}-${booking.createdAt.getMonth()}`;
    if (monthly.has(key)) {
      monthly.set(key, monthly.get(key)! + Number(booking.totalAmount));
    }
  }

  const monthlyRows: BarRow[] = Array.from(monthly.entries()).map(([key, value]) => {
    const [year, month] = key.split("-").map(Number);
    return {
      label: MONTHS_AR[month],
      sublabel: String(year),
      value,
      display: formatPrice(value),
    };
  });

  const statusRows: BarRow[] = statusCounts
    .map((row) => ({
      label: statusLabels[row.status] ?? row.status,
      value: row._count.status,
      display: String(row._count.status),
      color: statusColors[row.status],
    }))
    .sort((a, b) => b.value - a.value);

  const topCarRows: BarRow[] = topCarGroups
    .map((group) => {
      const car = topCars.find((c) => c.id === group.carId);
      return {
        label: car?.nameAr ?? group.carId,
        sublabel: car?.brand,
        value: group._count.carId,
        display: `${group._count.carId} حجز · ${formatPrice(Number(group._sum.totalAmount ?? 0))}`,
      };
    })
    .sort((a, b) => b.value - a.value);

  const branchRows: BarRow[] = branchGroups
    .map((group) => ({
      label: branches.find((b) => b.id === group.branchId)?.nameAr ?? group.branchId,
      sublabel: `${group._count.branchId} حجز`,
      value: Number(group._sum.totalAmount ?? 0),
      display: formatPrice(Number(group._sum.totalAmount ?? 0)),
    }))
    .sort((a, b) => b.value - a.value);

  const tiles = [
    { label: "الإيرادات المؤكدة", value: formatPrice(revenue), icon: DollarSign },
    { label: "إجمالي الحجوزات", value: String(totalBookings), icon: Calendar },
    { label: "متوسط قيمة الحجز", value: formatPrice(avgBooking), icon: TrendingUp },
    { label: "نسبة السيارات المحجوزة", value: `${utilization}%`, icon: Car },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">التقارير</h1>
          <p className="text-gray-500 text-sm mt-1">
            الإيرادات تحتسب الحجوزات المقبولة والمكتملة فقط
            {branchId ? " — ضمن فرعك" : ""}
          </p>
        </div>

        {/* Headline numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tiles.map((tile) => (
            <div key={tile.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                <tile.icon className="w-5 h-5 text-primary-700" />
              </div>
              <p className="text-2xl font-bold text-dark-950 tabular-nums">{tile.value}</p>
              <p className="text-gray-500 text-sm mt-1">{tile.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-dark-950 mb-1">الإيرادات الشهرية</h2>
            <p className="text-gray-400 text-xs mb-6">آخر 12 شهراً</p>
            <BarList rows={monthlyRows} emptyLabel="لا توجد إيرادات مسجّلة بعد" />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-dark-950 mb-1">الحجوزات حسب الحالة</h2>
            <p className="text-gray-400 text-xs mb-6">توزيع كل الحجوزات</p>
            <BarList rows={statusRows} emptyLabel="لا توجد حجوزات بعد" />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-dark-950 mb-1">الأكثر حجزاً</h2>
            <p className="text-gray-400 text-xs mb-6">أعلى 5 سيارات</p>
            <BarList rows={topCarRows} emptyLabel="لا توجد حجوزات بعد" />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-dark-950 mb-1">الإيرادات حسب الفرع</h2>
            <p className="text-gray-400 text-xs mb-6">الحجوزات المقبولة والمكتملة</p>
            <BarList rows={branchRows} emptyLabel="لا توجد إيرادات مسجّلة بعد" />
          </section>
        </div>
      </main>
    </div>
  );
}
