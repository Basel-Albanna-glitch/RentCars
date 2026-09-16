import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { prisma } from "@/lib/prisma";
import { Phone, Mail, MessageCircle, MapPin, AlertCircle } from "lucide-react";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("contact");
  const isAr = locale === "ar";

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const head = branches[0];

  const channels = head
    ? [
        { icon: Phone, label: t("phone"), value: head.phone, href: `tel:${head.phone.replace(/\s/g, "")}` },
        {
          icon: MessageCircle,
          label: t("whatsapp"),
          value: head.whatsapp,
          href: `https://wa.me/${head.whatsapp.replace(/[^0-9]/g, "")}`,
        },
        { icon: Mail, label: t("email"), value: head.email, href: `mailto:${head.email}` },
        ...(head.emergencyPhone
          ? [
              {
                icon: AlertCircle,
                label: t("emergency"),
                value: head.emergencyPhone,
                href: `tel:${head.emergencyPhone.replace(/\s/g, "")}`,
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <Navbar />

      <header className="bg-dark-950 pt-32 pb-14 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-700 rounded-full opacity-10 blur-3xl" />
        <div className="container-wide relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-white">{t("title")}</h1>
          <p className="text-gray-400 text-lg mt-3">{t("subtitle")}</p>
        </div>
      </header>

      <main className="bg-gray-50 py-14 min-h-[50vh]">
        <div className="container-wide grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          <ContactForm locale={locale} />

          <div className="space-y-6">
            {channels.length > 0 && (
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-dark-950">
                  {isAr ? "قنوات التواصل" : "Get in touch"}
                </h2>
                {channels.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                      <c.icon className="w-5 h-5 text-primary-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{c.label}</p>
                      <p className="text-sm font-medium text-dark-950 truncate" dir="ltr">
                        {c.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-dark-950">
                {isAr ? "فروعنا" : "Our branches"}
              </h2>
              {branches.map((b) => (
                <div key={b.id} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark-950">
                      {isAr ? b.nameAr : b.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isAr ? b.addressAr : b.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
