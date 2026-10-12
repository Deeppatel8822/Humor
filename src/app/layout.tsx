import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppButton from "@/components/WhatsAppButton";
import AdminProfileWidget from "@/components/AdminProfileWidget";
import MetaPixel from "@/components/MetaPixel";
import CustomerAuthPopup from "@/components/CustomerAuthPopup";
import { CartProvider } from "@/context/CartContext";

const siteUrl = "https://humorluxury.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Humor Luxury | Skincare, Haircare & Beauty Essentials",
    template: "%s | Humor Luxury",
  },
  description:
    "Shop Humor Luxury skincare, face washes, serums, sunscreen, shampoos and haircare essentials. Discover thoughtful everyday beauty routines made in India.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Humor Luxury",
    title: "Humor Luxury | Skincare, Haircare & Beauty Essentials",
    description:
      "Discover skincare, face washes, serums, sunscreen and haircare essentials from Humor Luxury.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Humor Luxury | Skincare, Haircare & Beauty Essentials",
    description:
      "Discover skincare, face washes, serums, sunscreen and haircare essentials from Humor Luxury.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Humor Luxury",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Humor Luxury",
  url: siteUrl,
  inLanguage: "en-IN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <MetaPixel />
        <CustomerAuthPopup />
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <WhatsAppButton />
          <AdminProfileWidget />
        </CartProvider>
      </body>
    </html>
  );
}
