import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en", "es", "tr", "zh", "ja"],
  defaultLocale: "ar",
  localePrefix: "always",
});
