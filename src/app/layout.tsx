import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProviders from "../components/ClientProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://jobmaster.com.bd"),
  title: "Job Master - চাকরি আপনার হাতে!",
  description: "Job Master - চাকরি আপনার হাতে! বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও অন্যান্য প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি।",
  alternates: {
    canonical: "https://jobmaster.com.bd",
  },
  openGraph: {
    title: "Job Master - চাকরি আপনার হাতে!",
    description: "Job Master - চাকরি আপনার হাতে! বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও অন্যান্য প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি।",
    url: "https://jobmaster.com.bd",
    siteName: "Job Master",
    locale: "bn_BD",
    type: "website",
    images: [
      {
        url: "/api/icons/icon-192.png",
        width: 192,
        height: 192,
        alt: "Job Master Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Job Master - চাকরি আপনার হাতে!",
    description: "Job Master - চাকরি আপনার হাতে! বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও অন্যান্য প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি।",
    images: ["/api/icons/icon-192.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/api/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/api/icons/favicon.ico" },
    ],
    shortcut: "/api/icons/favicon.ico",
    apple: "/api/icons/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Job Master",
  },
  verification: {
    google: "6jsJ56m1WHmwBZgqSaOYzCmP2SzPrizvTIQpJxf4N0I",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6A00",
};

// Google Sitelinks & SEO Structured Data (JSON-LD)
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://jobmaster.com.bd/#website",
      "url": "https://jobmaster.com.bd",
      "name": "Job Master",
      "alternateName": ["Job Master MCQ", "Job Master Bangladesh", "জব মাস্টার"],
      "description": "বিসিএস, ব্যাংক, শিক্ষক নিবন্ধন ও সরকারি চাকরির পূর্ণাঙ্গ অনলাইন প্রস্তুতি ও লাইভ পরীক্ষা প্ল্যাটফর্ম।",
      "inLanguage": "bn-BD",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://jobmaster.com.bd/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ItemList",
      "@id": "https://jobmaster.com.bd/#sitelinks",
      "name": "Job Master Sitelinks & Navigation",
      "description": "জব মাস্টার প্ল্যাটফর্মের মূল সেকশন ও কোর্সসমূহ",
      "numberOfItems": 6,
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "Our Courses",
          "alternateName": "আমাদের কোর্সসমূহ",
          "description": "বিসিএস, ব্যাংক ও অন্যান্য চাকরির স্পেশাল কোর্স ও প্রস্তুতিমূলক ক্লাস।",
          "url": "https://jobmaster.com.bd/?view=courses",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "লাইভ পরীক্ষা (Live Exams)",
          "alternateName": "Live Exams",
          "description": "নিয়মিত লাইভ পরীক্ষা, জাতীয় মেধা তালিকা ও রিয়েল-টাইম ফলাফল।",
          "url": "https://jobmaster.com.bd/?view=all-live-exams",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "কুইজ ও মডেল টেস্ট (Model Tests)",
          "alternateName": "Quizzes & Model Tests",
          "description": "বিষয়ভিত্তিক কুইজ এবং অধ্যায়ভিত্তিক পূর্ণাঙ্গ মডেল টেস্ট অনুশীলন।",
          "url": "https://jobmaster.com.bd/?view=tests",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 4,
          "name": "প্যাকেজসমূহ (Packages)",
          "alternateName": "Subscription Packages",
          "description": "মাসিক, ত্রৈমাসিক ও বাৎসরিক সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান।",
          "url": "https://jobmaster.com.bd/?view=packages",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 5,
          "name": "বিসিএস প্রস্তুতি (BCS Preparation)",
          "alternateName": "BCS Preparation",
          "description": "৪৭তম ও ৪৮তম বিসিএস প্রিলিমিনারি পূর্ণাঙ্গ সিলেবাস ভিত্তিক প্রস্তুতি।",
          "url": "https://jobmaster.com.bd/?view=prep-sub&id=bcs",
        },
        {
          "@type": "SiteNavigationElement",
          "position": 6,
          "name": "যোগাযোগ (Contact Us)",
          "alternateName": "Contact Us",
          "description": "যেকোনো জিজ্ঞাসা, হেল্পলাইন ও সহায়তায় জব মাস্টার টিমের সাথে যোগাযোগ করুন।",
          "url": "https://jobmaster.com.bd/?view=contact",
        },
      ],
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://jobmaster.com.bd/#organization",
      "name": "Job Master",
      "url": "https://jobmaster.com.bd",
      "logo": "https://jobmaster.com.bd/api/icons/icon-192.png",
      "description": "Job Master - চাকরি আপনার হাতে! বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও অন্যান্য প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি।",
      "sameAs": [
        "https://www.facebook.com/jobmaster.bd",
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Support",
        "url": "https://jobmaster.com.bd/?view=contact",
        "availableLanguage": ["Bengali", "English"],
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-YEC598XFK7"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-YEC598XFK7');
            `,
          }}
        />
        <meta
          name="google-site-verification"
          content="6jsJ56m1WHmwBZgqSaOYzCmP2SzPrizvTIQpJxf4N0I"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/api/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/api/icons/apple-icon.png" />
        <meta name="theme-color" content="#FF6A00" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}


