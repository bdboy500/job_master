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
  ChevronRight
} from "lucide-react";
import { ExamPaper, getExamStatus } from "../lib/exams";

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

  return (
    <div className="space-y-4">
      {/* Sticky Tab Bar (App-bar locked when scrolling) */}
      <div className="sticky top-[56px] sm:top-[62px] z-20 bg-slate-50/95 backdrop-blur-md py-2 px-0.5 border-b border-slate-200/80 -mx-1.5 sm:-mx-2.5 px-2 sm:px-3">
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab("routine");
              playClick();
            }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
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
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "routine"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {routineTotalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("archive");
              playClick();
            }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "archive"
                ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                : "bg-white text-slate-700 border border-slate-200/90 hover:bg-orange-50 hover:text-[#FF6A00]"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>আর্কাইভ</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "archive"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {archivedPapers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("results");
              playClick();
            }}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
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

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            onStartExam(paper);
                            playClick();
                          }}
                          className="flex-1 py-2 sm:py-2.5 px-3 bg-[#FF6A00] hover:bg-[#e55f00] text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>পরীক্ষা দিন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedSyllabusPaper(paper)}
                          className="py-2 sm:py-2.5 px-3 sm:px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
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
                        {/* Clean Date Header above card (Matches Image 11/12) */}
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

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <button
                              disabled
                              className="flex-1 py-2 sm:py-2.5 px-3 bg-slate-100 text-slate-400 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>আসন্ন (Upcoming)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedSyllabusPaper(paper)}
                              className="py-2 sm:py-2.5 px-3 sm:px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
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

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          onStartExam(paper);
                          playClick();
                        }}
                        className="flex-1 py-2 sm:py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>অনুশীলন করুন</span>
                      </button>

                      {onViewLeaderboard && (
                        <button
                          type="button"
                          onClick={() => {
                            onViewLeaderboard(paper);
                            playClick();
                          }}
                          className="py-2 sm:py-2.5 px-3 sm:px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>মেধা তালিকা</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedSyllabusPaper(paper)}
                        className="py-2 sm:py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer"
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
          {archivedPapers.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">
                এখনো কোনো পরীক্ষার ফলাফল তৈরি হয়নি
              </h3>
              <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                লাইভ পরীক্ষা সম্পন্ন হলে ফলাফল এবং মেধা তালিকা স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-extrabold text-slate-500 px-1">
                সম্পন্ন হওয়া পরীক্ষার ফলাফল ও মেধা তালিকা:
              </p>

              {archivedPapers.map((paper, idx) => (
                <div
                  key={paper.id || idx}
                  className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h4 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                      {paper.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-400">
                      {formatBengaliExamDate(paper.endDateTime || paper.startDateTime || paper.examDate)} • পূর্ণমান: {paper.totalMarks || paper.questionCount || 20}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onViewLeaderboard && (
                      <button
                        type="button"
                        onClick={() => {
                          onViewLeaderboard(paper);
                          playClick();
                        }}
                        className="flex-1 sm:flex-none py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-black shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>ফলাফল ও মেধা তালিকা</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onStartExam(paper);
                        playClick();
                      }}
                      className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      উত্তরপত্র
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Syllabus Popup / Modal */}
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
