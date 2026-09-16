import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CarCard } from "@/components/cars/CarCard";
import { serializeDecimals } from "@/lib/utils";
import { Heart } from "lucide-react";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("dashboard");
  const isAr = locale === "ar";

  const favorites = await prisma.favorite.findMany({
    where: { userId: session!.user.id },
    include: {
      car: { include: { branch: { select: { name: true, nameAr: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (favorites.length === 0) {
    return (
      <div className="card p-16 text-center">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-6">
          {isAr ? "لم تضف أي سيارة إلى المفضلة بعد" : "You have not saved any cars yet"}
        </p>
        <Link href={`/${locale}/cars`} className="btn-primary">
          {t("bookNow")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {serializeDecimals(favorites).map((fav) => (
        <CarCard key={fav.id} car={fav.car} locale={locale} isFavorite />
      ))}
    </div>
  );
}
