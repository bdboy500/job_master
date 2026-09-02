"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Crown, Trophy, Sparkles, RefreshCw, Award, CheckCircle2, ChevronDown, GraduationCap, Users, ListFilter } from "lucide-react";
import { LeaderboardUser, fetchLeaderboard } from "@/src/lib/leaderboard";
import { getSupabase } from "@/src/lib/supabase";
import LeaderboardSkeleton from "./LeaderboardSkeleton";

interface LeaderboardViewProps {
  onBack: () => void;
  currentUserProfile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    student_id?: string;
  } | null;
  profileAvatarUrl?: string;
}

export default function LeaderboardView({ onBack, currentUserProfile, profileAvatarUrl }: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<"Today" | "Week" | "Month" | "All Time">("Week");
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  const loadData = async (force = false) => {
    setIsLoading(true);
    try {
      const nowBd = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: true });
      setLastUpdatedTime(nowBd);

      // Always load comprehensive server store & DB aggregated leaderboard users
      const users = await fetchLeaderboard(force);

      // Check user rank & score via Supabase RPC if logged in
      const supabase = getSupabase();
      if (supabase && currentUserProfile?.id) {
        try {
          const periodMap: Record<string, string> = {
            Today: "today",
            Week: "week",
            Month: "month",
            "All Time": "all_time",
          };
          const { data, error } = await supabase.rpc("get_leaderboard_with_user_rank", {
            p_user_id: currentUserProfile.id,
            p_period: periodMap[activeTab] || "week",
            p_limit: 50,
            p_offset: 0,
          });

          if (!error && data) {
            if (typeof data.user_rank === "number" && data.user_rank > 0) {
              setUserRank(data.user_rank);
            }
            if (typeof data.user_score === "number") {
              setUserScore(data.user_score);
            }
          }
        } catch (rpcErr) {
          console.warn("Supabase RPC error, fallback to client calculation:", rpcErr);
        }
      }

      setLeaderboardUsers(users);
      setIsLoading(false);
    } catch (err) {
      console.warn("Error loading leaderboard data:", err);
      const fallbackUsers = await fetchLeaderboard(force);
      setLeaderboardUsers(fallbackUsers);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    // Automatically trigger update at every 30-minute boundary in Bangladesh Time (e.g. 9:00, 9:30, 10:00, 10:30)
    const schedule30MinClockUpdate = () => {
      const bdNowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
      const bdNow = new Date(bdNowStr);
      const minutes = bdNow.getMinutes();
      const seconds = bdNow.getSeconds();
      const ms = bdNow.getMilliseconds();

      const minutesToBoundary = 30 - (minutes % 30);
      const msToNextBoundary = minutesToBoundary * 60 * 1000 - (seconds * 1000 + ms);

      timeoutId = setTimeout(() => {
        loadData(true);
        intervalId = setInterval(() => {
          loadData(true);
        }, 30 * 60 * 1000);
      }, msToNextBoundary);
    };

    schedule30MinClockUpdate();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, currentUserProfile?.id]);

  const getScoreForTab = (user?: any) => {
    if (!user) return 0;
    let val = 0;
    switch (activeTab) {
      case "Today":
        val = user.today_score ?? user.score ?? user.points ?? user.total_score ?? 0;
        break;
      case "Week":
        val = user.week_score ?? user.score ?? user.points ?? user.total_score ?? 0;
        break;
      case "Month":
        val = user.month_score ?? user.score ?? user.points ?? user.total_score ?? 0;
        break;
      case "All Time":
        val = user.all_time_score ?? user.score ?? user.points ?? user.total_score ?? 0;
        break;
      default:
        val = user.score ?? user.today_score ?? user.week_score ?? 0;
    }
    return typeof val === "number" && !isNaN(val) ? val : Number(val) || 0;
  };

  // Sort users according to active tab score
  const getSortedUsers = () => {
    const sorted = [...leaderboardUsers];
    return sorted.sort((a, b) => getScoreForTab(b) - getScoreForTab(a));
  };

  const sortedUsers = getSortedUsers();
  // Filter active competitors who have score > 0 for this cycle period
  const activeCompetitors = sortedUsers.filter((u) => getScoreForTab(u) > 0);

  const top1 = activeCompetitors[0];
  const top2 = activeCompetitors[1];
  const top3 = activeCompetitors[2];
  const restUsers = activeCompetitors.slice(3, visibleCount);

  const userAvatar = profileAvatarUrl || currentUserProfile?.avatar_url || "";

  // Helper to get avatar URL for any user in the leaderboard (preferring Google/profile avatar if available)
  const getUserAvatarUrl = (user?: LeaderboardUser) => {
    if (!user) return "";
    const isCurrentUser =
      (currentUserProfile?.id && user.id === currentUserProfile.id) ||
      (currentUserProfile?.student_id && user.student_id === currentUserProfile.student_id) ||
      (currentUserProfile?.full_name && user.name === currentUserProfile.full_name);

    if (isCurrentUser && userAvatar) {
      return userAvatar;
    }
    if (user.avatar_url && user.avatar_url.trim() !== "") {
      return user.avatar_url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=ffedd5&color=c2410c`;
  };

  // Calculate user rank and score dynamically among active competitors
  const userInActiveListIndex = activeCompetitors.findIndex(
    (u) =>
      u.id === currentUserProfile?.id ||
      (u.student_id && currentUserProfile?.student_id && u.student_id === currentUserProfile.student_id) ||
      u.name === currentUserProfile?.full_name
  );

  const userInAllListIndex = sortedUsers.findIndex(
    (u) =>
      u.id === currentUserProfile?.id ||
      (u.student_id && currentUserProfile?.student_id && u.student_id === currentUserProfile.student_id) ||
      u.name === currentUserProfile?.full_name
  );

  const displayScore =
    userInAllListIndex !== -1
      ? getScoreForTab(sortedUsers[userInAllListIndex])
      : userScore !== null
      ? userScore
      : 0;

  const displayRank =
    displayScore > 0 && userInActiveListIndex !== -1
      ? userInActiveListIndex + 1
      : null;

  const getResetInfoText = () => {
    switch (activeTab) {
      case "Today":
        return "প্রতিদিন রাত ১২:০০ টায় স্বয়ংক্রিয়ভাবে জিরো (০) হবে";
      case "Week":
        return "প্রতি শুক্রবার রাত ১২:০০ টায় স্বয়ংক্রিয়ভাবে জিরো (০) হবে";
      case "Month":
        return "প্রতি মাসের শেষ দিন রাত ১২:০০ টায় স্বয়ংক্রিয়ভাবে জিরো (০) হবে";
      case "All Time":
        return "আজীবন অর্জিত লাইভ কুইজ স্কোর";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 pb-20 flex flex-col font-sans select-none animate-fade-in">
      
      {/* 1. TOP HERO SECTION WITH BACK & REFRESH ACTION BAR (STATIC UI) */}
      <div className="bg-gradient-to-b from-[#FF5500] via-[#FF6A00] to-[#E55B00] text-white pt-4 pb-8 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden shrink-0">
        
        {/* Background Subtle Accent Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* TIME PERIOD TABS (STATIC UI) */}
        <div className="relative z-10 max-w-md mx-auto mb-3">
          <div className="bg-black/25 backdrop-blur-md p-1.5 rounded-2xl flex items-center justify-between border border-white/20 shadow-inner gap-1">
            {[
              { id: "Today", label: "Today" },
              { id: "Week", label: "Week" },
              { id: "Month", label: "Month" },
              { id: "All Time", label: "All Time" }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-1 text-xs sm:text-sm font-extrabold tracking-wide rounded-xl transition-all duration-200 cursor-pointer text-center relative flex items-center justify-center ${
                    isActive
                      ? "bg-white text-[#FF6A00] shadow-md shadow-black/10 scale-[1.02]"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                >
                  <span className="leading-none whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Automatic Reset Schedule Indicator (STATIC UI) */}
        <div className="relative z-10 text-center mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-xs text-[10.5px] font-bold text-white/90 border border-white/15">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{getResetInfoText()}</span>
          </span>
        </div>

        {/* TOP 3 PODIUM SECTION (DYNAMIC SKELETON WHEN LOADING, DATA WHEN LOADED) */}
        {isLoading ? (
          /* Granular Shimmer Skeleton for Top 3 Podium */
          <div className="relative z-10 max-w-sm mx-auto flex items-end justify-center gap-3 sm:gap-4 pt-2">
            {/* 2nd Place Podium Skeleton */}
            <div className="flex flex-col items-center flex-1 z-10">
              <div className="flex flex-col items-center mb-2">
                <div className="w-5 h-5 rounded-full bg-white/20 mb-1 animate-shimmer" />
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/25 border-2 border-slate-200/50 shadow-md animate-shimmer" />
                <div className="h-3 w-14 bg-white/30 rounded-md mt-2 animate-shimmer" />
              </div>
              <div className="w-full bg-gradient-to-b from-white/25 to-white/10 border border-white/30 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-lg h-28 sm:h-32 justify-between animate-shimmer">
                <span className="text-4xl sm:text-5xl font-black text-white/30">2</span>
                <div className="w-14 h-5 rounded-full bg-white/35 animate-shimmer" />
              </div>
            </div>

            {/* 1st Place Podium Skeleton */}
            <div className="flex flex-col items-center flex-1 z-20 -mt-4">
              <div className="flex flex-col items-center mb-2">
                <div className="w-7 h-7 rounded-full bg-amber-300/40 mb-1 animate-shimmer" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/30 border-3 border-amber-300/60 shadow-xl animate-shimmer" />
                <div className="h-3.5 w-18 bg-white/40 rounded-md mt-2 animate-shimmer" />
              </div>
              <div className="w-full bg-gradient-to-b from-white/35 to-white/15 border-2 border-white/50 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-2xl h-36 sm:h-40 justify-between animate-shimmer">
                <span className="text-5xl sm:text-6xl font-black text-amber-200/40">1</span>
                <div className="w-16 h-6 rounded-full bg-amber-300/50 animate-shimmer" />
              </div>
            </div>

            {/* 3rd Place Podium Skeleton */}
            <div className="flex flex-col items-center flex-1 z-10">
              <div className="flex flex-col items-center mb-2">
                <div className="w-5 h-5 rounded-full bg-white/20 mb-1 animate-shimmer" />
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/25 border-2 border-amber-600/40 shadow-md animate-shimmer" />
                <div className="h-3 w-14 bg-white/30 rounded-md mt-2 animate-shimmer" />
              </div>
              <div className="w-full bg-gradient-to-b from-white/20 to-white/10 border border-white/25 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-lg h-24 sm:h-28 justify-between animate-shimmer">
                <span className="text-4xl sm:text-5xl font-black text-white/30">3</span>
                <div className="w-14 h-5 rounded-full bg-white/35 animate-shimmer" />
              </div>
            </div>
          </div>
        ) : activeCompetitors.length === 0 ? (
          <div className="relative z-10 max-w-sm mx-auto my-6 text-center bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <Trophy className="w-10 h-10 text-amber-200/80 mx-auto mb-2 animate-bounce" />
            <p className="text-sm font-black text-white">এখনও কোনো স্কোর রেকর্ড হয়নি</p>
            <p className="text-xs text-white/80 mt-1">
              কুইজে অংশ নিয়ে প্রথম স্থান অধিকার করুন!
            </p>
          </div>
        ) : (
          <div className="relative z-10 max-w-sm mx-auto flex items-end justify-center gap-3 sm:gap-4 pt-2">
            
            {/* 2nd Place Podium Block */}
            <div className="flex flex-col items-center flex-1 z-10">
              {top2 ? (
                <div className="flex flex-col items-center mb-2 animate-fade-in">
                  {/* Crown Icon */}
                  <div className="mb-0.5 relative">
                    <Crown className="w-6 h-6 text-slate-200 fill-slate-300 drop-shadow-md animate-bounce" />
                  </div>
                  {/* Profile Image */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-white/30 backdrop-blur-md border-2 border-slate-200 shadow-lg overflow-hidden">
                    <img
                      src={getUserAvatarUrl(top2)}
                      alt={top2.name}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top2.name)}&background=f1f5f9&color=334155`;
                      }}
                    />
                  </div>
                  {/* Name */}
                  <span className="text-xs font-bold text-white mt-1.5 truncate max-w-[80px] text-center drop-shadow-sm">
                    {top2.name}
                  </span>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center">
                  <span className="text-[10px] text-white/60 font-bold">খালি</span>
                </div>
              )}
              
              {/* Podium Bar 2 */}
              <div className="w-full bg-gradient-to-b from-white/30 to-white/10 backdrop-blur-md border border-white/40 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-lg h-28 sm:h-32 justify-between">
                <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-lg tracking-tight">2</span>
                <div className="bg-white/90 text-[#FF6A00] px-2.5 py-1 rounded-full text-[11px] font-black shadow-sm border border-white">
                  {top2 ? `${getScoreForTab(top2)} pt` : "-"}
                </div>
              </div>
            </div>

            {/* 1st Place Podium Block (Taller Center) */}
            <div className="flex flex-col items-center flex-1 z-20 -mt-4">
              {top1 ? (
                <div className="flex flex-col items-center mb-2 animate-fade-in">
                  {/* Crown Icon */}
                  <div className="mb-0.5 relative">
                    <Crown className="w-8 h-8 text-amber-300 fill-amber-400 drop-shadow-lg animate-bounce" />
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 absolute -top-1 -right-1 animate-ping" />
                  </div>
                  {/* Profile Image */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-amber-300 to-amber-500 border-3 border-amber-300 shadow-2xl overflow-hidden">
                    <img
                      src={getUserAvatarUrl(top1)}
                      alt={top1.name}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top1.name)}&background=fef3c7&color=d97706`;
                      }}
                    />
                  </div>
                  {/* Name */}
                  <span className="text-xs sm:text-sm font-black text-white mt-2 truncate max-w-[90px] text-center drop-shadow-md">
                    {top1.name}
                  </span>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <span className="text-[10px] text-white/60 font-bold">খালি</span>
                </div>
              )}
              
              {/* Podium Bar 1 */}
              <div className="w-full bg-gradient-to-b from-white/45 to-white/20 backdrop-blur-md border-2 border-white/60 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-2xl h-36 sm:h-40 justify-between">
                <span className="text-6xl sm:text-7xl font-black text-amber-200 drop-shadow-xl tracking-tight">1</span>
                <div className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-md border border-amber-200">
                  {top1 ? `${getScoreForTab(top1)} pt` : "-"}
                </div>
              </div>
            </div>

            {/* 3rd Place Podium Block */}
            <div className="flex flex-col items-center flex-1 z-10">
              {top3 ? (
                <div className="flex flex-col items-center mb-2 animate-fade-in">
                  {/* Crown Icon */}
                  <div className="mb-0.5 relative">
                    <Crown className="w-6 h-6 text-amber-600 fill-amber-700 drop-shadow-md animate-bounce" />
                  </div>
                  {/* Profile Image */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-white/30 backdrop-blur-md border-2 border-amber-600/60 shadow-lg overflow-hidden">
                    <img
                      src={getUserAvatarUrl(top3)}
                      alt={top3.name}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top3.name)}&background=ffedd5&color=c2410c`;
                      }}
                    />
                  </div>
                  {/* Name */}
                  <span className="text-xs font-bold text-white mt-1.5 truncate max-w-[80px] text-center drop-shadow-sm">
                    {top3.name}
                  </span>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center">
                  <span className="text-[10px] text-white/60 font-bold">খালি</span>
                </div>
              )}
              
              {/* Podium Bar 3 */}
              <div className="w-full bg-gradient-to-b from-white/25 to-white/10 backdrop-blur-md border border-white/30 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-lg h-24 sm:h-28 justify-between">
                <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-lg tracking-tight">3</span>
                <div className="bg-white/90 text-[#FF6A00] px-2.5 py-1 rounded-full text-[11px] font-black shadow-sm border border-white">
                  {top3 ? `${getScoreForTab(top3)} pt` : "-"}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* REST OF LEADERBOARD LIST (Ranks 4-10+) */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 -mt-3 z-30 space-y-3">
        
        {/* "YOUR POSITION" HIGHLIGHTED HORIZONTAL CARD COMPONENT */}
        {isLoading ? (
          /* Your Position Skeleton */
          <div className="relative pt-3 mb-1">
            <div className="bg-white border-2 border-orange-200/60 rounded-3xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-8 h-6 bg-slate-200 rounded-md animate-shimmer" />
                <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-orange-200 shrink-0 animate-shimmer" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 rounded-md animate-shimmer" />
                  <div className="h-3 w-20 bg-slate-100 rounded-md animate-shimmer" />
                </div>
              </div>
              <div className="h-8 w-16 bg-orange-100/80 rounded-2xl animate-shimmer shrink-0" />
            </div>
          </div>
        ) : currentUserProfile ? (
          <div className="relative pt-3 mb-1 animate-fade-in">
            {/* Floating badge sitting directly on the top border line */}
            <div className="absolute -top-0.5 left-6 sm:left-8 z-10 flex items-center gap-1.5 bg-gradient-to-r from-[#FF5500] to-[#FF6A00] text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-md border border-white uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
              <span>Your Position</span>
            </div>

            <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/90 backdrop-blur-md bg-white border-2 border-[#FF6A00]/50 rounded-3xl p-3.5 sm:p-4 shadow-lg shadow-orange-500/10 flex items-center justify-between transition-all hover:border-[#FF6A00]">
              {/* Left: Rank & Profile Avatar & Name */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* 1. Rank Number */}
                <div className="flex flex-col items-center justify-center shrink-0 w-8">
                  <span className="text-base sm:text-lg font-black text-[#FF6A00] tracking-tight">
                    {displayRank ? `#${displayRank}` : "#"}
                  </span>
                </div>

                {/* 2. User Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-[#FF6A00] p-0.5 bg-gradient-to-br from-amber-200 to-orange-400 shadow-md overflow-hidden">
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt="Your Avatar" 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile.full_name || "U")}&background=ffedd5&color=c2410c`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-amber-100 text-[#FF6A00] font-black text-base flex items-center justify-center rounded-full">
                        {currentUserProfile.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 border border-white">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                </div>

                {/* Name & ID */}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm sm:text-base font-black text-slate-900 truncate max-w-[130px] sm:max-w-[200px]">
                    {currentUserProfile.full_name || "ইউজার"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 truncate">
                    {currentUserProfile.student_id || "Your Account"}
                  </span>
                </div>
              </div>

              {/* 3. Total Points (Right Aligned) */}
              <div className="flex flex-col items-end shrink-0 pl-2">
                <div className="bg-[#FF6A00] text-white px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-orange-500/20 border border-orange-400">
                  {displayScore} pt
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wide pt-1.5">
              র‍্যাঙ্কিং প্রতি ৩০ মিনিটে স্বয়ংক্রিয়ভাবে আপডেট হয় {lastUpdatedTime ? `(সর্বশেষ: ${lastUpdatedTime})` : ""}
            </p>
          </div>
        ) : null}

        <div className="bg-white rounded-3xl p-3.5 sm:p-5 shadow-xl border border-slate-100/80 space-y-3">
          
          {/* Display Limit Buttons Filter (10 / 20 / 30 / 40 / 50) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
              <ListFilter className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>সর্বোচ্চ তালিকা সংখ্যা:</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
              {[10, 20, 30, 40, 50].map((num) => {
                const isSelected = visibleCount === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setVisibleCount(num)}
                    className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FF6A00] text-white shadow-sm shadow-orange-500/30 scale-105"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>র‍্যাঙ্ক ও প্রতিযোগী</span>
            <span>সর্বশেষ স্কোর</span>
          </div>

          {isLoading ? (
            /* Table Rows Granular Shimmer Skeleton */
            <div className="space-y-2.5 pt-1">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/40"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-5 h-4 bg-slate-200 rounded-md shrink-0 animate-shimmer" />
                    <div className="w-11 h-11 rounded-2xl bg-slate-200 border border-slate-200 shrink-0 animate-shimmer" />
                    <div className="space-y-1.5 flex-1 max-w-[180px]">
                      <div className="h-3.5 w-3/4 bg-slate-200 rounded-md animate-shimmer" />
                      <div className="h-2.5 w-1/2 bg-slate-100 rounded-md animate-shimmer" />
                    </div>
                  </div>
                  <div className="w-14 h-7 rounded-xl bg-orange-100/70 shrink-0 animate-shimmer" />
                </div>
              ))}
            </div>
          ) : restUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-bold text-xs">
              আর কোনো কুইজ স্কোর রেকর্ড নেই।
            </div>
          ) : (
            restUsers.map((user, idx) => {
              const rankNumber = idx + 4;
              const formattedRank = rankNumber < 10 ? `0${rankNumber}` : `${rankNumber}`;
              const score = getScoreForTab(user);

              return (
                <div
                  key={user.id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50/50 transition-colors border border-transparent hover:border-orange-100/80 group"
                >
                  {/* Left: Rank & Avatar & Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Serial Number */}
                    <span className="text-sm font-black text-slate-400 w-6 text-center shrink-0 group-hover:text-[#FF6A00] transition-colors">
                      {formattedRank}
                    </span>

                    {/* Avatar Image */}
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 shadow-2xs">
                      <img
                        src={getUserAvatarUrl(user)}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f1f5f9&color=475569`;
                        }}
                      />
                    </div>

                    {/* Name & ID */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-slate-800 truncate group-hover:text-[#FF6A00] transition-colors">
                        {user.name}
                      </span>
                      {user.student_id && (
                        <span className="text-[10px] font-bold text-slate-400 truncate">
                          {user.student_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Points */}
                  <div className="bg-orange-50 text-[#FF6A00] px-3 py-1.5 rounded-xl text-xs font-black shrink-0 border border-orange-200/60 shadow-2xs">
                    {score} pt
                  </div>
                </div>
              );
            })
          )}

          {/* Load More Button (up to max 50 items) */}
          {visibleCount < 50 && visibleCount < sortedUsers.length && (
            <div className="pt-3 pb-1 text-center border-t border-slate-100 mt-2">
              <button
                onClick={() => setVisibleCount((prev) => Math.min(50, prev + 10))}
                className="w-full py-3 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-[#FF6A00] border border-orange-200/80 rounded-2xl text-xs sm:text-sm font-black transition-all active:scale-98 cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <span>আরও দেখুন (Load More)</span>
                <ChevronDown className="w-4 h-4 text-[#FF6A00]" />
              </button>
              <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                সর্বোচ্চ ৫০ জন পর্যন্ত প্রদর্শন করা হবে ({Math.min(visibleCount, sortedUsers.length)}/50)
              </p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
