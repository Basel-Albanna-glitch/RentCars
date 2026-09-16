import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BookingActions } from "@/components/admin/BookingActions";
import { DocumentReview } from "@/components/admin/DocumentReview";
import { CarImage } from "@/components/cars/CarImage";
import { formatDate, formatPrice, getStatusColor, serializeDecimals } from "@/lib/utils";
import { ChevronLeft, Mail, Phone, MapPin, Truck, Star } from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

const paymentLabels: Record<string, string> = {
  VISA: "فيزا",
  MASTERCARD: "ماستركارد",
  CLIQ: "كليك",
  CASH: "نقداً",
};

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;

  const raw = await prisma.booking.findUnique({
    where: { id },
    include: {
      car: { include: { branch: true } },
      user: true,
      branch: true,
      documents: true,
      payments: true,
    },
  });

  if (!raw) notFound();

  // A branch admin must not read another branch's booking.
  if (
    session.user.role === "ADMIN" &&
    session.user.branchId &&
    session.user.branchId !== raw.branchId
  ) {
    notFound();
  }

  const booking = serializeDecimals(raw);

  const money = [
    { label: "التكلفة الأساسية", value: Number(booking.baseAmount) },
    ...(Number(booking.seasonMultiplier) > 1
      ? [
          {
            label: `رسوم الموسم (×${Number(booking.seasonMultiplier)})`,
            value: Number(booking.baseAmount) * (Number(booking.seasonMultiplier) - 1),
          },
        ]
      : []),
    ...(Number(booking.discountAmount) > 0
      ? [{ label: "خصم النقاط", value: -Number(booking.discountAmount) }]
      : []),
    { label: "التأمين", value: Number(booking.depositAmount) },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          كل الحجوزات
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark-950">حجز {booking.bookingNumber}</h1>
            <p className="text-gray-500 text-sm mt-1">
              أُنشئ في {formatDate(booking.createdAt)}
            </p>
          </div>
          <span className={`badge ${getStatusColor(booking.status)}`}>
            {statusLabels[booking.status] ?? booking.status}
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-6">
            {/* Car */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-dark-950 mb-4">السيارة</h2>
              <div className="flex gap-4">
                <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <CarImage
                    src={booking.car.images?.[0]}
                    alt={booking.car.nameAr}
                    sizes="128px"
                    fallbackSize="text-3xl"
                  />
                </div>
                <div className="text-sm space-y-1">
                  <Link
                    href={`/admin/cars/${booking.car.id}`}
                    className="font-bold text-dark-950 hover:text-primary-700"
                  >
                    {booking.car.nameAr}
                  </Link>
                  <p className="text-gray-500">
                    {booking.car.brand} {booking.car.model} · {booking.car.year}
                  </p>
                  <p className="text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" />
                    {booking.branch.nameAr}
                  </p>
                </div>
              </div>

              <dl className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 text-sm">
                <div>
                  <dt className="text-gray-400 text-xs">الاستلام</dt>
                  <dd className="font-medium text-dark-950">{formatDate(booking.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs">التسليم</dt>
                  <dd className="font-medium text-dark-950">{formatDate(booking.endDate)}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs">المدة</dt>
                  <dd className="font-medium text-dark-950">{booking.totalDays} أيام</dd>
                </div>
              </dl>

              {booking.needsDelivery && (
                <p className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 text-amber-800">
                  <Truck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  توصيل مطلوب: {booking.deliveryAddress ?? "لم يُحدَّد عنوان"}
                </p>
              )}
            </section>

            {/* Customer */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-dark-950 mb-4">العميل</h2>
              <div className="space-y-3 text-sm">
                <p className="font-medium text-dark-950">{booking.user.name}</p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-primary-600" />
                  <span dir="ltr">{booking.user.email}</span>
                </p>
                {booking.user.phone && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-primary-600" />
                    <span dir="ltr">{booking.user.phone}</span>
                  </p>
                )}
                <p className="flex items-center gap-2 text-gray-600">
                  <Star className="w-4 h-4 text-amber-500" />
                  رصيد النقاط: {booking.user.points}
                </p>
              </div>
            </section>

            {/* Documents */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-dark-950 mb-4">
                الوثائق ({booking.documents.length})
              </h2>
              {booking.documents.length === 0 ? (
                <p className="text-gray-400 text-sm">لم يرفع العميل أي وثائق</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {booking.documents.map((doc) => (
                    <DocumentReview key={doc.id} document={doc} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: money + actions */}
          <aside className="space-y-6 lg:sticky lg:top-6">
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-dark-950 mb-4">التكلفة</h2>
              <div className="space-y-2.5 text-sm">
                {money.map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="text-dark-950">{formatPrice(row.value)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary-700 text-lg">
                    {formatPrice(Number(booking.totalAmount))}
                  </span>
                </div>
              </div>

              {booking.payments.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-sm">
                  <p className="text-gray-400 text-xs">الدفع</p>
                  {booking.payments.map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span className="text-gray-600">
                        {paymentLabels[p.method] ?? p.method}
                      </span>
                      <span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">نقاط مستخدمة</span>
                  <span className="text-dark-950">{booking.pointsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">نقاط تُمنح عند الإكمال</span>
                  <span className="text-amber-600">+{booking.pointsEarned}</span>
                </div>
              </div>
            </section>

            <BookingActions
              bookingId={booking.id}
              status={booking.status}
              adminNote={booking.adminNote}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
