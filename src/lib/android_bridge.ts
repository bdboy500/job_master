export interface AndroidBridgeInterface {
  showInterstitialAd?: () => void;
  showRewardedAd?: () => void;
  onActionEvent?: (eventName: string) => void;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridgeInterface;
    onAndroidAdOpened?: () => void;
    onAndroidAdClosed?: () => void;
  }
}

export type AndroidAdActionEvent =
  | "start_exam"
  | "submit_exam"
  | "view_exam_result"
  | "start_quiz"
  | "quiz_next_3"
  | "quiz_next_6"
  | "quiz_replay_reward"
  | "quiz_rankings_reward"
  | "open_cv_maker_reward"
  | "job_circular_post_click"
  | "view_quiz_result"
  | "view_leaderboard"
  | "open_question_paper"
  | "download_circular"
  | "download_cv_pdf";

let androidAdsSuppressed = false;
let adPlayingState = false;
let sawFocusLostSinceAdTrigger = false;
let adTriggerTimestamp = 0;
let noFocusLostFallbackTimer: ReturnType<typeof setTimeout> | null = null;
let resumeDelayTimer: ReturnType<typeof setTimeout> | null = null;
let listenersInstalled = false;

const adStateListeners = new Set<(isPlaying: boolean) => void>();

/**
 * Globally enables or disables native Android ads (Interstitial & Rewarded).
 * Set to `true` whenever the logged-in user has an active purchased package.
 */
export function setAndroidAdsSuppressed(suppressed: boolean): void {
  androidAdsSuppressed = Boolean(suppressed);
  if (androidAdsSuppressed && adPlayingState) {
    resumeFromAndroidAd();
  }
}

export function isAndroidAdsSuppressed(): boolean {
  return androidAdsSuppressed;
}

function notifyAdState(playing: boolean) {
  if (adPlayingState === playing) return;
  adPlayingState = playing;
  adStateListeners.forEach((cb) => {
    try {
      cb(playing);
    } catch {
      // Ignore subscriber errors
    }
  });
}

function clearAdTimers() {
  if (noFocusLostFallbackTimer) {
    clearTimeout(noFocusLostFallbackTimer);
    noFocusLostFallbackTimer = null;
  }
  if (resumeDelayTimer) {
    clearTimeout(resumeDelayTimer);
    resumeDelayTimer = null;
  }
}

export function resumeFromAndroidAd(): void {
  clearAdTimers();
  sawFocusLostSinceAdTrigger = false;
  notifyAdState(false);
}

function pauseForAndroidAd(): void {
  clearAdTimers();
  sawFocusLostSinceAdTrigger = false;
  adTriggerTimestamp = Date.now();
  notifyAdState(true);

  // If neither blur nor hidden occurs within 4s (e.g. ad wasn't loaded/cached natively),
  // automatically resume so the quiz timer doesn't stay stuck (any tap inside WebView also resumes immediately).
  noFocusLostFallbackTimer = setTimeout(() => {
    if (adPlayingState && !sawFocusLostSinceAdTrigger && typeof document !== "undefined" && !document.hidden) {
      resumeFromAndroidAd();
    }
  }, 4000);
}

export function isAndroidAdPlayingNow(): boolean {
  return adPlayingState;
}

function installGlobalAdResumeListeners() {
  if (listenersInstalled || typeof window === "undefined") return;
  listenersInstalled = true;

  // Allow Android native code to explicitly notify when an ad opens/closes if desired:
  // webView.evaluateJavascript("window.onAndroidAdClosed && window.onAndroidAdClosed()", null)
  window.onAndroidAdOpened = () => {
    sawFocusLostSinceAdTrigger = true;
    clearAdTimers();
    notifyAdState(true);
  };
  window.onAndroidAdClosed = () => {
    resumeFromAndroidAd();
  };

  const markFocusLost = () => {
    if (adPlayingState) {
      sawFocusLostSinceAdTrigger = true;
      if (noFocusLostFallbackTimer) {
        clearTimeout(noFocusLostFallbackTimer);
        noFocusLostFallbackTimer = null;
      }
    }
  };

  const handlePossibleAdReturn = () => {
    if (!adPlayingState) return;
    if (typeof document !== "undefined" && document.hidden) {
      markFocusLost();
      return;
    }
    const elapsed = Date.now() - adTriggerTimestamp;
    if (sawFocusLostSinceAdTrigger || elapsed > 350) {
      if (resumeDelayTimer) clearTimeout(resumeDelayTimer);
      resumeDelayTimer = setTimeout(() => {
        if (typeof document === "undefined" || !document.hidden) {
          resumeFromAndroidAd();
        }
      }, 150);
    }
  };

  window.addEventListener("blur", markFocusLost);
  window.addEventListener("focus", handlePossibleAdReturn);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      markFocusLost();
    } else {
      handlePossibleAdReturn();
    }
  });

  // If the user physically interacts inside WebView, any fullscreen native ad is definitely dismissed
  const handleUserInteraction = () => {
    if (adPlayingState && Date.now() - adTriggerTimestamp > 120) {
      resumeFromAndroidAd();
    }
  };
  window.addEventListener("pointerdown", handleUserInteraction, { passive: true });
  window.addEventListener("touchstart", handleUserInteraction, { passive: true });
}

