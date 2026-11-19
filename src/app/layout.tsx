import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppButton from "@/components/WhatsAppButton";
import AdminProfileWidget from "@/components/AdminProfileWidget";
import MetaPixel from "@/components/MetaPixel";
import CustomerAuthPopup from "@/components/CustomerAuthPopup";
import { CartProvider } from "@/context/CartContext";
import TrafficTracker from "@/components/TrafficTracker";

const siteUrl = "https://www.humorluxury.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Humor Luxury | Skincare, Haircare & Beauty Essentials",
    template: "%s",
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
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NF4P6778"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-NF4P6778');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Suspense fallback={null}>
          <MetaPixel />
          <TrafficTracker />
          <CustomerAuthPopup />
          <CartProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <WhatsAppButton />
            <AdminProfileWidget />
          </CartProvider>
        </Suspense>
      </body>
    </html>
  );
}
