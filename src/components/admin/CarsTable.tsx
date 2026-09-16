"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, Users, Fuel, Settings2 } from "lucide-react";
import { formatPrice, getStatusColor } from "@/lib/utils";

interface AdminCar {
  id: string;
  name: string;
  nameAr: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  fuelType: string;
  transmission: string;
  color: string;
  images: string[];
  status: string;
  dailyPrice: any;
  depositAmount: any;
  branch: { name: string; nameAr: string };
}

const statusLabels: Record<string, string> = {
  AVAILABLE: "متاحة",
  BOOKED: "محجوزة",
  MAINTENANCE: "صيانة",
  OUT_OF_SERVICE: "خارج الخدمة",
};

const fuelLabels: Record<string, string> = {
  PETROL: "بنزين",
  DIESEL: "ديزل",
  HYBRID: "هايبرد",
  ELECTRIC: "كهربائي",
};

const transmissionLabels: Record<string, string> = {
  AUTOMATIC: "أوتوماتيك",
  MANUAL: "عادي",
};

export function CarsTable({ cars }: { cars: AdminCar[] }) {
  if (cars.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-4xl mb-3">🚗</p>
        <p className="text-gray-500">لا توجد سيارات مطابقة</p>
        <Link href="/admin/cars/new" className="btn-primary mt-5">
          إضافة سيارة
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-right font-medium px-6 py-3">السيارة</th>
              <th className="text-right font-medium px-6 py-3">المواصفات</th>
              <th className="text-right font-medium px-6 py-3">الفرع</th>
              <th className="text-right font-medium px-6 py-3">السعر اليومي</th>
              <th className="text-right font-medium px-6 py-3">التأمين</th>
              <th className="text-right font-medium px-6 py-3">الحالة</th>
              <th className="text-right font-medium px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cars.map((car) => (
              <tr key={car.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {car.images?.[0] ? (
                        <Image
                          src={car.images[0]}
                          alt={car.nameAr}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xl">🚗</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-dark-950">{car.nameAr}</p>
                      <p className="text-gray-400 text-xs">
                        {car.brand} {car.model} · {car.year}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4 text-gray-600 text-xs">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary-600" />
                      {car.seats}
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-primary-600" />
                      {fuelLabels[car.fuelType] ?? car.fuelType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings2 className="w-3.5 h-3.5 text-primary-600" />
                      {transmissionLabels[car.transmission] ?? car.transmission}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{car.branch.nameAr}</td>
                <td className="px-6 py-4 font-medium text-dark-950">
                  {formatPrice(Number(car.dailyPrice))}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {formatPrice(Number(car.depositAmount))}
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${getStatusColor(car.status)}`}>
                    {statusLabels[car.status] ?? car.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/cars/${car.id}`}
                    className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-600 text-xs font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    تعديل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
