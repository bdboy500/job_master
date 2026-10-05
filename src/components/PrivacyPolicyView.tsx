"use client";

import {
  ArrowLeft,
  ShieldCheck,
  Lock,
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
  FileText,
  BadgeCheck,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useState } from "react";

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export default function PrivacyPolicyView({ onBack }: PrivacyPolicyViewProps) {
  const [copied, setCopied] = useState(false);
  const lastUpdatedDate = "১ অক্টোবর, ২০২৬ (October 1, 2026)";

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText("https://jobmaster.com.bd/privacy-policy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 overflow-y-auto pb-16 selection:bg-orange-500 selection:text-white animate-fade-in text-left">
      {/* Top Floating App Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 shadow-xs flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6A00] font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer border border-orange-200/60"
          id="privacy-back-top-btn"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>হোমে ফিরুন (Home)</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="bg-[#FF6A00] p-1.5 rounded-xl text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-black text-slate-800 text-sm hidden sm:inline">
            Job Master <span className="text-[#FF6A00]">Privacy</span>
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          title="লিংক কপি করুন"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? "কপি হয়েছে!" : "শেয়ার"}</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Card */}
        <section className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/60">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 px-3 py-1 rounded-full text-orange-400 text-[11px] font-black tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Google Standard Compliant Policy</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Job Master <span className="text-[#FF6A00]">গোপনীয়তা নীতি (Privacy Policy)</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              স্বাগতম <strong>Job Master</strong> (অফিসিয়াল ওয়েবসাইট:{" "}
              <a
                href="https://jobmaster.com.bd"
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 underline hover:text-orange-300 font-bold"
              >
                https://jobmaster.com.bd
              </a>
              )-এ। আমরা শিক্ষার্থী ও চাকরিপ্রার্থীদের তথ্যের সর্বোচ্চ নিরাপত্তা এবং গুগল প্লে কনসোল ও গুগল অ্যাডসেন্স এর ডেটা সুরক্ষা নীতিমালা সম্পূর্ণভাবে অনুসরণ করি।
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-semibold border-t border-slate-700/80">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                সর্বশেষ আপডেট: {lastUpdatedDate}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                jobmaster.com.bd
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <BadgeCheck className="w-3.5 h-3.5" />
                Google Verified
              </span>
            </div>
          </div>
        </section>

        {/* Quick Highlights Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 bg-orange-100 text-[#FF6A00] rounded-xl flex items-center justify-center mb-2">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="font-black text-xs text-slate-800">তথ্য সংগ্রহ</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">নাম ও ইমেইল অ্যাকাউন্ট ডেটা</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="font-black text-xs text-slate-800">গুগল সার্ভিস</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">GA4, AdSense ও Play Services</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-2">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="font-black text-xs text-slate-800">তথ্য সুরক্ষা</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">SSL/TLS ফুল এনক্রিপশন</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-black text-xs text-slate-800">শিশু সুরক্ষা</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">১৩ বছরের নিচের জন্য নয়</p>
          </div>
        </section>

        {/* Section 1: Overview */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#FF6A00] text-white font-black text-xs flex items-center justify-center">
              ১
            </span>
            <h3 className="font-black text-base sm:text-lg">
              ভূমিকা ও কার্যপরিধি (Overview & Scope)
            </h3>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            <strong>Job Master</strong> একটি পূর্ণাঙ্গ শিক্ষামূলক ও পরীক্ষা প্রস্তুতি প্ল্যাটফর্ম (অ্যান্ড্রয়েড অ্যাপ ও ওয়েব: <a href="https://jobmaster.com.bd" className="text-[#FF6A00] font-bold underline">jobmaster.com.bd</a>)। আমাদের উদ্দেশ্য হলো বিসিএস (BCS), সরকারি ও বেসরকারি ব্যাংক, প্রাথমিক শিক্ষক নিয়োগ, শিক্ষক নিবন্ধন (NTRCA), রেলওয়ে এবং অন্যান্য প্রতিযোগিতামূলক পরীক্ষার প্রার্থীদের জন্য নির্ভরযোগ্য ও সময়োপযোগী প্রস্তুতি নিশ্চিত করা।
          </p>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            এই নীতিমালার মাধ্যমে আমরা স্পষ্ট করছি যে আপনি যখন আমাদের প্ল্যাটফর্ম ব্যবহার করেন, তখন আমরা আপনার কী কী তথ্য কীভাবে সংগ্রহ করি, সংরক্ষণ করি এবং সুরক্ষিত রাখি।
          </p>
        </section>

        {/* Section 2: Collected Data */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#FF6A00] text-white font-black text-xs flex items-center justify-center">
              ২
            </span>
            <h3 className="font-black text-base sm:text-lg">
              আমরা কী কী তথ্য সংগ্রহ করি (Information We Collect)
            </h3>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-start gap-3">
              <Eye className="w-4 h-4 text-[#FF6A00] mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-black text-xs sm:text-sm text-slate-800">
                  ক. ব্যবহারকারীর একাউন্ট তথ্য (Account Information)
                </h4>
                <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
                  সাইন-আপ বা লগইনের সময় আমরা আপনার <strong>পূর্ণ নাম (Full Name)</strong>, <strong>ইমেইল ঠিকানা (Email Address)</strong> এবং প্রোফাইল ছবি সংগ্রহ করি। এটি আপনার পরীক্ষার ফলাফল সংরক্ষণ, সাবস্ক্রিপশন স্ট্যাটাস ট্র্যাক করা এবং জাতীয় মেধা তালিকায় (Leaderboard) আপনার র‍্যাঙ্ক প্রদর্শনের জন্য ব্যবহৃত হয়।
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-start gap-3">
              <Layers className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-black text-xs sm:text-sm text-slate-800">
                  খ. Google Analytics (GA4) ট্র্যাকিং ডাটা
                </h4>
                <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
                  আমাদের সাইট ও অ্যাপের কার্যকারিতা বজায় রাখতে আমরা <strong>Google Analytics 4 (GA4)</strong> ব্যবহার করি। এর মাধ্যমে কোন কুইজ ও কোর্সগুলো বেশি ব্যবহৃত হচ্ছে, অ্যাপে কোনো ক্র্যাশ বা প্রযুক্তিগত ত্রুটি ঘটছে কি না তা সামগ্রিক ও পরিচয়বিহীন (Aggregated Anonymous) হিসেবে ট্র্যাক করা হয়।
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex items-start gap-3">
              <Smartphone className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-black text-xs sm:text-sm text-slate-800">
                  গ. বেসিক ডিভাইস ও ব্রাউজার তথ্য (Device Information)
                </h4>
                <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
                  ডিভাইসের ধরন (Android, iOS, Windows), স্ক্রিন রেজোলিউশন, ব্রাউজার ভার্সন এবং ইন্টারনেট কানেক্টিভিটি স্ট্যাটাস বিশ্লেষণ করা হয় যাতে লাইভ পরীক্ষার সময় স্ক্রিন ও টাইমার নির্বিঘ্নে কাজ করতে পারে।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Google & Third Party Services */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#FF6A00] text-white font-black text-xs flex items-center justify-center">
              ৩
            </span>
            <h3 className="font-black text-base sm:text-lg">
              গুগল ও থার্ড-পার্টি সার্ভিসেস (Google & Third-Party Services)
            </h3>
          </div>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            Job Master গুগল ও আন্তর্জাতিক মানের বিশ্বস্ত প্রযুক্তি সেবা ব্যবহার করে:
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs sm:text-sm text-slate-800">
                  ১. Google Play Services
                </h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Android App Framework
                </span>
              </div>
              <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
                অ্যান্ড্রয়েড অ্যাপে পুশ নোটিফিকেশন, অ্যাপ আপডেট চেক, ও ডিভাইস সিকিউরিটি ইন্টিগ্রিটির জন্য Google Play Services ব্যবহৃত হয়।
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs sm:text-sm text-slate-800">
                  ২. Google AdSense & Cookies Policy
                </h4>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Certified Google Network
                </span>
              </div>
              <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed font-medium">
                আমাদের ওয়েবসাইটে প্রাসঙ্গিক বিজ্ঞাপন প্রদর্শনের জন্য Google AdSense ব্যবহৃত হয়। গুগল থার্ড-পার্টি ভেন্ডর হিসেবে কুকিজ (যেমন DoubleClick DART কুকি) ব্যবহার করে ব্যবহারকারীর ব্রাউজিং ইতিহাসের ভিত্তিতে বিজ্ঞাপন প্রদর্শন করতে পারে। আপনি চাইলে{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 underline font-bold"
                >
                  Google Ads Settings
                </a>{" "}
                এ গিয়ে পারসোনালাইজড বিজ্ঞাপন বন্ধ (Opt-out) করতে পারেন।
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Data Security */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#FF6A00] text-white font-black text-xs flex items-center justify-center">
              ৪
            </span>
            <h3 className="font-black text-base sm:text-lg">
              তথ্য সুরক্ষা ও নিরাপত্তা (Data Security)
            </h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>HTTPS ও SSL এনক্রিপশন:</strong> আপনার ডিভাইস ও সার্ভারের মধ্যে সকল তথ্য সর্বাধুনিক এনক্রিপশনে আদান-প্রদান হয়।</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>কোনো তথ্য বিক্রি করা হয় না:</strong> ব্যবহারকারীর ব্যক্তিগত বা যোগাযোগের তথ্য কোনো বিজ্ঞাপনদাতা বা ব্যবসায়িক প্রতিষ্ঠানের কাছে বিক্রি বা ভাড়া দেওয়া হয় না।</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>নিরাপদ ক্লাউড ডাটাবেস:</strong> মেধা তালিকা ও প্রোফাইল ডাটা রো-লেভেল সিকিউরিটি (RLS) দ্বারা সংরক্ষিত থাকে।</span>
            </li>
          </ul>
        </section>

        {/* Section 5: Children's Privacy */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#FF6A00] text-white font-black text-xs flex items-center justify-center">
              ৫
            </span>
            <h3 className="font-black text-base sm:text-lg">
              শিশুদের গোপনীয়তা (Children&apos;s Privacy - Under 13)
            </h3>
          </div>
          <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-800 text-xs sm:text-sm font-medium leading-relaxed">
              <strong>Job Master</strong> শুধুমাত্র ১৩ বছর বা তার অধিক বয়সী শিক্ষার্থী ও প্রাপ্তবয়স্ক চাকরিপ্রার্থীদের জন্য প্রণীত। আমরা জেনেশুনে ১৩ বছরের কম বয়সীদের কোনো তথ্য সংগ্রহ করি না। কোনো অপ্রাপ্তবয়স্ক তথ্য প্রদান করে থাকলে অভিভাবকদের অনুরোধক্রমে তা সাথে সাথে স্থায়ীভাবে মুছে ফেলা হবে।
            </p>
          </div>
        </section>

        {/* Section 6: User Rights & Data Deletion */}
        <section className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#FF6A00] text-white font-black text-xs flex items-center justify-center">
              ৬
            </span>
            <h3 className="font-black text-base sm:text-lg">
              অ্যাকাউন্ট ও ডাটা মুছে ফেলার অধিকার (Data Deletion)
            </h3>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            গুগল প্লে স্টোর ও আন্তর্জাতিক নীতিমালা অনুযায়ী ব্যবহারকারীর সংরক্ষিত তথ্য সম্পূর্ণ মুছে ফেলার (Account Deletion) পূর্ণ অধিকার রয়েছে। আপনার অ্যাকাউন্ট ও সকল পরীক্ষার ডাটা মুছে ফেলতে চাইলে আপনার নিবন্ধিত ইমেইল থেকে আমাদের অফিসিয়াল সাপোর্টে মেইল করুন:{" "}
            <a href="mailto:mobileseba247@gmail.com" className="text-orange-600 font-bold underline">
              mobileseba247@gmail.com
            </a>
            । সর্বোচ্চ ৭২ ঘণ্টার মধ্যে যাচাইপূর্বক আপনার সমস্ত রেকর্ড স্থায়ীভাবে রিমুভ করে দেওয়া হবে।
          </p>
        </section>

        {/* Section 7: Contact Card */}
        <section className="bg-gradient-to-br from-orange-50 to-orange-100/70 rounded-2xl p-5 sm:p-7 border border-orange-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FF6A00] text-white rounded-xl shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                Support & Contact
              </span>
              <h3 className="text-base sm:text-xl font-black text-slate-900">
                আমাদের সাথে যোগাযোগ
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="mailto:mobileseba247@gmail.com"
              className="bg-white p-3.5 rounded-xl border border-orange-200/80 shadow-2xs flex items-center gap-2.5 hover:border-orange-400 transition-colors"
            >
              <Mail className="w-4 h-4 text-[#FF6A00] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block">সাপোর্ট ইমেইল</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 truncate block">
                  mobileseba247@gmail.com
                </span>
              </div>
            </a>

            <a
              href="https://jobmaster.com.bd"
              target="_blank"
              rel="noreferrer"
              className="bg-white p-3.5 rounded-xl border border-orange-200/80 shadow-2xs flex items-center gap-2.5 hover:border-orange-400 transition-colors"
            >
              <Globe className="w-4 h-4 text-[#FF6A00] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block">অফিসিয়াল ওয়েবসাইট</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 truncate block">
                  https://jobmaster.com.bd
                </span>
              </div>
            </a>
          </div>

          {/* Bottom Back Button */}
          <div className="pt-2 text-center">
            <button
              onClick={onBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-black text-sm px-8 py-3.5 rounded-xl shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
              id="privacy-back-bottom-btn"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>হোম পেজে ফিরে যান (Back to Home)</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
