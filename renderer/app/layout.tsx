import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OCR CONSOLE",
  description:
    "スクリーンショットからテキストを抽出するローカルOCRデスクトップアプリ",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${jetBrainsMono.variable} antialiased min-h-screen text-[var(--text-primary)] transition-colors`}
      >
        {children}
      </body>
    </html>
  );
}
