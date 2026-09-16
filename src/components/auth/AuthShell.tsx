import Link from "next/link";
import { Car, ChevronLeft } from "lucide-react";

interface AuthShellProps {
  locale: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Shared frame for /login and /register: a dark brand panel next to the form,
 * collapsing to a single column on small screens.
 */
export function AuthShell({ locale, title, subtitle, children }: AuthShellProps) {
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="hidden lg:flex bg-dark-950 relative overflow-hidden p-12 flex-col justify-between">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-700 rounded-full opacity-15 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500 rounded-full opacity-10 blur-2xl" />

        <Link href={`/${locale}`} className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">
              {isAr ? "الجنوب رنت كار" : "South Rent Car"}
            </p>
            <p className="text-primary-400 text-xs">
              {isAr ? "تأجير سيارات سياحية" : "Tourism Car Rental"}
            </p>
          </div>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight">
            {isAr ? (
              <>
                اكتشف <span className="text-gradient">الأردن</span>
                <br />
                بأفخم السيارات
              </>
            ) : (
              <>
                Explore <span className="text-gradient">Jordan</span>
                <br />
                In Tourism &amp; Style
              </>
            )}
          </h2>
          <p className="text-gray-400 mt-5 max-w-sm leading-relaxed">
            {isAr
              ? "احجز سيارتك، تابع حالتها، واجمع النقاط مع كل رحلة."
              : "Book your car, follow its status, and earn points with every trip."}
          </p>
        </div>

        <p className="text-gray-600 text-xs relative z-10">
          © {new Date().getFullYear()} {isAr ? "الجنوب رنت كار" : "South Rent Car"}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 transition-colors mb-8"
          >
            <ChevronLeft className={isAr ? "w-4 h-4 rotate-180" : "w-4 h-4"} />
            {isAr ? "العودة للرئيسية" : "Back to home"}
          </Link>

          <h1 className="text-3xl font-bold text-dark-950">{title}</h1>
          <p className="text-gray-500 mt-2 mb-8">{subtitle}</p>

          {children}
        </div>
      </main>
    </div>
  );
}
