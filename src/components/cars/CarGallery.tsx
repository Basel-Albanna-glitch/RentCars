"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CarImage } from "./CarImage";

interface CarGalleryProps {
  images: string[];
  alt: string;
  locale: string;
  status: string;
}

const statusLabels: Record<string, Record<string, string>> = {
  ar: { AVAILABLE: "متاح", BOOKED: "محجوز", MAINTENANCE: "صيانة", OUT_OF_SERVICE: "خارج الخدمة" },
  en: { AVAILABLE: "Available", BOOKED: "Booked", MAINTENANCE: "Maintenance", OUT_OF_SERVICE: "Out of Service" },
};

const statusClasses: Record<string, string> = {
  AVAILABLE: "badge-available",
  BOOKED: "badge-booked",
  MAINTENANCE: "badge-pending",
};

export function CarGallery({ images, alt, locale, status }: CarGalleryProps) {
  const [active, setActive] = useState(0);
  const labels = statusLabels[locale] ?? statusLabels.en;

  return (
    <div className="space-y-3">
      <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-gray-100">
        <CarImage
          src={images[active]}
          alt={alt}
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
          fallbackSize="text-8xl"
        />

        <span className={cn("badge absolute top-4 left-4", statusClasses[status] ?? "")}>
          {labels[status] ?? status}
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                i === active ? "border-primary-700" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <CarImage
                src={src}
                alt={`${alt} ${i + 1}`}
                sizes="96px"
                fallbackSize="text-2xl"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
