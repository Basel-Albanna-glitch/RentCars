import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CustomerSearch } from "@/components/admin/CustomerSearch";
import { formatDate, formatPrice } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;

  const q = params.q?.trim();
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);

  const where: Prisma.UserWhereInput = {
    role: "USER",
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        points: true,
        isActive: true,
        createdAt: true,
        _count: { select: { bookings: true } },
        bookings: {
          where: { status: { in: ["APPROVED", "COMPLETED"] } },
          select: { totalAmount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark-950">العملاء</h1>
            <p className="text-gray-500 text-sm mt-1">{total} عميل مسجّل</p>
          </div>
          <CustomerSearch initialQuery={q ?? ""} />
        </div>

        {customers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد عملاء مطابقون</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-right font-medium px-6 py-3">العميل</th>
                    <th className="text-right font-medium px-6 py-3">الهاتف</th>
                    <th className="text-right font-medium px-6 py-3">الحجوزات</th>
                    <th className="text-right font-medium px-6 py-3">إجمالي الإنفاق</th>
                    <th className="text-right font-medium px-6 py-3">النقاط</th>
                    <th className="text-right font-medium px-6 py-3">مسجّل منذ</th>
                    <th className="text-right font-medium px-6 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => {
                    const spend = customer.bookings.reduce(
                      (sum, b) => sum + Number(b.totalAmount),
                      0
                    );

                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-dark-950">{customer.name}</p>
                          <p className="text-gray-400 text-xs" dir="ltr">
                            {customer.email}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-600" dir="ltr">
                          {customer.phone ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          {customer._count.bookings > 0 ? (
                            <Link
                              href={`/admin/bookings?customer=${customer.id}`}
                              className="text-primary-700 hover:underline"
                            >
                              {customer._count.bookings}
                            </Link>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-dark-950">
                          {formatPrice(spend)}
                        </td>
                        <td className="px-6 py-4 text-amber-600 font-medium">
                          {customer.points}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`badge ${
                              customer.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {customer.isActive ? "نشط" : "موقوف"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <a
                key={i}
                href={`/admin/customers?page=${i + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
