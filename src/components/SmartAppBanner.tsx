"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";
import {
  PLAY_STORE_WEB_URL,
  buildAndroidIntentUrl,
  detectClientEnvironment,
  getAppLinkHttpsUrl,
} from "@/src/lib/app_links";

const DISMISS_STORAGE_KEY = "jobmaster_smart_app_banner_dismissed";

export default function SmartAppBanner() {
  const [visible, setVisible] = useState(false);
  const [intentHref, setIntentHref] = useState<string>(PLAY_STORE_WEB_URL);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const env = detectClientEnvironment();
    // Show ONLY on Android mobile browsers outside the native WebView app & standalone PWA
    if (!env.isAndroid || env.isInsideJobMasterApp) {
      setVisible(false);
      return;
    }

    try {
      const dismissedAt = window.localStorage.getItem(DISMISS_STORAGE_KEY);
      if (
        dismissedAt &&
        Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000
      ) {
        return;
      }
    } catch {
      // Ignore storage errors
    }

    const currentPath =
      window.location.pathname === "/open"
        ? `/${window.location.search || ""}`
        : `${window.location.pathname}${window.location.search || ""}`;
    const httpsTarget = getAppLinkHttpsUrl(currentPath || "/");
    setIntentHref(
      env.isInAppBrowser
        ? PLAY_STORE_WEB_URL
        : buildAndroidIntentUrl(httpsTarget, PLAY_STORE_WEB_URL)
    );
    setVisible(true);
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between gap-2.5 border-b border-slate-800 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-[#FF6A00] flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-xs font-extrabold text-white truncate">
            Job Master অ্যাপে খুলুন
          </p>
          <p className="text-[10px] font-medium text-slate-300 truncate">
            অ্যাপ না থাকলে Play Store থেকে ইনস্টল করুন
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={intentHref}
          className="px-3 py-1.5 rounded-lg bg-[#FF6A00] hover:bg-[#e55f00] text-white text-[11px] font-black whitespace-nowrap active:scale-95 transition-all"
        >
          অ্যাপে খুলুন
        </a>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="বন্ধ করুন"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
