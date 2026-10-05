"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { Download, X, Check, Share, PlusSquare } from "lucide-react";

interface PwaContextType {
  isStandalone: boolean;
  isIos: boolean;
  isNativeApp: boolean;
  bannerDismissed: boolean;
  installedSuccess: boolean;
  canInstall: boolean;
  triggerInstall: () => void;
  dismissBanner: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isStandalone: false,
  isIos: false,
  isNativeApp: false,
  bannerDismissed: false,
  installedSuccess: false,
  canInstall: false,
  triggerInstall: () => {},
  dismissBanner: () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Lightweight Service Worker for PWA compliance
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
        console.warn("Service Worker registration notice:", err);
      });
    }

    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent || "";

      // 2. Detect Android Kotlin Native WebView App
      // In Kotlin WebView, Android typically appends '; wv)' or 'Version/... Chrome/...'
      const isKotlinWebView = 
        Boolean((window as any).AndroidBridge) ||
        Boolean((window as any).isNativeApp) ||
        Boolean((window as any).Android) ||
        /;\s*wv\)/i.test(ua) ||
        (/Android/i.test(ua) && /Version\/[0-9.]+/i.test(ua) && !/Chrome\/[0-9.]+\s+Mobile/i.test(ua));

      if (isKotlinWebView) {
        setIsNativeApp(true);
        setIsStandalone(true);
      }

      // 3. Detect Standalone PWA mode (already installed on homescreen)
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        (navigator as any).standalone === true;

      if (isStandaloneMode) {
        setIsStandalone(true);
      }

      // 4. Detect iOS / Safari
      const isIosDevice =
        /iPhone|iPad|iPod/i.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setIsIos(isIosDevice);

      // 5. Check if user dismissed banner recently (within 24 hours)
      try {
        const lastDismissed = localStorage.getItem("jobmaster_pwa_banner_dismissed");
        if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 24 * 60 * 60 * 1000) {
          setBannerDismissed(true);
        }
      } catch (e) {
        // Ignore localStorage access issues in restricted iframes
      }
    }

    // 6. Listen for beforeinstallprompt event (Chromium, Edge, Samsung Internet)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Ensure banner shows immediately when browser signals installability
      setBannerDismissed(false);
    };

    // 7. Listen for appinstalled event
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
        await deferredPrompt.prompt();
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
      try {
        localStorage.setItem("jobmaster_pwa_banner_dismissed", Date.now().toString());
      } catch (e) {
        // Ignore
      }
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isStandalone,
        isIos,
        isNativeApp,
        bannerDismissed,
        installedSuccess,
        canInstall: Boolean(deferredPrompt) || (isIos && !isStandalone),
        triggerInstall,
        dismissBanner,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

/* Bottom Sheet Install Banner (positioned cleanly above mobile bottom nav) */
export function BottomInstallBanner() {
  const { isStandalone, isIos, isNativeApp, bannerDismissed, canInstall, triggerInstall, dismissBanner } = usePwa();
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Suppress banner if:
  // - Already running inside the Kotlin Android Native WebView App
  // - Already running as an installed standalone PWA
  // - Banner was explicitly closed by user
  // - Cannot be installed or not ready
  if (isNativeApp || isStandalone || bannerDismissed || !canInstall) {
    return null;
  }

  return (
    <>
      <div 
        className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[60] animate-slide-up"
        id="bottom-pwa-install-banner"
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 transition-all">
          
          {/* Left: App Icon & Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-white shadow-sm flex items-center justify-center">
              <img 
                src="/icon-192.png" 
                alt="Job Master Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
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

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isIos ? (
              <button
                onClick={() => setShowIosGuide(true)}
                className="bg-[#0056b3] hover:bg-[#004494] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                id="bottom-banner-ios-guide-btn"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ইনস্টল করুন</span>
              </button>
            ) : (
              <button
                onClick={triggerInstall}
                className="bg-[#0056b3] hover:bg-[#004494] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                id="bottom-banner-install-btn"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ইনস্টল করুন</span>
              </button>
            )}

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

      {/* iOS Safari Guided Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[140] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-2xl relative">
            <button 
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#0056b3] text-white flex items-center justify-center font-black">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">iPhone / iPad-এ ইনস্টল</h3>
                <p className="text-[11px] text-slate-500 font-semibold">Safari ব্রাউজার দিয়ে সহজে হোম স্ক্রিনে আনুন</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-medium">
              <div className="flex items-start gap-2.5">
                <div className="p-1 bg-white rounded-lg border border-slate-200 text-blue-600 shrink-0">
                  <Share className="w-3.5 h-3.5" />
                </div>
                <span>১. নিচের Safari মেনু বারে <strong>Share</strong> বাটনে চাপ দিন।</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="p-1 bg-white rounded-lg border border-slate-200 text-[#0056b3] shrink-0">
                  <PlusSquare className="w-3.5 h-3.5" />
                </div>
                <span>২. একটু স্ক্রোল করে <strong>"Add to Home Screen"</strong> বেছে নিন।</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 bg-[#0056b3] hover:bg-[#004494] text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
            >
              বুঝেছি (Close)
            </button>
          </div>
        </div>
      )}
    </>
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
      <span>Job Master সফলভাবে আপনার ডিভাইসের হোম স্ক্রিনে ইনস্টল করা হয়েছে!</span>
    </div>
  );
}
