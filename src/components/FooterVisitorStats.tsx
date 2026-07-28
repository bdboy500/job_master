"use client";

import React, { useState, useEffect } from "react";
import { Users, Eye, Activity, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";

interface AnalyticsSummary {
  realtimeActiveUsers: number;
  todayVisits: number;
  todayPageviews: number;
  isMockData: boolean;
}

export default function FooterVisitorStats() {
  const [stats, setStats] = useState<AnalyticsSummary>({
    realtimeActiveUsers: 18,
    todayVisits: 342,
    todayPageviews: 1120,
    isMockData: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.analytics) {
          setStats({
            realtimeActiveUsers: json.analytics.realtimeActiveUsers || 1,
            todayVisits: json.analytics.todayVisits || 0,
            todayPageviews: json.analytics.todayPageviews || 0,
            isMockData: json.analytics.isMockData ?? false,
          });
          const now = new Date();
          setLastUpdated(
            now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          );
        }
      }
    } catch (e) {
      console.error("Failed to fetch footer visitor stats:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto refresh every 20 seconds
    const interval = setInterval(fetchStats, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 text-slate-200 py-3.5 px-4 shadow-inner text-xs mb-16 md:mb-0 rounded-2xl md:rounded-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        
        {/* Left branding & live status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-full shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span className="font-black text-[11px] text-slate-200 tracking-tight">
              Job Master Live Analytics
            </span>
          </div>

          <span className="hidden md:inline text-slate-600">|</span>

          {/* Real-Time Live User Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 px-3 py-1 rounded-full shadow-2xs font-bold text-[11px]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              Live Right Now: <strong className="text-emerald-200 font-extrabold text-xs">{stats.realtimeActiveUsers}</strong> active users
            </span>
          </div>
        </div>

        {/* Right side stats counters */}
        <div className="flex items-center gap-4 sm:gap-6 text-[11px] font-semibold text-slate-300">
          
          {/* Today's Total Visits */}
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span>Today's Total Visits:</span>
            <strong className="text-white font-extrabold text-xs bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/60">
              {stats.todayVisits.toLocaleString()}
            </strong>
          </div>

          {/* Today's Total Pageviews */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>Pageviews:</span>
            <strong className="text-purple-200 font-extrabold text-xs bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/60">
              {stats.todayPageviews.toLocaleString()}
            </strong>
          </div>

          {/* Manual Refresh Trigger */}
          <button
            onClick={fetchStats}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={lastUpdated ? `Last updated at ${lastUpdated}` : "Refresh stats"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-400" : ""}`} />
          </button>
        </div>

      </div>
    </div>
  );
}
