"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, Gift, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { getCachedAppSettings, fetchAppSettingsFromDb, PopupNotificationConfig, DEFAULT_POPUP_CONFIG } from "@/src/lib/app_settings";

interface IntroOfferProps {
  onClose?: () => void;
  onAction?: (targetScreen?: string) => void;
}

export default function IntroOffer({ onClose, onAction }: IntroOfferProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [popupConfig, setPopupConfig] = useState<PopupNotificationConfig>(
    getCachedAppSettings().popupNotification || DEFAULT_POPUP_CONFIG
  );

  useEffect(() => {
    let isMounted = true;

    async function checkAndOpen() {
      try {
        const settings = await fetchAppSettingsFromDb();
        const conf = settings.popupNotification || DEFAULT_POPUP_CONFIG;
        if (!isMounted) return;
        setPopupConfig(conf);

        if (conf.enabled === false) {
          return;
        }

        if (typeof window !== "undefined") {
          const frequency = conf.showFrequency || "once_a_day";

          if (frequency === "once_a_day") {
            const dismissedAt = localStorage.getItem("job_master_intro_offer_dismissed");
            const now = Date.now();
            if (dismissedAt && now - Number(dismissedAt) < 24 * 60 * 60 * 1000) {
              return;
            }
          } else if (frequency === "once_per_session") {
            const sessionDismissed = sessionStorage.getItem("job_master_intro_offer_session_dismissed");
            if (sessionDismissed) {
              return;
            }
          }
          // If frequency === "every_visit", we don't block it

          const timer = setTimeout(() => {
            if (isMounted) setIsOpen(true);
          }, 1200);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.warn("Failed to check popup notification settings:", e);
      }
    }

    checkAndOpen();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("job_master_intro_offer_dismissed", Date.now().toString());
      sessionStorage.setItem("job_master_intro_offer_session_dismissed", "true");
    }
    if (onClose) onClose();
  };

  const handleClaim = () => {
    handleDismiss();
    const actionType = popupConfig.buttonActionType || "screen";
    const actionVal = popupConfig.buttonActionValue || "all-live-exams";

    if (actionType === "url" && actionVal) {
      if (actionVal.startsWith("http://") || actionVal.startsWith("https://")) {
        window.open(actionVal, "_blank");
      } else {
        window.location.href = actionVal;
      }
    } else {
      if (onAction) onAction(actionVal);
    }
  };

  if (!isOpen || popupConfig.enabled === false) return null;

  const points = Array.isArray(popupConfig.points) && popupConfig.points.length > 0 
    ? popupConfig.points 
    : DEFAULT_POPUP_CONFIG.points || [];

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="relative bg-white rounded-[2rem] p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-orange-100 overflow-hidden space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Decorative background glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer z-10"
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4 stroke-[2.5px]" />
        </button>

        {/* Optional Banner Image or Header Icon */}
        {popupConfig.bannerImageUrl && popupConfig.bannerImageUrl.trim() !== "" ? (
          <div className="w-full h-32 rounded-2xl overflow-hidden shadow-md bg-slate-100 border border-slate-200/80 relative">
            <img 
              src={popupConfig.bannerImageUrl} 
              alt="Announcement Banner" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Gift className="w-7 h-7 stroke-[2.5px] animate-bounce" />
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          {popupConfig.badgeText && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#FF6A00] text-[11px] font-black tracking-tight">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{popupConfig.badgeText}</span>
            </div>
          )}

          <h3 className="text-lg font-black text-slate-900 leading-snug">
            {popupConfig.title || "প্রথমবার প্রস্তুতি শুরু করুন"}{" "}
            {popupConfig.highlightText && (
              <span className="text-[#FF6A00]">{popupConfig.highlightText}</span>
            )}
          </h3>

          {popupConfig.message && (
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {popupConfig.message}
            </p>
          )}
        </div>

        {/* Highlight Perks / Points */}
        {points.length > 0 && (
          <div className="space-y-1.5 py-1">
            {points.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  idx % 2 === 0 ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {idx % 2 === 0 ? <Zap className="w-3 h-3 stroke-[2.5px]" /> : <ShieldCheck className="w-3 h-3 stroke-[2.5px]" />}
                </div>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleClaim}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF6A00] to-[#FF4E00] hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{popupConfig.buttonText || "এখনই পরীক্ষা দিন"}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            {popupConfig.cancelButtonText || "পরে দেখব"}
          </button>
        </div>
      </div>
    </div>
  );
}
