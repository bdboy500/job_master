/**
 * OneSignal Native & Web Push Notification Client Module
 * Supports both Capacitor native bridge (Android/iOS) and Web PWA without Firebase client dependencies.
 */

// OneSignal App ID from environment or fallback
export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "12345678-abcd-1234-abcd-1234567890ab";

let isOneSignalInitialized = false;

/**
 * Initialize OneSignal SDK on Web / Capacitor runtime
 */
export async function initOneSignal(onNotificationClick?: (data: any) => void) {
  if (typeof window === "undefined" || isOneSignalInitialized) return;

  try {
    // 1. Check if running inside native Capacitor environment
    const capacitorWindow = window as any;
    if (capacitorWindow.Capacitor?.isNativePlatform && capacitorWindow.Capacitor.isNativePlatform()) {
      const OneSignalPlugin = capacitorWindow.OneSignalPlugin || capacitorWindow.Capacitor?.Plugins?.OneSignal;
      if (OneSignalPlugin) {
        OneSignalPlugin.initialize(ONESIGNAL_APP_ID);
        if (onNotificationClick) {
          OneSignalPlugin.Notifications.addEventListener("click", (event: any) => {
            onNotificationClick(event?.notification?.additionalData || {});
          });
        }
        isOneSignalInitialized = true;
        return;
      }
    }

    // 2. Web PWA OneSignal SDK script injection
    if (!document.getElementById("onesignal-sdk-script")) {
      const script = document.createElement("script");
      script.id = "onesignal-sdk-script";
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);

      const OneSignal = ((window as any).OneSignal = (window as any).OneSignal || []);
      OneSignal.push(async () => {
        await (window as any).OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          autoResubscribe: true,
          notifyButton: {
            enable: false,
          },
        });

        if (onNotificationClick) {
          (window as any).OneSignal.Notifications.addEventListener("click", (event: any) => {
            onNotificationClick(event?.notification?.additionalData || {});
          });
        }
      });
      isOneSignalInitialized = true;
    }
  } catch (err) {
    console.warn("OneSignal initialization warning:", err);
  }
}

/**
 * Associate Supabase User ID with OneSignal External User ID / Alias
 */
export async function setOneSignalUser(supabaseUserId: string, userMetadata?: { name?: string; role?: string; email?: string }) {
  if (typeof window === "undefined" || !supabaseUserId) return;

  try {
    const capacitorWindow = window as any;
    // Native Capacitor
    if (capacitorWindow.Capacitor?.isNativePlatform?.()) {
      const OneSignalPlugin = capacitorWindow.OneSignalPlugin || capacitorWindow.Capacitor?.Plugins?.OneSignal;
      if (OneSignalPlugin?.login) {
        await OneSignalPlugin.login(supabaseUserId);
        if (userMetadata) {
          if (userMetadata.role) OneSignalPlugin.User?.addTag?.("role", userMetadata.role);
          if (userMetadata.email) OneSignalPlugin.User?.addEmail?.(userMetadata.email);
        }
        return;
      }
    }

    // Web OneSignal SDK
    const OneSignal = (window as any).OneSignal;
    if (OneSignal?.login) {
      await OneSignal.login(supabaseUserId);
      if (userMetadata?.role) {
        OneSignal.User?.addTag?.("role", userMetadata.role);
      }
    }
  } catch (e) {
    console.warn("Failed to set OneSignal user:", e);
  }
}

/**
 * Disassociate OneSignal user on logout
 */
export async function logoutOneSignalUser() {
  if (typeof window === "undefined") return;

  try {
    const capacitorWindow = window as any;
    if (capacitorWindow.Capacitor?.isNativePlatform?.()) {
      const OneSignalPlugin = capacitorWindow.OneSignalPlugin || capacitorWindow.Capacitor?.Plugins?.OneSignal;
      if (OneSignalPlugin?.logout) {
        await OneSignalPlugin.logout();
        return;
      }
    }

    const OneSignal = (window as any).OneSignal;
    if (OneSignal?.logout) {
      await OneSignal.logout();
    }
  } catch (e) {
    console.warn("Failed to logout OneSignal user:", e);
  }
}

/**
 * Request Push Permission (Store compliant prompt)
 */
export async function requestOneSignalPushPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const capacitorWindow = window as any;
    if (capacitorWindow.Capacitor?.isNativePlatform?.()) {
      const OneSignalPlugin = capacitorWindow.OneSignalPlugin || capacitorWindow.Capacitor?.Plugins?.OneSignal;
      if (OneSignalPlugin?.Notifications?.requestPermission) {
        const granted = await OneSignalPlugin.Notifications.requestPermission(true);
        return Boolean(granted);
      }
    }

    const OneSignal = (window as any).OneSignal;
    if (OneSignal?.Notifications?.requestPermission) {
      await OneSignal.Notifications.requestPermission();
      return Boolean(OneSignal.Notifications.permission);
    }

    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  } catch (e) {
    console.warn("Permission request error:", e);
  }
  return false;
}
