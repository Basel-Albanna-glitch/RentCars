"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarFiltersProps {
  locale: string;
  cities: string[];
  selected: {
    city?: string;
    from?: string;
    to?: string;
    seats?: string;
    transmission?: string;
    fuelType?: string;
    sort?: string;
  };
}

const cityLabels: Record<string, Record<string, string>> = {
  ar: { Amman: "عمان", Aqaba: "العقبة", Irbid: "إربد", Petra: "البتراء" },
};

export function CarFilters({ locale, cities, selected }: CarFiltersProps) {
  const t = useTranslations("cars.filters");
  const router = useRouter();
  const isRTL = locale === "ar";
  const [open, setOpen] = useState(false);

  // Every control writes straight into the URL, so the server component stays
  // the single source of truth for what is on screen.
  function apply(key: string, value: string) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(selected)) {
      if (v && k !== key) qs.set(k, v);
    }
    if (value) qs.set(key, value);
    router.push(`/${locale}/cars${qs.toString() ? `?${qs}` : ""}`);
  }

  const hasFilters = Object.entries(selected).some(
    ([k, v]) => v && k !== "sort" && k !== "page"
  );

  const groups: { key: string; label: string; options: { value: string; label: string }[] }[] = [
    {
      key: "city",
      label: isRTL ? "الفرع" : "Branch",
      options: cities.map((c) => ({
        value: c,
        label: cityLabels[locale]?.[c] ?? c,
      })),
    },
    {
      key: "transmission",
      label: t("transmission"),
      options: [
        { value: "AUTOMATIC", label: t("automatic") },
        { value: "MANUAL", label: t("manual") },
      ],
    },
    {
      key: "fuelType",
      label: t("fuelType"),
      options: [
        { value: "PETROL", label: t("petrol") },
        { value: "DIESEL", label: t("diesel") },
        { value: "HYBRID", label: t("hybrid") },
        { value: "ELECTRIC", label: t("electric") },
      ],
    },
    {
      key: "seats",
      label: t("seats"),
      options: [
        { value: "4", label: "4+" },
        { value: "5", label: "5+" },
        { value: "7", label: "7+" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden btn-secondary w-full"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {t("all")}
      </button>

      <aside
        className={cn(
          "card p-5 space-y-6 lg:sticky lg:top-24",
          open ? "block" : "hidden lg:block"
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-dark-950">
            {isRTL ? "تصفية النتائج" : "Filters"}
          </h2>
          {hasFilters && (
            <button
              onClick={() => router.push(`/${locale}/cars`)}
              className="flex items-center gap-1 text-xs text-primary-700 hover:underline"
            >
              <X className="w-3 h-3" />
              {isRTL ? "مسح" : "Clear"}
            </button>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500">
            {isRTL ? "فترة الاستئجار" : "Rental period"}
          </p>
          <input
            type="date"
            value={selected.from ?? ""}
            onChange={(e) => apply("from", e.target.value)}
            className="input-field py-2 text-sm"
          />
          <input
            type="date"
            value={selected.to ?? ""}
            min={selected.from}
            onChange={(e) => apply("to", e.target.value)}
            className="input-field py-2 text-sm"
          />
          {selected.from && selected.to && (
            <p className="text-xs text-green-600">
              {isRTL
                ? "يتم عرض السيارات المتاحة في هذه الفترة فقط"
                : "Showing only cars free for these dates"}
            </p>
          )}
        </div>

        {groups.map((group) => (
          <div key={group.key} className="space-y-2">
            <p className="text-xs font-medium text-gray-500">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const active =
                  selected[group.key as keyof typeof selected] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => apply(group.key, active ? "" : opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      active
                        ? "bg-primary-700 border-primary-700 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-primary-300"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sort */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">{t("sortBy")}</p>
          <select
            value={selected.sort ?? "newest"}
            onChange={(e) => apply("sort", e.target.value)}
            className="input-field py-2 text-sm"
          >
            <option value="newest">{t("newest")}</option>
            <option value="price_asc">{t("priceLow")}</option>
            <option value="price_desc">{t("priceHigh")}</option>
          </select>
        </div>
      </aside>
    </>
  );
}
