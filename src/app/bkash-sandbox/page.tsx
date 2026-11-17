"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2, CreditCard } from "lucide-react";

const TEST_WALLETS = [
  { label: "Active Success (01770618575)", number: "01770618575", type: "success" },
  { label: "Active Success (01929918378)", number: "01929918378", type: "success" },
  { label: "Insufficient Balance (01823074817)", number: "01823074817", type: "fail" },
  { label: "Debit Block (01823074818)", number: "01823074818", type: "fail" },
];

function BkashSandboxCheckoutInner() {
  const searchParams = useSearchParams();
  const paymentID = searchParams.get("paymentID") || "";
  const amount = searchParams.get("amount") || "0";
  const invoice = searchParams.get("invoice") || "";
  const pkgTitle = searchParams.get("pkg") || "JobMaster Package";

  const [step, setStep] = useState<"wallet" | "otp" | "pin">("wallet");
  const [wallet, setWallet] = useState("01770618575");
  const [otp, setOtp] = useState("123456");
  const [pin, setPin] = useState("12121");
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: "confirm" | "cancel" | "failure") => {
    setErrorMsg("");
    setIsProcessing(true);
    try {
      const res = await fetch("/api/bkash/sandbox-prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentID,
          wallet,
          otp,
          pin,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.redirectUrl) {
        setErrorMsg(data?.error || "টেস্ট পেমেন্ট প্রসেস করা যায়নি।");
        setIsProcessing(false);
        return;
      }
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      setErrorMsg(err?.message || "সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে।");
      setIsProcessing(false);
    }
  };

  if (!paymentID) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3 shadow-lg">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="font-black text-base text-slate-800">ভ্যালিড Payment ID পাওয়া যায়নি</h2>
          <a
            href="/?view=packages"
            className="inline-block px-4 py-2 bg-[#E2136E] text-white font-bold text-xs rounded-xl"
          >
            প্যাকেজে ফিরে যান
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-pink-100">
        {/* Test Mode Top Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-[11px] font-black text-amber-900">
            bKash Sandbox Test Simulator • আপনার আসল API Env যোগ করার পর সরাসরি আসল bKash পেজ ওপেন হবে
          </p>
        </div>

        {/* Official bKash Brand Header */}
        <div className="bg-[#E2136E] text-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white text-[#E2136E] rounded-xl flex items-center justify-center font-black text-sm shadow-xs">
                bKash
              </div>
              <div>
                <h1 className="font-black text-sm tracking-tight">bKash Checkout (Test Mode)</h1>
                <p className="text-[10px] text-pink-100 font-semibold">Merchant: JobMaster</p>
              </div>
            </div>
            <span className="text-lg font-black bg-white/15 px-3 py-1 rounded-xl">
              ৳{amount}
            </span>
          </div>

          <div className="bg-black/15 rounded-xl p-2.5 text-[11px] flex items-center justify-between gap-2">
            <span className="truncate font-bold">{pkgTitle}</span>
            <span className="font-mono text-[10px] text-pink-100 shrink-0">{invoice}</span>
          </div>
        </div>

        {/* Main Step Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Step Indicators */}
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span className={step === "wallet" ? "text-[#E2136E]" : "text-emerald-600"}>1. Wallet</span>
            <span className={step === "otp" ? "text-[#E2136E]" : step === "pin" ? "text-emerald-600" : ""}>2. OTP (123456)</span>
            <span className={step === "pin" ? "text-[#E2136E]" : ""}>3. PIN (12121)</span>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === "wallet" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Your bKash Account Number (Sandbox Test Wallet)
                </label>
                <input
                  type="text"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="e.g 01770618575"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#E2136E] rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:outline-none tracking-wider"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase block">
                  দ্রুত টেস্ট ওয়ালেট বাছাই করুন:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {TEST_WALLETS.map((w) => (
                    <button
                      key={w.number}
                      type="button"
                      onClick={() => setWallet(w.number)}
                      className={`px-2.5 py-2 rounded-xl border text-left text-[10px] font-bold transition-all cursor-pointer ${
                        wallet === w.number
                          ? "border-[#E2136E] bg-pink-50 text-[#E2136E]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!/^01\d{9}$/.test(wallet.trim())) {
                    setErrorMsg("সঠিক ১১ সংখ্যার টেস্ট বিকাশ নম্বর দিন (যেমন: 01770618575)।");
                    return;
                  }
                  setErrorMsg("");
                  setStep("otp");
                }}
                className="w-full py-3 bg-[#E2136E] hover:bg-[#c91061] text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Confirm Wallet & Proceed
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Enter Verification Code (Test OTP: 123456)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#E2136E] rounded-xl px-4 py-3 text-center text-base font-black text-slate-900 focus:outline-none tracking-[0.35em]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("wallet")}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (otp.trim() !== "123456") {
                      setErrorMsg("ভুল OTP! টেস্ট মোডের জন্য OTP হলো: 123456");
                      return;
                    }
                    setErrorMsg("");
                    setStep("pin");
                  }}
                  className="flex-1 py-3 bg-[#E2136E] hover:bg-[#c91061] text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  Confirm OTP
                </button>
              </div>
            </div>
          )}

          {step === "pin" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Enter bKash PIN (Test PIN: 12121)
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="12121"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#E2136E] rounded-xl px-4 py-3 text-center text-base font-black text-slate-900 focus:outline-none tracking-[0.35em]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setStep("otp")}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction("confirm")}
                  className="flex-1 py-3 bg-[#E2136E] hover:bg-[#c91061] disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Payment (৳{amount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Cancel / Simulate Failure Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAction("cancel")}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel Payment
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleAction("failure")}
              className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer"
            >
              Simulate Failure
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 pt-1">
            <Lock className="w-3 h-3" />
            <span>Protected by bKash Callback & Token Engine</span>
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BkashSandboxPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 flex items-center gap-3 shadow-md">
            <CreditCard className="w-5 h-5 text-[#E2136E] animate-pulse" />
            <span className="text-xs font-bold text-slate-700">bKash Test Checkout লোড হচ্ছে...</span>
          </div>
        </div>
      }
    >
      <BkashSandboxCheckoutInner />
    </Suspense>
  );
}
