import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/dashboard`);
  }

  const t = await getTranslations("dashboard");
  const isAr = locale === "ar";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, points: true },
  });

  return (
    <>
      <Navbar />

      <header className="bg-dark-950 pt-32 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-700 rounded-full opacity-10 blur-3xl" />
        <div className="container-wide relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-primary-400 text-sm">{t("welcome")}</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mt-1">
              {user?.name ?? session.user.name}
            </h1>
          </div>

          <Link
            href={`/${locale}/dashboard`}
            className="bg-white/10 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 hover:bg-white/15 transition-colors"
          >
            <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{t("totalPoints")}</p>
              <p className="text-white font-bold text-2xl leading-tight">{user?.points ?? 0}</p>
            </div>
          </Link>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100 sticky top-20 z-30">
        <div className="container-wide">
          <DashboardTabs locale={locale} />
        </div>
      </div>

      <main className="bg-gray-50 py-10 min-h-[40vh]">
        <div className="container-wide">{children}</div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
