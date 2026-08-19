"use client";

import React from "react";
import { Bell, ShieldCheck, X, Sparkles } from "lucide-react";

interface PushPermissionModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function PushPermissionModal({
  isOpen,
  onAccept,
  onDismiss,
}: PushPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="relative bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-orange-100 space-y-4">
        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Bell Animation Icon */}
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6A00] flex items-center justify-center shadow-inner">
          <Bell className="w-6 h-6 animate-bounce" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#FF6A00] bg-orange-50 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span>পরীক্ষার আপডেট</span>
          </div>
          <h3 className="text-base font-black text-slate-800 leading-snug">
            লাইভ পরীক্ষার নোটিফিকেশন চালু করুন
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            নতুন লাইভ মডেল টেস্টের সময়সূচি, পরীক্ষার ফলাফল ও গুরুত্বপূর্ণ নোটিশ সাথে সাথে পেতে নোটিফিকেশন চালু রাখুন।
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={onAccept}
            className="w-full py-3 bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Bell className="w-4 h-4" />
            <span>নোটিফিকেশন চালু করুন</span>
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            এখন নয়
          </button>
        </div>
      </div>
    </div>
  );
}
