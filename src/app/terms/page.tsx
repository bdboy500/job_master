import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Scale,
  ArrowLeft,
  Mail,
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Megaphone,
  CreditCard,
  Copyright,
  UserCheck,
  GraduationCap,
  Building2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions | Job Master (ব্যবহারের শর্তাবলী)",
  description:
    "Official Terms and Conditions of Job Master (https://jobmaster.com.bd). Service agreement, trader & operator information, Google AdMob & AdSense disclosures, subscriptions, and user guidelines.",
  alternates: {
    canonical: "https://jobmaster.com.bd/terms",
  },
  openGraph: {
    title: "Terms & Conditions - Job Master (ব্যবহারের শর্তাবলী)",
    description:
      "Official Terms and Conditions of Job Master (https://jobmaster.com.bd). Transparent service terms, AdMob/AdSense disclosures, and user guidelines.",
    url: "https://jobmaster.com.bd/terms",
    siteName: "Job Master",
    locale: "bn_BD",
    type: "website",
  },
};

export default function TermsPage() {
  const lastUpdatedDate = "১৩ নভেম্বর, ২০২৬ (November 13, 2026)";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              prefetch={false}
              className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 active:scale-95 transition-all flex items-center gap-1.5 font-bold text-xs sm:text-sm"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>হোমপেজে ফিরে যান</span>
            </Link>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="bg-[#FF6A00] p-1.5 sm:p-2 rounded-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-[#1E293B] text-base sm:text-lg tracking-tight leading-none">
                Job <span className="text-[#FF6A00]">Master</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                jobmaster.com.bd
              </span>
            </div>
          </Link>

          <a
            href="mailto:mobileseba247@gmail.com"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs transition-colors border border-orange-200/60"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>সাপোর্ট যোগাযোগ</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Card */}
        <section className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden border border-slate-700/60">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 px-3 py-1.5 rounded-full text-orange-400 text-xs font-black tracking-wide uppercase">
              <Scale className="w-4 h-4 text-orange-400" />
              <span>Official Terms &amp; Conditions • ব্যবহারের শর্তাবলী</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
              Job Master <span className="text-[#FF6A00]">Terms &amp; Conditions</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              Welcome to <strong>Job Master</strong> ({" "}
              <a
                href="https://jobmaster.com.bd"
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 underline hover:text-orange-300"
              >
                https://jobmaster.com.bd
              </a>
              ). By accessing or using our website or mobile application, you agree to be bound by these Terms &amp; Conditions. <strong>Job Master</strong> ব্যবহার করার মাধ্যমে আপনি নিচের সকল নিয়মাবলী ও শর্তাবলীতে সম্মত হচ্ছেন।
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] sm:text-xs text-slate-400 font-semibold border-t border-slate-700/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                Effective / Updated: {lastUpdatedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                https://jobmaster.com.bd/terms
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Google AdMob &amp; Play Store Compliant
              </span>
            </div>
          </div>
        </section>

        {/* Quick Summary Highlights Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-orange-100/70 text-[#FF6A00] rounded-xl shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-800">Operator &amp; Trader</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Job Master • mobileseba247@gmail.com
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-blue-100/70 text-blue-600 rounded-xl shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-800">Fair Usage</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                স্বচ্ছ পরীক্ষা ও অনুশীলন নীতিমালা
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-emerald-100/70 text-emerald-600 rounded-xl shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-800">AdMob &amp; AdSense</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Google Certified Advertising
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-purple-100/70 text-purple-600 rounded-xl shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-800">Packages &amp; Refunds</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                স্বচ্ছ ডিজিটাল সাবস্ক্রিপশন শর্ত
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Terms Sections */}
        <div className="space-y-6">
          {/* Section 1: Service Provider / Trader Identity & Acceptance */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Acceptance of Terms &amp; Service Provider (পরিচিতি ও শর্তাবলী গ্রহণ)
              </h2>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              These Terms &amp; Conditions govern your use of the <strong>Job Master</strong> website (
              <a
                href="https://jobmaster.com.bd"
                target="_blank"
                rel="noreferrer"
                className="text-orange-600 font-bold hover:underline"
              >
                https://jobmaster.com.bd
              </a>
              ) and mobile application, operated by <strong>Job Master</strong> (Bangladesh; Contact Email:{" "}
              <a
                href="mailto:mobileseba247@gmail.com"
                className="text-orange-600 font-bold hover:underline"
              >
                mobileseba247@gmail.com
              </a>
              ). By creating an account, taking exams, or browsing content, you accept these Terms &amp; Conditions along with our{" "}
              <Link href="/privacy-policy" className="text-orange-600 font-bold underline">
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              <strong>Job Master</strong> (ওয়েবসাইট ও মোবাইল অ্যাপ) ব্যবহার করার মাধ্যমে আপনি এই ব্যবহারের শর্তাবলী এবং আমাদের গোপনীয়তা নীতিতে সম্পূর্ণ সম্মতি প্রদান করছেন। যদি আপনি কোনো শর্তের সাথে একমত না হন, তবে অনুগ্রহ করে আমাদের প্ল্যাটফর্ম ব্যবহার করা থেকে বিরত থাকুন।
            </p>
          </section>

          {/* Section 2: Educational Purpose & Non-Government Disclaimer */}
          <section className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-amber-200/90 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                2. Independent Educational Service &amp; Disclaimer (স্বতন্ত্র শিক্ষামূলক সেবা ও ডিসক্লেমার)
              </h2>
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-amber-200 shadow-2xs space-y-2.5">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                Job Master is an independent educational and exam-preparation platform for BCS, Bank, Primary Teacher, NTRCA, and competitive job exams. We are <strong className="text-rose-700 underline underline-offset-2">NOT</strong> affiliated with, endorsed by, or representing the Government of Bangladesh or the Bangladesh Public Service Commission (BPSC).
              </p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Public exam circulars and syllabus references are compiled from public official portals such as{" "}
                <a href="https://bpsc.gov.bd" target="_blank" rel="noopener noreferrer" className="text-[#FF6A00] font-bold hover:underline inline-flex items-center gap-1">
                  https://bpsc.gov.bd <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and{" "}
                <a href="https://bangladesh.gov.bd/" target="_blank" rel="noopener noreferrer" className="text-[#FF6A00] font-bold hover:underline inline-flex items-center gap-1">
                  https://bangladesh.gov.bd/ <ExternalLink className="w-3 h-3" />
                </a>
                . Job Master একটি স্বতন্ত্র শিক্ষামূলক প্ল্যাটফর্ম এবং কোনো সরকারি প্রতিষ্ঠানের প্রতিনিধি নয়।
              </p>
            </div>
          </section>

          {/* Section 3: Eligibility, Accounts & Acceptable Use */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                User Accounts, Eligibility &amp; Acceptable Use (অ্যাকাউন্ট ও ব্যবহারবিধি)
              </h2>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Eligibility (বয়সসীমা):</strong> You must be at least 13 years old to use Job Master (users under 18 should use the service with parental/guardian awareness). ১৩ বছরের কম বয়সীদের জন্য এই প্ল্যাটফর্ম প্রযোজ্য নয়।
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Account Security (অ্যাকাউন্টের নিরাপত্তা):</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities occurring under your account.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Fair Exam Conduct (সততা ও ন্যায্য ব্যবহার):</strong> Automated bots, scraping question banks, attempting to manipulate live exam timers or leaderboards, reverse-engineering the app, or harassing other users is strictly prohibited and may result in immediate account termination.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 4: Advertising - Google AdMob & AdSense */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Advertising, Google AdMob &amp; AdSense (বিজ্ঞাপন ও Google AdMob নীতিমালা)
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              To keep core study materials and daily/weekly model tests accessible, Job Master displays advertisements provided by third-party ad networks, including <strong>Google AdMob</strong> (in our Android/mobile app) and <strong>Google AdSense</strong> (on our website).
            </p>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              বিনামূল্যে শিক্ষামূলক সেবা ও মডেল টেস্ট চালু রাখার জন্য আমাদের অ্যাপে <strong>Google AdMob</strong> এবং ওয়েবসাইটে <strong>Google AdSense</strong>-এর মাধ্যমে প্রাসঙ্গিক বিজ্ঞাপন প্রদর্শিত হতে পারে।
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <p>
                • Google and its partners may use cookies or mobile advertising identifiers (such as Google Advertising ID) to serve and measure ads in accordance with{" "}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 font-bold underline"
                >
                  Google Advertising Policies
                </a>{" "}
                and our{" "}
                <Link href="/privacy-policy" className="text-orange-600 font-bold underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <p>
                • Users must not engage in invalid ad clicks, automated impressions, or encourage artificial ad interactions.
              </p>
              <p>
                • External links within advertisements are governed by the respective advertiser&apos;s own terms and privacy policies.
              </p>
            </div>
          </section>

          {/* Section 5: Subscriptions, Packages & Refund Policy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                5
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Paid Packages, Subscriptions &amp; Refunds (প্যাকেজ ও রিফান্ড নীতিমালা)
              </h2>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Transparent Pricing:</strong> All optional Pro / Premium packages, validity periods, and prices are clearly displayed before any purchase or payment confirmation.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Digital Delivery:</strong> Subscription access is activated digitally on your registered Job Master account upon verification.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Refunds &amp; Billing Support:</strong> Because digital educational content is accessible immediately upon activation, fees are generally non-refundable once consumed. However, if you experience a duplicate payment, accidental charge, or unresolved technical activation failure, please email{" "}
                  <a href="mailto:mobileseba247@gmail.com" className="text-orange-600 font-bold underline">
                    mobileseba247@gmail.com
                  </a>{" "}
                  within 7 days with your transaction details for review and resolution.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 6: Intellectual Property */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                6
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
                <Copyright className="w-4 h-4 text-[#FF6A00] shrink-0" />
                <span>Intellectual Property Rights (মেধাস্বত্ব ও কপিরাইট)</span>
              </h2>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              All brand logos, UI designs, curated model test sets, explanations, graphics, and software code on <strong>Job Master</strong> are the intellectual property of Job Master or its licensors. You are granted a limited, personal, non-transferable license solely for personal exam preparation. Copying, redistributing, or reselling platform content without prior written consent is prohibited.
            </p>
          </section>

          {/* Section 7: Limitation of Liability & Disclaimer of Warranties */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                7
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Disclaimer of Warranties &amp; Limitation of Liability (দায়বদ্ধতার সীমা)
              </h2>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              While we strive to keep every question, answer, and explanation accurate and our servers available 24/7, <strong>Job Master</strong> is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. Job Master shall not be liable for any indirect, incidental, or consequential damages resulting from temporary downtime, third-party network failures, or changes in external recruitment exam schedules.
            </p>
          </section>

          {/* Section 8: Termination, Updates & Governing Law */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                8
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Termination, Amendments &amp; Governing Law (অ্যাকাউন্ট বাতিল ও প্রযোজ্য আইন)
              </h2>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              We reserve the right to suspend or terminate accounts that violate these Terms &amp; Conditions. Users may stop using the service or request permanent account deletion anytime by emailing{" "}
              <a href="mailto:mobileseba247@gmail.com" className="text-orange-600 font-bold underline">
                mobileseba247@gmail.com
              </a>
              . We may update these Terms from time to time, and continued use after updates indicates acceptance. These Terms are governed by the laws of the People&apos;s Republic of Bangladesh.
            </p>
          </section>

          {/* Section 9: Trader & Contact Information Card */}
          <section className="bg-gradient-to-br from-orange-50 to-orange-100/60 rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#FF6A00] text-white rounded-2xl shadow-md shadow-orange-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                  Trader &amp; Support Details • যোগাযোগ তথ্য
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900">
                  Operator &amp; Support Contact
                </h2>
              </div>
            </div>

            <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
              For any legal, AdMob/trader verification, billing, or support inquiries regarding these Terms &amp; Conditions, please contact us directly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-orange-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Official Support Email
                </span>
                <a
                  href="mailto:mobileseba247@gmail.com"
                  className="font-black text-xs sm:text-sm text-[#FF6A00] hover:underline flex items-center gap-1.5 break-all"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>mobileseba247@gmail.com</span>
                </a>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-orange-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Official Website &amp; Operator
                </span>
                <a
                  href="https://jobmaster.com.bd"
                  target="_blank"
                  rel="noreferrer"
                  className="font-black text-xs sm:text-sm text-slate-800 hover:text-[#FF6A00] transition-colors flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4 shrink-0 text-[#FF6A00]" />
                  <span>Job Master (https://jobmaster.com.bd)</span>
                </a>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-orange-500/25 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Job Master অ্যাপে ফিরে যান</span>
              </Link>

              <Link
                href="/privacy-policy"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-orange-50 text-slate-800 border border-orange-200 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl active:scale-95 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
                <span>Privacy Policy দেখুন</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 px-4 sm:px-8 text-center text-slate-500 space-y-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FF6A00] rounded-lg flex items-center justify-center text-white font-black text-[10px]">
              JM
            </div>
            <span className="font-extrabold text-slate-800">Job Master</span>
            <span>• চাকরি আপনার হাতে!</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600">
            <Link href="/" className="hover:text-orange-600 transition-colors">
              হোম (Home)
            </Link>
            <span>•</span>
            <Link
              href="/privacy-policy"
              className="hover:text-orange-600 transition-colors"
            >
              প্রাইভেসি পলিসি (Privacy Policy)
            </Link>
            <span>•</span>
            <Link
              href="/terms"
              className="text-orange-600 font-extrabold underline decoration-orange-300"
            >
              শর্তাবলী (Terms &amp; Conditions)
            </Link>
            <span>•</span>
            <a
              href="mailto:mobileseba247@gmail.com"
              className="hover:text-orange-600 transition-colors"
            >
              যোগাযোগ (Support)
            </a>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          All Rights Reserved © 2026 Job Master (https://jobmaster.com.bd).
        </p>
      </footer>
    </div>
  );
}
