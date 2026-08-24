"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, Gift, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { PopupNotificationConfig, DEFAULT_POPUP_NOTIFICATION, getCachedAppSettings, fetchAppSettingsFromDb } from "@/src/lib/app_settings";

interface IntroOfferProps {
  onClose?: () => void;
  onAction?: (actionType?: string, customUrl?: string) => void;
}

export default function IntroOffer({ onClose, onAction }: IntroOfferProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<PopupNotificationConfig>(() => {
    const cached = getCachedAppSettings();
    return cached.popupNotification || DEFAULT_POPUP_NOTIFICATION;
  });

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        const settings = await fetchAppSettingsFromDb();
        if (isMounted && settings?.popupNotification) {
          setConfig(settings.popupNotification);
        }
      } catch (err) {
        console.warn("Failed to load popup notification config:", err);
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // If popup is turned off in admin settings, do not show at all
    if (config.enabled === false) {
      setIsOpen(false);
      return;
    }

    if (typeof window !== "undefined") {
      const dismissedAt = localStorage.getItem("job_master_intro_offer_dismissed");
      const now = Date.now();
      const shouldShow =
        !config.showOncePerDay ||
        !dismissedAt ||
        now - Number(dismissedAt) > 24 * 60 * 60 * 1000;

      if (shouldShow) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [config.enabled, config.showOncePerDay]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("job_master_intro_offer_dismissed", Date.now().toString());
    }
    if (onClose) onClose();
  };

  const handleClaim = () => {
    handleDismiss();
    if (onAction) {
      onAction(config.actionType || "all-live-exams", config.customUrl || "");
    }
  };

  if (!isOpen || config.enabled === false) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="relative bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-orange-100 overflow-hidden space-y-4">
        {/* Decorative background glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
          title="বন্ধ করুন"
          id="popup-notification-close-btn"
        >
          <X className="w-4 h-4 stroke-[2.5px]" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Gift className="w-7 h-7 stroke-[2.5px] animate-bounce" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#FF6A00] text-[11px] font-black tracking-tight">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{config.badgeText || "বিশেষ বিজ্ঞপ্তি"}</span>
          </div>

          <h3 className="text-lg font-black text-slate-900 leading-snug">
            {config.title || "প্রথমবার প্রস্তুতি শুরু করুন সম্পূর্ণ ফ্রিতে!"}
          </h3>

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {config.description || "বিসিএস, প্রাইমারি ও ব্যাংক পরীক্ষার লাইভ মডেল টেস্ট, ব্যাখ্যাসহ বিগত সালের প্রশ্ন ও ডেইলি রুটিন প্র্যাকটিস করুন যেকোনো সময়।"}
          </p>
        </div>

        {/* Highlight Perks */}
        {(config.perk1 || config.perk2) && (
          <div className="space-y-1.5 py-1">
            {config.perk1 && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 stroke-[2.5px]" />
                </div>
                <span>{config.perk1}</span>
              </div>
            )}
            {config.perk2 && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3 h-3 stroke-[2.5px]" />
                </div>
                <span>{config.perk2}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleClaim}
            id="popup-notification-action-btn"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF6A00] to-[#FF4E00] hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{config.buttonText || "এখনই দেখুন"}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            পরে দেখব
          </button>
        </div>
      </div>
    </div>
  );
}
