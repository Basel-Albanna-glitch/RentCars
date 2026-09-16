import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SeasonsManager } from "@/components/admin/SeasonsManager";

export default async function AdminSeasonsPage() {
  const session = await requireStaff();
  const canEdit = session.user.role === "SUPER_ADMIN";

  const seasons = await prisma.season.findMany({ orderBy: { startDate: "asc" } });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">المواسم والأسعار</h1>
          <p className="text-gray-500 text-sm mt-1">
            المواسم ترفع أسعار كل السيارات وترفع الحد الأدنى لمدة الحجز خلال فترتها.
            {!canEdit && " (العرض فقط — التعديل من صلاحية المدير العام)"}
          </p>
        </div>

        <SeasonsManager
          canEdit={canEdit}
          seasons={seasons.map((s) => ({
            id: s.id,
            name: s.name,
            nameAr: s.nameAr,
            startDate: s.startDate.toISOString(),
            endDate: s.endDate.toISOString(),
            priceMultiplier: Number(s.priceMultiplier),
            minDays: s.minDays,
            isActive: s.isActive,
            descriptionAr: s.descriptionAr,
          }))}
        />
      </main>
    </div>
  );
}
