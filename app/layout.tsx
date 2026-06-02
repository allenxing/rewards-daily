import type { Metadata } from "next";
import { Poppins, Nunito } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/common/toast";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  display: "swap",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "成长星球 — 好习惯养成计划",
  description:
    "通过任务积分、愿望激励、勋章荣誉的闭环体系,帮助 3-6 岁孩子在游戏化体验中养成良好习惯。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${poppins.variable} ${nunito.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
