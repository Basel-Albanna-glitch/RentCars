import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { formatDate } from "@/lib/utils";
import { Info, Shield, Building2, Sunset, Star, Clock } from "lucide-react";

/**
 * Business rules that live in code today rather than in a settings table. They
 * are shown here so an operator can see what the system is enforcing, with the
 * file that owns each one.
 */
const businessRules = [
  {
    icon: Clock,
    label: "الحد الأدنى لمدة الحجز",
    value: "3 أيام",
    source: "src/components/booking/BookingWizard.tsx",
  },
  {
    icon: Sunset,
    label: "الحد الأدنى خلال المواسم",
    value: "يُحدَّد لكل موسم على حدة",
    source: "إدارة المواسم",
    href: "/admin/seasons",
  },
  {
    icon: Star,
    label: "احتساب النقاط",
    value: "كل 1 دينار = 10 نقاط",
    source: "src/lib/utils.ts",
  },
  {
    icon: Star,
    label: "استبدال النقاط",
    value: "كل 100 نقطة = خصم 1 دينار",
    source: "src/lib/utils.ts",
  },
];

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "مدير عام",
  ADMIN: "مدير فرع",
};

export default async function AdminSettingsPage() {
  const session = await requireStaff();

  const [me, staff] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { branch: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      include: { branch: { select: { nameAr: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const integrations = [
    { label: "Cloudinary (رفع الصور)", ready: Boolean(process.env.CLOUDINARY_API_KEY) },
    { label: "Stripe (الدفع)", ready: Boolean(process.env.STRIPE_SECRET_KEY) },
    { label: "Resend (البريد)", ready: Boolean(process.env.RESEND_API_KEY) },
    { label: "Google OAuth (تسجيل الدخول)", ready: Boolean(process.env.GOOGLE_CLIENT_ID) },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-950">الإعدادات</h1>
          <p className="text-gray-500 text-sm mt-1">حسابك وقواعد العمل المطبّقة في النظام</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
          {/* Account */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-dark-950 mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-700" />
              حسابك
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">الاسم</dt>
                <dd className="text-dark-950 font-medium">{me?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">البريد</dt>
                <dd className="text-dark-950" dir="ltr">
                  {me?.email}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">الصلاحية</dt>
                <dd>
                  <span className="badge bg-primary-100 text-primary-700">
                    {roleLabels[session.user.role]}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">الفرع</dt>
                <dd className="text-dark-950">{me?.branch?.nameAr ?? "كل الفروع"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">تاريخ الإنشاء</dt>
                <dd className="text-dark-950">{me ? formatDate(me.createdAt) : "—"}</dd>
              </div>
            </dl>
          </section>

          {/* Integrations */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-dark-950 mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-700" />
              الخدمات الخارجية
            </h2>
            <ul className="space-y-3 text-sm">
              {integrations.map((integration) => (
                <li key={integration.label} className="flex items-center justify-between">
                  <span className="text-gray-600">{integration.label}</span>
                  <span
                    className={`badge ${
                      integration.ready
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {integration.ready ? "مفعّلة" : "غير مهيّأة"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-5">
              تُهيَّأ هذه الخدمات عبر متغيرات البيئة في ملف <code>.env.local</code>.
            </p>
          </section>

          {/* Business rules */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
            <h2 className="font-bold text-dark-950 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary-700" />
              قواعد العمل
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              هذه القواعد مضبوطة في الكود حالياً، ما عدا المواسم فهي قابلة للتعديل من لوحة
              التحكم.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {businessRules.map((rule) => (
                <div
                  key={rule.label}
                  className="flex items-start gap-4 border border-gray-100 rounded-xl p-4"
                >
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <rule.icon className="w-5 h-5 text-primary-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">{rule.label}</p>
                    <p className="font-medium text-dark-950">{rule.value}</p>
                    {rule.href ? (
                      <Link href={rule.href} className="text-primary-700 text-xs hover:underline">
                        {rule.source}
                      </Link>
                    ) : (
                      <p className="text-gray-400 text-xs font-mono mt-0.5 truncate" dir="ltr">
                        {rule.source}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Staff */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
            <h2 className="font-bold text-dark-950 mb-5">حسابات الإدارة ({staff.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-right font-medium px-4 py-3">الاسم</th>
                    <th className="text-right font-medium px-4 py-3">البريد</th>
                    <th className="text-right font-medium px-4 py-3">الصلاحية</th>
                    <th className="text-right font-medium px-4 py-3">الفرع</th>
                    <th className="text-right font-medium px-4 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3 font-medium text-dark-950">{member.name}</td>
                      <td className="px-4 py-3 text-gray-600" dir="ltr">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-primary-100 text-primary-700">
                          {roleLabels[member.role] ?? member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {member.branch?.nameAr ?? "كل الفروع"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`badge ${
                            member.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {member.isActive ? "نشط" : "موقوف"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
