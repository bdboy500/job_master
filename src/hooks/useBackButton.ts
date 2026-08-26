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
 * Helper to generate a universal deep link share URL for any section or item.
 */
export function generateShareUrl(params: {
  view: string;
  id?: string | null;
  subId?: string | null;
  q?: string | null;
}): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const path = window.location.pathname;
  const searchParams = new URLSearchParams();
  if (params.view && params.view !== "home") {
    searchParams.set("view", params.view);
  }
  if (params.id) {
    searchParams.set("id", params.id);
  }
  if (params.subId) {
    searchParams.set("subId", params.subId);
  }
  if (params.q) {
    searchParams.set("q", params.q);
  }
  const queryString = searchParams.toString();
  return `${origin}${path}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Builds the URL query string based on the current app UI state.
 */
export function buildUrlSearchString(navState: {
  currentScreen: string;
  selectedCourseDetail?: any;
  selectedCourseId?: string | null;
  selectedPrepSubject?: string;
  selectedPrepSubSubject?: any;
  selectedLevel3Topic?: string | null;
  selectedPurchasePkg?: any;
  selectedLiveExamModal?: any;
  takingExamModal?: any;
  activeQuizTitle?: string;
  searchQuery?: string;
}): string {
  const params = new URLSearchParams();

  if (navState.takingExamModal) {
    params.set("view", "exam");
    if (navState.takingExamModal.id) params.set("id", String(navState.takingExamModal.id));
    return params.toString() ? `?${params.toString()}` : "";
  }

  if (navState.selectedLiveExamModal) {
    params.set("view", "exam");
    if (navState.selectedLiveExamModal.id) params.set("id", String(navState.selectedLiveExamModal.id));
    return params.toString() ? `?${params.toString()}` : "";
  }

  if (navState.selectedPurchasePkg) {
    params.set("view", "package");
    const pkgId = navState.selectedPurchasePkg.id || navState.selectedPurchasePkg.title;
    if (pkgId) params.set("id", String(pkgId));
    return params.toString() ? `?${params.toString()}` : "";
  }

  switch (navState.currentScreen) {
    case "quiz":
      if (navState.activeQuizTitle === "Live Quiz Game") {
        params.set("view", "live-quiz");
      } else {
        params.set("view", "quiz");
        if (navState.activeQuizTitle) params.set("id", navState.activeQuizTitle);
      }
      break;
    case "courses":
      params.set("view", "courses");
      break;
    case "course-detail":
      params.set("view", "course");
      const courseId = navState.selectedCourseId || navState.selectedCourseDetail?.id;
      if (courseId) params.set("id", String(courseId));
      break;
    case "prep-all-subjects":
      params.set("view", "prep-all-subjects");
      break;
    case "prep-sub":
      params.set("view", "prep-sub");
      if (navState.selectedPrepSubject) params.set("id", navState.selectedPrepSubject);
      break;
    case "prep-sub-detail":
      params.set("view", "prep-sub-detail");
      if (navState.selectedPrepSubject) params.set("id", navState.selectedPrepSubject);
      if (navState.selectedPrepSubSubject?.name) params.set("subId", navState.selectedPrepSubSubject.name);
      break;
    case "packages":
      params.set("view", "packages");
      break;
    case "routine":
      params.set("view", "routine");
      break;
    case "tests":
      params.set("view", "tests");
      break;
    case "all-live-exams":
      params.set("view", "all-live-exams");
      break;
    case "rankings":
      params.set("view", "rankings");
      break;
    case "profile":
      params.set("view", "profile");
      break;
    case "notice":
      params.set("view", "notice");
      break;
    case "search":
      params.set("view", "search");
      if (navState.searchQuery) params.set("q", navState.searchQuery);
      break;
    case "home":
    default:
      break;
  }

  const res = params.toString();
  return res ? `?${res}` : "";
}

/**
 * Full App PWA Navigation Sync Engine
 * Synchronizes screen navigation (Home -> Courses -> Subject -> Topic), Modals, Drawers, and Exams
 * with the browser's History Stack (`window.history.pushState` and `popstate`) and Dynamic URL Parameters.
 * Enables deep-linking, direct sharing, mobile hardware back button and iOS/Android swipe-to-back gestures.
 */
export function useAppNavigationHistory(
  navState: {
    currentScreen: string;
    selectedCourseDetail?: any;
    selectedCourseId?: string | null;
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
    viewingPaperModal?: any;
    archiveModalOpen?: boolean;
    quickToolModal?: any;
    selectedPurchasePkg?: any;
    quizStarted?: boolean;
    isSubmitted?: boolean;
    previousScreen?: string;
    courseOriginScreen?: string;
    prepSubjectOrigin?: string;
    activeQuizTitle?: string;
    searchQuery?: string;
  },
  handlers: {
    setCurrentScreen: (s: any) => void;
    setSelectedCourseDetail?: (c: any) => void;
    setSelectedCourseId?: (id: any) => void;
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
    setViewingPaperModal?: (modal: any) => void;
    setArchiveModalOpen?: (open: boolean) => void;
    setQuickToolModal?: (modal: any) => void;
    setSelectedPurchasePkg?: (pkg: any) => void;
  }
) {
  const isPopstateHandlingRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const lastStateKeyRef = useRef<string>("");
  const pushedCountRef = useRef<number>(0);

  // Create a composite key representing the current UI state
  const stateKey = [
    navState.currentScreen,
    navState.selectedCourseId || "",
    navState.selectedCourseDetail ? "course_active" : "",
    navState.selectedPrepSubject || "",
    navState.selectedPrepSubSubject ? "subsub_active" : "",
    navState.selectedLevel3Topic || "",
    navState.selectedPrepExamTypeFilter || "",
    navState.activeExamSection ? "sec_active" : "",
    navState.drawerOpen ? "drawer_open" : "",
    navState.activeDrawerModal && navState.activeDrawerModal !== "none" ? `dmodal_${navState.activeDrawerModal}` : "",
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
    navState.selectedLiveExamModal ? `liveexam_${navState.selectedLiveExamModal.id || "open"}` : "",
    navState.takingExamModal ? `takingexam_${navState.takingExamModal.id || "open"}` : "",
    navState.viewingAnswerSheetData ? "answersheet_open" : "",
    navState.viewingPaperModal ? "viewpaper_open" : "",
    navState.archiveModalOpen ? "archive_open" : "",
    navState.quickToolModal ? "quicktool_open" : "",
    navState.selectedPurchasePkg ? `pkg_${navState.selectedPurchasePkg.id || "open"}` : "",
    navState.quizStarted ? "quiz_started" : "",
  ].join("|");

  // Push / Replace history state whenever user navigates or opens modals/drawers
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchStr = buildUrlSearchString(navState);
    const targetUrl = window.location.pathname + searchStr;

    // First time mount initialization
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastStateKeyRef.current = stateKey;
      
      // CRITICAL FIX: If browser loaded with URL query parameters (Deep Link), DO NOT overwrite with "/"!
      const initialSearch = window.location.search;
      if (initialSearch && initialSearch.length > 1) {
        // Keep the existing deep link query string intact for the deep link engine to process
        return;
      }
      try {
        window.history.replaceState({ appRoot: true, key: stateKey }, "", targetUrl);
      } catch (e) {}
      return;
    }

    // If state change was caused by popstate (browser back button / gesture), do not push state!
    if (isPopstateHandlingRef.current) {
      lastStateKeyRef.current = stateKey;
      isPopstateHandlingRef.current = false;
      return;
    }

    // Special handling for Home screen when no overlays are active
    const isAtHomeClean = navState.currentScreen === "home" && 
      !navState.drawerOpen &&
      (!navState.activeDrawerModal || navState.activeDrawerModal === "none") &&
      !navState.showAuthModal &&
      !navState.showContactModal &&
      !navState.showAboutModal &&
      !navState.showSearchModal &&
      !navState.showNotificationModal &&
      !navState.showSettingsModal &&
      !navState.showLogoutConfirmModal &&
      !navState.showQuitConfirmModal &&
      !navState.isEditProfileOpen &&
      !navState.isChangePasswordOpen &&
      !navState.selectedLiveExamModal &&
      !navState.takingExamModal &&
      !navState.viewingAnswerSheetData &&
      !navState.viewingPaperModal &&
      !navState.archiveModalOpen &&
      !navState.quickToolModal &&
      !navState.selectedPurchasePkg &&
      !navState.quizStarted;

    if (isAtHomeClean) {
      // If there are still unparsed deep link parameters in current URL during initial render, do not overwrite yet
      const curSearch = window.location.search;
      if (curSearch && curSearch.includes("view=")) {
        return;
      }
      lastStateKeyRef.current = stateKey;
      try {
        window.history.replaceState({ appRoot: true, key: stateKey }, "", window.location.pathname);
      } catch (e) {}
      return;
    }

    // Only push if the state key actually changed
    if (stateKey !== lastStateKeyRef.current) {
      lastStateKeyRef.current = stateKey;
      pushedCountRef.current += 1;
      try {
        window.history.pushState({ appNav: true, key: stateKey }, "", targetUrl);
      } catch (e) {}
    } else {
      try {
        window.history.replaceState({ appNav: true, key: stateKey }, "", targetUrl);
      } catch (e) {}
    }
  }, [stateKey, navState]);

  // Global popstate listener for back button / swipe back gesture
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      isPopstateHandlingRef.current = true;
      if (pushedCountRef.current > 0) {
        pushedCountRef.current -= 1;
      }

      // 0. If Exit Confirmation Warning Popup is OPEN:
      // Pressing back button closes the popup (equivalent to clicking "Stay / Continue")
      if (navState.showQuitConfirmModal) {
        handlers.setShowQuitConfirmModal(false);
        return;
      }

      // 1. ACTIVE EXAM PROTECTION: If actively taking an exam (and not submitted)
      if (navState.takingExamModal && !navState.examSubmitted) {
        try {
          window.history.pushState({ appNav: true, key: lastStateKeyRef.current }, "", window.location.href);
          pushedCountRef.current += 1;
        } catch (e) {}
        handlers.setShowQuitConfirmModal(true);
        return;
      }

      // 2. ACTIVE QUIZ PROTECTION: If actively playing a quiz (and not submitted)
      if (navState.quizStarted && !navState.isSubmitted) {
        try {
          window.history.pushState({ appNav: true, key: lastStateKeyRef.current }, "", window.location.href);
          pushedCountRef.current += 1;
        } catch (e) {}
        handlers.setShowQuitConfirmModal(true);
        return;
      }

      // 3. QUESTION PAPER VIEW ("প্রশ্নপত্র") MODAL
      if (navState.viewingPaperModal) {
        if (handlers.setViewingPaperModal) {
          handlers.setViewingPaperModal(null);
        }
        return;
      }

      // 4. ARCHIVE MODAL ("আর্কাইভড মডেল টেস্ট")
      if (navState.archiveModalOpen) {
        if (handlers.setArchiveModalOpen) {
          handlers.setArchiveModalOpen(false);
        }
        return;
      }

      // 5. QUICK TOOL MODAL
      if (navState.quickToolModal) {
        if (handlers.setQuickToolModal) {
          handlers.setQuickToolModal(null);
        }
        return;
      }

      // 6. PURCHASE PACKAGE MODAL
      if (navState.selectedPurchasePkg) {
        if (handlers.setSelectedPurchasePkg) {
          handlers.setSelectedPurchasePkg(null);
        }
        return;
      }

      // 7. ANSWER SHEET VIEW ("উত্তরপত্র") MODAL
      if (navState.viewingAnswerSheetData) {
        if (handlers.setViewingAnswerSheetData) {
          handlers.setViewingAnswerSheetData(null);
        }
        return;
      }

      // 8. SUBMITTED EXAM SUMMARY MODAL
      if (navState.takingExamModal && navState.examSubmitted) {
        if (handlers.setTakingExamModal) handlers.setTakingExamModal(null);
        return;
      }

      // 9. MODALS & DRAWERS (Close 1-by-1)
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

      // 10. SCREEN HIERARCHY & SUB-VIEW BACK NAVIGATION (1-by-1)
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
        navState.currentScreen === "all-live-exams" ||
        navState.currentScreen === "rankings"
      ) {
        handlers.setCurrentScreen("home");
        return;
      }

      // 11. If at home, popstate allows natural browser exit/close
      isPopstateHandlingRef.current = true;
      lastStateKeyRef.current = stateKey;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navState, handlers, stateKey]);
}
