import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Humor Luxury — Clean Skincare & Haircare, Made in India",
  description:
    "Dermatologist-tested, paraben-free, cruelty-free skincare and haircare. Build your routine with Humor Luxury.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
