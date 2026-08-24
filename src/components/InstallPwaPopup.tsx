"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { Download, X, Check } from "lucide-react";

interface PwaContextType {
  isStandalone: boolean;
  isIos: boolean;
  bannerDismissed: boolean;
  installedSuccess: boolean;
  triggerInstall: () => void;
  dismissBanner: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isStandalone: false,
  isIos: false,
  bannerDismissed: false,
  installedSuccess: false,
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

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("Service Worker registration failed:", err);
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

    // 6. Listen for appinstalled event (Strict Auto-Hide)
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
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
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    }
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
        triggerInstall,
        dismissBanner,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

/* Bottom Sheet Banner (positioned directly above bottom nav: bottom-16 / bottom-20) */
export function BottomInstallBanner() {
  const { isStandalone, isIos, bannerDismissed, triggerInstall, dismissBanner } = usePwa();

  // Strict Auto-Hide: Hide completely if already installed, running on iOS/iPhone, or banner was dismissed
  if (isStandalone || isIos || bannerDismissed) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[60] animate-slide-up"
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
            onClick={triggerInstall}
            className="bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            id="bottom-banner-install-btn"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>

          <button
            onClick={dismissBanner}
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
