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
      if (isPushedRef.current && !closedByBackRef.current) {
        isPushedRef.current = false;
        try {
          window.history.back();
        } catch (e) {}
      }
      closedByBackRef.current = false;
      return;
    }

    closedByBackRef.current = false;
    const stateKey = `jobmaster_modal_${modalKey}`;

    try {
      window.history.pushState({ [stateKey]: true }, "", window.location.href);
      isPushedRef.current = true;
    } catch (e) {
      console.warn("pushState error:", e);
    }

    const handlePopState = () => {
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

    try {
      window.history.pushState({ jobmaster_exam_guard: true }, "", window.location.href);
      isGuardedRef.current = true;
    } catch (e) {}

    const handlePopState = () => {
      if (!isExamActive) return;

      try {
        window.history.pushState({ jobmaster_exam_guard: true }, "", window.location.href);
      } catch (e) {}

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

/**
 * Full App PWA Navigation Sync Engine
 * Synchronizes screen navigation (Home -> Courses -> Subject -> Topic), Modals, Drawers, and Exams
 * with the browser's History Stack (`window.history.pushState` and `popstate`).
 * Enables mobile hardware back button and iOS/Android swipe-to-back gestures to step back cleanly
 * through nested pages instead of exiting the browser/PWA.
 */
export function useAppNavigationHistory(
  navState: {
    currentScreen: string;
    selectedCourseDetail?: any;
    selectedPrepSubject?: string;
    selectedPrepSubSubject?: any;
    selectedLevel3Topic?: string | null;
    selectedPrepExamTypeFilter?: string | null;
    activeExamSection?: any;
    drawerOpen?: boolean;
    activeDrawerModal?: string;
    showAuthModal?: boolean;
    showContactModal?: boolean;
    showAboutModal?: boolean;
    showSearchModal?: boolean;
    showNotificationModal?: boolean;
    showSettingsModal?: boolean;
    showLogoutConfirmModal?: boolean;
    showQuitConfirmModal?: boolean;
    showExamSubmitConfirmModal?: boolean;
    isEditProfileOpen?: boolean;
    isChangePasswordOpen?: boolean;
    selectedLiveExamModal?: any;
    takingExamModal?: any;
    examSubmitted?: boolean;
    viewingAnswerSheetData?: any;
    quizStarted?: boolean;
    isSubmitted?: boolean;
    previousScreen?: string;
    courseOriginScreen?: string;
    prepSubjectOrigin?: string;
  },
  handlers: {
    setCurrentScreen: (s: any) => void;
    setSelectedCourseDetail?: (c: any) => void;
    setSelectedPrepSubject?: (sub: string) => void;
    setSelectedPrepSubSubject?: (sub: any) => void;
    setSelectedLevel3Topic?: (topic: string | null) => void;
    setSelectedPrepExamTypeFilter?: (filter: any) => void;
    setActiveExamSection?: (sec: any) => void;
    setDrawerOpen: (open: boolean) => void;
    setActiveDrawerModal: (modal: any) => void;
    setShowAuthModal: (open: boolean) => void;
    setShowContactModal: (open: boolean) => void;
    setShowAboutModal: (open: boolean) => void;
    setShowSearchModal: (open: boolean) => void;
    setShowNotificationModal: (open: boolean) => void;
    setShowSettingsModal: (open: boolean) => void;
    setShowLogoutConfirmModal: (open: boolean) => void;
    setShowQuitConfirmModal: (open: boolean) => void;
    setShowExamSubmitConfirmModal?: (open: boolean) => void;
    setIsEditProfileOpen: (open: boolean) => void;
    setIsChangePasswordOpen: (open: boolean) => void;
    setSelectedLiveExamModal?: (modal: any) => void;
    setTakingExamModal?: (modal: any) => void;
    setViewingAnswerSheetData?: (data: any) => void;
  }
) {
  const isPopstateHandlingRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const lastStateKeyRef = useRef<string>("");

  // Create a composite key representing the current UI state
  const stateKey = [
    navState.currentScreen,
    navState.selectedCourseDetail ? "course_active" : "",
    navState.selectedPrepSubject || "",
    navState.selectedPrepSubSubject ? "subsub_active" : "",
    navState.selectedLevel3Topic || "",
    navState.selectedPrepExamTypeFilter || "",
    navState.activeExamSection ? "sec_active" : "",
    navState.drawerOpen ? "drawer_open" : "",
    navState.activeDrawerModal !== "none" ? `dmodal_${navState.activeDrawerModal}` : "",
    navState.showAuthModal ? "auth_open" : "",
    navState.showContactModal ? "contact_open" : "",
    navState.showAboutModal ? "about_open" : "",
    navState.showSearchModal ? "search_open" : "",
    navState.showNotificationModal ? "notif_open" : "",
    navState.showSettingsModal ? "sett_open" : "",
    navState.showLogoutConfirmModal ? "logout_open" : "",
    navState.showQuitConfirmModal ? "quit_open" : "",
    navState.showExamSubmitConfirmModal ? "subm_confirm_open" : "",
    navState.isEditProfileOpen ? "editprof_open" : "",
    navState.isChangePasswordOpen ? "chpass_open" : "",
    navState.selectedLiveExamModal ? "liveexam_open" : "",
    navState.takingExamModal ? "takingexam_open" : "",
    navState.viewingAnswerSheetData ? "answersheet_open" : "",
    navState.quizStarted ? "quiz_started" : "",
  ].join("|");

  // Push history state whenever user navigates or opens modals/drawers
  useEffect(() => {
    if (typeof window === "undefined") return;

    // First time mount initialization
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastStateKeyRef.current = stateKey;
      try {
        window.history.replaceState({ appRoot: true, key: stateKey }, "", window.location.href);
      } catch (e) {}
      return;
    }

    // If state change was caused by popstate (browser back button / gesture), do not push state!
    if (isPopstateHandlingRef.current) {
      lastStateKeyRef.current = stateKey;
      isPopstateHandlingRef.current = false;
      return;
    }

    // Only push if the state key actually changed
    if (stateKey !== lastStateKeyRef.current) {
      lastStateKeyRef.current = stateKey;
      try {
        window.history.pushState({ appNav: true, key: stateKey }, "", window.location.href);
      } catch (e) {}
    }
  }, [stateKey]);

  // Global popstate listener for back button / swipe back gesture
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      isPopstateHandlingRef.current = true;

      // 0. If Exit Confirmation Warning Popup is OPEN:
      // Pressing back button closes the popup (equivalent to clicking "Stay / Continue")
      if (navState.showQuitConfirmModal) {
        handlers.setShowQuitConfirmModal(false);
        return;
      }

      // 1. ACTIVE EXAM PROTECTION: If actively taking an exam (and not submitted)
      if (navState.takingExamModal && !navState.examSubmitted) {
        // Re-push history to trap browser exit
        try {
          window.history.pushState({ appNav: true, key: lastStateKeyRef.current }, "", window.location.href);
        } catch (e) {}
        // Open the exit warning popup!
        handlers.setShowQuitConfirmModal(true);
        return;
      }

      // 2. ACTIVE QUIZ PROTECTION: If actively playing a quiz (and not submitted)
      if (navState.quizStarted && !navState.isSubmitted) {
        try {
          window.history.pushState({ appNav: true, key: lastStateKeyRef.current }, "", window.location.href);
        } catch (e) {}
        handlers.setShowQuitConfirmModal(true);
        return;
      }

      // 3. ANSWER SHEET / QUESTION PAPER VIEW (Non-active exam mode)
      // When viewing question paper/answer sheet, pressing back button closes it 1-by-1 without warning
      if (navState.viewingAnswerSheetData) {
        if (handlers.setViewingAnswerSheetData) {
          handlers.setViewingAnswerSheetData(null);
        }
        return;
      }

      // 4. SUBMITTED EXAM SUMMARY MODAL
      if (navState.takingExamModal && navState.examSubmitted) {
        if (handlers.setTakingExamModal) handlers.setTakingExamModal(null);
        return;
      }

      // 5. MODALS & DRAWERS (Close 1-by-1)
      if (navState.showExamSubmitConfirmModal && handlers.setShowExamSubmitConfirmModal) {
        handlers.setShowExamSubmitConfirmModal(false);
        return;
      }
      if (navState.drawerOpen) {
        handlers.setDrawerOpen(false);
        return;
      }
      if (navState.activeDrawerModal && navState.activeDrawerModal !== "none") {
        handlers.setActiveDrawerModal("none");
        return;
      }
      if (navState.showAuthModal) {
        handlers.setShowAuthModal(false);
        return;
      }
      if (navState.showLogoutConfirmModal) {
        handlers.setShowLogoutConfirmModal(false);
        return;
      }
      if (navState.showContactModal) {
        handlers.setShowContactModal(false);
        return;
      }
      if (navState.showAboutModal) {
        handlers.setShowAboutModal(false);
        return;
      }
      if (navState.showSearchModal) {
        handlers.setShowSearchModal(false);
        return;
      }
      if (navState.showNotificationModal) {
        handlers.setShowNotificationModal(false);
        return;
      }
      if (navState.showSettingsModal) {
        handlers.setShowSettingsModal(false);
        return;
      }
      if (navState.isEditProfileOpen) {
        handlers.setIsEditProfileOpen(false);
        return;
      }
      if (navState.isChangePasswordOpen) {
        handlers.setIsChangePasswordOpen(false);
        return;
      }
      if (navState.selectedLiveExamModal) {
        if (handlers.setSelectedLiveExamModal) handlers.setSelectedLiveExamModal(null);
        return;
      }

      // 6. SCREEN HIERARCHY & SUB-VIEW BACK NAVIGATION (1-by-1)
      if (navState.activeExamSection) {
        if (handlers.setActiveExamSection) handlers.setActiveExamSection(null);
        return;
      }

      if (navState.currentScreen === "prep-sub-detail") {
        if (navState.selectedPrepExamTypeFilter) {
          if (handlers.setSelectedPrepExamTypeFilter) handlers.setSelectedPrepExamTypeFilter(null);
        } else if (navState.selectedLevel3Topic) {
          if (handlers.setSelectedLevel3Topic) handlers.setSelectedLevel3Topic(null);
        } else {
          const dest = (navState.previousScreen && navState.previousScreen !== "prep-sub-detail")
            ? navState.previousScreen
            : "prep-sub";
          handlers.setCurrentScreen(dest);
        }
        return;
      }

      if (navState.currentScreen === "prep-sub") {
        const dest = navState.prepSubjectOrigin || "courses";
        handlers.setCurrentScreen(dest);
        return;
      }

      if (navState.currentScreen === "course-detail") {
        const dest = (navState.previousScreen && navState.previousScreen !== "course-detail")
          ? navState.previousScreen
          : (navState.courseOriginScreen || "courses");
        handlers.setCurrentScreen(dest);
        return;
      }

      if (
        navState.currentScreen === "courses" ||
        navState.currentScreen === "prep-all-subjects" ||
        navState.currentScreen === "quiz" ||
        navState.currentScreen === "routine" ||
        navState.currentScreen === "tests" ||
        navState.currentScreen === "profile" ||
        navState.currentScreen === "packages" ||
        navState.currentScreen === "search" ||
        navState.currentScreen === "notice" ||
        navState.currentScreen === "all-live-exams"
      ) {
        handlers.setCurrentScreen("home");
        return;
      }

      // If at home, popstate allows natural browser behavior
      isPopstateHandlingRef.current = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navState, handlers]);
}
