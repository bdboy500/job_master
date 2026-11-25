"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Globe,
  GraduationCap,
  Loader2,
  Smartphone,
} from "lucide-react";
import {
  PLAY_STORE_WEB_URL,
  buildAndroidIntentUrl,
  buildCustomSchemeUrl,
  buildWebDestinationPath,
  detectClientEnvironment,
  getAppLinkHttpsUrl,
} from "@/src/lib/app_links";

interface SmartOpenClientProps {
  view?: string;
  id?: string;
  subId?: string;
  q?: string;
}

export default function SmartOpenClient({
  view,
  id,
  subId,
  q,
}: SmartOpenClientProps) {
  const [phase, setPhase] = useState<"checking" | "launching" | "ready">(
    "checking"
  );
  const didLeavePageRef = useRef(false);

  const webDestPath = useMemo(
    () => buildWebDestinationPath({ view, id, subId, q }),
    [view, id, subId, q]
  );

  const targetHttpsUrl = useMemo(
    () => getAppLinkHttpsUrl(webDestPath),
    [webDestPath]
  );

  const intentUrl = useMemo(
    () => buildAndroidIntentUrl(targetHttpsUrl, PLAY_STORE_WEB_URL),
    [targetHttpsUrl]
  );

  const customSchemeUrl = useMemo(
    () => buildCustomSchemeUrl(webDestPath),
    [webDestPath]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const env = detectClientEnvironment();

    // 1. If already inside Job Master Android WebView App or installed Standalone PWA, open destination directly
    if (env.isInsideJobMasterApp) {
      window.location.replace(webDestPath);
      return;
    }

    // 2. If Desktop or iOS (no Play Store Android app), continue seamlessly to the web page
    if (!env.isAndroid) {
      window.location.replace(webDestPath);
      return;
    }

    // 3. Android mobile browser handling
    const handleVisibilityOrHide = () => {
      if (document.hidden || document.visibilityState === "hidden") {
        didLeavePageRef.current = true;
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setPhase("ready");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrHide);
    window.addEventListener("pagehide", handleVisibilityOrHide);
    window.addEventListener("pageshow", handlePageShow);

    const sessionKey = `jobmaster_smart_open_tried_${webDestPath}`;
    let alreadyTried = false;
    try {
      alreadyTried = Boolean(window.sessionStorage.getItem(sessionKey));
    } catch {
      alreadyTried = false;
    }

    if (alreadyTried) {
      // User returned via Back button: show manual action choices without looping
      setPhase("ready");
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityOrHide);
        window.removeEventListener("pagehide", handleVisibilityOrHide);
        window.removeEventListener("pageshow", handlePageShow);
      };
    }

    try {
      window.sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Ignore storage failures
    }

    setPhase("launching");

    // Attempt native app launch via Android intent:// (auto-redirects to Play Store if app is missing in Chrome/Samsung)
    const launchTimer = window.setTimeout(() => {
      try {
        if (!env.isInAppBrowser) {
          window.location.href = intentUrl;
        } else {
          // Many social in-app browsers (FB/Messenger/Instagram) block intent://; try custom scheme then fallback to Play Store
          window.location.href = customSchemeUrl;
        }
      } catch {
        // Fallback handled by timer below
      }
    }, 120);

    // Fallback: if browser stayed visible (e.g., in-app browser didn't launch app or blocked auto-intent), go to Play Store
    const playStoreTimer = window.setTimeout(() => {
      if (
        !didLeavePageRef.current &&
        document.visibilityState === "visible"
      ) {
        setPhase("ready");
        try {
          window.location.href = PLAY_STORE_WEB_URL;
        } catch {
          // Ignore navigation block
        }
      } else {
        setPhase("ready");
      }
    }, 1700);

    return () => {
      window.clearTimeout(launchTimer);
      window.clearTimeout(playStoreTimer);
      document.removeEventListener("visibilitychange", handleVisibilityOrHide);
      window.removeEventListener("pagehide", handleVisibilityOrHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [webDestPath, intentUrl, customSchemeUrl]);

  return (
    <main className="min-h-[100dvh] w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6A00] text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Job <span className="text-[#FF6A00]">Master</span>
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              চাকরি আপনার হাতে • স্মার্ট অ্যাপ লিংক
            </p>
          </div>
        </div>

        <div className="bg-orange-50/70 border border-orange-200/70 rounded-2xl p-4 flex items-center justify-center gap-2.5 text-sm font-bold text-slate-800">
          {phase !== "ready" ? (
            <>
              <Loader2 className="w-4 h-4 text-[#FF6A00] animate-spin shrink-0" />
              <span>অ্যাপে চালু করা হচ্ছে... অ্যাপ না থাকলে Play Store-এ নিয়ে যাওয়া হবে।</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 text-[#FF6A00] shrink-0" />
              <span>নিচের বাটনে ট্যাপ করে অ্যাপে খুলুন অথবা Play Store থেকে ইনস্টল করুন।</span>
            </>
          )}
        </div>

        <div className="space-y-3">
          <a
            href={intentUrl}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#FF6A00] hover:bg-[#e55f00] text-white font-black text-sm shadow-md shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Job Master অ্যাপে খুলুন</span>
          </a>

          <a
            href={PLAY_STORE_WEB_URL}
            className="w-full min-h-[46px] px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>Google Play Store-এ যান</span>
          </a>

          <a
            href={webDestPath}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Globe className="w-4 h-4 text-slate-500 shrink-0" />
            <span>ব্রাউজারেই দেখুন</span>
          </a>
        </div>
      </div>
    </main>
  );
}
