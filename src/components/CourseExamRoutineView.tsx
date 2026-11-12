"use client";

import React, { useState, useMemo } from "react";
import { 
  Calendar, 
  Archive, 
  Award, 
  Clock, 
  Play, 
  RefreshCw, 
  Share2, 
  BookOpen, 
  X, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Timer,
  ChevronRight,
  FileText,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { ExamPaper, getExamStatus } from "../lib/exams";
import { QUIZ_QUESTIONS } from "../data";

interface CourseExamRoutineViewProps {
  courseName: string;
  courseTitle?: string;
  subSubjectName?: string;
  papers: ExamPaper[];
  onStartExam: (paper: ExamPaper) => void;
  onSharePaper: (paper: ExamPaper) => void;
  onViewLeaderboard?: (paper: ExamPaper) => void;
  soundEnabled: boolean;
  quizAudio?: any;
  formatBengaliExamDate: (dateStr?: string) => string;
}

function getQuestionCorrectIndex(q: any): number {
  if (typeof q?.correctOptionIndex === "number") return q.correctOptionIndex;
  if (typeof q?.correctIndex === "number") return q.correctIndex;
  if (typeof q?.correctAnswer === "number") return q.correctAnswer;
  if (typeof q?.correctAnswer === "string") {
    const num = parseInt(q.correctAnswer, 10);
    if (!isNaN(num) && num >= 0 && num <= 3) return num;
    if (Array.isArray(q.options)) {
      const idx = q.options.findIndex((opt: string) => opt?.trim() === q.correctAnswer?.trim());
      if (idx >= 0) return idx;
    }
  }
  return 0;
}

export default function CourseExamRoutineView({
  courseName,
  courseTitle,
  subSubjectName,
  papers,
  onStartExam,
  onSharePaper,
  onViewLeaderboard,
  soundEnabled,
  quizAudio,
  formatBengaliExamDate,
}: CourseExamRoutineViewProps) {
  const [activeTab, setActiveTab] = useState<"routine" | "archive" | "results">("routine");
  const [selectedSyllabusPaper, setSelectedSyllabusPaper] = useState<ExamPaper | null>(null);
  const [selectedQuestionsPaper, setSelectedQuestionsPaper] = useState<ExamPaper | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [userSelectedOptions, setUserSelectedOptions] = useState<Record<number, number>>({});
  const [showAllAnswers, setShowAllAnswers] = useState<boolean>(false);

  // Filter and sort papers
  const { livePapers, upcomingPapers, archivedPapers } = useMemo(() => {
    const live: ExamPaper[] = [];
    const upcoming: ExamPaper[] = [];
    const archived: ExamPaper[] = [];

    papers.forEach((p) => {
      const status = getExamStatus(p);
      if (status === "Live") {
        live.push(p);
      } else if (status === "Upcoming") {
        upcoming.push(p);
      } else {
        archived.push(p);
      }
    });

    // Upcoming: Earliest start date first (chronological order)
    upcoming.sort((a, b) => {
      const timeA = new Date(a.startDateTime || a.examDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.startDateTime || b.examDate || b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    // Archived: Most recently archived first (reverse chronological)
    archived.sort((a, b) => {
      const timeA = new Date(a.endDateTime || a.startDateTime || a.createdAt || 0).getTime();
      const timeB = new Date(b.endDateTime || b.startDateTime || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return { livePapers: live, upcomingPapers: upcoming, archivedPapers: archived };
  }, [papers]);

  const routineTotalCount = livePapers.length + upcomingPapers.length;

  const playClick = () => {
    if (soundEnabled && quizAudio?.playClick) {
      quizAudio.playClick();
    }
  };

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    setUserSelectedOptions(prev => ({ ...prev, [qIdx]: optIdx }));
    setRevealedAnswers(prev => ({ ...prev, [qIdx]: true }));
    if (soundEnabled && quizAudio?.playClick) {
      quizAudio.playClick();
    }
  };

  const toggleRevealAnswer = (qIdx: number) => {
    setRevealedAnswers(prev => ({ ...prev, [qIdx]: !prev[qIdx] }));
    if (soundEnabled && quizAudio?.playClick) {
      quizAudio.playClick();
    }
  };

  return (
    <div className="space-y-3 pt-0">
      {/* Sticky Tab Bar - Sits right below app-bar with zero redundant whitespace */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md py-1.5 px-0.5 border-b border-slate-200/80 -mx-1.5 sm:-mx-2.5 px-2 sm:px-3 mb-2.5 sm:mb-3">
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab("routine");
              playClick();
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "routine"
                ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                : "bg-white text-slate-700 border border-slate-200/90 hover:bg-orange-50 hover:text-[#FF6A00]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>রুটিন</span>
            {livePapers.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("archive");
              playClick();
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "archive"
                ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                : "bg-white text-slate-700 border border-slate-200/90 hover:bg-orange-50 hover:text-[#FF6A00]"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>আর্কাইভ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("results");
              playClick();
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "results"
                ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                : "bg-white text-slate-700 border border-slate-200/90 hover:bg-orange-50 hover:text-[#FF6A00]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>ফলাফল</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ROUTINE TAB: Live Exams first, then Upcoming by date   */}
      {/* ========================================================= */}
      {activeTab === "routine" && (
        <div className="space-y-4 animate-fade-in">
          {routineTotalCount === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">
                বর্তমানে কোনো লাইভ বা আসন্ন পরীক্ষা নেই
              </h3>
              <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                এই বিষয়ের জন্য শীঘ্রই নতুন পরীক্ষার রুটিন প্রকাশ করা হবে। আগের পরীক্ষাগুলো অনুশীলন করতে &apos;আর্কাইভ&apos; ট্যাবে দেখুন।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* LIVE EXAMS (Top priority) */}
              {livePapers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-wide">
                      চলমান লাইভ পরীক্ষা ({livePapers.length} টি)
                    </span>
                  </div>

                  {livePapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="bg-white border-2 border-emerald-400/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        Live Now
                      </div>

                      <div className="space-y-1 text-left pr-16">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                          {paper.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-500">
                          <span>প্রশ্ন: {paper.questionCount || paper.questions?.length || 20} টি</span>
                          <span>•</span>
                          <span>সময়: {Math.ceil(((paper.questionCount || paper.questions?.length || 20) * 36) / 60)} মিনিট</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-extrabold">পূর্ণমান: {paper.totalMarks || paper.questionCount || 20}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons: পরীক্ষা দিন, সিলেবাস, প্রশ্নপত্র (Inactive for live), Share */}
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-100 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            onStartExam(paper);
                            playClick();
                          }}
                          className="flex-1 py-2 sm:py-2.5 px-3 bg-[#FF6A00] hover:bg-[#e55f00] text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[90px]"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>পরীক্ষা দিন</span>
                        </button>

                        {/* প্রশ্নপত্র বাটন: লাইভ এক্সামের সময় আন-অ্যাক্টিভ (Inactive during live) */}
                        <button
                          type="button"
                          disabled
                          className="py-2 sm:py-2.5 px-2.5 sm:px-3 bg-slate-100 text-slate-400 border border-slate-200/60 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold opacity-50 cursor-not-allowed flex items-center gap-1 shrink-0"
                          title="লাইভ পরীক্ষা চলাকালীন প্রশ্নপত্র দেখা যাবে না"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>প্রশ্নপত্র</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedSyllabusPaper(paper)}
                          className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                          সিলেবাস
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSharePaper(paper);
                          }}
                          className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl sm:rounded-2xl transition-all active:scale-95 cursor-pointer shrink-0"
                          title="শেয়ার করুন"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* UPCOMING EXAMS (Sorted by date - earliest on top) */}
              {upcomingPapers.length > 0 && (
                <div className="space-y-4">
                  {upcomingPapers.map((paper, idx) => {
                    const formattedDate = formatBengaliExamDate(paper.startDateTime || paper.examDate);
                    return (
                      <div key={paper.id || idx} className="space-y-1.5">
                        {/* Clean Date Header above card */}
                        <div className="text-xs sm:text-sm font-black text-slate-800 px-1 pt-1 flex items-center gap-1.5 text-left">
                          <Calendar className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>{formattedDate}</span>
                        </div>

                        {/* Exam Card */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-3 text-left">
                          <div className="space-y-1">
                            <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                              {paper.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-500">
                              <span>প্রশ্ন {paper.questionCount || paper.questions?.length || 20} টি</span>
                              <span>-</span>
                              <span>{Math.ceil(((paper.questionCount || paper.questions?.length || 20) * 36) / 60)} মিনিট</span>
                              <span>•</span>
                              <span className="text-blue-600 font-extrabold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Upcoming
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons: আসন্ন, প্রশ্নপত্র (ACTIVE), সিলেবাস, Share */}
                          <div className="flex items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-100 flex-wrap sm:flex-nowrap">
                            <button
                              disabled
                              className="flex-1 py-2 sm:py-2.5 px-3 bg-slate-100 text-slate-400 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-not-allowed min-w-[90px]"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>আসন্ন (Upcoming)</span>
                            </button>

                            {/* প্রশ্নপত্র বাটন: আপকামিং এর জন্য একটিভ (Active for upcoming) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuestionsPaper(paper);
                                setRevealedAnswers({});
                                setUserSelectedOptions({});
                                setShowAllAnswers(false);
                                playClick();
                              }}
                              className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-purple-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>প্রশ্নপত্র</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedSyllabusPaper(paper)}
                              className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                            >
                              সিলেবাস
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSharePaper(paper);
                              }}
                              className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl sm:rounded-2xl transition-all active:scale-95 cursor-pointer shrink-0"
                              title="শেয়ার করুন"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ARCHIVE TAB: Completed/past exams (Newest first)       */}
      {/* ========================================================= */}
      {activeTab === "archive" && (
        <div className="space-y-4 animate-fade-in">
          {archivedPapers.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                <Archive className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">
                আর্কাইভে এখনো কোনো পরীক্ষা জমা হয়নি
              </h3>
              <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                লাইভ পরীক্ষা শেষ হয়ে গেলে তা স্বয়ংক্রিয়ভাবে এই আর্কাইভে চলে আসবে এবং যেকোনো সময় অনুশীলন করা যাবে।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-extrabold text-slate-500 px-1 text-left">
                সর্বমোট {archivedPapers.length}টি আর্কাইভ পরীক্ষা (যেকোনো সময় অনুশীলনযোগ্য):
              </p>

              {archivedPapers.map((paper, idx) => {
                const formattedDate = formatBengaliExamDate(paper.endDateTime || paper.startDateTime || paper.examDate);
                return (
                  <div
                    key={paper.id || idx}
                    className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-3 text-left"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-400">
                        <span>{formattedDate}</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-black">আর্কাইভ</span>
                      </div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                        {paper.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-500">
                        প্রশ্ন: {paper.questionCount || paper.questions?.length || 20} টি • সময়: {Math.ceil(((paper.questionCount || paper.questions?.length || 20) * 36) / 60)} মিনিট
                      </p>
                    </div>

                    {/* Action Buttons: অনুশীলন করুন, প্রশ্নপত্র (ACTIVE), মেধা তালিকা, সিলেবাস, Share */}
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-100 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          onStartExam(paper);
                          playClick();
                        }}
                        className="flex-1 py-2 sm:py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[90px]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>অনুশীলন</span>
                      </button>

                      {/* প্রশ্নপত্র বাটন: আর্কাইভের জন্য এক্টিভ (Active for archive) */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuestionsPaper(paper);
                          setRevealedAnswers({});
                          setUserSelectedOptions({});
                          setShowAllAnswers(false);
                          playClick();
                        }}
                        className="py-2 sm:py-2.5 px-2.5 sm:px-3 bg-purple-100 hover:bg-purple-200/70 border border-purple-300/80 text-purple-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>প্রশ্নপত্র</span>
                      </button>

                      {onViewLeaderboard && (
                        <button
                          type="button"
                          onClick={() => {
                            onViewLeaderboard(paper);
                            playClick();
                          }}
                          className="py-2 sm:py-2.5 px-2.5 sm:px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>মেধা তালিকা</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedSyllabusPaper(paper)}
                        className="py-2 sm:py-2.5 px-2.5 sm:px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        সিলেবাস
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSharePaper(paper);
                        }}
                        className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl sm:rounded-2xl transition-all active:scale-95 cursor-pointer shrink-0"
                        title="শেয়ার করুন"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RESULTS TAB: Exam results and merit lists               */}
      {/* ========================================================= */}
      {activeTab === "results" && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-slate-900">
                    {courseTitle || courseName} পরীক্ষার মেধা তালিকা ও ফলাফল
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400">
                    আর্কাইভ পরীক্ষার মেধা তালিকা ও আপনার অর্জিত স্কোর
                  </p>
                </div>
              </div>

              {onViewLeaderboard && (
                <button
                  type="button"
                  onClick={() => {
                    if (archivedPapers[0]) {
                      onViewLeaderboard(archivedPapers[0]);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#FF6A00] text-white rounded-xl text-xs font-black shadow-xs hover:bg-[#e55f00] transition-all cursor-pointer"
                >
                  সার্বক্ষণিক লিডারবোর্ড
                </button>
              )}
            </div>

            {archivedPapers.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 py-4 text-center">
                ফলাফল দেখার জন্য এখনো কোনো পরীক্ষা সম্পন্ন হয়নি।
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {archivedPapers.map((paper, idx) => (
                  <div key={paper.id || idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                        {paper.title}
                      </h5>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {formatBengaliExamDate(paper.endDateTime || paper.startDateTime || paper.examDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onViewLeaderboard && (
                        <button
                          type="button"
                          onClick={() => {
                            onViewLeaderboard(paper);
                            playClick();
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>ফলাফল দেখুন</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE QUESTION PAPER MODAL (প্রশ্নপত্র ও সমাধান)     */}
      {/* ========================================================= */}
      {selectedQuestionsPaper && (() => {
        const paperQuestions = (selectedQuestionsPaper.questions && selectedQuestionsPaper.questions.length > 0)
          ? selectedQuestionsPaper.questions
          : QUIZ_QUESTIONS.slice(0, selectedQuestionsPaper.questionCount || 20);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 animate-scale-up text-left overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500 via-[#FF6A00] to-amber-500 text-white flex items-center justify-between shrink-0 shadow-sm">
                <div className="space-y-0.5 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      প্রশ্নপত্র ও সমাধান
                    </span>
                    <span className="text-[10px] font-bold text-white/90">
                      মোট {paperQuestions.length} টি প্রশ্ন
                    </span>
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-white truncate">
                    {selectedQuestionsPaper.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAllAnswers(!showAllAnswers)}
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-all cursor-pointer"
                    title={showAllAnswers ? "উত্তর লুকান" : "সব উত্তর দেখুন"}
                  >
                    {showAllAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAllAnswers ? "উত্তর লুকান" : "সব উত্তর দেখুন"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedQuestionsPaper(null)}
                    className="p-1.5 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-bar for mobile toggle */}
              <div className="sm:hidden px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  যেকোনো অপশনে ক্লিক করে উত্তর যাচাই করুন
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllAnswers(!showAllAnswers)}
                  className="px-2.5 py-1 rounded-lg bg-[#FF6A00] text-white text-[11px] font-black cursor-pointer flex items-center gap-1"
                >
                  {showAllAnswers ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showAllAnswers ? "লুকান" : "সব উত্তর"}</span>
                </button>
              </div>

              {/* Scrollable Questions List */}
              <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {paperQuestions.map((q: any, qIdx: number) => {
                  const correctIdx = getQuestionCorrectIndex(q);
                  const isRevealed = showAllAnswers || revealedAnswers[qIdx];
                  const userChoice = userSelectedOptions[qIdx];
                  const qText = q.question || q.questionText || `প্রশ্ন ${qIdx + 1}`;
                  const optionsList: string[] = Array.isArray(q.options) ? q.options : [];
                  const explanation = q.explanation || "";

                  return (
                    <div 
                      key={q.id || qIdx} 
                      className="p-3.5 sm:p-4.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl sm:rounded-3xl space-y-3 transition-all hover:border-orange-200"
                    >
                      {/* Question Text */}
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#FF6A00] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {qIdx + 1}
                        </span>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                            {qText}
                          </h4>
                          {q.subject && (
                            <span className="inline-block text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.2 rounded-md">
                              {q.subject}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Options Grid (Click to reveal / test answer) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-0 sm:pl-8">
                        {optionsList.map((optText: string, optIdx: number) => {
                          const isCorrect = optIdx === correctIdx;
                          const isSelectedByUser = userChoice === optIdx;

                          let btnStyle = "bg-white border-slate-200/90 text-slate-700 hover:border-orange-300 hover:bg-orange-50/40";

                          if (isRevealed) {
                            if (isCorrect) {
                              btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-900 font-black shadow-xs ring-1 ring-emerald-300";
                            } else if (isSelectedByUser) {
                              btnStyle = "bg-rose-50 border-rose-300 text-rose-800 font-bold line-through";
                            } else {
                              btnStyle = "bg-white/70 border-slate-200 text-slate-400 opacity-60";
                            }
                          } else if (isSelectedByUser) {
                            btnStyle = "bg-orange-50 border-[#FF6A00] text-[#FF6A00] font-black";
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleOptionSelect(qIdx, optIdx)}
                              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-xs text-left border transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                            >
                              <span className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10.5px] font-black shrink-0 ${
                                  isRevealed && isCorrect 
                                    ? "bg-emerald-600 text-white" 
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="break-words leading-tight">{optText}</span>
                              </span>

                              {isRevealed && isCorrect && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ml-1">
                                  <Check className="w-3 h-3 stroke-[2.5px]" />
                                  <span>সঠিক উত্তর</span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation & Reveal Toggle Button */}
                      <div className="pl-0 sm:pl-8 pt-1 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleRevealAnswer(qIdx)}
                            className="text-[11px] font-black text-[#FF6A00] hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{isRevealed ? "উত্তর ও ব্যাখ্যা লুকান" : "উত্তর ও ব্যাখ্যা দেখুন"}</span>
                          </button>

                          {userChoice !== undefined && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              userChoice === correctIdx 
                                ? "bg-emerald-100 text-emerald-800" 
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {userChoice === correctIdx ? "আপনার উত্তর সঠিক 🎉" : "আপনার উত্তর ভুল হয়েছে"}
                            </span>
                          )}
                        </div>

                        {/* Detailed Explanation Box */}
                        {isRevealed && (
                          <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-950 space-y-1 animate-fade-in text-left">
                            <span className="font-black text-amber-800 block text-[11px] uppercase tracking-wide">
                              💡 সঠিক উত্তর ও সমাধান:
                            </span>
                            <p className="font-extrabold text-emerald-800 text-xs">
                              সঠিক অপশন: {String.fromCharCode(65 + correctIdx)}. {optionsList[correctIdx]}
                            </p>
                            {explanation ? (
                              <p className="text-slate-700 leading-relaxed pt-1 text-[11.5px] font-medium">
                                <span className="font-bold text-slate-800">ব্যাখ্যা: </span>
                                {explanation}
                              </p>
                            ) : (
                              <p className="text-slate-500 italic text-[11px] pt-0.5">
                                এই প্রশ্নের জন্য কোনো অতিরিক্ত ব্যাখ্যা সংরক্ষিত নেই।
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-500">
                  মোট {paperQuestions.length} টি প্রশ্নের সেট
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedQuestionsPaper(null)}
                  className="px-5 sm:px-6 py-2 bg-[#FF6A00] hover:bg-[#e55f00] text-white font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  বন্ধ করুন
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* SYLLABUS MODAL                                            */}
      {/* ========================================================= */}
      {selectedSyllabusPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6A00] flex items-center justify-center font-black">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="font-black text-base text-slate-800">পরীক্ষার সিলেবাস</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSyllabusPaper(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">পরীক্ষার নাম</h5>
                <p className="font-black text-sm text-slate-800 mt-0.5">{selectedSyllabusPaper.title}</p>
              </div>

              <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200/80 space-y-1">
                <h5 className="text-xs font-black text-[#FF6A00] uppercase tracking-wide">সিলেবাস ও বিষয় বিবরণ</h5>
                <p className="text-xs font-bold text-slate-700 leading-relaxed pt-0.5">
                  {selectedSyllabusPaper.topic || "এই পরীক্ষার নির্দিষ্ট কোনো সিলেবাস নেই। সাধারণ পাঠ্যক্রম ও বিষয়ভিত্তিক প্রস্তুতি অনুযায়ী পরীক্ষা অনুষ্ঠিত হবে।"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>প্রশ্ন: {selectedSyllabusPaper.questionCount || 20} টি</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>সময়: {Math.ceil(((selectedSyllabusPaper.questionCount || 20) * 36) / 60)} মিনিট</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSyllabusPaper(null)}
              className="w-full py-2.5 bg-[#FF6A00] hover:bg-[#e55f00] text-white font-black rounded-xl text-xs sm:text-sm active:scale-95 transition-all cursor-pointer shadow-md shadow-orange-500/20"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
