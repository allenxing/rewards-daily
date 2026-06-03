"use client";

import { NextIntlClientProvider } from "next-intl";
import zhMessages from "@/messages/zh.json";
import enMessages from "@/messages/en.json";

function getLocale(): string {
  if (typeof document === "undefined") return "zh";
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  return match?.[1] ?? "zh";
}

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const messages = locale === "en" ? enMessages : zhMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
