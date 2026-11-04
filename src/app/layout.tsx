import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Literata } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const literata = Literata({ subsets: ["latin"], variable: "--font-literata", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "PrepHub", template: "%s | PrepHub" },
  description: "Day-by-day interview preparation for senior full-stack, AI engineering and design roles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${literata.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