export function subscribeAndroidAdState(cb: (isPlaying: boolean) => void): () => void {
  installGlobalAdResumeListeners();
  adStateListeners.add(cb);
  cb(adPlayingState);
  return () => {
    adStateListeners.delete(cb);
  };
}

/**
 * Safely checks whether the page is running inside an Android WebView
 * with an exposed `window.AndroidBridge` interface.
 */
export function isAndroidWebViewBridge(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.AndroidBridge &&
      (typeof window.AndroidBridge.showInterstitialAd === "function" ||
        typeof window.AndroidBridge.showRewardedAd === "function")
  );
}

/**
 * Safely triggers a native Android AdMob Interstitial ad via `window.AndroidBridge.showInterstitialAd()`.
 * Pauses active quiz/exam timers until the ad finishes/closes.
 * Suppressed automatically if user holds an active purchased package.
 */
export function triggerAndroidInterstitialAd(actionEvent?: AndroidAdActionEvent): boolean {
  if (typeof window === "undefined" || androidAdsSuppressed) return false;
  installGlobalAdResumeListeners();

  try {
    const bridge = window.AndroidBridge;
    if (!bridge) return false;

    if (actionEvent && typeof bridge.onActionEvent === "function") {
      try {
        bridge.onActionEvent(actionEvent);
      } catch {
        // Ignore optional telemetry hook errors
      }
    }

    if (typeof bridge.showInterstitialAd === "function") {
      pauseForAndroidAd();
      bridge.showInterstitialAd();
      return true;
    }
  } catch {
    resumeFromAndroidAd();
  }

  return false;
}

/**
 * Safely triggers a native Android AdMob Rewarded ad via `window.AndroidBridge.showRewardedAd()`.
 * Pauses active quiz/exam timers until the ad finishes/closes.
 * Suppressed automatically if user holds an active purchased package.
 */
export function triggerAndroidRewardedAd(actionEvent?: AndroidAdActionEvent): boolean {
  if (typeof window === "undefined" || androidAdsSuppressed) return false;
  installGlobalAdResumeListeners();

  try {
    const bridge = window.AndroidBridge;
    if (!bridge) return false;

    if (actionEvent && typeof bridge.onActionEvent === "function") {
      try {
        bridge.onActionEvent(actionEvent);
      } catch {
        // Ignore optional telemetry hook errors
      }
    }

    if (typeof bridge.showRewardedAd === "function") {
      pauseForAndroidAd();
      bridge.showRewardedAd();
      return true;
    }
  } catch {
    resumeFromAndroidAd();
  }

  return false;
}

const CIRCULAR_AD_COOLDOWN_KEY = "jobmaster_circular_post_ad_last_at";
export const CIRCULAR_AD_COOLDOWN_MS = 150_000; // 2.5 minutes (2 * 60 + 30 = 150s)
let memoryCircularAdLastShownAt = 0;

/**
 * Triggers an Android Interstitial Ad when clicking a Job Circular post card,
 * strictly enforcing a 2.5-minute (150,000ms) cooldown between ads.
 * Suppressed automatically if user holds an active purchased package.
 */
export function triggerCircularPostInterstitialWithCooldown(
  cooldownMs: number = CIRCULAR_AD_COOLDOWN_MS
): boolean {
  if (typeof window === "undefined" || androidAdsSuppressed) return false;

  try {
    const now = Date.now();
    let lastShownAt = memoryCircularAdLastShownAt;
    try {
      const storedRaw = window.localStorage.getItem(CIRCULAR_AD_COOLDOWN_KEY);
      const storedNum = storedRaw ? Number(storedRaw) : 0;
      if (Number.isFinite(storedNum) && storedNum > lastShownAt) {
        lastShownAt = storedNum;
      }
    } catch {
      // Ignore storage access errors
    }

    if (lastShownAt > 0 && now - lastShownAt < cooldownMs) {
      return false;
    }

    const shown = triggerAndroidInterstitialAd("job_circular_post_click");
    if (shown) {
      memoryCircularAdLastShownAt = now;
      try {
        window.localStorage.setItem(CIRCULAR_AD_COOLDOWN_KEY, String(now));
      } catch {
        // Ignore storage write errors
      }
      return true;
    }
  } catch {
    // Ignore errors so circular opening never breaks
  }

  return false;
}
