"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Eye, 
  Activity, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  BookOpen, 
  Package, 
  HelpCircle, 
  TrendingUp, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Lock,
  Layers
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";

interface AnalyticsState {
  realtimeActiveUsers: number;
  todayVisits: number;
  todayPageviews: number;
  totalRegisteredUsers: number;
  totalExamsCount: number;
  totalQuestionsCount: number;
  dailyTrend: Array<{
    date: string;
    displayDate: string;
    activeUsers: number;
    pageviews: number;
  }>;
  topPages: Array<{
    pagePath: string;
    activeUsers: number;
  }>;
  isMockData: boolean;
  errorMsg?: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [showConfigHelp, setShowConfigHelp] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.analytics) {
          setData(json.analytics);
          setLastRefreshed(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      }
    } catch (err) {
      console.error("Error loading admin analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Panel</span>
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6A00] flex items-center justify-center font-black">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  Traffic & Analytics Dashboard
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Real-time visitor monitoring & system insights
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {lastRefreshed && (
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400">
                Updated: {lastRefreshed}
              </span>
            )}
            <button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#FF6A00]" : ""}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6A00] hover:bg-[#e05d00] text-white rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer"
            >
              <span>View Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* GA4 Connection Status Banner */}
        {data && data.isMockData && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 text-amber-900 shadow-2xs space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-amber-950">
                    {data.errorMsg && data.errorMsg.includes("not enabled")
                      ? "Google Analytics Data API Not Enabled in GCP — Displaying Live Simulated Analytics"
                      : "GA4 Stream Status — Displaying Live Simulated Analytics"}
                  </h3>
                  <p className="text-[11px] font-medium text-amber-800 leading-relaxed mt-0.5">
                    {data.errorMsg || "The dashboard is currently displaying simulated real-time data. Connect your Google Analytics 4 Property ID and Service Account key in .env.local to stream live GA4 data."}
                  </p>
                  {data.errorMsg && data.errorMsg.includes("not enabled") && (
                    <a
                      href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10px] font-bold transition-colors"
                    >
                      <span>Enable Analytics Data API in GCP Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowConfigHelp(!showConfigHelp)}
                className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 rounded-lg text-xs font-black shrink-0 cursor-pointer transition-colors"
              >
                {showConfigHelp ? "Hide Setup Guide" : "Setup Credentials"}
              </button>
            </div>

            {/* Expandable Setup Instructions */}
            {showConfigHelp && (
              <div className="mt-3 pt-3 border-t border-amber-200 text-xs space-y-2 text-slate-800 bg-white/80 p-3.5 rounded-xl border">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  How to setup GA4 Credentials in .env.local:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium text-slate-700 pl-1">
                  <li>Go to Google Analytics 4 Admin → Property Settings and copy your <strong>GA_PROPERTY_ID</strong> (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">123456789</code>).</li>
                  <li>In Google Cloud Console, create a Service Account, generate a JSON Key, and copy the <code className="bg-slate-100 px-1 py-0.5 rounded">client_email</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">private_key</code>.</li>
                  <li>In GA4 Property Settings → Property Access Management, grant Viewer permission to your Service Account email.</li>
                  <li>Add these variables to your <code className="bg-slate-100 px-1 py-0.5 rounded">.env.local</code> file:</li>
                </ol>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed">
{`GA_PROPERTY_ID="YOUR_GA4_PROPERTY_ID"
GA_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"`}
                </pre>
              </div>
            )}
          </div>
        )}

        {data && !data.isMockData && (
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 px-4 text-emerald-900 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-extrabold text-emerald-950">
                Connected to Google Analytics 4 API (v1beta)
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Live Stream Active
            </span>
          </div>
        )}

        {/* Top 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Realtime Live Visitors */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Real-Time Right Now
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {data ? data.realtimeActiveUsers : "..."}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/90 px-2 py-0.5 rounded-full text-[10px] font-black">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active Users
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold mt-2">
              Current active users browsing site
            </p>
          </div>

          {/* Card 2: Today's Total Visitors & Pageviews */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Today's Traffic
              </span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6A00] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {data ? data.todayVisits.toLocaleString() : "..."}
              </span>
              <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {data ? `${data.todayPageviews.toLocaleString()} Views` : "..."}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold mt-2">
              Unique visitors & page views today
            </p>
          </div>

          {/* Card 3: Total Registered Users */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Total Users
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {data ? data.totalRegisteredUsers.toLocaleString() : "..."}
              </span>
              <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                Registered
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold mt-2">
              Total candidate accounts in database
            </p>
          </div>

          {/* Card 4: Total Exams & Packages */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Exams & Packages
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {data ? data.totalExamsCount : "..."}
              </span>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {data ? `${data.totalQuestionsCount.toLocaleString()} Questions` : "..."}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold mt-2">
              Active published exam papers
            </p>
          </div>

        </div>

        {/* Charts Section: 7-Day Traffic Trend */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#FF6A00]" />
                <span>7-Day Visitor & Pageview Trends</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Daily traffic volume over the past 7 days
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-extrabold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FF6A00]"></span>
                <span className="text-slate-600">Active Visitors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span className="text-slate-600">Pageviews</span>
              </div>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="w-full h-72 sm:h-80 pt-2">
            {data && data.dailyTrend && data.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF6A00" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="activeUsers" 
                    name="Active Visitors"
                    stroke="#FF6A00" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pageviews" 
                    name="Pageviews"
                    stroke="#A855F7" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-semibold text-xs">
                Loading chart trends...
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Active Pages & Quick System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Pages Breakdown */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>Real-time Active Pages Breakdown</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                    <th className="pb-3">Route / Page Path</th>
                    <th className="pb-3 text-right">Active Users Right Now</th>
                    <th className="pb-3 text-right">Traffic Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {data && data.topPages && data.topPages.length > 0 ? (
                    data.topPages.map((page, idx) => {
                      const totalActive = Math.max(1, data.realtimeActiveUsers);
                      const pct = Math.min(100, Math.round((page.activeUsers / totalActive) * 100));
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 font-mono text-[11px] text-slate-900">
                            {page.pagePath}
                          </td>
                          <td className="py-3 text-right font-black text-slate-900">
                            {page.activeUsers}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-[#FF6A00] h-full rounded-full" 
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-black text-slate-500 w-8">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">
                        No active page data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick System Status Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>System Architecture Status</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-600">Supabase DB</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Connected
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-600">GA4 Analytics</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    data && !data.isMockData 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                      : "text-amber-800 bg-amber-50 border-amber-200"
                  }`}>
                    {data && !data.isMockData ? "Live Stream" : "Simulated Mode"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-600">API Route Revalidation</span>
                  <span className="font-mono text-[11px] font-extrabold text-slate-800">
                    30 seconds
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Job Master Analytics System v2.0</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
