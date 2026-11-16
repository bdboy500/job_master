export interface AndroidBridgeInterface {
  showInterstitialAd?: () => void;
  showRewardedAd?: () => void;
  onActionEvent?: (eventName: string) => void;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridgeInterface;
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
  | "view_quiz_result"
  | "view_leaderboard"
  | "open_question_paper"
  | "download_circular"
  | "download_cv_pdf";

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
 * For standard web browser visitors where `window.AndroidBridge` is absent, this no-ops silently
 * with zero errors or UX interruptions.
 */
export function triggerAndroidInterstitialAd(actionEvent?: AndroidAdActionEvent): boolean {
  if (typeof window === "undefined") return false;

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
      bridge.showInterstitialAd();
      return true;
    }
  } catch {
    // Never interrupt normal user navigation or browser behavior
  }

  return false;
}

/**
 * Safely triggers a native Android AdMob Rewarded ad via `window.AndroidBridge.showRewardedAd()`.
 * For standard web browser visitors where `window.AndroidBridge` is absent, this no-ops silently.
 */
export function triggerAndroidRewardedAd(actionEvent?: AndroidAdActionEvent): boolean {
  if (typeof window === "undefined") return false;

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
      bridge.showRewardedAd();
      return true;
    }
  } catch {
    // Never interrupt normal user navigation or browser behavior
  }

  return false;
}
