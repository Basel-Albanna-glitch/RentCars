import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff, branchFilter } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DocumentReview } from "@/components/admin/DocumentReview";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import type { Prisma } from "@prisma/client";

const statusFilters = [
  { label: "بانتظار المراجعة", value: "PENDING" },
  { label: "مقبولة", value: "APPROVED" },
  { label: "مرفوضة", value: "REJECTED" },
  { label: "مطلوب إعادة رفع", value: "REUPLOAD_REQUIRED" },
  { label: "الكل", value: "" },
];

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireStaff();
  const params = await searchParams;

  // Reviewing pending uploads is the job, so that is the default view.
  const status = params.status ?? "PENDING";
  const branchId = branchFilter(session);

  const where: Prisma.DocumentWhereInput = {
    ...(status ? { status: status as never } : {}),
    ...(branchId ? { booking: { branchId } } : {}),
  };

  const documents = await prisma.document.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          startDate: true,
          endDate: true,
          status: true,
          car: { select: { nameAr: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  // Group by booking so a reviewer sees one customer's papers together.
  const byBooking = new Map<string, typeof documents>();
  for (const doc of documents) {
    const list = byBooking.get(doc.bookingId) ?? [];
    list.push(doc);
    byBooking.set(doc.bookingId, list);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">الوثائق</h1>
          <p className="text-gray-500 text-sm mt-1">{documents.length} وثيقة في هذه القائمة</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
          {statusFilters.map((f) => (
            <a
              key={f.value || "all"}
              href={f.value ? `/admin/documents?status=${f.value}` : "/admin/documents?status="}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                status === f.value
                  ? "bg-primary-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد وثائق في هذه الحالة</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(byBooking.entries()).map(([bookingId, docs]) => {
              const booking = docs[0].booking;
              return (
                <section
                  key={bookingId}
                  className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                    <div>
                      <Link
                        href={`/admin/bookings/${bookingId}`}
                        className="font-bold text-primary-700 hover:underline"
                      >
                        {booking.bookingNumber}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {docs[0].user.name} · {booking.car.nameAr}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map((doc) => (
                      <DocumentReview key={doc.id} document={doc} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
