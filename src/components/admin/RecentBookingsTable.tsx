"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDate, formatPrice, getStatusColor } from "@/lib/utils";

interface RecentBooking {
  id: string;
  bookingNumber: string;
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number;
  totalAmount: any;
  status: string;
  car: { name: string; nameAr: string; images: string[] };
  user: { name: string | null; email: string };
  branch: { name: string };
}

const statusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

export function RecentBookingsTable({ bookings }: { bookings: RecentBooking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-gray-500">لا توجد حجوزات بعد</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-right font-medium px-6 py-3">رقم الحجز</th>
            <th className="text-right font-medium px-6 py-3">السيارة</th>
            <th className="text-right font-medium px-6 py-3">العميل</th>
            <th className="text-right font-medium px-6 py-3">الفترة</th>
            <th className="text-right font-medium px-6 py-3">المبلغ</th>
            <th className="text-right font-medium px-6 py-3">الحالة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="font-medium text-primary-700 hover:underline"
                >
                  {b.bookingNumber}
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {b.car.images?.[0] ? (
                      <Image
                        src={b.car.images[0]}
                        alt={b.car.nameAr}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center">🚗</span>
                    )}
                  </div>
                  <span className="font-medium text-dark-950">{b.car.nameAr}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-dark-950">{b.user.name ?? "—"}</p>
                <p className="text-gray-400 text-xs">{b.user.email}</p>
              </td>
              <td className="px-6 py-4 text-gray-600">
                <p>{formatDate(b.startDate)} ← {formatDate(b.endDate)}</p>
                <p className="text-gray-400 text-xs">{b.totalDays} أيام</p>
              </td>
              <td className="px-6 py-4 font-medium text-dark-950">
                {formatPrice(Number(b.totalAmount))}
              </td>
              <td className="px-6 py-4">
                <span className={`badge ${getStatusColor(b.status)}`}>
                  {statusLabels[b.status] ?? b.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
