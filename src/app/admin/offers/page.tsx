import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { OffersManager } from "@/components/admin/OffersManager";

export default async function AdminOffersPage() {
  const session = await requireStaff();
  const canEdit = session.user.role === "SUPER_ADMIN";

  const offers = await prisma.offer.findMany({ orderBy: { startDate: "desc" } });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">العروض</h1>
          <p className="text-gray-500 text-sm mt-1">
            {offers.length} عرض
            {!canEdit && " (العرض فقط — التعديل من صلاحية المدير العام)"}
          </p>
        </div>

        <OffersManager
          canEdit={canEdit}
          offers={offers.map((o) => ({
            id: o.id,
            title: o.title,
            titleAr: o.titleAr,
            descriptionAr: o.descriptionAr,
            discountPercent: o.discountPercent,
            discountAmount: o.discountAmount ? Number(o.discountAmount) : null,
            code: o.code,
            startDate: o.startDate.toISOString(),
            endDate: o.endDate.toISOString(),
            isActive: o.isActive,
            usageLimit: o.usageLimit,
            usageCount: o.usageCount,
          }))}
        />
      </main>
    </div>
  );
}
