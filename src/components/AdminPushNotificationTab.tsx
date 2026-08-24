"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Send, 
  Smartphone, 
  RefreshCw, 
  Clock, 
  Users, 
  ExternalLink,
  Sparkles,
  Zap,
  Award,
  BookOpen,
  Calendar,
  Search,
  SmartphoneNfc
} from "lucide-react";
import { ExamPaper } from "../lib/exams";
import { PushHistoryItem } from "../app/api/admin/push/route";

interface AdminPushNotificationTabProps {
  examPapers: ExamPaper[];
  triggerNotification: (type: "success" | "error", message: string) => void;
}

export default function AdminPushNotificationTab({
  examPapers,
  triggerNotification
}: AdminPushNotificationTabProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<"all" | "user" | "segment">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [deepLinkType, setDeepLinkType] = useState<"none" | "live_exam" | "all-live-exams" | "courses" | "routine" | "quiz">("all-live-exams");
  const [selectedExamId, setSelectedExamId] = useState<string>(examPapers[0]?.id || "");
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<PushHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/push", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history)) {
          setHistory(data.history);
        }
      }
    } catch (e) {
      console.warn("Failed to load push history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Quick Notification Template Presets
  const PRESET_TEMPLATES = [
    {
      id: "live_exam_start",
      icon: Zap,
      label: "🚨 লাইভ পরীক্ষা শুরু",
      bg: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200",
      title: "🚨 লাইভ মডেল টেস্ট শুরু হয়েছে!",
      message: "৪৬তম বিসিএস স্পেশাল পূর্ণাঙ্গ মডেল টেস্ট এখন লাইভ। এখনই পরীক্ষায় অংশ নিয়ে মেধা তালিকায় স্থান নিশ্চিত করুন।",
      deepLinkType: "all-live-exams" as const,
    },
    {
      id: "exam_result",
      icon: Award,
      label: "🏆 ফলাফল ও মেধা তালিকা",
      bg: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200",
      title: "🏆 মেধা তালিকা ও ফলাফল প্রকাশিত হয়েছে!",
      message: "আজকের মডেল টেস্টের পূর্ণাঙ্গ ফলাফল ও লিডারবোর্ড প্রকাশিত হয়েছে। আপনার প্রাপ্ত নম্বর ও পজিশন দেখতে এখনই ট্যাপ করুন।",
      deepLinkType: "quiz" as const,
    },
    {
      id: "routine_reminder",
      icon: Calendar,
      label: "⏰ পড়ার রুটিন রিমাইন্ডার",
      bg: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200",
      title: "⏰ আজকের পড়ার রুটিন রিভিশন টাইম!",
      message: "আপনার আজকের পড়ার রুটিনের নির্ধারিত টপিকগুলো সম্পন্ন করুন এবং কুইজ প্র্যাকটিস দিয়ে প্রস্তুতি ঝালিয়ে নিন।",
      deepLinkType: "routine" as const,
    },
    {
      id: "new_course",
      icon: BookOpen,
      label: "📚 নতুন কোর্স ও প্রস্তুতি",
      bg: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
      title: "📚 নতুন এক্সক্লুসিভ কোর্স আপডেট!",
      message: "জব মাস্টার প্রিপারেশন হাবে নতুন সাজেস্টিভ কোর্স ও অধ্যায়ভিত্তিক প্রশ্ন ব্যাংক যুক্ত করা হয়েছে।",
      deepLinkType: "courses" as const,
    },
  ];

  const applyTemplate = (t: typeof PRESET_TEMPLATES[0]) => {
    setTitle(t.title);
    setMessage(t.message);
    setDeepLinkType(t.deepLinkType);
    triggerNotification("success", `"${t.label}" টেমপ্লেটটি ফর্মে যুক্ত হয়েছে!`);
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      triggerNotification("error", "দয়া করে নোটিফিকেশনের শিরোনাম এবং বার্তা উভয়ই পূরণ করুন।");
      return;
    }

    if (targetType === "user" && !targetUserId.trim()) {
      triggerNotification("error", "দয়া করে নির্দিষ্ট ইউজারের আইডি বা ইমেইল লিখুন।");
      return;
    }

    setIsSending(true);
    try {
      const deepLinkData: any = {};
      if (deepLinkType === "live_exam") {
        deepLinkData.type = "live_exam";
        deepLinkData.targetId = selectedExamId || examPapers[0]?.id || "";
      } else if (deepLinkType !== "none") {
        deepLinkData.type = deepLinkType;
      }

      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetType,
          targetUserId: targetType === "user" ? targetUserId.trim() : undefined,
          deepLinkData: Object.keys(deepLinkData).length > 0 ? deepLinkData : undefined,
          adminSecret: "jobmaster_admin_secret_key",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "নোটিফিকেশন পাঠাতে ব্যর্থ হয়েছে");
      }

      triggerNotification(
        "success", 
        `🚀 পুশ নোটিফিকেশন সফলভাবে পাঠানো হয়েছে! (${data.recipients || 0} টি ডিভাইসের স্ট্যাটাস বারে ডেলিভার্ড)`
      );

      // Reset form
      setTitle("");
      setMessage("");

      // Reload sent history
      await loadHistory();
    } catch (err: any) {
      triggerNotification("error", `ত্রুটি: ${err.message || "পুশ নোটিফিকেশন পাঠানো যায়নি"}`);
    } finally {
      setIsSending(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      (item.title || "").toLowerCase().includes(q) ||
      (item.message || "").toLowerCase().includes(q) ||
      (item.targetType || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Top Banner & Status Row */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <Bell className="w-6 h-6 stroke-[2.2px] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black bg-orange-100 text-[#FF6A00] px-2 py-0.5 rounded-full uppercase tracking-wider">
                ONESIGNAL PUSH DISPATCHER
              </span>
              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                BACKGROUND ALERTS READY
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              পুশ নোটিফিকেশন হাব (Push Notification Broadcast)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              অ্যাপ বন্ধ থাকলেও ইউজারদের মোবাইলের স্ট্যাটাস বার ও লক স্ক্রিনে নোটিফিকেশন পাঠানো হবে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl text-xs">
          <Smartphone className="w-4 h-4 text-[#FF6A00]" />
          <span className="font-extrabold text-slate-700">টার্গেট রিচ:</span>
          <span className="font-black text-[#FF6A00]">১,৪৫০+ অ্যাক্টিভ ডিভাইস</span>
        </div>
      </div>

      {/* Main Grid: Composer on Left, Live Mobile Preview & History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 Cols): Notification Composer Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-50 text-[#FF6A00] rounded-lg flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 stroke-[2.2px]" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  নতুন নোটিফিকেশন পাঠান (Compose Push Notification)
                </h3>
              </div>
            </div>

            {/* Quick 1-Click Templates */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>দ্রুত নোটিফিকেশন টেমপ্লেট (1-Click Presets)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className={`p-2.5 rounded-xl border text-[11px] font-black transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${tpl.bg}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="leading-tight">{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSendPush} className="space-y-4 pt-1">
              
              {/* Notification Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase flex items-center justify-between pl-1">
                  <span>নোটিফিকেশন শিরোনাম (Title) *</span>
                  <span className="text-[10px] text-slate-400 font-bold">{title.length}/60 অক্ষর</span>
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="যেমন: 🚨 ৪৬তম বিসিএস লাইভ মডেল টেস্ট শুরু হয়েছে!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Notification Message */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase flex items-center justify-between pl-1">
                  <span>বার্তা / বিস্তারিত বিবরণ (Message Body) *</span>
                  <span className="text-[10px] text-slate-400 font-bold">{message.length}/150 অক্ষর</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={150}
                  placeholder="যেমন: আজকের বিশেষ পূর্ণাঙ্গ মডেল টেস্ট এখন লাইভ। নির্ধারিত সময় শেষ হওয়ার আগেই পরীক্ষায় অংশ নিয়ে আপনার মেধা স্কোর যাচাই করুন।"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none transition-all resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Target Audience & Deep Link Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Target Audience */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                    প্রাপক নির্বাচন (Target Audience)
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all">📢 সকল নিবন্ধিত শিক্ষার্থী (All Users)</option>
                    <option value="segment">⚡ সক্রিয় গ্রাহক (Active Segment)</option>
                    <option value="user">🎯 নির্দিষ্ট শিক্ষার্থী (Specific User)</option>
                  </select>
                </div>

                {/* Deep Link Action */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                    ক্লিক অ্যাকশন (Deep Link Action)
                  </label>
                  <select
                    value={deepLinkType}
                    onChange={(e) => setDeepLinkType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="all-live-exams">📋 সকল লাইভ পরীক্ষার তালিকা</option>
                    <option value="live_exam">📝 নির্দিষ্ট লাইভ পরীক্ষা (Direct Exam)</option>
                    <option value="courses">📚 কোর্স ও প্রিপারেশন হাব</option>
                    <option value="routine">⏰ দৈনিক পড়ার রুটিন</option>
                    <option value="quiz">🏆 কুইজ গেম ও লিডারবোর্ড</option>
                    <option value="none">🏠 সাধারণ ওপেন (Home App)</option>
                  </select>
                </div>

              </div>

              {/* Conditional: Specific User Input */}
              {targetType === "user" && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1 animate-fade-in">
                  <label className="text-[11px] font-black text-blue-900 uppercase block">
                    ইউজার আইডি বা ইমেইল (Supabase User ID or Email) *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: user_12345 অথবা student@gmail.com"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full bg-white border border-blue-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    required={targetType === "user"}
                  />
                </div>
              )}

              {/* Conditional: Specific Live Exam Selector */}
              {deepLinkType === "live_exam" && (
                <div className="p-3.5 bg-orange-50/70 border border-orange-100 rounded-2xl space-y-1 animate-fade-in">
                  <label className="text-[11px] font-black text-orange-900 uppercase block">
                    নির্দিষ্ট পরীক্ষা নির্বাচন করুন (Select Target Exam Paper) *
                  </label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full bg-white border border-orange-200 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {examPapers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.examDate || p.status}) - {p.questionCount || 10} টি প্রশ্ন
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-50 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full sm:w-auto bg-[#FF6A00] hover:bg-orange-600 disabled:bg-slate-400 text-white font-black text-xs sm:text-sm px-7 py-3.5 rounded-2xl active:scale-95 transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>নোটিফিকেশন পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 stroke-[2.5px]" />
                      <span>পুশ নোটিফিকেশন পাঠান (Send Push Now)</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>

        {/* Right Column (5 Cols): Live Mobile Status Bar Preview & Sent History */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Live Mobile Status Bar & Lock Screen Preview Card */}
          <div className="bg-slate-900 text-white rounded-[2rem] p-5 sm:p-6 shadow-xl space-y-4 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SmartphoneNfc className="w-4 h-4 text-[#FF6A00]" />
                <span className="text-xs font-black text-slate-200">
                  মোবাইল স্ট্যাটাস বার প্রিভিউ (Lock Screen Mockup)
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Android / iOS
              </span>
            </div>

            {/* Mockup Notification Banner */}
            <div className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-4 space-y-2 shadow-lg backdrop-blur-sm transition-all text-left">
              
              {/* Header */}
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-[#FF6A00] rounded-md flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                    JM
                  </div>
                  <span className="font-extrabold text-white tracking-wide">JOB MASTER</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-[10px] text-slate-400">এখনই (Just now)</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#FF6A00]"></span>
              </div>

              {/* Title */}
              <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                {title.trim() || "🚨 লাইভ মডেল টেস্ট শুরু হয়েছে!"}
              </h4>

              {/* Body Message */}
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium line-clamp-2">
                {message.trim() || "৪৬তম বিসিএস স্পেশাল পূর্ণাঙ্গ মডেল টেস্ট এখন লাইভ। এখনই পরীক্ষায় অংশ নিয়ে মেধা তালিকায় স্থান নিশ্চিত করুন।"}
              </p>

              {/* Action Badge */}
              <div className="pt-1.5 flex items-center justify-between text-[10px] font-extrabold text-orange-400 border-t border-slate-700/60">
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {deepLinkType === "live_exam" 
                    ? "পরীক্ষাটি চালু করতে ট্যাপ করুন" 
                    : deepLinkType === "quiz" 
                    ? "লিডারবোর্ড দেখতে ট্যাপ করুন"
                    : deepLinkType === "routine"
                    ? "রুটিন দেখতে ট্যাপ করুন"
                    : "অ্যাপে দেখতে ট্যাপ করুন"}
                </span>
                <span className="text-slate-500">সোয়াইপ করে দেখুন</span>
              </div>

            </div>

            <p className="text-[10px] text-slate-400 leading-normal text-center">
              💡 ব্যবহারকারী অ্যাপ বন্ধ রাখলেও মোবাইলের উপরে এই নোটিফিকেশন পপআপ প্রদর্শিত হবে।
            </p>
          </div>

          {/* 2. Sent Broadcast History Log */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
                  পাঠানো নোটিফিকেশন হিস্ট্রি ({history.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={loadHistory}
                disabled={isLoadingHistory}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin text-[#FF6A00]" : ""}`} />
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="হিস্ট্রি খুঁজুন..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            {/* History List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                  কোনো হিস্ট্রি পাওয়া যায়নি
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-1.5 text-left hover:border-orange-200 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-black text-slate-800 line-clamp-1">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                        item.status === "delivered" 
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {item.status === "delivered" ? "ডেলিভার্ড" : "সিমুলেটেড"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-bold">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {item.recipientsCount} জন প্রাপক
                      </span>
                      <span>
                        {new Date(item.sentAt).toLocaleTimeString("bn-BD", { 
                          timeZone: "Asia/Dhaka", 
                          hour: "2-digit", 
                          minute: "2-digit",
                          hour12: true 
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
