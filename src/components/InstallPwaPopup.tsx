"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { Download, X, Check, Smartphone, Share2, PlusSquare, MoreVertical, Sparkles } from "lucide-react";

interface PwaContextType {
  isStandalone: boolean;
  isIos: boolean;
  bannerDismissed: boolean;
  installedSuccess: boolean;
  showGuideModal: boolean;
  setShowGuideModal: (show: boolean) => void;
  triggerInstall: () => void;
  dismissBanner: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isStandalone: false,
  isIos: false,
  bannerDismissed: false,
  installedSuccess: false,
  showGuideModal: false,
  setShowGuideModal: () => {},
  triggerInstall: () => {},
  dismissBanner: () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("Service Worker registration notice:", err);
      });
    }

    if (typeof window !== "undefined") {
      // 2. Check Standalone mode
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;

      setIsStandalone(isStandaloneMode);

      // 3. Detect iOS / iPhone / iPad
      const ua = window.navigator.userAgent || "";
      const isIosDevice = /iPhone|iPad|iPod/i.test(ua) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIos(isIosDevice);

      // 4. Check localStorage for dismissal
      const lastDismissed = localStorage.getItem("jobmaster_pwa_banner_dismissed");
      const isDismissed = lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000;
      if (isDismissed) {
        setBannerDismissed(true);
      }
    }

    // 5. Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 6. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    const handleTriggerCustom = () => {
      setShowGuideModal(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("trigger-pwa-install", handleTriggerCustom);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleTriggerCustom);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsStandalone(true);
          setInstalledSuccess(true);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn("Deferred install prompt error:", err);
      }
    }
    // Fallback: If browser doesn't support direct programmatic prompt, show guided install modal
    setShowGuideModal(true);
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("jobmaster_pwa_banner_dismissed", Date.now().toString());
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isStandalone,
        isIos,
        bannerDismissed,
        installedSuccess,
        showGuideModal,
        setShowGuideModal,
        triggerInstall,
        dismissBanner,
      }}
    >
      {children}
      <PwaGuideModal />
      <InstallPwaPopup />
    </PwaContext.Provider>
  );
}

/* Guided Modal for Android / iOS / Desktop */
export function PwaGuideModal() {
  const { showGuideModal, setShowGuideModal, isIos } = usePwa();

  if (!showGuideModal) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="relative bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-orange-100 overflow-hidden space-y-4">
        {/* Close Button */}
        <button
          onClick={() => setShowGuideModal(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4 stroke-[2.5px]" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Smartphone className="w-6 h-6 stroke-[2.2px]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-[#FF6A00] uppercase tracking-wider">
              {isIos ? "iOS / Safari" : "Android / Chrome"}
            </span>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Job Master অ্যাপ ইনস্টল করুন
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          আপনার মোবাইলের হোম স্ক্রিনে সরাসরি অ্যাপের মতো ব্যবহার করতে নিচের সহজ ধাপগুলো অনুসরণ করুন:
        </p>

        {/* Instructions */}
        {isIos ? (
          <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs font-bold text-slate-700">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center shrink-0 font-black text-xs">
                ১
              </div>
              <p className="pt-0.5">
                Safari ব্রাউজারের নিচে থাকা <span className="text-blue-600 font-black inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 inline" /> Share</span> বাটনে ট্যাপ করুন।
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center shrink-0 font-black text-xs">
                ২
              </div>
              <p className="pt-0.5">
                মেনু স্ক্রল করে <span className="text-slate-900 font-black inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline text-[#FF6A00]" /> Add to Home Screen</span> অপশন চাপুন।
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center shrink-0 font-black text-xs">
                ৩
              </div>
              <p className="pt-0.5">
                উপরে ডানে <span className="text-[#FF6A00] font-black">"Add"</span> বাটনে চাপলে হোম স্ক্রিনে অ্যাপ আইকন চলে আসবে!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs font-bold text-slate-700">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center shrink-0 font-black text-xs">
                ১
              </div>
              <p className="pt-0.5">
                Chrome ব্রাউজারের উপরে ডানে থাকা <span className="text-slate-900 font-black inline-flex items-center gap-0.5"><MoreVertical className="w-3.5 h-3.5 inline text-[#FF6A00]" /> ৩-ডট</span> মেনুতে ট্যাপ করুন।
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center shrink-0 font-black text-xs">
                ২
              </div>
              <p className="pt-0.5">
                মেনু থেকে <span className="text-[#FF6A00] font-black">"Install app"</span> অথবা <span className="text-slate-900 font-black">"Add to Home screen"</span> নির্বাচন করুন।
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center shrink-0 font-black text-xs">
                ৩
              </div>
              <p className="pt-0.5">
                <span className="text-emerald-600 font-black">"Install"</span> কনফার্ম করলেই অ্যাপটি দ্রুত ডাউনলোড হয়ে যাবে!
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowGuideModal(false)}
          className="w-full py-3 px-4 bg-[#FF6A00] hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
        >
          বুঝেছি, ধন্যবাদ
        </button>
      </div>
    </div>
  );
}

/* Bottom Sheet Banner (positioned directly above bottom nav: bottom-16 / bottom-20) */
export function BottomInstallBanner() {
  const { isStandalone, bannerDismissed, triggerInstall, dismissBanner } = usePwa();

  // Strict Auto-Hide: Hide completely if already running in standalone app or banner was dismissed
  if (isStandalone || bannerDismissed) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-18 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[60] animate-slide-up"
      id="bottom-pwa-install-banner"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 transition-all">
        
        {/* Left: App Icon & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-[#FAF9F6] shadow-sm">
            <img 
              src="/icon.svg" 
              alt="Job Master Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 leading-tight">
            <h4 className="font-extrabold text-xs text-white truncate tracking-tight flex items-center gap-1">
              Install Job Master App
            </h4>
            <p className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
              চাকরি প্রস্তুতি এখন আরও সহজ ও দ্রুত!
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerInstall();
            }}
            className="bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            id="bottom-banner-install-btn"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dismissBanner();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="বন্ধ করুন"
            id="bottom-banner-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

/* Success Toast when installed */
export function InstallPwaPopup() {
  const { installedSuccess } = usePwa();

  if (!installedSuccess) return null;

  return (
    <div className="fixed top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[9999] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-fade-in">
      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
        <Check className="w-4 h-4 text-white stroke-[3]" />
      </div>
      <span>Job Master সফলভাবে আপনার মোবাইলের হোম স্ক্রিনে ইনস্টল করা হয়েছে!</span>
    </div>
  );
}
