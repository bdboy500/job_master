"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getSupabase } from "../lib/supabase";
import { UserProfile, fetchUserProfile, upsertUserProfile, generateStudentId } from "../lib/user_profiles";

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  showAuthModal: boolean;
  authModalMode: "signin" | "signup";
  setShowAuthModal: (show: boolean) => void;
  setAuthModalMode: (mode: "signin" | "signup") => void;
  requireAuth: (action: () => void, intentType?: string, paperId?: string) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  updateCurrentUserState: (updatedProfile: UserProfile) => void;
  checkSession: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Sync user profile from Supabase Auth Session
  const syncUserFromSession = useCallback(async (session: any): Promise<UserProfile | null> => {
    if (!session?.user) {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem("job_master_current_user");
      return null;
    }

    const authUser = session.user;
    let profile = await fetchUserProfile(authUser.id);

    if (!profile) {
      // Auto-create profile from Auth metadata if DB row isn't present
      profile = {
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "শিক্ষার্থী",
        phone_number: authUser.user_metadata?.phone_number || "",
        student_id: authUser.user_metadata?.student_id || generateStudentId(),
        role: "Student",
        status: "Active",
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || "",
      };
      await upsertUserProfile(profile);
    }

    if (profile.status === "Banned") {
      alert("আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক স্থগিত/নিষিদ্ধ করা হয়েছে।");
      localStorage.removeItem("job_master_current_user");
      const supabase = getSupabase();
      if (supabase) await supabase.auth.signOut();
      setUser(null);
      setIsLoggedIn(false);
      return null;
    }

    setUser(profile);
    setIsLoggedIn(true);
    localStorage.setItem("job_master_current_user", JSON.stringify(profile));

    // Handle profile avatar caching rule
    const googleAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || profile.avatar_url || "";
    const localGalleryAvatar = typeof window !== "undefined" ? localStorage.getItem("job_master_user_avatar") : "";
    const effectiveAvatar = localGalleryAvatar || googleAvatar || "";
    if (effectiveAvatar && typeof window !== "undefined") {
      localStorage.setItem("job_master_cached_avatar", effectiveAvatar);
    }

    return profile;
  }, []);

  // Check active session lazily
  const checkSession = useCallback(async (): Promise<UserProfile | null> => {
    try {
      // First check local storage cache for instant 0ms state
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("job_master_current_user");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.id) {
              setUser(parsed);
              setIsLoggedIn(true);
            }
          } catch (e) {}
        }
      }

      const supabase = getSupabase();
      if (!supabase) return user;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return await syncUserFromSession(session);
      } else if (!user) {
        // Guest user browsing
        setUser(null);
        setIsLoggedIn(false);
      }
      return user;
    } catch (err) {
      console.warn("Auth check session error:", err);
      return user;
    } finally {
      setIsLoading(false);
    }
  }, [user, syncUserFromSession]);

  // Initial lazy check on mount with listener cleanup
  useEffect(() => {
    let authSub: any = null;

    // Load local cached profile instantly without blocking rendering
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("job_master_current_user");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id) {
            setUser(parsed);
            setIsLoggedIn(true);
          }
        } catch (e) {}
      }
    }
    setIsLoading(false);

    try {
      const supabase = getSupabase();
      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            syncUserFromSession(session);
          }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            await syncUserFromSession(session);
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            setIsLoggedIn(false);
            localStorage.removeItem("job_master_current_user");
          }
        });
        authSub = subscription;
      }
    } catch (err) {
      console.warn("Auth subscription setup error:", err);
    }

    return () => {
      if (authSub && typeof authSub.unsubscribe === "function") {
        authSub.unsubscribe();
      }
    };
  }, [syncUserFromSession]);

  // Lazy Auth Requirement Gatekeeper for Exams & Quizzes
  const requireAuth = useCallback(async (action: () => void, intentType: string = "exams", paperId?: string): Promise<boolean> => {
    // 1. Check current logged in state
    if (isLoggedIn && user && user.status !== "Banned") {
      action();
      return true;
    }

    if (user && user.status === "Banned") {
      alert("আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক সাময়িকভাবে নিষিদ্ধ করা হয়েছে।");
      return false;
    }

    // 2. Perform live check with Supabase auth session
    const liveProfile = await checkSession();
    if (liveProfile && liveProfile.status !== "Banned") {
      action();
      return true;
    }

    // 3. Guest user: store pending action/intent and prompt login modal
    if (typeof window !== "undefined") {
      localStorage.setItem("job_master_pending_intent", intentType);
      if (paperId) {
        localStorage.setItem("job_master_pending_paper_id", paperId);
      }
    }

    setPendingAction(() => action);
    setAuthModalMode("signin");
    setShowAuthModal(true);
    return false;
  }, [isLoggedIn, user, checkSession]);

  // Execute pending action after successful authentication
  useEffect(() => {
    if (isLoggedIn && pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [isLoggedIn, pendingAction]);

  const signOutUser = async () => {
    setUser(null);
    setIsLoggedIn(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("job_master_current_user");
      localStorage.removeItem("job_master_user_avatar");
      localStorage.removeItem("job_master_cached_avatar");
    }
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
  };

  const updateCurrentUserState = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    setIsLoggedIn(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("job_master_current_user", JSON.stringify(updatedProfile));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        showAuthModal,
        authModalMode,
        setShowAuthModal,
        setAuthModalMode,
        requireAuth,
        signOutUser,
        updateCurrentUserState,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
