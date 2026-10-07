"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getSupabase } from "../lib/supabase";
import {
  UserProfile,
  fetchUserProfile,
  upsertUserProfile,
  generateStudentId,
} from "../lib/user_profiles";
import {
  loginUserAccount,
  registerUserAccount,
} from "../lib/user_auth";

interface AuthViewProps {
  onBack: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

export default function AuthView({
  onBack,
  onAuthSuccess,
  initialMode = "signin",
  onModeChange,
}: AuthViewProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isLoading = isSubmitting || isGoogleLoading;
  const [oauthPopupUrl, setOauthPopupUrl] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
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
  }, [initialMode]);

  // Helper to process session and complete auth
  const handleCompleteSessionAuth = useCallback(async (code?: string | null, hash?: string | null) => {
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
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
            phone_number: session.user.user_metadata?.phone_number || session.user.user_metadata?.phone || "",
            student_id: session.user.user_metadata?.student_id || generateStudentId(),
            role: "Student",
            status: "Active",
          };
          await upsertUserProfile(profile);
        }

        if (profile.status === "Banned") {
          setErrorMsg("Account suspended or restricted by administrator.");
          await supabase.auth.signOut();
          setIsGoogleLoading(false);
          setIsSubmitting(false);
          return;
        }

        localStorage.setItem("job_master_current_user", JSON.stringify(profile));
        onAuthSuccess(profile);
        setIsGoogleLoading(false);
        setIsSubmitting(false);
        return;
      } else {
        setIsGoogleLoading(false);
        setIsSubmitting(false);
      }
    } catch (sessionErr: any) {
      console.warn("Session exchange error in AuthView:", sessionErr);
      setErrorMsg("Authentication session error: " + (sessionErr?.message || ""));
      setIsGoogleLoading(false);
      setIsSubmitting(false);
    }
  }, [onAuthSuccess]);

  // Listen for cross-window messages and BroadcastChannel from OAuth popup
  useEffect(() => {
    const handleAuthMessage = async (e: MessageEvent) => {
      if (e.data?.type === "SUPABASE_AUTH_CALLBACK" || e.data?.type === "SUPABASE_AUTH_SUCCESS") {
        if (e.data?.error) {
          setErrorMsg(e.data.errorDescription || e.data.error || "Google authentication failed.");
          setIsGoogleLoading(false);
          return;
        }
        setIsGoogleLoading(true);
        await handleCompleteSessionAuth(e.data.code, e.data.hash);
      }
    };
    window.addEventListener("message", handleAuthMessage);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("jobmaster_auth_channel");
        bc.onmessage = async (e) => {
          if (e.data?.type === "SUPABASE_AUTH_CALLBACK" || e.data?.type === "SUPABASE_AUTH_SUCCESS") {
            if (e.data?.error) {
              setErrorMsg(e.data.errorDescription || e.data.error || "Google authentication failed.");
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

    const handleStorage = async (e: StorageEvent) => {
      if (e.key === "jobmaster_oauth_signal" && e.newValue) {
        try {
          const signal = JSON.parse(e.newValue);
          if (signal.error) {
            setErrorMsg(signal.errorDescription || signal.error || "Google authentication failed.");
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
  }, [handleCompleteSessionAuth]);

  // Polling for session when Google sign-in is active
  useEffect(() => {
    if (!isGoogleLoading) return;

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
  }, [isGoogleLoading, handleCompleteSessionAuth]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const inputVal = email.trim();
    if (!inputVal || !password.trim()) {
      setErrorMsg("Please enter your email or phone number and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUserAccount(inputVal, password.trim());
      if (!result.success || !result.user) {
        setErrorMsg(result.error || "Sign in failed. Please check your credentials.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("Signed in successfully!");
      setTimeout(() => {
        onAuthSuccess(result.user!);
        setIsSubmitting(false);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Sign in error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg("Please enter your mobile phone number.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Password and Confirm Password do not match.");
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
        setErrorMsg(regResult.error || "Account creation failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg("Account created successfully!");
      setTimeout(() => {
        onAuthSuccess(regResult.user!);
        setIsSubmitting(false);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || "Account creation error occurred. Please try again.");
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
        const redirectUrl = typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

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
          setErrorMsg("Failed to initialize Google sign in: " + error.message);
          setIsGoogleLoading(false);
          return;
        }

        if (!data?.url) {
          setErrorMsg("Google authentication URL not available.");
          setIsGoogleLoading(false);
          return;
        }

        const isAndroidWebView = typeof window !== "undefined" && (
          Boolean((window as any).AndroidInterface) || 
          navigator.userAgent.includes("; wv") ||
          (navigator.userAgent.includes("Android") && navigator.userAgent.includes("Version/"))
        );

        if (isAndroidWebView) {
          window.location.href = data.url;
          return;
        }

        const popup = window.open(
          data.url,
          "jobmaster_google_login",
          "width=520,height=650,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
        );

        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          setOauthPopupUrl(data.url);
          setErrorMsg("Browser blocked the popup window. Please click the button below to proceed:");
          setIsGoogleLoading(false);
          return;
        }

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

        setTimeout(() => {
          try { clearInterval(checkClosed); } catch (e) {}
          setIsGoogleLoading((prev) => {
            if (prev) {
              setErrorMsg("Google sign in timed out. Please try again.");
            }
            return false;
          });
        }, 45000);
      } else {
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
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Google sign in failed.");
      setIsGoogleLoading(false);
    }
  };

  const handleModeSwitch = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setErrorMsg("");
    setSuccessMsg("");
    if (newMode === "signup" && !studentId) {
      setStudentId(generateStudentId());
    }
    onModeChange?.(newMode);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-10 selection:bg-orange-500 selection:text-white animate-fade-in text-left">
      {/* Clean Segmented Tab Switch (Sign In / Sign Up) - Directly below Top App Bar */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl mb-5">
        <button
          type="button"
          onClick={() => handleModeSwitch("signin")}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            mode === "signin"
              ? "bg-white text-[#FF6A00] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => handleModeSwitch("signup")}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            mode === "signup"
              ? "bg-white text-[#FF6A00] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Alert messages */}
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SIGN IN FORM */}
      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block pl-1">
              Email or Phone
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com / 017XXXXXXXX"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type={showSignInPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
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
            className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#e05d00] text-white font-black text-sm rounded-2xl active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      )}

      {/* SIGN UP FORM */}
      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block pl-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block pl-1">
              Mobile Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block pl-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block pl-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type={showSignUpPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                tabIndex={-1}
                aria-label={showSignUpPassword ? "Hide password" : "Show password"}
              >
                {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block pl-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type={showSignUpConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
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
            className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#e05d00] text-white font-black text-sm rounded-2xl active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase font-extrabold">
          <span className="bg-slate-50 px-3 text-slate-400">OR</span>
        </div>
      </div>

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-sm rounded-2xl border border-slate-200 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
      >
        {isGoogleLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#FF6A00] font-bold">Connecting with Google...</span>
          </>
        ) : (
          <>
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
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
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center animate-fade-in">
          <p className="text-xs text-amber-900 font-bold mb-2">
            Popup window blocked. Click below to continue:
          </p>
          <a
            href={oauthPopupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FF6A00] hover:bg-[#e55f00] text-white text-xs font-black rounded-xl transition-all"
            onClick={() => setIsGoogleLoading(true)}
          >
            Open Google Sign In Window
          </a>
        </div>
      )}

      {/* Footer toggle switch */}
      <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs sm:text-sm font-semibold text-slate-600">
        {mode === "signin" ? (
          <p>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => handleModeSwitch("signup")}
              className="text-[#FF6A00] font-black hover:underline cursor-pointer ml-1"
            >
              Sign Up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => handleModeSwitch("signin")}
              className="text-[#FF6A00] font-black hover:underline cursor-pointer ml-1"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
