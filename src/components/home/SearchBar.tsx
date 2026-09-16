"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Calendar, MapPin, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  locale: string;
}

const cities = [
  { value: "", ar: "كل الفروع", en: "All Branches" },
  { value: "Amman", ar: "عمان", en: "Amman" },
  { value: "Aqaba", ar: "العقبة", en: "Aqaba" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function SearchBar({ locale }: SearchBarProps) {
  const t = useTranslations("home.hero");
  const router = useRouter();
  const isRTL = locale === "ar";

  const [city, setCity] = useState("");
  const [pickup, setPickup] = useState(today());
  const [dropoff, setDropoff] = useState("");
  const [seats, setSeats] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (pickup) params.set("from", pickup);
    if (dropoff) params.set("to", dropoff);
    if (seats) params.set("seats", seats);

    const qs = params.toString();
    router.push(`/${locale}/cars${qs ? `?${qs}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 space-y-4"
    >
      <div>
        <h3 className="font-bold text-dark-950 text-lg">
          {t("searchPlaceholder")}
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          {isRTL
            ? "اختر الفرع والتواريخ لعرض السيارات المتاحة"
            : "Pick a branch and your dates to see available cars"}
        </p>
      </div>

      {/* Branch */}
      <label className="block">
        <span className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary-600" />
          {isRTL ? "الفرع" : "Branch"}
        </span>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="input-field"
        >
          {cities.map((c) => (
            <option key={c.value} value={c.value}>
              {isRTL ? c.ar : c.en}
            </option>
          ))}
        </select>
      </label>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary-600" />
            {t("pickupDate")}
          </span>
          <input
            type="date"
            value={pickup}
            min={today()}
            onChange={(e) => setPickup(e.target.value)}
            className="input-field"
          />
        </label>

        <label className="block">
          <span className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary-600" />
            {t("returnDate")}
          </span>
          <input
            type="date"
            value={dropoff}
            min={pickup || today()}
            onChange={(e) => setDropoff(e.target.value)}
            className="input-field"
          />
        </label>
      </div>

      {/* Seats */}
      <label className="block">
        <span className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
          <Users className="w-3.5 h-3.5 text-primary-600" />
          {isRTL ? "عدد المقاعد" : "Seats"}
        </span>
        <div className="grid grid-cols-4 gap-2">
          {["", "4", "5", "7"].map((s) => (
            <button
              key={s || "any"}
              type="button"
              onClick={() => setSeats(s)}
              className={cn(
                "py-2.5 rounded-lg text-sm font-medium border transition-all",
                seats === s
                  ? "bg-primary-700 border-primary-700 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-primary-300"
              )}
            >
              {s ? `${s}+` : isRTL ? "الكل" : "Any"}
            </button>
          ))}
        </div>
      </label>

      <button type="submit" className="btn-primary w-full py-4 text-base">
        <Search className="w-5 h-5" />
        {t("searchBtn")}
      </button>
    </form>
  );
}
