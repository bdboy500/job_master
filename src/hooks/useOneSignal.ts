"use client";

import { useEffect, useState, useCallback } from "react";
import { initOneSignal, setOneSignalUser, logoutOneSignalUser, requestOneSignalPushPermission } from "@/src/lib/onesignal";

interface UseOneSignalOptions {
  currentUserId?: string | null;
  userRole?: string;
  userEmail?: string;
  onDeepLink?: (data: { type?: string; targetId?: string; url?: string }) => void;
}

export function useOneSignal({
  currentUserId,
  userRole,
  userEmail,
  onDeepLink,
}: UseOneSignalOptions = {}) {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [showSoftPrompt, setShowSoftPrompt] = useState<boolean>(false);

  // Initialize OneSignal on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    initOneSignal((data) => {
      if (onDeepLink && data) {
        onDeepLink(data);
      }
    });

    // Check existing notification permission
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }
  }, [onDeepLink]);

  // Sync Supabase user ID with OneSignal alias
  useEffect(() => {
    if (currentUserId) {
      setOneSignalUser(currentUserId, { role: userRole, email: userEmail });
    }
  }, [currentUserId, userRole, userEmail]);

  // Check if soft prompt should be displayed after significant user action
  const triggerContextualSoftPrompt = useCallback(() => {
    if (typeof window === "undefined") return;

    // If permission already granted or user explicitly declined recently, skip
    if ("Notification" in window && Notification.permission === "granted") {
      setHasPermission(true);
      return;
    }

    const lastPrompt = localStorage.getItem("jobmaster_soft_push_prompt_dismissed");
    const now = Date.now();
    // Prompt at most once every 7 days if previously dismissed
    if (lastPrompt && now - Number(lastPrompt) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    setShowSoftPrompt(true);
  }, []);

  const handleAcceptSoftPrompt = async () => {
    setShowSoftPrompt(false);
    const granted = await requestOneSignalPushPermission();
    setHasPermission(granted);
    if (typeof window !== "undefined") {
      localStorage.setItem("jobmaster_soft_push_prompt_dismissed", Date.now().toString());
    }
  };

  const handleDismissSoftPrompt = () => {
    setShowSoftPrompt(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("jobmaster_soft_push_prompt_dismissed", Date.now().toString());
    }
  };

  const handleUserLogout = useCallback(async () => {
    await logoutOneSignalUser();
  }, []);

  return {
    hasPermission,
    showSoftPrompt,
    triggerContextualSoftPrompt,
    handleAcceptSoftPrompt,
    handleDismissSoftPrompt,
    handleUserLogout,
  };
}
