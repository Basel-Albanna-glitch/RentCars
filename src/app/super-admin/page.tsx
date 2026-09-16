import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BarList, type BarRow } from "@/components/admin/BarList";
import { formatPrice } from "@/lib/utils";
import {
  Building2, Car, Users, Calendar, DollarSign, Sunset, Tag, ShieldCheck, ChevronLeft,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "مدير عام",
  ADMIN: "مدير فرع",
};

export default async function SuperAdminPage() {
  const session = await requireSuperAdmin();
  const now = new Date();

  const [
    branches,
    carCount,
    customerCount,
    bookingCount,
    revenue,
    staff,
    activeSeasons,
    activeOffers,
    pendingBookings,
    pendingDocuments,
    branchRevenue,
  ] = await Promise.all([
    prisma.branch.findMany({
      include: { _count: { select: { cars: true, admins: true, bookings: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.car.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: { status: { in: ["APPROVED", "COMPLETED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      include: { branch: { select: { nameAr: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.season.count({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    }),
    prisma.offer.count({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.document.count({ where: { status: "PENDING" } }),
    prisma.booking.groupBy({
      by: ["branchId"],
      where: { status: { in: ["APPROVED", "COMPLETED"] } },
      _sum: { totalAmount: true },
    }),
  ]);

  const stats = [
    { label: "الفروع", value: branches.length, icon: Building2 },
    { label: "السيارات", value: carCount, icon: Car },
    { label: "العملاء", value: customerCount, icon: Users },
    { label: "الحجوزات", value: bookingCount, icon: Calendar },
    {
      label: "الإيرادات المؤكدة",
      value: formatPrice(Number(revenue._sum.totalAmount ?? 0)),
      icon: DollarSign,
    },
    { label: "حسابات الإدارة", value: staff.length, icon: ShieldCheck },
  ];

  const attention = [
    {
      label: "حجوزات بانتظار المراجعة",
      count: pendingBookings,
      href: "/admin/bookings?status=PENDING",
    },
    {
      label: "وثائق بانتظار المراجعة",
      count: pendingDocuments,
      href: "/admin/documents?status=PENDING",
    },
  ];

  const revenueRows: BarRow[] = branchRevenue
    .map((group) => ({
      label: branches.find((b) => b.id === group.branchId)?.nameAr ?? group.branchId,
      value: Number(group._sum.totalAmount ?? 0),
      display: formatPrice(Number(group._sum.totalAmount ?? 0)),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">لوحة المدير العام</h1>
          <p className="text-gray-500 text-sm mt-1">
            مرحباً {session.user.name} — نظرة شاملة على النظام بالكامل
          </p>
        </div>

        {/* System totals */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                <stat.icon className="w-5 h-5 text-primary-700" />
              </div>
              <p className="text-2xl font-bold text-dark-950 tabular-nums">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Needs attention */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {attention.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between gap-4 p-5 rounded-2xl border transition-all hover:shadow-md ${
                item.count > 0
                  ? "bg-amber-50 border-amber-200 hover:border-amber-400"
                  : "bg-white border-gray-100 hover:border-primary-300"
              }`}
            >
              <div>
                <p className="font-medium text-dark-950 text-sm">{item.label}</p>
                <p className="text-2xl font-bold text-dark-950 mt-1 tabular-nums">{item.count}</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Branch table */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-dark-950">الفروع</h2>
              <Link href="/admin/branches" className="text-primary-700 text-sm hover:underline">
                إدارة الفروع
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-right font-medium px-4 py-3">الفرع</th>
                    <th className="text-right font-medium px-4 py-3">المدينة</th>
                    <th className="text-right font-medium px-4 py-3">السيارات</th>
                    <th className="text-right font-medium px-4 py-3">الحجوزات</th>
                    <th className="text-right font-medium px-4 py-3">المديرون</th>
                    <th className="text-right font-medium px-4 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-dark-950">{branch.nameAr}</td>
                      <td className="px-4 py-3 text-gray-600">{branch.city}</td>
                      <td className="px-4 py-3 text-gray-600">{branch._count.cars}</td>
                      <td className="px-4 py-3 text-gray-600">{branch._count.bookings}</td>
                      <td className="px-4 py-3 text-gray-600">{branch._count.admins}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`badge ${
                            branch.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {branch.isActive ? "يعمل" : "متوقف"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Revenue by branch */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-dark-950 mb-1">الإيرادات حسب الفرع</h2>
            <p className="text-gray-400 text-xs mb-6">الحجوزات المقبولة والمكتملة</p>
            <BarList rows={revenueRows} emptyLabel="لا توجد إيرادات مسجّلة بعد" />
          </section>

          {/* Pricing programmes */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-dark-950 mb-5">برامج التسعير</h2>
            <div className="space-y-3">
              <Link
                href="/admin/seasons"
                className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-primary-300 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Sunset className="w-5 h-5 text-primary-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-950 text-sm">المواسم</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {activeSeasons} موسم فعّال الآن
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300" />
              </Link>

              <Link
                href="/admin/offers"
                className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-primary-300 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-950 text-sm">العروض</p>
                  <p className="text-gray-500 text-xs mt-0.5">{activeOffers} عرض فعّال الآن</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300" />
              </Link>
            </div>
          </section>

          {/* Staff */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
            <h2 className="font-bold text-dark-950 mb-5">حسابات الإدارة</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-right font-medium px-4 py-3">الاسم</th>
                    <th className="text-right font-medium px-4 py-3">البريد</th>
                    <th className="text-right font-medium px-4 py-3">الصلاحية</th>
                    <th className="text-right font-medium px-4 py-3">الفرع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3 font-medium text-dark-950">{member.name}</td>
                      <td className="px-4 py-3 text-gray-600" dir="ltr">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-primary-100 text-primary-700">
                          {roleLabels[member.role] ?? member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {member.branch?.nameAr ?? "كل الفروع"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
