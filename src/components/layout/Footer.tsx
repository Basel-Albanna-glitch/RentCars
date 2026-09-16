import Link from "next/link";
import { Car, Phone, Mail, MapPin, MessageCircle, Instagram, Facebook, Twitter } from "lucide-react";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const isAr = locale === "ar";

  return (
    <footer className="bg-dark-950 text-gray-400">
      {/* Main footer */}
      <div className="container-wide py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
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
            </div>
            <p className="text-sm leading-relaxed mb-6">
              {isAr
                ? "أفضل شركة تأجير سيارات سياحية في الأردن. نوفر لك أرقى السيارات بأسعار تنافسية."
                : "Jordan's premier tourism car rental. Premium vehicles at competitive prices."}
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 hover:bg-primary-700 rounded-lg flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">{isAr ? "روابط سريعة" : "Quick Links"}</h4>
            <ul className="space-y-2">
              {[
                { href: `/${locale}`, label: isAr ? "الرئيسية" : "Home" },
                { href: `/${locale}/cars`, label: isAr ? "السيارات" : "Cars" },
                { href: `/${locale}/branches`, label: isAr ? "الفروع" : "Branches" },
                { href: `/${locale}/about`, label: isAr ? "من نحن" : "About Us" },
                { href: `/${locale}/contact`, label: isAr ? "تواصل معنا" : "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">{isAr ? "خدماتنا" : "Services"}</h4>
            <ul className="space-y-2 text-sm">
              {(isAr
                ? ["تأجير يومي", "تأجير أسبوعي", "تأجير شهري", "توصيل للمطار", "رحلات سياحية", "خدمة VIP"]
                : ["Daily Rental", "Weekly Rental", "Monthly Rental", "Airport Transfer", "Tour Packages", "VIP Service"]
              ).map((s, i) => (
                <li key={i} className="hover:text-primary-400 transition-colors cursor-pointer">{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">{isAr ? "تواصل معنا" : "Contact"}</h4>
            <ul className="space-y-3">
              {[
                { icon: Phone, value: "+962 6 123 4567" },
                { icon: MessageCircle, value: "+962 7 987 6543", label: "WhatsApp" },
                { icon: Mail, value: "info@drivejordan.jo" },
                { icon: MapPin, value: isAr ? "عمان، الأردن" : "Amman, Jordan" },
              ].map(({ icon: Icon, value, label }, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="container-wide py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">
            © {new Date().getFullYear()} {isAr ? "الجنوب رنت كار. جميع الحقوق محفوظة" : "South Rent Car. All rights reserved"}
          </p>
          <div className="flex gap-4">
            <Link href={`/${locale}/privacy`} className="text-xs hover:text-primary-400 transition-colors">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <Link href={`/${locale}/terms`} className="text-xs hover:text-primary-400 transition-colors">
              {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
