"use client";

import React, { useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";

const CHUNK_RELOAD_GUARD_KEY = "jobmaster_chunk_recovery_ts";

function isChunkOrHydrationAssetError(errOrMessage: unknown): boolean {
  const msg = String(
    (errOrMessage as any)?.message ||
      (errOrMessage as any)?.reason?.message ||
      errOrMessage ||
      ""
  ).toLowerCase();

  return (
    msg.includes("chunkloaderror") ||
    msg.includes("loading chunk") ||
    msg.includes("loading css chunk") ||
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed")
  );
}

export async function clearSwCachesAndReload(force = false) {
  if (typeof window === "undefined") return;
  try {
    const lastTs = Number(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) || "0");
    if (!force && lastTs && Date.now() - lastTs < 25000) {
      return;
    }
    sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(Date.now()));
  } catch (e) {}

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active) {
        reg.active.postMessage({ type: "CLEAR_ALL_CACHES" });
      }
      await reg?.update().catch(() => {});
    }
  } catch (e) {}

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {}

  try {
    const url = new URL(window.location.href);
    url.searchParams.set("_r", String(Date.now()));
    window.location.replace(url.toString());
  } catch (e) {
    window.location.reload();
  }
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {});
    }

    const handleWindowError = (event: ErrorEvent) => {
      const target = event?.target as HTMLElement | null;
      const isScriptOrLinkTag =
        target &&
        (target.tagName === "SCRIPT" || target.tagName === "LINK") &&
        String((target as any).src || (target as any).href || "").includes("/_next/static/");

      if (isScriptOrLinkTag || isChunkOrHydrationAssetError(event?.error || event?.message)) {
        clearSwCachesAndReload(false);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkOrHydrationAssetError(event?.reason)) {
        clearSwCachesAndReload(false);
      }
    };

    const handleVisibilityUpdateSw = () => {
      if (document.visibilityState === "visible" && "serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistration()
          .then((reg) => reg?.update().catch(() => {}))
          .catch(() => {});
      }
    };

    window.addEventListener("error", handleWindowError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    document.addEventListener("visibilitychange", handleVisibilityUpdateSw);

    return () => {
      window.removeEventListener("error", handleWindowError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      document.removeEventListener("visibilitychange", handleVisibilityUpdateSw);
    };
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
