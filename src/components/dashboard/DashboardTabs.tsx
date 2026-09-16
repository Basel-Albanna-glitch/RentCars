"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardTabs({ locale }: { locale: string }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  const tabs = [
    { href: `/${locale}/dashboard`, label: t("bookings"), icon: Calendar },
    { href: `/${locale}/dashboard/favorites`, label: t("favorites"), icon: Heart },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all",
              active
                ? "border-primary-700 text-primary-700"
                : "border-transparent text-gray-500 hover:text-dark-950"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
