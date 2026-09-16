import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Car, Users, Calendar, DollarSign, Clock,
  TrendingUp, AlertTriangle, CheckCircle, XCircle
} from "lucide-react";
import { formatPrice, serializeDecimals } from "@/lib/utils";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { RecentBookingsTable } from "@/components/admin/RecentBookingsTable";

async function getDashboardData() {
  const [
    totalCars, availableCars, bookedCars,
    totalUsers, totalBookings, pendingBookings,
    revenueData, recentBookings, topCars
  ] = await Promise.all([
    prisma.car.count(),
    prisma.car.count({ where: { status: "AVAILABLE" } }),
    prisma.car.count({ where: { status: "BOOKED" } }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.aggregate({
      where: { status: { in: ["APPROVED", "COMPLETED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.findMany({
      where: {},
      include: {
        car: { select: { name: true, nameAr: true, images: true } },
        user: { select: { name: true, email: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.booking.groupBy({
      by: ["carId"],
      _count: { carId: true },
      orderBy: { _count: { carId: "desc" } },
      take: 5,
    }),
  ]);

  const totalRevenue = Number(revenueData._sum.totalAmount ?? 0);

  return {
    totalCars, availableCars, bookedCars,
    totalUsers, totalBookings, pendingBookings,
    totalRevenue, recentBookings: serializeDecimals(recentBookings), topCars,
  };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    redirect("/");
  }

  const data = await getDashboardData();

  const stats = [
    {
      label: "إجمالي الحجوزات",
      value: data.totalBookings,
      icon: Calendar,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      label: "الإيرادات",
      value: formatPrice(data.totalRevenue),
      icon: DollarSign,
      color: "bg-green-500",
      change: "+8%",
    },
    {
      label: "العملاء",
      value: data.totalUsers,
      icon: Users,
      color: "bg-purple-500",
      change: "+5%",
    },
    {
      label: "سيارات متاحة",
      value: data.availableCars,
      icon: Car,
      color: "bg-primary-600",
      change: `${data.availableCars}/${data.totalCars}`,
    },
    {
      label: "حجوزات معلقة",
      value: data.pendingBookings,
      icon: Clock,
      color: "bg-amber-500",
      urgent: data.pendingBookings > 0,
    },
    {
      label: "سيارات محجوزة",
      value: data.bookedCars,
      icon: TrendingUp,
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm mt-1">مرحباً بك، {session.user?.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border ${stat.urgent ? "border-amber-200 bg-amber-50" : "border-gray-100"}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {stat.urgent && (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
                {stat.change && !stat.urgent && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-dark-950">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "مراجعة الحجوزات المعلقة", href: "/admin/bookings?status=PENDING", icon: Clock, urgent: data.pendingBookings > 0, count: data.pendingBookings },
            { label: "إضافة سيارة جديدة", href: "/admin/cars/new", icon: Car },
            { label: "مراجعة الوثائق", href: "/admin/documents?status=PENDING", icon: CheckCircle },
          ].map((action, i) => (
            <a key={i} href={action.href}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${action.urgent ? "bg-amber-50 border-amber-200 hover:border-amber-400" : "bg-white border-gray-100 hover:border-primary-300"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.urgent ? "bg-amber-100" : "bg-primary-100"}`}>
                <action.icon className={`w-5 h-5 ${action.urgent ? "text-amber-600" : "text-primary-700"}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-dark-950 text-sm">{action.label}</p>
                {action.count !== undefined && action.count > 0 && (
                  <p className="text-amber-600 text-xs">{action.count} بانتظار المراجعة</p>
                )}
              </div>
              <span className="text-gray-300">›</span>
            </a>
          ))}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-bold text-dark-950">أحدث الحجوزات</h2>
            <a href="/admin/bookings" className="text-primary-700 text-sm hover:underline">عرض الكل</a>
          </div>
          <RecentBookingsTable bookings={data.recentBookings} />
        </div>
      </main>
    </div>
  );
}
