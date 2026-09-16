import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { Toaster } from "react-hot-toast";
import "../globals.css";

const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "لوحة التحكم | South Rent Car",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={arabicFont.variable}>
      <body className="font-arabic bg-gray-50 text-dark-950 antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#141414",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "14px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
