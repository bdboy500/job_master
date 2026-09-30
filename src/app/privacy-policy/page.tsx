import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Mail,
  Globe,
  Database,
  Smartphone,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  GraduationCap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Job Master (গোপনীয়তা নীতি)",
  description:
    "Official Privacy Policy of Job Master (https://jobmaster.com.bd). Learn how we handle account data, Google Analytics (GA4), Google Play Services, data security, and children's privacy.",
  alternates: {
    canonical: "https://jobmaster.com.bd/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy - Job Master (গোপনীয়তা নীতি)",
    description:
      "Official Privacy Policy of Job Master (https://jobmaster.com.bd). Transparent data handling, Google Play Services, and user safety standards.",
    url: "https://jobmaster.com.bd/privacy-policy",
    siteName: "Job Master",
    locale: "bn_BD",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdatedDate = "১ অক্টোবর, ২০২৬ (October 1, 2026)";

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
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Official Privacy Policy • অফিসিয়াল গোপনীয়তা নীতি</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
              Job Master <span className="text-[#FF6A00]">Privacy Policy</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              স্বাগতম <strong>Job Master</strong> (ওয়েবসাইট:{" "}
              <a
                href="https://jobmaster.com.bd"
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 underline hover:text-orange-300"
              >
                https://jobmaster.com.bd
              </a>
              )-এ। আমরা আমাদের শিক্ষার্থীদের ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা ও সুরক্ষা নিশ্চিত করতে বদ্ধপরিকর। আমাদের অ্যাপ ও ওয়েব প্ল্যাটফর্ম কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখে তা নিচে বিস্তারিত উল্লেখ করা হলো।
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] sm:text-xs text-slate-400 font-semibold border-t border-slate-700/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                সর্বশেষ আপডেট: {lastUpdatedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                ওয়েবসাইট: https://jobmaster.com.bd
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Google Play Store Compliant
              </span>
            </div>
          </div>
        </section>

        {/* Quick Summary Highlights Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-orange-100/70 text-[#FF6A00] rounded-xl shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-800">তথ্য সংগ্রহ</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">নাম, ইমেইল এবং বেসিক ডিভাইস ডেটা</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-blue-100/70 text-blue-600 rounded-xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-800">থার্ড-পার্টি সার্ভিস</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Google Analytics (GA4) ও Play Services</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-emerald-100/70 text-emerald-600 rounded-xl shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-800">ডেটা নিরাপত্তা</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">SSL/TLS এনক্রিপশন ও কঠোর নিরাপত্তা</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-purple-100/70 text-purple-600 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-800">শিশুদের গোপনীয়তা</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">১৩ বছরের নিচের কোনো তথ্য নেওয়া হয় না</p>
            </div>
          </div>
        </section>

        {/* Detailed Policy Sections */}
        <div className="space-y-6">
          {/* Section 1: Overview */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                ১
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                ভূমিকা ও সাধারণ পরিচয় (Overview & General Information)
              </h2>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              <strong>Job Master</strong> (অ্যাপ এবং ওয়েব প্ল্যাটফর্ম:{" "}
              <a
                href="https://jobmaster.com.bd"
                target="_blank"
                rel="noreferrer"
                className="text-orange-600 font-bold hover:underline"
              >
                https://jobmaster.com.bd
              </a>
              ) বাংলাদেশে বিসিএস (BCS), ব্যাংক জব, প্রাইমারি শিক্ষক নিয়োগ, এনটিআরসিএ (NTRCA) ও বিভিন্ন প্রতিযোগিতামূলক সরকারি ও বেসরকারি চাকরির পরীক্ষার প্রস্তুতিমূলক অনলাইন প্ল্যাটফর্ম।
            </p>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              ব্যবহারকারী যখন আমাদের অ্যাপ্লিকেশন বা ওয়েবসাইটে প্রবেশ করেন, তখন তিনি এই প্রাইভেসি পলিসির শর্তাবলীর সাথে সম্মতি জ্ঞাপন করছেন বলে গণ্য হবে।
            </p>
          </section>

          {/* Section 2: Collected Information */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                ২
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                আমরা কী কী তথ্য সংগ্রহ করি (Information We Collect)
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              আমাদের প্ল্যাটফর্মের সেবাগুলোকে নিরবচ্ছিন্ন, নির্ভুল ও শিক্ষার্থী-বান্ধব রাখতে আমরা সীমিত পরিসরে নিম্নোক্ত তথ্যগুলো সংগ্রহ করি:
            </p>

            <div className="space-y-3 pt-1">
              {/* Account Data */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-[#FF6A00] shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
                    ক. ইউজার একাউন্ট তথ্য (User Account Information)
                  </h3>
                  <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
                    আপনি যখন আমাদের অ্যাপ বা সাইটে রেজিস্ট্রেশন বা সাইন-ইন করেন, তখন আমরা আপনার <strong>নাম (Full Name)</strong>, <strong>ইমেইল ঠিকানা (Email Address)</strong> এবং প্রোফাইল ছবি (যদি প্রদান করেন) সংগ্রহ করি। এটি আপনার পরীক্ষার অগ্রগতি সেভ রাখা, মেধা তালিকা (Leaderboard) তৈরি এবং সাবস্ক্রিপশন স্টেটাস ট্র্যাকিংয়ের কাজে ব্যবহৃত হয়।
                  </p>
                </div>
              </div>

              {/* GA4 Tracking Data */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
                    খ. Google Analytics (GA4) ট্র্যাকিং ডাটা
                  </h3>
                  <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
                    অ্যাপ ও ওয়েবসাইটের ইউজার এক্সপেরিয়েন্স উন্নত করতে আমরা <strong>Google Analytics (GA4)</strong> ব্যবহার করি (ট্যাগ আইডি: <code>G-YEC598XFK7</code>)। এর মাধ্যমে ইউজার কোন কোন পেজ বা কুইজে বেশি সময় ব্যয় করছেন, ত্রুটি বা ক্র্যাশ হচ্ছে কি না তা সামগ্রিক ও অনামী (Anonymous Aggregated) পরিসংখ্যান হিসেবে সংরক্ষিত হয়। কোনো ব্যক্তিগত গোপনীয় তথ্য এতে স্টোর করা হয় না।
                  </p>
                </div>
              </div>

              {/* Device Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-purple-600 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
                    গ. বেসিক ডিভাইস ইনফরমেশন (Basic Device Information)
                  </h3>
                  <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
                    পরীক্ষার ইন্টারফেস এবং রেসপন্সিভ ডিজাইন সঠিকভাবে লোড করার জন্য আমরা ডিভাইসের অপারেটিং সিস্টেম (Android / iOS / Windows), ব্রাউজার টাইপ, স্ক্রিন রেজোলিউশন এবং নেটওয়ার্ক সংযোগের ধরন বিশ্লেষণ করি।
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Third Party Services */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                ৩
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                থার্ড-পার্টি সার্ভিসসমূহ (Third-Party Services)
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              Job Master অ্যাপ্লিকেশনটি তার নির্ভরযোগ্য সেবা প্রদানের সুবিধার্থে নিচের থার্ড-পার্টি প্রযুক্তি সেবাগুলো ব্যবহার করে:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Google Play Services
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Android Platform
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                  আমাদের অ্যান্ড্রয়েড অ্যাপের পুশ নোটিফিকেশন, অ্যাপ আপডেট চেক এবং সিকিউরিটি ইন্টিগ্রিটির জন্য Google Play Services ব্যবহৃত হয়।
                </p>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline pt-1"
                >
                  <span>Google Privacy Policy দেখুন</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Google Analytics (GA4)
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Analytics & Performance
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                  ওয়েব ও অ্যাপের সামগ্রিক ট্রাফিক পর্যবেক্ষণ, জনপ্রিয় কোর্সসমূহ শনাক্তকরণ ও ব্যবহারকারীদের জন্য আরও কার্যকর কন্টেন্ট নির্ধারণে কাজ করে।
                </p>
                <a
                  href="https://support.google.com/analytics/answer/6004245"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline pt-1"
                >
                  <span>Google Analytics Data Privacy</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </section>

          {/* Section 4: Data Security */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                ৪
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                তথ্যের সুরক্ষা ও নিরাপত্তা (Data Security & Protection)
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              গ্রাহকের তথ্যের সুরক্ষা প্রদান করা আমাদের শীর্ষ অগ্রাধিকার। আমরা আধুনিক নিরাপত্তা প্রোটোকল অনুসরণ করি:
            </p>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>HTTPS / TLS এনক্রিপশন:</strong> আপনার ডিভাইস থেকে আমাদের সার্ভারে পাঠানো প্রতিটি ডেটা উচ্চমাত্রার এনক্রিপশন প্রোটোকলের মাধ্যমে সুরক্ষিতভাবে আদান-প্রদান করা হয়।
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>নিরাপদ ডাটাবেস ও এক্সেস কন্ট্রোল:</strong> অননুমোদিত অ্যাক্সেস, পরিবর্তন বা প্রকাশ রোধ করতে শক্তিশালী ডাটাবেস নিরাপত্তা ও ভূমিকা-ভিত্তিক অনুমতি (Role-based access control) কার্যকর রয়েছে।
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>কোনো তথ্য বিক্রি করা হয় না:</strong> Job Master তার নিবন্ধিত ব্যবহারকারীদের কোনো ব্যক্তিগত তথ্য তৃতীয় কোনো বিজ্ঞাপনদাতা বা বাণিজ্যিক সংস্থার কাছে বিক্রি, ভাড়া বা বাণিজ্যিক ব্যবহারের জন্য হস্তান্তর করে না।
                </span>
              </li>
            </ul>
          </section>

          {/* Section 5: Children's Privacy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                ৫
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                শিশুদের গোপনীয়তা (Children&apos;s Privacy)
              </h2>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-xs sm:text-sm text-amber-900">
                  ১৩ বছরের কম বয়সীদের তথ্য সংগ্রহ করা হয় না (Under 13 Policy)
                </h3>
                <p className="text-amber-800 text-[11px] sm:text-xs leading-relaxed font-medium">
                  <strong>Job Master</strong> শুধুমাত্র বিসিএস, ব্যাংক ও বিভিন্ন চাকরির পরীক্ষার শিক্ষার্থী এবং প্রাপ্তবয়স্ক চাকরিপ্রার্থীদের জন্য তৈরি করা হয়েছে। আমরা জেনেশুনে ১৩ (তেরো) বছরের কম বয়সী শিশুদের কাছ থেকে কোনো ব্যক্তিগত শনাক্তকরণযোগ্য তথ্য (Personal Identifiable Information) সংগ্রহ করি না। যদি কোনো অভিভাবক বা অভিভাবিকা জানতে পারেন যে তাঁর অপ্রাপ্তবয়স্ক সন্তান আমাদের কোনো তথ্য প্রদান করেছে, তবে অনুগ্রহ করে আমাদের সাথে অবিলম্বে যোগাযোগ করুন; আমরা অবিলম্বে উক্ত তথ্য ডাটাবেস থেকে মুছে ফেলব।
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: User Rights & Data Deletion */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                ৬
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                ব্যবহারকারীর অধিকার ও ডাটা মুছে ফেলার নিয়ম (User Rights & Data Deletion)
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              আপনার সংরক্ষিত তথ্যের ওপর আপনার পূর্ণ নিয়ন্ত্রণ রয়েছে:
            </p>

            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-black">•</span>
                <span>আপনি যেকোনো সময় আপনার প্রোফাইল তথ্য সংশোধন বা আপডেট করতে পারেন।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-black">•</span>
                <span>
                  আপনার একাউন্ট ও সংশ্লিষ্ট সকল পরীক্ষা রেকর্ড স্থায়ীভাবে মুছে ফেলার (Account Deletion) অনুরোধ জানাতে সরাসরি আমাদের অফিসিয়াল ইমেইল{" "}
                  <a
                    href="mailto:mobileseba247@gmail.com"
                    className="text-orange-600 font-bold underline"
                  >
                    mobileseba247@gmail.com
                  </a>{" "}
                  এ যোগাযোগ করতে পারেন। অনুরোধ প্রাপ্তির ৭২ ঘণ্টার মধ্যে যাচাই সাপেক্ষে ডেটা মুছে ফেলা হবে।
                </span>
              </li>
            </ul>
          </section>

          {/* Section 7: Changes to this Policy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                ৭
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                পলিসির পরিবর্তন (Policy Changes)
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              সময়ে সময়ে নতুন ফিচার যুক্ত হলে বা আইনগত নির্দেশনার প্রেক্ষিতে আমরা এই গোপনীয়তা নীতি হালনাগাদ করতে পারি। যেকোনো পরিবর্তনের ক্ষেত্রে এই পেজে সংশোধিত তারিখসহ নোটিশ প্রকাশ করা হবে।
            </p>
          </section>

          {/* Section 8: Contact Information Card */}
          <section className="bg-gradient-to-br from-orange-50 to-orange-100/60 rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#FF6A00] text-white rounded-2xl shadow-md shadow-orange-500/20">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                  Contact Us • যোগাযোগ
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900">
                  যোগাযোগ ও সাপোর্ট ইনফরমেশন
                </h2>
              </div>
            </div>

            <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
              এই গোপনীয়তা নীতি সম্পর্কে আপনার কোনো প্রশ্ন, মতামত বা ডাটা সংক্রান্ত অনুরোধ থাকলে নির্দ্বিধায় আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-orange-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Official Email Address
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
                  Website URL
                </span>
                <a
                  href="https://jobmaster.com.bd"
                  target="_blank"
                  rel="noreferrer"
                  className="font-black text-xs sm:text-sm text-slate-800 hover:text-[#FF6A00] transition-colors flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4 shrink-0 text-[#FF6A00]" />
                  <span>https://jobmaster.com.bd</span>
                </a>
              </div>
            </div>

            <div className="pt-2 text-center sm:text-left">
              <Link
                href="/"
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-orange-500/25 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Job Master অ্যাপে ফিরে যান</span>
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
              className="text-orange-600 font-extrabold underline decoration-orange-300"
            >
              প্রাইভেসি পলিসি (Privacy Policy)
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
