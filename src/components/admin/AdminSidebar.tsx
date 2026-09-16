"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Car, Calendar, Users, GitBranch,
  Sunset, Tag, FileText, BarChart3, Settings, LogOut,
  ChevronLeft, Star, ShieldCheck
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const menuItems = [
  { href: "/admin", label: "الإحصائيات", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "الحجوزات", icon: Calendar },
  { href: "/admin/cars", label: "السيارات", icon: Car },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/documents", label: "الوثائق", icon: FileText },
  { href: "/admin/seasons", label: "المواسم والأسعار", icon: Sunset },
  { href: "/admin/offers", label: "العروض", icon: Tag },
  { href: "/admin/branches", label: "الفروع", icon: GitBranch },
  { href: "/admin/reports", label: "التقارير", icon: BarChart3 },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

// Only a super admin can reach the system-wide panel.
const superAdminItem = {
  href: "/super-admin",
  label: "لوحة المدير العام",
  icon: ShieldCheck,
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const items =
    session?.user?.role === "SUPER_ADMIN" ? [...menuItems, superAdminItem] : menuItems;

  return (
    <aside className={cn(
      "bg-dark-950 flex flex-col transition-all duration-300 min-h-screen sticky top-0",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">الجنوب رنت كار</p>
              <p className="text-primary-400 text-xs">لوحة الإدارة</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "admin-sidebar-item",
                isActive && "active",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-white/10 space-y-1">
        <Link href="/" className={cn("admin-sidebar-item", collapsed && "justify-center px-2")}>
          <Star className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">الموقع العام</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/ar" })}
          className={cn("admin-sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/10", collapsed && "justify-center px-2")}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
