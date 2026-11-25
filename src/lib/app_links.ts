export const ANDROID_PACKAGE_ID = "com.bd.jobmaster.app";
export const PLAY_STORE_WEB_URL =
  "https://play.google.com/store/apps/details?id=com.bd.jobmaster.app";
export const PLAY_STORE_MARKET_URL =
  "market://details?id=com.bd.jobmaster.app";
export const APP_CUSTOM_SCHEME = "jobmaster";
export const PRODUCTION_WEB_ORIGIN = "https://jobmaster.com.bd";

export interface ClientEnvInfo {
  isInsideJobMasterApp: boolean;
  isAndroid: boolean;
  isIos: boolean;
  isMobileDevice: boolean;
  isStandalonePwa: boolean;
  isInAppBrowser: boolean;
}

export function detectClientEnvironment(): ClientEnvInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isInsideJobMasterApp: false,
      isAndroid: false,
      isIos: false,
      isMobileDevice: false,
      isStandalonePwa: false,
      isInAppBrowser: false,
    };
  }

  const ua = navigator.userAgent || "";

  const isAndroid = /Android/i.test(ua);
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isAndroidWebView =
    /;\s*wv\b/i.test(ua) ||
    (/\bwv\b/i.test(ua) && isAndroid) ||
    (/Version\/[0-9.]+/i.test(ua) && /Chrome\/[0-9.]+/i.test(ua) && isAndroid);

  const isStandalonePwa =
    (typeof window.matchMedia === "function" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches)) ||
    (navigator as any).standalone === true ||
    Boolean(document.referrer && document.referrer.includes("android-app://"));

  const hasAndroidBridge = Boolean(
    (window as any).AndroidBridge ||
      (window as any).AndroidInterface ||
      (window as any).Android ||
      (window as any).isNativeApp ||
      (window as any).isJobMasterApp
  );

  // Known social/chat in-app browsers (Facebook, Messenger, Instagram, WhatsApp, Telegram)
  const isInAppBrowser =
    /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|Twitter|Telegram/i.test(ua);

  const isInsideJobMasterApp =
    hasAndroidBridge ||
    ua.includes(ANDROID_PACKAGE_ID) ||
    ua.includes("JobMasterApp") ||
    (isAndroidWebView && !isInAppBrowser) ||
    isStandalonePwa;

  const isMobileUA =
    isAndroid ||
    isIos ||
    /webOS|BlackBerry|IEMobile|Opera Mini|Tablet|Mobile/i.test(ua);

  return {
    isInsideJobMasterApp,
    isAndroid,
    isIos,
    isMobileDevice: isMobileUA,
    isStandalonePwa,
    isInAppBrowser,
  };
}

export function buildWebDestinationPath(params: {
  view?: string | null;
  id?: string | null;
  subId?: string | null;
  q?: string | null;
}): string {
  const sp = new URLSearchParams();
  if (params.view && params.view !== "home") {
    sp.set("view", params.view);
  }
  if (params.id) {
    sp.set("id", params.id);
  }
  if (params.subId) {
    sp.set("subId", params.subId);
  }
  if (params.q) {
    sp.set("q", params.q);
  }
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

/**
 * Builds the canonical HTTPS URL targeted by Android App Links.
 * On production (jobmaster.com.bd / www.jobmaster.com.bd) uses current origin;
 * otherwise targets PRODUCTION_WEB_ORIGIN so AndroidManifest host filter matches.
 */
export function getAppLinkHttpsUrl(webDestPath: string): string {
  if (typeof window === "undefined") {
    return `${PRODUCTION_WEB_ORIGIN}${webDestPath}`;
  }
  const host = window.location.hostname.toLowerCase();
  const origin =
    host === "jobmaster.com.bd" || host === "www.jobmaster.com.bd"
      ? window.location.origin
      : PRODUCTION_WEB_ORIGIN;
  const normalizedPath = webDestPath.startsWith("/") ? webDestPath : `/${webDestPath}`;
  return `${origin}${normalizedPath}`;
}

/**
 * Builds Google's official Android intent:// URI with Play Store fallback:
 * - If com.bd.jobmaster.app is installed -> opens the app on the exact target URL.
 * - If NOT installed -> Android browser automatically opens Play Store listing.
 */
export function buildAndroidIntentUrl(
  targetHttpsUrl: string,
  fallbackUrl: string = PLAY_STORE_WEB_URL
): string {
  try {
    const parsed = new URL(targetHttpsUrl);
    const scheme = parsed.protocol.replace(":", "") || "https";
    const pathAndQuery = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
    const encodedFallback = encodeURIComponent(fallbackUrl);
    return `intent://${pathAndQuery}#Intent;scheme=${scheme};package=${ANDROID_PACKAGE_ID};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodedFallback};end`;
  } catch {
    const encodedFallback = encodeURIComponent(fallbackUrl);
    return `intent://jobmaster.com.bd/#Intent;scheme=https;package=${ANDROID_PACKAGE_ID};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodedFallback};end`;
  }
}

export function buildCustomSchemeUrl(webDestPath: string): string {
  const normalizedPath = webDestPath.startsWith("/") ? webDestPath.slice(1) : webDestPath;
  return `${APP_CUSTOM_SCHEME}://open${normalizedPath.startsWith("?") ? normalizedPath : normalizedPath ? `/${normalizedPath}` : ""}`;
}
