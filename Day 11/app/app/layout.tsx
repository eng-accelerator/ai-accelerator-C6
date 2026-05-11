import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Cursor } from "@/components/Cursor";
import { NavHeader } from "@/components/NavHeader";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Model Council",
  description:
    "Convene four frontier models. Watch them debate. Read the verdict.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Cursor />
        <NavHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
