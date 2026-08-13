"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Crown, Trophy, Sparkles, RefreshCw, Award, CheckCircle2, ChevronDown, GraduationCap } from "lucide-react";
import { LeaderboardUser, fetchLeaderboard } from "@/src/lib/leaderboard";
import { getSupabase } from "@/src/lib/supabase";

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const nowBd = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: true });
      setLastUpdatedTime(nowBd);

      // Always load comprehensive server store & DB aggregated leaderboard users
      const users = await fetchLeaderboard();

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
      const fallbackUsers = await fetchLeaderboard();
      setLeaderboardUsers(fallbackUsers);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setVisibleCount(10);
    loadData();

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
        loadData();
        intervalId = setInterval(() => {
          loadData();
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
  const top1 = sortedUsers[0];
  const top2 = sortedUsers[1];
  const top3 = sortedUsers[2];
  const restUsers = sortedUsers.slice(3, visibleCount);

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

  // Calculate user rank and score dynamically
  const userInListIndex = sortedUsers.findIndex(
    (u) =>
      u.id === currentUserProfile?.id ||
      (u.student_id && currentUserProfile?.student_id && u.student_id === currentUserProfile.student_id) ||
      u.name === currentUserProfile?.full_name
  );

  const displayRank =
    userRank && userRank > 0
      ? userRank
      : userInListIndex !== -1
      ? userInListIndex + 1
      : null;

  const displayScore =
    userInListIndex !== -1
      ? getScoreForTab(sortedUsers[userInListIndex])
      : userScore !== null
      ? userScore
      : 0;

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 pb-20 flex flex-col font-sans select-none animate-fade-in">
      
      {/* 1. TOP APP BAR - WHITE BACKGROUND LIKE HOME PAGE */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-40">
        {/* Back Icon, Site Logo Icon & Title */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-slate-200/60 shadow-2xs shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          {/* Site Logo Icon */}
          <div className="bg-[#FF6A00] p-1.5 sm:p-2 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>Leaderboard</span>
              <Trophy className="w-5 h-5 text-[#FF6A00] fill-[#FF6A00]/20" />
            </h1>
            <p className="text-[10px] text-slate-500 font-bold">
              লাইভ কুইজের সর্বোচ্চ স্কোরার তালিকা
            </p>
          </div>
        </div>

        {/* Right: Subscribed / User Profile Avatar */}
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:rotate-180 border border-slate-200/60 shadow-2xs"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <div className="relative group">
            <div className="w-9 h-9 rounded-full border-2 border-orange-200 bg-orange-50 overflow-hidden shadow-2xs">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.full_name || "U")}&background=ffedd5&color=c2410c`;
                  }}
                />
              ) : (
                <div className="w-full h-full text-[#FF6A00] font-black text-sm flex items-center justify-center">
                  {currentUserProfile?.full_name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white" title="Active">
              <CheckCircle2 className="w-2.5 h-2.5 fill-emerald-500 text-white" />
            </span>
          </div>
        </div>
      </div>

      {/* PODIUM HERO SECTION (Theme Gradient) */}
      <div className="bg-gradient-to-b from-[#FF5500] via-[#FF6A00] to-[#E55B00] text-white pt-5 pb-8 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden shrink-0">
        
        {/* Background Subtle Accent Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* TIME PERIOD TABS - Apple UI Segmented Control Style */}
        <div className="relative z-10 max-w-md mx-auto mb-6">
          <div className="bg-black/20 backdrop-blur-md p-1.5 rounded-2xl flex items-center justify-between border border-white/20 shadow-inner">
            {(["Today", "Week", "Month", "All Time"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-200 cursor-pointer text-center relative ${
                    isActive
                      ? "bg-white text-[#FF6A00] shadow-md shadow-black/10 scale-[1.02]"
                      : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab === "Today" && "Today"}
                  {tab === "Week" && "Week"}
                  {tab === "Month" && "Month"}
                  {tab === "All Time" && "All Time"}
                </button>
              );
            })}
          </div>
        </div>

        {/* TOP 3 PODIUM SECTION (2nd, 1st, 3rd) */}
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
              <div className="h-20" />
            )}
            
            {/* Podium Bar 2 */}
            <div className="w-full bg-gradient-to-b from-white/30 to-white/10 backdrop-blur-md border border-white/40 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-lg h-28 sm:h-32 justify-between">
              <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-lg tracking-tight">2</span>
              <div className="bg-white/90 text-[#FF6A00] px-2.5 py-1 rounded-full text-[11px] font-black shadow-sm border border-white">
                {getScoreForTab(top2)} pt
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
              <div className="h-24" />
            )}
            
            {/* Podium Bar 1 */}
            <div className="w-full bg-gradient-to-b from-white/45 to-white/20 backdrop-blur-md border-2 border-white/60 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-2xl h-36 sm:h-40 justify-between">
              <span className="text-6xl sm:text-7xl font-black text-amber-200 drop-shadow-xl tracking-tight">1</span>
              <div className="bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-md border border-amber-200">
                {getScoreForTab(top1)} pt
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
              <div className="h-20" />
            )}
            
            {/* Podium Bar 3 */}
            <div className="w-full bg-gradient-to-b from-white/25 to-white/10 backdrop-blur-md border border-white/30 rounded-t-2xl pt-3 pb-4 flex flex-col items-center shadow-lg h-24 sm:h-28 justify-between">
              <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-lg tracking-tight">3</span>
              <div className="bg-white/90 text-[#FF6A00] px-2.5 py-1 rounded-full text-[11px] font-black shadow-sm border border-white">
                {getScoreForTab(top3)} pt
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* REST OF LEADERBOARD LIST (Ranks 4-10+) */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 -mt-3 z-30 space-y-3">
        
        {/* "YOUR POSITION" HIGHLIGHTED HORIZONTAL CARD COMPONENT */}
        {currentUserProfile && (
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
        )}

        <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-100/80 space-y-2">
          
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>র‍্যাঙ্ক ও প্রতিযোগী</span>
            <span>সর্বশেষ স্কোর</span>
          </div>

          {restUsers.length === 0 ? (
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
