"use client";

import { useState } from "react";
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Globe,
  Clock,
  Send,
  CheckCircle2,
  Headphones,
  GraduationCap,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface ContactUsViewProps {
  onBack: () => void;
}

export default function ContactUsView({ onBack }: ContactUsViewProps) {
  const [quickMsg, setQuickMsg] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("সাধারণ জিজ্ঞাসা");

  const supportTopics = [
    "সাধারণ জিজ্ঞাসা",
    "প্যাকেজ ও সাবস্ক্রিপশন",
    "লাইভ পরীক্ষা ও টাইমার",
    "মেধা তালিকা ও র‍্যাঙ্ক",
    "লগইন বা পাসওয়ার্ড সমস্যা",
    "পরামর্শ বা ফিডব্যাক",
  ];

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const topicPrefix = `[বিষয়: ${selectedTopic}] `;
    const textToSend = quickMsg.trim()
      ? encodeURIComponent(`${topicPrefix}${quickMsg.trim()}`)
      : encodeURIComponent(`${topicPrefix}হ্যালো Job Master সাপোর্ট টিম, আমার একটু সাহায্য দরকার।`);
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/8801830235681?text=${textToSend}`, "_blank");
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 overflow-y-auto pb-16 selection:bg-orange-500 selection:text-white animate-fade-in text-left">
      {/* Top Floating App Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 shadow-xs flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6A00] font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer border border-orange-200/60"
          id="contact-back-top-btn"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>হোমে ফিরুন (Home)</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="bg-[#FF6A00] p-1.5 rounded-xl text-white shadow-xs">
            <Headphones className="w-4 h-4" />
          </div>
          <span className="font-black text-slate-800 text-sm hidden sm:inline">
            Job Master <span className="text-[#FF6A00]">Support</span>
          </span>
        </div>

        <a
          href="https://wa.me/8801830235681"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-colors shadow-xs active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
          <span>WhatsApp Help</span>
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Card */}
        <section className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700/60">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-emerald-400 text-[11px] font-black tracking-wide uppercase">
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>24/7 Dedicated Support</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              যোগাযোগ ও সহায়তা <span className="text-[#FF6A00]">(Contact & Support)</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              Job Master প্ল্যাটফর্ম ব্যবহারকালীন যেকোনো কারিগরি ত্রুটি, লাইভ কুইজ সংক্রান্ত সমস্যা, বা কোর্স ও সাবস্ক্রিপশন সম্পর্কিত তথ্যের জন্য আমাদের সাপোর্ট টিম সর্বদা প্রস্তুত রয়েছে।
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-300 font-semibold border-t border-slate-700/80">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                সরাসরি WhatsApp চালু রয়েছে
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                গড় রেসপন্স টাইম: ৫-১৫ মিনিট
              </span>
            </div>
          </div>
        </section>

        {/* Primary Contact Options Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* WhatsApp Card */}
          <a
            href="https://wa.me/8801830235681?text=Hello%20Job%20Master%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-3xl p-5 border-2 border-emerald-300/80 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
            id="contact-page-whatsapp-card"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-7 h-7 fill-white stroke-none" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-white/90 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Direct WhatsApp
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  হোয়াটসঅ্যাপ হেল্পলাইন
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight block mt-0.5 group-hover:text-emerald-700 transition-colors">
                  01830235681
                </span>
                <p className="text-[11px] text-slate-600 font-medium mt-1">
                  ক্লিক করলে সরাসরি WhatsApp অ্যাপ ওপেন হবে।
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-black text-emerald-800">
              <span>চ্যাট শুরু করুন</span>
              <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-2xs">
                →
              </span>
            </div>
          </a>

          {/* Email Card */}
          <a
            href="mailto:mobileseba247@gmail.com?subject=Job%20Master%20Support%20Query"
            className="group bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-orange-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
            id="contact-page-email-card"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6A00] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  Official Email
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  অফিসিয়াল সাপোর্ট ইমেইল
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight block truncate mt-0.5 group-hover:text-[#FF6A00] transition-colors">
                  mobileseba247@gmail.com
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  যেকোনো বড় অভিযোগ বা অফিসিয়াল অনুসন্ধানের জন্য।
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-black text-slate-700 group-hover:text-[#FF6A00]">
              <span>মেইল পাঠান</span>
              <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </a>
        </section>

        {/* Quick WhatsApp Message Box */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4 fill-white stroke-none" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">
                দ্রুত বার্তা পাঠান (Quick WhatsApp Chat)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                বার্তাটি লিখে পাঠালে সরাসরি আপনার WhatsApp অ্যাপে ওপেন হয়ে যাবে।
              </p>
            </div>
          </div>

          {/* Topic Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">
              বার্তার বিষয় নির্বাচন করুন:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {supportTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    selectedTopic === topic
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendWhatsApp} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                আপনার বার্তা বা প্রশ্ন লিখুন:
              </label>
              <textarea
                rows={3}
                value={quickMsg}
                onChange={(e) => setQuickMsg(e.target.value)}
                placeholder="এখানে বিস্তারিত লিখুন... যেমন: আমার সাবস্ক্রিপশন সক্রিয়করণ বা পরীক্ষার ফলাফল সম্পর্কে জানতে চাই।"
                className="w-full p-3 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-sm py-3.5 rounded-2xl shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              id="contact-page-send-whatsapp-submit"
            >
              <MessageCircle className="w-5 h-5 fill-white stroke-none" />
              <span>WhatsApp-এ মেসেজ পাঠান (01830235681)</span>
            </button>
          </form>
        </section>

        {/* Website & Operating Details */}
        <section className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 space-y-3">
          <h4 className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#FF6A00]" />
            <span>অফিসিয়াল পোর্টাল ও প্লাটফর্ম বিবরণ</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">অফিসিয়াল ওয়েবসাইট</span>
              <a
                href="https://jobmaster.com.bd"
                target="_blank"
                rel="noreferrer"
                className="font-black text-slate-900 hover:text-[#FF6A00] flex items-center gap-1 mt-0.5"
              >
                <span>https://jobmaster.com.bd</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">সাপোর্ট সক্রিয়তা</span>
              <span className="font-black text-emerald-600 block mt-0.5">
                সপ্তাহের ৭ দিন • সকাল ৮টা - রাত ১১টা
              </span>
            </div>
          </div>
        </section>

        {/* Bottom CTA to return home */}
        <div className="pt-2 text-center">
          <button
            onClick={onBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6A00] hover:bg-[#e05e00] text-white font-black text-sm px-8 py-3.5 rounded-xl shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
            id="contact-back-bottom-btn"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>হোম পেজে ফিরে যান (Back to Home)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
