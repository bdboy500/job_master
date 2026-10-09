"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, Mail, Phone, User, IdCard, LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, ArrowLeft, Send, RefreshCw, ShieldCheck } from "lucide-react";
import { getSupabase } from "../lib/supabase";
import { UserProfile, generateStudentId, upsertUserProfile, fetchUserProfile } from "../lib/user_profiles";
import { loginUserAccount, registerUserAccount, sendPasswordResetOtp, resetPasswordWithOtp } from "../lib/user_auth";
import { useModalHistory } from "../hooks/useBackButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: "signin" | "signup";
  customTitle?: string;
  customSubtitle?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "signin",
  customTitle,
  customSubtitle,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentId, setStudentId] = useState("");

  // Show/hide password states
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot / Reset Password state with OTP
  const [isResetPasswordView, setIsResetPasswordView] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetOtpCode, setResetOtpCode] = useState("");
  const [resetMaskedEmail, setResetMaskedEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");
  const [resetErrorMsg, setResetErrorMsg] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isLoading = isSubmitting || isGoogleLoading;
  const [oauthPopupUrl, setOauthPopupUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setIsResetPasswordView(false);
      setResetStep("request");
      setResetOtpCode("");
      setResetErrorMsg("");
      setResetSuccessMsg("");
      setDevOtpHint(null);
      setErrorMsg("");
      setSuccessMsg("");
      setIsSubmitting(false);
      setIsGoogleLoading(false);
      setOauthPopupUrl(null);
      setShowSignInPassword(false);
      setShowSignUpPassword(false);
      setShowSignUpConfirmPassword(false);
      if (!studentId) {
        setStudentId(generateStudentId());
      }
    }
  }, [isOpen, initialMode]);

  // Helper to process session and complete auth
  const handleCompleteSessionAuth = React.useCallback(async (code?: string | null, hash?: string | null) => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsGoogleLoading(false);
      setIsSubmitting(false);
      return;
    }

    try {
      if (code) {
        try {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            console.warn("exchangeCodeForSession error:", exErr.message);
          }
        } catch (exException) {
          console.warn("Exception during exchangeCodeForSession:", exException);
        }
      } else if (hash && hash.includes("access_token=")) {
        const hashString = hash.startsWith("#") ? hash.substring(1) : hash;
        const params = new URLSearchParams(hashString);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          } catch (setErr) {
            console.warn("setSession error:", setErr);
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        let profile = await fetchUserProfile(session.user.id);
        if (!profile) {
          profile = {
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "শিক্ষার্থী",
            phone_number: session.user.user_metadata?.phone_number || session.user.user_metadata?.phone || "",
            student_id: session.user.user_metadata?.student_id || generateStudentId(),
            role: "Student",
            status: "Active",
          };
          await upsertUserProfile(profile);
        }

        if (profile.status === "Banned") {
          setErrorMsg("আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক স্থগিত/নিষিদ্ধ করা হয়েছে।");
          await supabase.auth.signOut();
          setIsGoogleLoading(false);
          setIsSubmitting(false);
          return;
        }

        localStorage.setItem("job_master_current_user", JSON.stringify(profile));
        onAuthSuccess(profile);
        setIsGoogleLoading(false);
        setIsSubmitting(false);
        onClose();
        return;
      } else {
        // Session not available yet, turn off loading so UI is not frozen
        setIsGoogleLoading(false);
        setIsSubmitting(false);
      }
    } catch (sessionErr: any) {
      console.warn("Session exchange error in AuthModal:", sessionErr);
      setErrorMsg("লগইন সেশন প্রক্রিয়াকরণে সমস্যা হয়েছে: " + (sessionErr?.message || ""));
      setIsGoogleLoading(false);
      setIsSubmitting(false);
    }
  }, [onAuthSuccess, onClose]);

  // Listen for cross-window messages and BroadcastChannel from OAuth popup
  useEffect(() => {
    if (!isOpen) return;

    // 1. Window postMessage listener
    const handleAuthMessage = async (e: MessageEvent) => {
      if (e.data?.type === "SUPABASE_AUTH_CALLBACK" || e.data?.type === "SUPABASE_AUTH_SUCCESS") {
        if (e.data?.error) {
          setErrorMsg(e.data.errorDescription || e.data.error || "গুগল সাইন-ইন প্রক্রিয়া সম্পন্ন হতে পারেনি।");
          setIsGoogleLoading(false);
          return;
        }
        setIsGoogleLoading(true);
        await handleCompleteSessionAuth(e.data.code, e.data.hash);
      }
    };
    window.addEventListener("message", handleAuthMessage);

    // 2. BroadcastChannel across windows/tabs on this origin
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("jobmaster_auth_channel");
        bc.onmessage = async (e) => {
          if (e.data?.type === "SUPABASE_AUTH_CALLBACK" || e.data?.type === "SUPABASE_AUTH_SUCCESS") {
            if (e.data?.error) {
              setErrorMsg(e.data.errorDescription || e.data.error || "গুগল সাইন-ইন প্রক্রিয়া সম্পন্ন হতে পারেনি।");
              setIsGoogleLoading(false);
              return;
            }
            setIsGoogleLoading(true);
            await handleCompleteSessionAuth(e.data.code, e.data.hash);
          }
        };
      }
    } catch (bcErr) {
      console.warn("BroadcastChannel init warning:", bcErr);
    }

    // 3. Storage event fallback
    const handleStorage = async (e: StorageEvent) => {
      if (e.key === "jobmaster_oauth_signal" && e.newValue) {
        try {
          const signal = JSON.parse(e.newValue);
          if (signal.error) {
            setErrorMsg(signal.errorDescription || signal.error || "গুগল সাইন-ইন প্রক্রিয়া সম্পন্ন হতে পারেনি।");
            setIsGoogleLoading(false);
            return;
          }
          setIsGoogleLoading(true);
          await handleCompleteSessionAuth(signal.code, signal.hash);
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("message", handleAuthMessage);
      window.removeEventListener("storage", handleStorage);
      if (bc) {
        try { bc.close(); } catch (err) {}
      }
    };
  }, [isOpen, handleCompleteSessionAuth]);

  // Active polling for session when Google sign-in is in progress (timeout after 30s)
  useEffect(() => {
    if (!isGoogleLoading || !isOpen) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 25) {
        clearInterval(interval);
        setIsGoogleLoading(false);
        return;
      }
      const supabase = getSupabase();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        clearInterval(interval);
        await handleCompleteSessionAuth();
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isGoogleLoading, isOpen, handleCompleteSessionAuth]);

  if (!isOpen) return null;

  // Step 1: Send OTP to user email
  const handleSendResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetErrorMsg("");
    setResetSuccessMsg("");
    setDevOtpHint(null);

    const idVal = resetIdentifier.trim();
    if (!idVal) {
      setResetErrorMsg("অনুগ্রহ করে আপনার নিবন্ধিত ইমেইল বা মোবাইল নম্বর দিন।");
      return;
    }

    setIsResetting(true);

    try {
      let result: any;
      try {
        const res = await fetch("/api/user/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send-reset-otp",
            identifier: idVal,
          }),
        });
        result = await res.json();
      } catch (e) {
        result = await sendPasswordResetOtp(idVal);
      }

      if (!result.success) {
        setResetErrorMsg(result.error || "ভেরিফিকেশন কোড পাঠানো সম্ভব হয়নি।");
        setIsResetting(false);
        return;
      }

      setResetMaskedEmail(result.emailMasked || idVal);
      if (result.devOtp) {
        setDevOtpHint(result.devOtp);
      }
      setResetStep("verify");
      setResetSuccessMsg(result.message || "আপনার নিবন্ধিত ইমেইলে ৬ ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।");
    } catch (err: any) {
      setResetErrorMsg(err?.message || "সার্ভার এরর: অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsResetting(false);
    }
  };

  // Step 2: Verify OTP and set New Password
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg("");
    setResetSuccessMsg("");

    const idVal = resetIdentifier.trim();
    const code = resetOtpCode.trim();
    const newPass = resetNewPassword.trim();
    const confirmPass = resetConfirmPassword.trim();

    if (!code || code.length < 6) {
      setResetErrorMsg("অনুগ্রহ করে মেইলে পাঠানো ৬ ডিজিটের ভেরিফিকেশন কোডটি দিন।");
      return;
    }
    if (!newPass || newPass.length < 6) {
      setResetErrorMsg("নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (newPass !== confirmPass) {
      setResetErrorMsg("নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।");
      return;
    }

    setIsResetting(true);

    try {
      let result: any;
      try {
        const res = await fetch("/api/user/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reset-password-otp",
            identifier: idVal,
            code,
            newPassword: newPass,
          }),
        });
        result = await res.json();
      } catch (e) {
        result = await resetPasswordWithOtp(idVal, code, newPass);
      }

      if (!result.success) {
        setResetErrorMsg(result.error || "পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।");
        setIsResetting(false);
        return;
      }

      setResetSuccessMsg(result.message || "🎉 নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!");
      setPassword(newPass);
      setEmail(idVal);

      setTimeout(() => {
        setIsResetPasswordView(false);
        setResetStep("request");
        setResetOtpCode("");
        setResetSuccessMsg("");
        setDevOtpHint(null);
        setSuccessMsg("🎉 পাসওয়ার্ড সফলভাবে রিসেট হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।");
      }, 1500);
    } catch (err: any) {
      setResetErrorMsg(err?.message || "সার্ভার এরর: পাসওয়ার্ড রিসেট করা সম্ভব হয়নি।");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const inputVal = email.trim();
    if (!inputVal || !password.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার ইমেইল অথবা মোবাইল নম্বর এবং পাসওয়ার্ড দিন।");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUserAccount(inputVal, password.trim());
      if (!result.success || !result.user) {
        setErrorMsg(result.error || "লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("🎉 সফলভাবে লগইন সম্পন্ন হয়েছে!");
      setTimeout(() => {
        onAuthSuccess(result.user!);
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || "লগইন করার সময় ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন।");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস দিন।");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।");
      return;
    }

    setIsSubmitting(true);

    try {
      const regResult = await registerUserAccount({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      if (!regResult.success || !regResult.user) {
        setErrorMsg(regResult.error || "একাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("🎉 অভিনন্দন! আপনার একাউন্ট সফলভাবে তৈরি হয়েছে।");
      setTimeout(() => {
        onAuthSuccess(regResult.user!);
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || "একাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg("");
      setOauthPopupUrl(null);
      setIsGoogleLoading(true);

      const supabase = getSupabase();
      if (supabase) {
        // Direct to dedicated OAuth callback endpoint
        const redirectUrl = typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

        const isIframe = typeof window !== "undefined" && window.self !== window.top;

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

        if (error) {
          setErrorMsg("গুগল সাইন-ইন শুরু করতে ব্যর্থ হয়েছে: " + error.message);
          setIsGoogleLoading(false);
          return;
        }

        if (!data?.url) {
          setErrorMsg("গুগল অথেন্টিকেশন ইউআরএল পাওয়া যায়নি।");
          setIsGoogleLoading(false);
          return;
        }

        // Check if running inside Android WebView (e.g. Kotlin app with AndroidInterface)
        const isAndroidWebView = typeof window !== "undefined" && (
          Boolean((window as any).AndroidInterface) || 
          navigator.userAgent.includes("; wv") ||
          (navigator.userAgent.includes("Android") && navigator.userAgent.includes("Version/"))
        );

        if (isAndroidWebView) {
          // In Android WebView, navigate directly in the current window
          window.location.href = data.url;
          return;
        }

        // Open in popup window so Google Accounts won't be blocked by X-Frame-Options
        const popup = window.open(
          data.url,
          "jobmaster_google_login",
          "width=520,height=650,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
        );

        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          // If popup was blocked by browser
          setOauthPopupUrl(data.url);
          setErrorMsg("ব্রাউজারে পপ-আপ ব্লক করা আছে। অনুগ্রহ করে নিচের বাটনে ক্লিক করে গুগল লগইন সম্পন্ন করুন।");
          setIsGoogleLoading(false);
          return;
        }

        // Monitor popup status: if user closes popup without completing login, reset spinner
        const checkClosed = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkClosed);
              setIsGoogleLoading(false);
            }
          } catch (e) {
            clearInterval(checkClosed);
          }
        }, 1000);

        // Safety timeout (45 seconds) so spinner never hangs indefinitely
        setTimeout(() => {
          try { clearInterval(checkClosed); } catch (e) {}
          setIsGoogleLoading((prev) => {
            if (prev) {
              setErrorMsg("গুগল সাইন-ইনের সময়সীমা শেষ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
            }
            return false;
          });
        }, 45000);
      } else {
        // Fallback simulate demo google sign in
        const googleUser: UserProfile = {
          id: `goog-${Date.now()}`,
          email: "student.google@gmail.com",
          full_name: "Google Student User",
          phone_number: "01812345678",
          student_id: generateStudentId(),
          role: "Student",
          status: "Active",
        };
        localStorage.setItem("job_master_current_user", JSON.stringify(googleUser));
        onAuthSuccess(googleUser);
        setIsGoogleLoading(false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "গুগল সাইন-ইন প্রক্রিয়া ব্যর্থ হয়েছে।");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white border border-slate-100 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF4E00] p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all active:scale-90 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          <h2 className="text-xl font-black tracking-tight leading-tight mt-1">
            {customTitle || (mode === "signin" ? "Sign In" : "Sign Up")}
          </h2>

          {/* Toggle Tabs */}
          <div className="flex bg-black/20 p-1 rounded-xl mt-4 border border-white/10">
            <button
              onClick={() => {
                setMode("signin");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "signin"
                  ? "bg-white text-[#FF4E00] shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => {
                setMode("signup");
                setErrorMsg("");
                setSuccessMsg("");
                if (!studentId) setStudentId(generateStudentId());
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-[#FF4E00] shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORGOT / RESET PASSWORD VIEW WITH EMAIL OTP */}
          {isResetPasswordView && mode === "signin" && (
            <div className="space-y-3.5 animate-fade-in text-left">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 text-[#FF6A00] rounded-lg">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900">নিরাপদ পাসওয়ার্ড রিসেট (Email OTP)</h3>
                    <p className="text-[10px] text-slate-400">
                      {resetStep === "request"
                        ? "নিবন্ধিত ইমেইলে ভেরিফিকেশন কোড পাঠানো হবে"
                        : "মেইলের ৬-ডিজিটের কোড দিয়ে নতুন পাসওয়ার্ড দিন"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordView(false);
                    setResetStep("request");
                    setResetOtpCode("");
                    setResetErrorMsg("");
                    setResetSuccessMsg("");
                    setDevOtpHint(null);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back</span>
                </button>
              </div>

              {resetErrorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                  <span>{resetErrorMsg}</span>
                </div>
              )}

              {resetSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              {/* STEP 1: REQUEST OTP */}
              {resetStep === "request" && (
                <form onSubmit={handleSendResetOtp} className="space-y-3">
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800">
                    <p className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>ইমেইল ভেরিফিকেশন সুরক্ষা</span>
                    </p>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      অনুমোদনহীন পাসওয়ার্ড পরিবর্তন রোধ করতে আপনার নিবন্ধিত মেইলে ৬-ডিজিটের কোড পাঠানো হবে।
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                      Registered Email or Phone *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        placeholder="example@gmail.com / 017XXXXXXXX"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-2.5 bg-[#FF6A00] hover:bg-[#e05d00] disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    {isResetting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>কোড পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>মেইলে কোড পাঠান (Send Code)</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFY OTP AND SET NEW PASSWORD */}
              {resetStep === "verify" && (
                <form onSubmit={handleConfirmResetPassword} className="space-y-3 animate-fade-in">
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">কোড পাঠানো হয়েছে: <span className="font-mono text-slate-900">{resetMaskedEmail}</span></span>
                      <button
                        type="button"
                        onClick={() => handleSendResetOtp()}
                        className="text-[#FF6A00] hover:underline flex items-center gap-0.5 cursor-pointer font-bold text-[10px]"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>আবার পাঠান</span>
                      </button>
                    </div>
                    {devOtpHint && (
                      <p className="text-[10px] font-mono text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded font-bold">
                        🔑 ওটিপি কোড: <span className="font-black text-emerald-950">{devOtpHint}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                      6-Digit Code (মেইলের ৬ ডিজিট কোড) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={resetOtpCode}
                        onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-orange-200 focus:border-[#FF6A00] rounded-xl text-sm font-mono font-black text-slate-900 tracking-widest text-center outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                      New Password (নতুন পাসওয়ার্ড) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showResetPassword ? "text" : "password"}
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                        tabIndex={-1}
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showResetPassword ? "text" : "password"}
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-2.5 bg-[#FF6A00] hover:bg-[#e05d00] disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1 mt-2"
                  >
                    {isResetting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>পাসওয়ার্ড সেভ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>কোড সাবমিট ও পাসওয়ার্ড সেভ করুন</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* MODE: SIGN IN FORM */}
          {!isResetPasswordView && mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  Email or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com / 017XXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between pl-1 pr-1">
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase block">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(email);
                      setIsResetPasswordView(true);
                      setResetStep("request");
                      setResetErrorMsg("");
                      setResetSuccessMsg("");
                      setDevOtpHint(null);
                    }}
                    className="text-[10px] font-black text-[#FF6A00] hover:underline cursor-pointer"
                  >
                    Forgot Password? (পাসওয়ার্ড ভুলে গেছেন?)
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showSignInPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                    tabIndex={-1}
                    aria-label={showSignInPassword ? "Hide password" : "Show password"}
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#FF6A00] hover:bg-[#e05d00] text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: SIGN UP FORM */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                    tabIndex={-1}
                    aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showSignUpConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                    tabIndex={-1}
                    aria-label={showSignUpConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#FF6A00] hover:bg-[#e05d00] text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold">
              <span className="bg-white px-3 text-slate-400">OR</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#FF6A00] font-bold">Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {oauthPopupUrl && (
            <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-center animate-fade-in">
              <p className="text-[11px] text-amber-900 font-bold mb-1.5 leading-snug">
                Popup window blocked. Click below to continue:
              </p>
              <a
                href={oauthPopupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#FF6A00] hover:bg-[#e55f00] text-white text-[11px] font-black rounded-lg transition-all shadow-xs"
                onClick={() => setIsGoogleLoading(true)}
              >
                Open Google Sign In Window
              </a>
            </div>
          )}
        </div>

        {/* Footer switch */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs font-semibold text-slate-600 shrink-0">
          {mode === "signin" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                  if (!studentId) setStudentId(generateStudentId());
                }}
                className="text-[#FF6A00] font-black hover:underline cursor-pointer ml-1"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-[#FF6A00] font-black hover:underline cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
