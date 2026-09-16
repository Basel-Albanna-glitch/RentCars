import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BranchesManager } from "@/components/admin/BranchesManager";

export default async function AdminBranchesPage() {
  const session = await requireStaff();
  const canEdit = session.user.role === "SUPER_ADMIN";

  // A branch admin sees only the branch they run.
  const branches = await prisma.branch.findMany({
    where:
      session.user.role === "ADMIN" && session.user.branchId
        ? { id: session.user.branchId }
        : {},
    include: {
      _count: { select: { cars: true, admins: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">الفروع</h1>
          <p className="text-gray-500 text-sm mt-1">
            {branches.length} فرع
            {!canEdit && " (العرض فقط — التعديل من صلاحية المدير العام)"}
          </p>
        </div>

        <BranchesManager
          canEdit={canEdit}
          branches={branches.map((b) => ({
            id: b.id,
            name: b.name,
            nameAr: b.nameAr,
            address: b.address,
            addressAr: b.addressAr,
            city: b.city,
            lat: Number(b.lat),
            lng: Number(b.lng),
            phone: b.phone,
            whatsapp: b.whatsapp,
            email: b.email,
            emergencyPhone: b.emergencyPhone,
            isActive: b.isActive,
            carCount: b._count.cars,
            adminCount: b._count.admins,
          }))}
        />
      </main>
    </div>
  );
}
