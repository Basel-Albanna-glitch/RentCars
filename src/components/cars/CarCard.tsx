"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Fuel, Settings2, Heart } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { CarImage } from "./CarImage";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";

interface CarCardProps {
  car: {
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
  };
  locale: string;
  isFavorite?: boolean;
}

const fuelLabels: Record<string, Record<string, string>> = {
  ar: { PETROL: "بنزين", DIESEL: "ديزل", HYBRID: "هايبرد", ELECTRIC: "كهربائي" },
  en: { PETROL: "Petrol", DIESEL: "Diesel", HYBRID: "Hybrid", ELECTRIC: "Electric" },
};

const transmissionLabels: Record<string, Record<string, string>> = {
  ar: { AUTOMATIC: "أوتوماتيك", MANUAL: "عادي" },
  en: { AUTOMATIC: "Automatic", MANUAL: "Manual" },
};

export function CarCard({ car, locale, isFavorite = false }: CarCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFav, setIsFav] = useState(isFavorite);
  const [pending, startTransition] = useTransition();

  const name = locale === "ar" ? car.nameAr : car.name;
  const branchName = locale === "ar" ? car.branch.nameAr : car.branch.name;
  const price = Number(car.dailyPrice);

  const statusConfig = {
    AVAILABLE: { label: locale === "ar" ? "متاح" : "Available", cls: "badge-available" },
    BOOKED: { label: locale === "ar" ? "محجوز" : "Booked", cls: "badge-booked" },
    MAINTENANCE: { label: locale === "ar" ? "صيانة" : "Maintenance", cls: "badge-pending" },
    OUT_OF_SERVICE: { label: locale === "ar" ? "خارج الخدمة" : "Out of Service", cls: "" },
  };

  const status = statusConfig[car.status as keyof typeof statusConfig] ?? { label: car.status, cls: "" };

  async function toggleFavorite() {
    if (!session) {
      router.push(`/${locale}/login?callbackUrl=/${locale}/cars/${car.id}`);
      return;
    }

    // Flip immediately, roll back if the request fails.
    const next = !isFav;
    setIsFav(next);

    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: car.id }),
      });
      if (!res.ok) throw new Error("Request failed");
      startTransition(() => router.refresh());
    } catch {
      setIsFav(!next);
      toast.error(locale === "ar" ? "تعذر تحديث المفضلة" : "Could not update favorites");
    }
  }

  return (
    <div className="car-card card group">
      {/* Image */}
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        <CarImage
          src={car.images[0]}
          alt={name}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="group-hover:scale-105 transition-transform duration-500"
        />

        {/* Overlay top */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className={cn("badge", status.cls)}>{status.label}</span>
          <button
            onClick={toggleFavorite}
            disabled={pending}
            aria-label={locale === "ar" ? "إضافة للمفضلة" : "Add to favorites"}
            className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart className={cn("w-4 h-4 transition-colors", isFav ? "fill-red-500 text-red-500" : "text-gray-400")} />
          </button>
        </div>

        {/* Price tag */}
        <div className="absolute bottom-3 right-3 bg-dark-950/90 backdrop-blur rounded-xl px-3 py-1.5">
          <span className="text-white font-bold text-lg">{formatPrice(price)}</span>
          <span className="text-gray-400 text-xs"> /{locale === "ar" ? "يوم" : "day"}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-dark-950 text-lg leading-tight">{name}</h3>
          <span className="text-sm text-gray-400 flex-shrink-0">{car.year}</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {car.brand} {car.model} · {branchName}
        </p>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="w-4 h-4 text-primary-600" />
            <span className="text-sm">{car.seats}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Fuel className="w-4 h-4 text-primary-600" />
            <span className="text-xs">
              {(fuelLabels[locale] ?? fuelLabels.en)[car.fuelType] ?? car.fuelType}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Settings2 className="w-4 h-4 text-primary-600" />
            <span className="text-xs">
              {(transmissionLabels[locale] ?? transmissionLabels.en)[car.transmission] ?? car.transmission}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          <Link
            href={`/${locale}/cars/${car.id}`}
            className="flex-1 btn-secondary text-sm py-2.5 text-center"
          >
            {locale === "ar" ? "التفاصيل" : "Details"}
          </Link>
          {car.status === "AVAILABLE" && (
            <Link
              href={`/${locale}/booking/${car.id}`}
              className="flex-1 btn-primary text-sm py-2.5 text-center"
            >
              {locale === "ar" ? "احجز الآن" : "Book Now"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
