"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, Mail, Phone, User, IdCard, LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { getSupabase } from "../lib/supabase";
import { UserProfile, generateStudentId, upsertUserProfile, fetchUserProfile } from "../lib/user_profiles";
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isLoading = isSubmitting || isGoogleLoading;
  const [oauthPopupUrl, setOauthPopupUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
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
      const supabase = getSupabase();
      let targetEmail = inputVal;

      // Determine if the input is a mobile phone number or student ID instead of an email
      const isPhoneOrId = !inputVal.includes("@");
      const cleanPhone = inputVal.replace(/[\s-]/g, "");
      const digitsOnly = cleanPhone.replace(/\D/g, "");
      const bdNormalizedPhone = digitsOnly.startsWith("880") ? digitsOnly.slice(2) : digitsOnly;

      if (isPhoneOrId) {
        // 1. Check local registered users list first
        const localUsersRaw = typeof window !== "undefined" ? localStorage.getItem("job_master_registered_users") : null;
        const localUsers: UserProfile[] = localUsersRaw ? JSON.parse(localUsersRaw) : [];
        const localMatched = localUsers.find((u) => {
          const uPhone = (u.phone_number || "").replace(/\D/g, "").replace(/^88/, "");
          const isPhoneMatch = bdNormalizedPhone && uPhone && (uPhone === bdNormalizedPhone || uPhone.endsWith(bdNormalizedPhone));
          const isIdMatch = u.student_id && u.student_id.toLowerCase() === inputVal.toLowerCase();
          return isPhoneMatch || isIdMatch;
        });

        if (localMatched?.email) {
          targetEmail = localMatched.email;
        } else if (supabase) {
          // 2. Query Supabase profiles table for matching phone or student_id with 4s timeout
          try {
            const timeoutQuery = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 4000));
            const queryPromise = supabase
              .from("profiles")
              .select("id, email, phone_number, student_id, full_name, role, status")
              .or(`phone_number.eq.${cleanPhone},phone_number.eq.${bdNormalizedPhone},phone_number.eq.+88${bdNormalizedPhone},student_id.eq.${inputVal}`)
              .maybeSingle();

            const { data: dbProfile }: any = await Promise.race([queryPromise, timeoutQuery]);

            if (dbProfile?.email) {
              targetEmail = dbProfile.email;
            }
          } catch (dbErr) {
            console.warn("Phone lookup in profiles error:", dbErr);
          }
        }

        // If phone or student ID did not match any registered email address:
        if (!targetEmail.includes("@")) {
          // Check local fallback
          const matched = localUsers.find((u) => {
            const uPhoneClean = (u.phone_number || "").replace(/\D/g, "").replace(/^88/, "");
            const uPhoneMatch = bdNormalizedPhone && uPhoneClean === bdNormalizedPhone;
            const uIdMatch = u.student_id && u.student_id.toLowerCase() === inputVal.toLowerCase();
            return uPhoneMatch || uIdMatch;
          });

          if (matched) {
            if (matched.status === "Banned") {
              setErrorMsg("আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক স্থগিত/নিষিদ্ধ করা হয়েছে।");
              setIsSubmitting(false);
              return;
            }
            localStorage.setItem("job_master_current_user", JSON.stringify(matched));
            onAuthSuccess(matched);
            setIsSubmitting(false);
            onClose();
            return;
          }

          setErrorMsg("এই মোবাইল নম্বর বা আইডি দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে সঠিক নম্বর দিন অথবা সাইন-আপ করুন।");
          setIsSubmitting(false);
          return;
        }
      }

      if (supabase) {
        try {
          const timeoutAuth = new Promise((_, reject) => setTimeout(() => reject(new Error("NETWORK_TIMEOUT")), 8000));
          const authPromise = supabase.auth.signInWithPassword({
            email: targetEmail.trim(),
            password: password.trim(),
          });

          const { data: authData, error: authError }: any = await Promise.race([authPromise, timeoutAuth]);

          if (authError) {
            console.warn("Supabase auth error:", authError.message);
            // Fallback check against local users if Supabase auth fails or is not enabled
            const localUsersRaw = localStorage.getItem("job_master_registered_users");
            const localUsers: UserProfile[] = localUsersRaw ? JSON.parse(localUsersRaw) : [];
            const matched = localUsers.find((u) => {
              const uEmailMatch = u.email.toLowerCase() === targetEmail.toLowerCase();
              const uPhoneClean = (u.phone_number || "").replace(/\D/g, "").replace(/^88/, "");
              const uPhoneMatch = bdNormalizedPhone && uPhoneClean === bdNormalizedPhone;
              return uEmailMatch || uPhoneMatch;
            });

            if (matched) {
              if (matched.status === "Banned") {
                setErrorMsg("আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক স্থগিত/নিষিদ্ধ করা হয়েছে।");
                setIsSubmitting(false);
                return;
              }
              localStorage.setItem("job_master_current_user", JSON.stringify(matched));
              onAuthSuccess(matched);
              setIsSubmitting(false);
              onClose();
              return;
            }

            // Check if account might have been created via Google
            if (authError.message.includes("Invalid login credentials")) {
              try {
                const { data: prof } = await supabase
                  .from("profiles")
                  .select("email, full_name")
                  .eq("email", targetEmail.trim())
                  .maybeSingle();

                if (prof) {
                  setErrorMsg("পাসওয়ার্ড সঠিক নয়। আপনি পূর্বে Google দিয়ে লগইন করে থাকলে অনুগ্রহ করে নিচের 'Google দিয়ে সাইন ইন করুন' বাটনে ক্লিক করুন।");
                  setIsSubmitting(false);
                  return;
                }
              } catch (e) {}

              setErrorMsg(
                isPhoneOrId
                  ? "মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়। দয়া করে সঠিক নম্বর ও পাসওয়ার্ড দিন।"
                  : "ভুল ইমেইল অথবা পাসওয়ার্ড দেওয়া হয়েছে। আবার চেষ্টা করুন।"
              );
            } else {
              setErrorMsg(authError.message || "লগইন করতে সমস্যা হয়েছে।");
            }
            setIsSubmitting(false);
            return;
          }

          if (authData?.user) {
            // Fetch user profile from Supabase profiles table
            let profile = await fetchUserProfile(authData.user.id);

            if (!profile) {
              profile = {
                id: authData.user.id,
                email: authData.user.email || targetEmail.trim(),
                full_name: authData.user.user_metadata?.full_name || fullName || targetEmail.split("@")[0],
                phone_number: authData.user.user_metadata?.phone_number || phoneNumber || "",
                student_id: authData.user.user_metadata?.student_id || studentId || generateStudentId(),
                role: "Student",
                status: "Active",
              };
              await upsertUserProfile(profile);
            }

            if (profile.status === "Banned") {
              setErrorMsg("আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত/নিষিদ্ধ করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।");
              await supabase.auth.signOut();
              setIsSubmitting(false);
              return;
            }

            localStorage.setItem("job_master_current_user", JSON.stringify(profile));
            onAuthSuccess(profile);
            setIsSubmitting(false);
            onClose();
            return;
          }
        } catch (timeoutErr: any) {
          if (timeoutErr?.message === "NETWORK_TIMEOUT") {
            setErrorMsg("সার্ভারে সংযোগ করতে সময় বেশি লাগছে। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।");
            setIsSubmitting(false);
            return;
          }
          throw timeoutErr;
        }
      }

      // Offline / Local state fallback
      const localProfile: UserProfile = {
        id: `usr-${Date.now()}`,
        email: targetEmail.trim(),
        full_name: fullName || targetEmail.split("@")[0],
        phone_number: isPhoneOrId ? inputVal : phoneNumber || "01700000000",
        student_id: studentId || generateStudentId(),
        role: "Student",
        status: "Active",
      };

      localStorage.setItem("job_master_current_user", JSON.stringify(localProfile));
      onAuthSuccess(localProfile);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "লগইন করার সময় ত্রুটি ঘটেছে।");
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
    // Student ID is auto-generated in background
    const finalStudentId = generateStudentId();

    try {
      const supabase = getSupabase();
      let createdUserId = `usr-${Date.now()}`;

      if (supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
              name: fullName.trim(),
              phone_number: phoneNumber.trim(),
              phone: phoneNumber.trim(),
              student_id: finalStudentId,
            },
          },
        });

        if (authError) {
          console.warn("Supabase signup warning:", authError.message);
          if (authError.message.includes("User already registered")) {
            setErrorMsg("এই ইমেইল এড্রেস দিয়ে ইতিমধ্যে একটি একাউন্ট খোলা আছে। অনুগ্রহ করে লগইন করুন।");
          } else if (authError.message.includes("Password should be")) {
            setErrorMsg("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
          } else {
            setErrorMsg("সাইন-আপ ব্যর্থ হয়েছে: " + authError.message);
          }
          setIsSubmitting(false);
          return;
        }

        if (authData?.user) {
          createdUserId = authData.user.id;
        }
      }

      const newProfile: UserProfile = {
        id: createdUserId,
        email: email.trim(),
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        student_id: finalStudentId,
        role: "Student",
        status: "Active",
        created_at: new Date().toISOString(),
      };

      // Upsert to Supabase DB profiles table
      await upsertUserProfile(newProfile);

      // Save to local storage cache & registered users array
      const localUsersRaw = localStorage.getItem("job_master_registered_users");
      const localUsers: UserProfile[] = localUsersRaw ? JSON.parse(localUsersRaw) : [];
      if (!localUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        localUsers.push(newProfile);
        localStorage.setItem("job_master_registered_users", JSON.stringify(localUsers));
      }

      localStorage.setItem("job_master_current_user", JSON.stringify(newProfile));

      setSuccessMsg("🎉 অভিনন্দন! আপনার একাউন্ট সফলভাবে তৈরি হয়েছে।");
      
      setTimeout(() => {
        onAuthSuccess(newProfile);
        setIsSubmitting(false);
        onClose();
      }, 800);
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

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">
              JOB MASTER AUTHENTICATION
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight leading-tight">
            {customTitle || (mode === "signin" ? "সাইন ইন করুন (Log In)" : "নতুন একাউন্ট খুলুন (ফ্রি)")}
          </h2>
          <p className="text-xs text-white/90 font-medium mt-0.5">
            {customSubtitle || (mode === "signin"
              ? "পরীক্ষা দিতে ও পূর্ণাঙ্গ মডেল টেস্টে অংশ নিতে লগইন করুন"
              : "আজই যুক্ত হয়ে যেকোনো পরীক্ষার প্রশ্নপত্রে অংশ নিন")}
          </p>

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
              <span>লগইন (Sign In)</span>
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
              <span>রেজিস্টার (Sign Up)</span>
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

          {/* MODE: SIGN IN FORM */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  ইমেইল অথবা মোবাইল নম্বর (Email or Phone)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com অথবা 017XXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  পাসওয়ার্ড (Password)
                </label>
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
                    <span>লগইন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>সাইন ইন করুন</span>
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
                  ইউজারের পূর্ণ নাম (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase block pl-1">
                  মোবাইল নম্বর (Mobile Number) *
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
                  ইমেইল এড্রেস (Email Address) *
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
                  পাসওয়ার্ড (Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="অন্তত ৬ অক্ষরের পাসওয়ার্ড"
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
                  কনফার্ম পাসওয়ার্ড (Confirm Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showSignUpConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড নিশ্চিত করুন"
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
                    <span>একাউন্ট তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>নতুন একাউন্ট খুলুন (ফ্রি)</span>
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
              <span className="bg-white px-3 text-slate-400">অথবা</span>
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
                <span className="text-[#FF6A00] font-bold">Google-এ সংযোগ করা হচ্ছে...</span>
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
                <span>
                  {mode === "signin"
                    ? "Google দিয়ে সাইন ইন করুন"
                    : "Google দিয়ে রেজিস্টার করুন"}
                </span>
              </>
            )}
          </button>

          {oauthPopupUrl && (
            <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-center animate-fade-in">
              <p className="text-[11px] text-amber-900 font-bold mb-1.5 leading-snug">
                ব্রাউজার বা আইফ্রেম পপ-আপ ব্লক করেছে। অনুগ্রহ করে নিচের বাটনে ক্লিক করুন:
              </p>
              <a
                href={oauthPopupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#FF6A00] hover:bg-[#e55f00] text-white text-[11px] font-black rounded-lg transition-all shadow-xs"
                onClick={() => setIsGoogleLoading(true)}
              >
                গুগল সাইন-ইন উইন্ডো খুলুন
              </a>
            </div>
          )}
        </div>

        {/* Footer switch */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs font-semibold text-slate-600 shrink-0">
          {mode === "signin" ? (
            <p>
              নতুন অ্যাকাউন্ট নেই?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                  if (!studentId) setStudentId(generateStudentId());
                }}
                className="text-[#FF6A00] font-black hover:underline cursor-pointer ml-1"
              >
                নতুন একাউন্ট খুলুন (ফ্রি)
              </button>
            </p>
          ) : (
            <p>
              ইতিমধ্যে একাউন্ট আছে?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-[#FF6A00] font-black hover:underline cursor-pointer ml-1"
              >
                সাইন ইন করুন
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
