"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Custom Hook for Modal & Overlay History Handling
 * Pushes a history state when modal opens, and listens for popstate (back button / swipe back).
 * Pressing back/swiping back closes the modal first instead of navigating away.
 */
export function useModalHistory(
  isOpen: boolean,
  onClose: () => void,
  modalKey: string = "modal"
) {
  const isPushedRef = useRef<boolean>(false);
  const closedByBackRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      // If modal was closed programmatically (e.g. X button, backdrop click)
      // and we pushed a state, clean up history state by stepping back.
      if (isPushedRef.current && !closedByBackRef.current) {
        isPushedRef.current = false;
        try {
          window.history.back();
        } catch (e) {}
      }
      closedByBackRef.current = false;
      return;
    }

    // Modal is opened
    closedByBackRef.current = false;
    const stateKey = `jobmaster_modal_${modalKey}`;

    // Push new history state for modal
    try {
      window.history.pushState({ [stateKey]: true }, "", window.location.href);
      isPushedRef.current = true;
    } catch (e) {
      console.warn("pushState error:", e);
    }

    const handlePopState = (event: PopStateEvent) => {
      // Back button or swipe back gesture occurred
      closedByBackRef.current = true;
      isPushedRef.current = false;
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, onClose, modalKey]);
}

/**
 * Custom Hook for Active Exam Exit Protection
 * Traps back button / back swipe gesture during an active exam/quiz to prevent accidental exit.
 */
export function useExamExitProtection(
  isExamActive: boolean,
  onTriggerExitConfirm: () => void
) {
  const isGuardedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isExamActive) {
      if (isGuardedRef.current) {
        isGuardedRef.current = false;
      }
      return;
    }

    // Push guard state into window history
    try {
      window.history.pushState({ jobmaster_exam_guard: true }, "", window.location.href);
      isGuardedRef.current = true;
    } catch (e) {}

    const handlePopState = (event: PopStateEvent) => {
      if (!isExamActive) return;

      // Re-push history state immediately to lock user on exam screen
      try {
        window.history.pushState({ jobmaster_exam_guard: true }, "", window.location.href);
      } catch (e) {}

      // Open custom exit confirmation dialog
      onTriggerExitConfirm();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isExamActive, onTriggerExitConfirm]);

  const removeExamGuard = useCallback(() => {
    if (isGuardedRef.current) {
      isGuardedRef.current = false;
      try {
        window.history.back();
      } catch (e) {}
    }
  }, []);

  return { removeExamGuard };
}
