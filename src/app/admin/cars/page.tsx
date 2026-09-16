import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CarsTable } from "@/components/admin/CarsTable";
import { BranchFilter } from "@/components/admin/BranchFilter";
import { Plus } from "lucide-react";
import { serializeDecimals } from "@/lib/utils";

export default async function AdminCarsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; branch?: string }>;
}) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    redirect("/");
  }

  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const limit = 12;
  const status = params.status;
  const branchId = params.branch;

  const isAdmin = (session.user as any).role === "ADMIN";
  const userBranchId = (session.user as any).branchId;

  const where: any = {};
  if (status) where.status = status;
  if (isAdmin && userBranchId) where.branchId = userBranchId;
  else if (branchId) where.branchId = branchId;

  const [cars, total, branches] = await Promise.all([
    prisma.car.findMany({
      where,
      include: { branch: { select: { name: true, nameAr: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.car.count({ where }),
    prisma.branch.findMany({ select: { id: true, name: true, nameAr: true } }),
  ]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark-950">إدارة السيارات</h1>
            <p className="text-gray-500 text-sm mt-1">{total} سيارة في النظام</p>
          </div>
          <a href="/admin/cars/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            إضافة سيارة
          </a>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
          {[
            { label: "الكل", value: "" },
            { label: "متاحة", value: "AVAILABLE" },
            { label: "محجوزة", value: "BOOKED" },
            { label: "صيانة", value: "MAINTENANCE" },
            { label: "خارج الخدمة", value: "OUT_OF_SERVICE" },
          ].map((f) => (
            <a
              key={f.value}
              href={f.value ? `/admin/cars?status=${f.value}` : "/admin/cars"}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                (status ?? "") === f.value
                  ? "bg-primary-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </a>
          ))}

          {/* Branch filter (super admin) */}
          {!isAdmin && (
            <BranchFilter branches={branches} selected={branchId} />
          )}
        </div>

        {/* Cars Table */}
        <CarsTable cars={serializeDecimals(cars)} />

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
              <a
                key={i}
                href={`/admin/cars?page=${i + 1}${status ? `&status=${status}` : ""}`}
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
