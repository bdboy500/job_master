"use client";

import { ArrowLeft, Trophy } from "lucide-react";

interface LeaderboardSkeletonProps {
  onBack?: () => void;
}

export default function LeaderboardSkeleton({ onBack }: LeaderboardSkeletonProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 pb-20 flex flex-col font-sans select-none animate-fade-in">
      {/* 1. TOP HERO GRADIENT SECTION SKELETON */}
      <div className="bg-gradient-to-b from-[#FF5500] via-[#FF6A00] to-[#E55B00] text-white pt-4 pb-8 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden shrink-0">
        
        {/* Top Action Row */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {onBack ? (
              <button
                onClick={onBack}
                className="w-8.5 h-8.5 rounded-xl bg-white/20 text-white flex items-center justify-center cursor-pointer border border-white/20 shadow-xs shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-white" />
              </button>
            ) : (
              <div className="w-8.5 h-8.5 rounded-xl bg-white/20 border border-white/20 animate-shimmer" />
            )}
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">Leaderboard</span>
                <Trophy className="w-4 h-4 text-amber-200 fill-amber-300/30" />
              </div>
              <p className="text-[10px] text-white/80 font-bold">
                লাইভ কুইজের সর্বোচ্চ স্কোরার তালিকা লোড হচ্ছে...
              </p>
            </div>
          </div>

          <div className="w-8.5 h-8.5 rounded-xl bg-white/20 border border-white/20 shadow-xs flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          </div>
        </div>

        {/* Ambient light effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />

        {/* TIME PERIOD TABS SKELETON */}
        <div className="relative z-10 max-w-md mx-auto mb-3">
          <div className="bg-black/20 backdrop-blur-md p-1.5 rounded-2xl flex items-center justify-between border border-white/20 shadow-inner gap-1.5">
            <div className="flex-1 h-8 rounded-xl bg-white/30 shadow-xs animate-shimmer" />
            <div className="flex-1 h-8 rounded-xl bg-white/15 animate-shimmer" />
            <div className="flex-1 h-8 rounded-xl bg-white/15 animate-shimmer" />
            <div className="flex-1 h-8 rounded-xl bg-white/15 animate-shimmer" />
          </div>
        </div>

        {/* Reset Info Pill Skeleton */}
        <div className="relative z-10 text-center mb-4 flex justify-center">
          <div className="h-6 w-56 rounded-full bg-black/20 border border-white/15 animate-shimmer" />
        </div>

        {/* TOP 3 PODIUM SECTION SKELETON */}
        <div className="relative z-10 max-w-sm mx-auto flex items-end justify-center gap-3 sm:gap-4 pt-2">
          
          {/* 2nd Place Podium */}
          <div className="flex flex-col items-center flex-1 z-10">
            <div className="flex flex-col items-center mb-2">
              <div className="w-5 h-5 rounded-full bg-white/30 mb-1 animate-shimmer" />
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/30 border-2 border-slate-200/60 shadow-lg animate-shimmer" />
              <div className="h-3 w-14 bg-white/40 rounded-md mt-2 animate-shimmer" />
            </div>
            <div className="w-full bg-gradient-to-b from-white/30 to-white/10 border border-white/40 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-lg h-28 sm:h-32 justify-between animate-shimmer">
              <span className="text-4xl sm:text-5xl font-black text-white/40">2</span>
              <div className="w-14 h-5 rounded-full bg-white/40 animate-shimmer" />
            </div>
          </div>

          {/* 1st Place Podium (Taller) */}
          <div className="flex flex-col items-center flex-1 z-20 -mt-4">
            <div className="flex flex-col items-center mb-2">
              <div className="w-7 h-7 rounded-full bg-amber-300/50 mb-1 animate-shimmer" />
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-300/40 to-amber-500/40 border-3 border-amber-300/70 shadow-2xl animate-shimmer" />
              <div className="h-3.5 w-18 bg-white/50 rounded-md mt-2 animate-shimmer" />
            </div>
            <div className="w-full bg-gradient-to-b from-white/45 to-white/20 border-2 border-white/60 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-2xl h-36 sm:h-40 justify-between animate-shimmer">
              <span className="text-5xl sm:text-6xl font-black text-amber-200/50">1</span>
              <div className="w-16 h-6 rounded-full bg-amber-300/60 animate-shimmer" />
            </div>
          </div>

          {/* 3rd Place Podium */}
          <div className="flex flex-col items-center flex-1 z-10">
            <div className="flex flex-col items-center mb-2">
              <div className="w-5 h-5 rounded-full bg-white/30 mb-1 animate-shimmer" />
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/30 border-2 border-amber-600/40 shadow-lg animate-shimmer" />
              <div className="h-3 w-14 bg-white/40 rounded-md mt-2 animate-shimmer" />
            </div>
            <div className="w-full bg-gradient-to-b from-white/25 to-white/10 border border-white/30 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-lg h-24 sm:h-28 justify-between animate-shimmer">
              <span className="text-4xl sm:text-5xl font-black text-white/40">3</span>
              <div className="w-14 h-5 rounded-full bg-white/40 animate-shimmer" />
            </div>
          </div>

        </div>
      </div>

      {/* 2. SKELETON CARDS LIST */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 -mt-3 z-30 space-y-3">
        
        {/* "Your Position" Card Skeleton */}
        <div className="relative pt-3 mb-1">
          <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/90 bg-white border-2 border-[#FF6A00]/40 rounded-3xl p-3.5 sm:p-4 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-7 h-5 bg-orange-200/70 rounded-md animate-shimmer" />
              <div className="w-12 h-12 rounded-full bg-orange-200/80 border-2 border-[#FF6A00]/60 shrink-0 animate-shimmer" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 sm:w-36 bg-slate-200 rounded-md animate-shimmer" />
                <div className="h-3 w-20 bg-slate-100 rounded-md animate-shimmer" />
              </div>
            </div>
            <div className="h-8 w-16 bg-[#FF6A00]/40 rounded-2xl animate-shimmer" />
          </div>
        </div>

        {/* Main Leaderboard Table List Skeleton */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-100/80 space-y-3">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <div className="h-3 w-24 bg-slate-200 rounded-md animate-shimmer" />
            <div className="h-3 w-16 bg-slate-200 rounded-md animate-shimmer" />
          </div>

          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-50"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-5 h-4 bg-slate-200 rounded-md shrink-0 animate-shimmer" />
                <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/70 shrink-0 animate-shimmer" />
                <div className="space-y-1.5 flex-1 max-w-[180px]">
                  <div className="h-3.5 w-3/4 bg-slate-200 rounded-md animate-shimmer" />
                  <div className="h-2.5 w-1/2 bg-slate-100 rounded-md animate-shimmer" />
                </div>
              </div>
              <div className="w-14 h-7 rounded-xl bg-orange-100/80 shrink-0 animate-shimmer" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
