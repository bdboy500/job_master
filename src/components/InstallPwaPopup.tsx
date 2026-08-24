"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { Download, X, Check, Info } from "lucide-react";
import JobMasterLogo from "./JobMasterLogo";

interface PwaContextType {
  isStandalone: boolean;
  isIos: boolean;
  bannerDismissed: boolean;
  installedSuccess: boolean;
  canInstall: boolean;
  triggerInstall: () => Promise<void>;
  dismissBanner: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isStandalone: false,
  isIos: false,
  bannerDismissed: false,
  installedSuccess: false,
  canInstall: false,
  triggerInstall: async () => {},
  dismissBanner: () => {},
});

export const usePwa = () => useContext(PwaContext);

// Global installer function callable anywhere
export const triggerNativePwaInstall = async () => {
  if (typeof window !== "undefined") {
    // 1. Check if running inside iframe (e.g., Preview window)
    // Chrome strictly disables beforeinstallprompt in iframes by security policy
    try {
      if (window.self !== window.top) {
        window.open(window.location.href, "_blank");
        return;
      }
    } catch {
      window.open(window.location.href, "_blank");
      return;
    }

    // 2. Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) {
      window.dispatchEvent(
        new CustomEvent("pwa-toast-notify", {
          detail: { message: "Job Master অ্যাপটি ইতিমধ্যে আপনার ফোনে ইনস্টল রয়েছে।" },
        })
      );
      return;
    }

    // 3. Try to prompt native OS install
    const promptEvent = (window as any).__pwaInstallPrompt;
    if (promptEvent && typeof promptEvent.prompt === "function") {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === "accepted") {
          (window as any).__pwaInstallPrompt = null;
          window.dispatchEvent(new Event("appinstalled"));
        }
      } catch (err) {
        console.warn("Direct PWA install prompt error:", err);
      }
    } else {
      // Prompt not ready or in browser without beforeinstallprompt support
      window.dispatchEvent(
        new CustomEvent("pwa-toast-notify", {
          detail: {
            message:
              "ইনস্টল করতে ব্রাউজারের ৩-ডট (⋮) মেনু থেকে 'Install app' বা 'Add to Home screen' চাপুন।",
          },
        })
      );
    }
  }
};

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("Service Worker registration notice:", err);
      });
    }

    if (typeof window !== "undefined") {
      // Check if global prompt already caught
      if ((window as any).__pwaInstallPrompt) {
        setDeferredPrompt((window as any).__pwaInstallPrompt);
      }

      // 2. Check Standalone mode
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;

      setIsStandalone(isStandaloneMode);

      // 3. Detect iOS
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

      // 5. Toast event listener
      const handleToast = (e: any) => {
        if (e.detail?.message) {
          setToastMessage(e.detail.message);
          setTimeout(() => setToastMessage(null), 4000);
        }
      };
      window.addEventListener("pwa-toast-notify", handleToast);

      // 6. Listen for beforeinstallprompt & custom pwa-prompt-available event
      const handleBeforeInstallPrompt = (e: any) => {
        const promptEvt = e.detail || e;
        if (typeof promptEvt.preventDefault === "function") {
          promptEvt.preventDefault();
        }
        (window as any).__pwaInstallPrompt = promptEvt;
        setDeferredPrompt(promptEvt);
      };

      // 7. Listen for appinstalled event
      const handleAppInstalled = () => {
        setIsStandalone(true);
        setDeferredPrompt(null);
        (window as any).__pwaInstallPrompt = null;
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 5000);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("pwa-prompt-available", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("pwa-prompt-available", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("pwa-toast-notify", handleToast);
      };
    }
  }, []);

  const triggerInstall = async () => {
    await triggerNativePwaInstall();
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
        canInstall: !!(deferredPrompt || (typeof window !== "undefined" && (window as any).__pwaInstallPrompt)),
        triggerInstall,
        dismissBanner,
      }}
    >
      {children}
      <InstallPwaPopup />
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[99999] bg-slate-900/95 text-white border border-slate-700 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-fade-in backdrop-blur-md">
          <div className="w-6 h-6 bg-[#FF6A00]/20 text-[#FF6A00] rounded-lg flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}
    </PwaContext.Provider>
  );
}

/* Bottom Sheet Banner (positioned directly above bottom nav: bottom-18 / bottom-6) */
export function BottomInstallBanner() {
  const { isStandalone, bannerDismissed, triggerInstall, dismissBanner } = usePwa();

  // Hide completely if already running in standalone app or banner was dismissed
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
          <JobMasterLogo size={40} className="w-10 h-10 shrink-0" />
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
