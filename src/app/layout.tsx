import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Master - চাকরি আপনার হাতে!",
  description: "Job Master - চাকরি আপনার হাতে! বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও অন্যান্য প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি।",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/api/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/api/icons/favicon.ico" }
    ],
    shortcut: "/api/icons/favicon.ico",
    apple: "/api/icons/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Job Master",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6A00",
};

import ClientProviders from "../components/ClientProviders";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/api/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/api/icons/apple-icon.png" />
        <meta name="theme-color" content="#FF6A00" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

