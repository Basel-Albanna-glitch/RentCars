import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CarCard } from "@/components/cars/CarCard";
import { SearchBar } from "@/components/home/SearchBar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeDecimals } from "@/lib/utils";
import { Shield, Clock, MapPin, Award, Star, ChevronRight, Zap } from "lucide-react";

async function getFeaturedCars() {
  const cars = await prisma.car.findMany({
    where: { status: "AVAILABLE" },
    include: { branch: { select: { name: true, nameAr: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return serializeDecimals(cars);
}

/** The ids the signed-in visitor has saved, so the hearts start filled. */
async function getFavoriteCarIds() {
  const session = await auth();
  if (!session) return new Set<string>();

  const rows = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { carId: true },
  });
  return new Set(rows.map((r) => r.carId));
}

async function getStats() {
  const [carCount, userCount, bookingCount] = await Promise.all([
    prisma.car.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
  ]);
  return { carCount, userCount, bookingCount };
}

export default async function HomePage() {
  const [cars, stats, favorites] = await Promise.all([
    getFeaturedCars(),
    getStats(),
    getFavoriteCarIds(),
  ]);
  const locale = await getLocale();
  const isRTL = locale === "ar";

  return (
    <>
      <Navbar />

      {/* ========================
          HERO SECTION
          ======================== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-dark-950">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url('/hero-bg.jpg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="hero-gradient absolute inset-0" />
          {/* Red accent glow */}
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary-700 rounded-full opacity-10 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary-500 rounded-full opacity-5 blur-2xl" />
        </div>

        <div className="container-wide relative z-10 py-32 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
            {/* Left: Content */}
            <div className={`space-y-8 ${isRTL ? "lg:order-2" : ""}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary-900/40 border border-primary-700/50 rounded-full px-4 py-2">
                <Star className="w-4 h-4 text-primary-400 fill-primary-400" />
                <span className="text-primary-300 text-sm font-medium">
                  {locale === "ar" ? "الأول في الأردن" : "#1 in Jordan"}
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                  {locale === "ar" ? (
                    <>
                      اكتشف <span className="text-gradient">الأردن</span>
                      <br />
                      بأفخم السيارات
                    </>
                  ) : (
                    <>
                      Explore <span className="text-gradient">Jordan</span>
                      <br />
                      In Tourism & Style
                    </>
                  )}
                </h1>
                <p className="mt-6 text-xl text-gray-400 leading-relaxed max-w-lg">
                  {locale === "ar"
                    ? "أسطول من أرقى السيارات لتجربة قيادة لا تُنسى في ربوع المملكة الأردنية"
                    : "Premium fleet of vehicles for an unforgettable driving experience across the Hashemite Kingdom"}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { num: `${stats.carCount}+`, label: locale === "ar" ? "سيارة سياحية" : "Tourism Cars" },
                  { num: `${stats.userCount}+`, label: locale === "ar" ? "عميل سعيد" : "Happy Clients" },
                  { num: "5+", label: locale === "ar" ? "سنوات خبرة" : "Years Experience" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl font-bold text-white">{stat.num}</p>
                    <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link href={`/${locale}/cars`} className="btn-primary text-base py-4 px-8">
                  {locale === "ar" ? "تصفح السيارات" : "Browse Cars"}
                  <ChevronRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
                </Link>
                <Link href={`/${locale}/contact`} className="btn-secondary text-base py-4 px-8 border-white/20 text-white hover:bg-white/10">
                  {locale === "ar" ? "تواصل معنا" : "Contact Us"}
                </Link>
              </div>
            </div>

            {/* Right: Search card */}
            <div className={`${isRTL ? "lg:order-1" : ""}`}>
              <SearchBar locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================
          FEATURES BAR
          ======================== */}
      <section className="bg-dark-950 border-y border-white/5">
        <div className="container-wide py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: locale === "ar" ? "دفع آمن 100%" : "100% Secure Payment" },
              { icon: Clock, label: locale === "ar" ? "دعم 24/7" : "24/7 Support" },
              { icon: MapPin, label: locale === "ar" ? "توصيل لبابك" : "Door Delivery" },
              { icon: Award, label: locale === "ar" ? "أسطول سياحي" : "Premium Fleet" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-primary-400" />
                </div>
                <span className="text-gray-300 text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================
          FEATURED CARS
          ======================== */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="section-title">
                {locale === "ar" ? "أبرز السيارات" : "Featured Cars"}
              </h2>
              <p className="section-subtitle">
                {locale === "ar"
                  ? "اختر من بين أفخم السيارات المتاحة"
                  : "Choose from our premium selection"}
              </p>
            </div>
            <Link
              href={`/${locale}/cars`}
              className="hidden md:flex items-center gap-2 text-primary-700 hover:text-primary-600 font-medium transition-colors"
            >
              {locale === "ar" ? "عرض الكل" : "View All"}
              <ChevronRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                locale={locale}
                isFavorite={favorites.has(car.id)}
              />
            ))}
          </div>

          <div className="text-center mt-10 md:hidden">
            <Link href={`/${locale}/cars`} className="btn-primary">
              {locale === "ar" ? "عرض جميع السيارات" : "View All Cars"}
            </Link>
          </div>
        </div>
      </section>

      {/* ========================
          HOW IT WORKS
          ======================== */}
      <section className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="section-title">
              {locale === "ar" ? "كيف يعمل النظام؟" : "How It Works"}
            </h2>
            <p className="section-subtitle">
              {locale === "ar"
                ? "ثلاث خطوات بسيطة للحصول على سيارتك"
                : "Three simple steps to get your car"}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 via-primary-500 to-primary-200" />

            {[
              {
                step: "01",
                icon: "🚗",
                title: locale === "ar" ? "اختر سيارتك" : "Choose Your Car",
                desc: locale === "ar"
                  ? "تصفح أسطولنا السياحي واختر السيارة المناسبة لاحتياجاتك"
                  : "Browse our premium fleet and pick the perfect car for your needs",
              },
              {
                step: "02",
                icon: "📅",
                title: locale === "ar" ? "احجز فوراً" : "Book Instantly",
                desc: locale === "ar"
                  ? "حدد تواريخ الاستلام والتسليم وأكمل عملية الحجز بأمان تام"
                  : "Select pickup and return dates and complete your booking securely",
              },
              {
                step: "03",
                icon: "🏎️",
                title: locale === "ar" ? "انطلق!" : "Hit the Road!",
                desc: locale === "ar"
                  ? "استلم سيارتك من الفرع أو نوصلها لموقعك واستمتع برحلتك"
                  : "Pick up your car or we'll deliver it and enjoy your journey",
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl mx-auto mb-6 flex items-center justify-center text-5xl transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                  {step.icon}
                </div>
                <div className="absolute top-4 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center text-white text-xs font-bold z-20">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-dark-950 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================
          CTA BANNER
          ======================== */}
      <section className="py-20 bg-dark-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-700 rounded-full opacity-10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500 rounded-full opacity-5 blur-2xl" />
        </div>
        <div className="container-wide relative z-10 text-center">
          <Zap className="w-12 h-12 text-primary-400 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {locale === "ar" ? "جاهز للانطلاق؟" : "Ready to Hit the Road?"}
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            {locale === "ar"
              ? "احجز سيارتك الآن واستمتع بتجربة قيادة لا مثيل لها في الأردن"
              : "Book your car now and experience unparalleled driving in Jordan"}
          </p>
          <Link href={`/${locale}/cars`} className="btn-primary text-lg py-5 px-12">
            {locale === "ar" ? "ابدأ الحجز الآن" : "Start Booking Now"}
          </Link>
        </div>
      </section>

      <Footer locale={locale} />
    </>
  );
}
