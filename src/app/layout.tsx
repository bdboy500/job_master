import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Master - চাকরি আপনার হাতে!",
  description: "Job Master - চাকরি আপনার হাতে! বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও অন্যান্য প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি।",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // 1. Capture beforeinstallprompt immediately
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__pwaInstallPrompt = e;
                  window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
                });

                // 2. Register Service Worker on load
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                      .then(function(reg) {
                        reg.update();
                      })
                      .catch(function(err) {
                        console.log('SW registration note:', err);
                      });
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

