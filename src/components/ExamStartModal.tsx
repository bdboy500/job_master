"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Clock, HelpCircle, CheckCircle2, AlertTriangle, ShieldCheck, WifiOff, Send } from "lucide-react";
import { ExamPaper, getExamStatus } from "../lib/exams";
import MathRenderer from "./MathRenderer";

interface ExamStartModalProps {
  paper: ExamPaper | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitExam: (paper: ExamPaper, userAnswers: Record<number, number>, timeSpentSeconds: number) => void;
}

export default function ExamStartModal({
  paper,
  isOpen,
  onClose,
  onSubmitExam,
}: ExamStartModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  // Monitor network status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Offline Exam Setup & Local Question Caching
  useEffect(() => {
    if (isOpen && paper) {
      const questionsList = paper.questions || [];
      const duration = paper.totalDurationSeconds || questionsList.length * 36;
      setTimeLeft(duration);
      setTotalDuration(duration);
      setCurrentQuestionIndex(0);
      setIsSubmitted(false);
      setShowConfirmSubmit(false);

      // Offline Exam Capability: Save active exam paper & questions to local storage immediately
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("jobmaster_active_exam_paper", JSON.stringify(paper));
          localStorage.setItem("jobmaster_active_exam_questions", JSON.stringify(questionsList));
          
          // Restore any existing answers if resuming
          const storedAnswers = localStorage.getItem("jobmaster_active_exam_answers");
          if (storedAnswers) {
            setUserAnswers(JSON.parse(storedAnswers));
          } else {
            setUserAnswers({});
            localStorage.setItem("jobmaster_active_exam_answers", JSON.stringify({}));
          }
        } catch (e) {
          console.warn("Failed to cache exam questions locally:", e);
        }
      }
    }
  }, [isOpen, paper]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || !paper || isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, paper, isSubmitted, timeLeft]);

  // Handle Option Select with Realtime Local Persist
  const handleOptionSelect = (qIdx: number, optionIdx: number) => {
    if (isSubmitted) return;
    const nextAnswers = { ...userAnswers, [qIdx]: optionIdx };
    setUserAnswers(nextAnswers);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("jobmaster_active_exam_answers", JSON.stringify(nextAnswers));
      } catch (e) {}
    }
  };

  // Submit Exam
  const handleFinalSubmit = useCallback(() => {
    if (isSubmitted || !paper) return;
    setIsSubmitted(true);
    setShowConfirmSubmit(false);

    const timeSpent = totalDuration - timeLeft;

    // Save offline completion log
    if (typeof window !== "undefined") {
      try {
        const historyRaw = localStorage.getItem("jobmaster_offline_exam_history");
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        history.push({
          paperId: paper.id,
          title: paper.title,
          submittedAt: new Date().toISOString(),
          userAnswers,
          timeSpent,
        });
        localStorage.setItem("jobmaster_offline_exam_history", JSON.stringify(history));
        
        // Clean active exam cache
        localStorage.removeItem("jobmaster_active_exam_paper");
        localStorage.removeItem("jobmaster_active_exam_answers");
      } catch (e) {}
    }

    onSubmitExam(paper, userAnswers, timeSpent);
  }, [isSubmitted, paper, totalDuration, timeLeft, userAnswers, onSubmitExam]);

  if (!isOpen || !paper) return null;

  const questions = paper.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] relative">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[#FF6A00]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white line-clamp-1">{paper.title}</h3>
                {isOffline && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> অফলাইন মোড (Offline)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                প্রশ্ন {currentQuestionIndex + 1} / {questions.length} • উত্তর দেওয়া হয়েছে: {answeredCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold ${
              timeLeft < 60 
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse" 
                : "bg-slate-800 border-slate-700 text-amber-400"
            }`}>
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-3.5 py-1.5 bg-[#FF6A00] hover:bg-[#e05d00] text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              জমা দিন (Submit)
            </button>
          </div>
        </div>

        {/* Offline Banner indicator */}
        {isOffline && (
          <div className="bg-amber-500 text-slate-900 text-[11px] font-bold px-4 py-1.5 flex items-center justify-between">
            <span>⚡ আপনি অফলাইনে আছেন। আপনার প্রশ্নের উত্তরগুলো ডিভাইস ডিভাইসে লোকালি সংরক্ষিত হচ্ছে।</span>
            <span className="underline text-[10px]">অফলাইন সেভ একটিভ</span>
          </div>
        )}

        {/* Question Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {currentQ ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-orange-100 text-[#FF6A00] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {currentQuestionIndex + 1}
                </span>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
                  <MathRenderer content={(currentQ as any).questionText || currentQ.question || "প্রশ্ন পাওয়া যায়নি"} />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {currentQ.options?.map((opt: string, oIdx: number) => {
                  const isSelected = userAnswers[currentQuestionIndex] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleOptionSelect(currentQuestionIndex, oIdx)}
                      className={`p-3.5 rounded-2xl text-left text-xs sm:text-sm font-semibold transition-all border flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-orange-50 border-[#FF6A00] text-[#FF6A00] shadow-sm font-extrabold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center ${
                          isSelected ? "bg-[#FF6A00] text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF6A00]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 font-bold">
              কোনো প্রশ্ন পাওয়া যায়নি।
            </div>
          )}
        </div>

        {/* Question Quick Navigation Palette */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            {questions.map((_, idx) => {
              const isAnswered = userAnswers[idx] !== undefined;
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${
                    isCurrent
                      ? "ring-2 ring-[#FF6A00] ring-offset-1 bg-[#FF6A00] text-white"
                      : isAnswered
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              পূর্ববর্তী
            </button>
            <button
              disabled={currentQuestionIndex >= questions.length - 1}
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl disabled:opacity-40 cursor-pointer"
            >
              পরবর্তী
            </button>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showConfirmSubmit && (
          <div className="absolute inset-0 z-10 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100 animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6A00] flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg text-slate-900">পরীক্ষা জমা দিতে চান?</h4>
              <p className="text-xs text-slate-500 font-medium">
                মোট প্রশ্ন: {questions.length} টি • উত্তর দিয়েছেন: {answeredCount} টি
                {isOffline && " (অফলাইনে লোকালি সংরক্ষিত হবে)"}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ফিরে যান
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#e05d00] text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
                >
                  হ্যাঁ, জমা দিন
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
