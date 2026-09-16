import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CarForm } from "@/components/admin/CarForm";
import { ChevronLeft } from "lucide-react";

export default async function NewCarPage() {
  const session = await requireStaff();

  // A branch admin can only add cars to their own branch.
  const branches = await prisma.branch.findMany({
    where:
      session.user.role === "ADMIN" && session.user.branchId
        ? { id: session.user.branchId }
        : { isActive: true },
    select: { id: true, nameAr: true },
    orderBy: { createdAt: "asc" },
  });

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

        <h1 className="text-2xl font-bold text-dark-950 mb-8">إضافة سيارة جديدة</h1>

        <CarForm
          branches={branches}
          mode="create"
          canDelete={false}
          initial={{
            name: "",
            nameAr: "",
            brand: "",
            model: "",
            year: new Date().getFullYear(),
            seats: 5,
            fuelType: "PETROL",
            fuelConsumption: "",
            transmission: "AUTOMATIC",
            color: "",
            colorAr: "",
            description: "",
            descriptionAr: "",
            images: [],
            status: "AVAILABLE",
            dailyPrice: 0,
            weeklyPrice: null,
            monthlyPrice: null,
            depositAmount: 0,
            branchId: branches[0]?.id ?? "",
          }}
        />
      </main>
    </div>
  );
}
