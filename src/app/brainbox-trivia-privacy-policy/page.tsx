import type { Metadata } from "next";
import {
  ShieldCheck,
  Lock,
  Mail,
  Globe,
  Database,
  Smartphone,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Trophy,
  Megaphone,
  Trash2,
  RefreshCw,
  UserCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | BrainBox Trivia",
  description:
    "Official Privacy Policy for BrainBox Trivia. Learn how we collect, use, disclose, and safeguard your information when using the BrainBox Trivia mobile application.",
  alternates: {
    canonical: "https://jobmaster.com.bd/brainbox-trivia-privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy - BrainBox Trivia",
    description:
      "Official Privacy Policy for BrainBox Trivia mobile application. Transparent data practices, Google AdMob, Google Play Services, and Supabase security.",
    url: "https://jobmaster.com.bd/brainbox-trivia-privacy-policy",
    siteName: "BrainBox Trivia",
    locale: "en_US",
    type: "website",
  },
};

export default function BrainBoxTriviaPrivacyPolicyPage() {
  const effectiveDate = "November 25, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Sticky Top Header (Standalone BrainBox Trivia Branding) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight leading-none">
                BrainBox <span className="text-indigo-600">Trivia</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Official Privacy Policy
              </span>
            </div>
          </div>

          <a
            href="mailto:mobileseba247@gmail.com"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors border border-indigo-200/70"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-7">
        {/* Hero Card */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden border border-indigo-800/40">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-14 -left-14 w-52 h-52 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3.5 py-1.5 rounded-full text-indigo-300 text-xs font-black tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-indigo-300" />
              <span>Privacy &amp; Data Protection Policy</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
              Privacy Policy for{" "}
              <span className="text-indigo-400">BrainBox Trivia</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              Welcome to <strong>BrainBox Trivia</strong> (&ldquo;we,&rdquo;
              &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to
              protecting your privacy and ensuring a transparent, safe user
              experience. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our mobile
              application <strong>BrainBox Trivia</strong> (the
              &ldquo;Application&rdquo;).
            </p>

            <p className="text-slate-300/90 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              Please read this Privacy Policy carefully. By installing and using{" "}
              <strong>BrainBox Trivia</strong>, you agree to the collection and
              use of information in accordance with this policy.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-4 text-[11px] sm:text-xs text-slate-300 font-semibold border-t border-slate-700/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Last Updated: {effectiveDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                Application: BrainBox Trivia
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Google Play Policy Compliant
              </span>
            </div>
          </div>
        </section>

        {/* Quick Summary Highlights Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-900">
                Profile &amp; Gameplay
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Display name, scores, streaks &amp; rankings
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-900">
                Trusted Services
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                AdMob, Play Services &amp; Supabase
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-900">
                Encrypted Data
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                HTTPS/TLS &amp; secure cloud storage
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xs text-slate-900">
                Age 16+ Policy
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Not directed to children under 16
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Policy Sections */}
        <div className="space-y-6">
          {/* Section 1: Information We Collect */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Information We Collect
              </h2>
            </div>

            {/* A. Information Provided Directly by You */}
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>A. Information Provided Directly by You</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    User Profile Data
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    When you customize your profile or log in (e.g., via Google
                    Authentication or email), we may collect your display name,
                    email address, custom bio, and chosen profile avatar/photo.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Gameplay &amp; Performance Statistics</span>
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    We collect trivia quiz answers, total scores, daily streaks,
                    coin balances, power-up inventory, and ranking statistics to
                    manage leaderboards and game progress.
                  </p>
                </div>
              </div>
            </div>

            {/* B. Information Collected Automatically */}
            <div className="space-y-3 pt-1">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-violet-600" />
                <span>B. Information Collected Automatically</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Device Identifiers &amp; Technical Data
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    We automatically collect certain non-personally
                    identifiable technical information, including your device
                    model, operating system version, unique device identifiers,
                    IP address, and Google Advertising ID (AAID).
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Usage &amp; Log Data
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    Information about your interactions with the Application,
                    such as session durations, features accessed, and error
                    crash logs.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Third-Party Services & Technologies Used */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Third-Party Services &amp; Technologies Used
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              To deliver advertising, handle user authentication, and host game
              data, <strong>BrainBox Trivia</strong> integrates trusted
              third-party services that may collect information used to identify
              your device:
            </p>

            <div className="grid grid-cols-1 gap-4 pt-1">
              {/* A. Google AdMob */}
              <div className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-600" />
                    <span>A. Google AdMob (Advertising)</span>
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Ads &amp; Monetization
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  We use <strong>Google AdMob</strong> to display personalized
                  and non-personalized advertisements (App Open, Banner,
                  Interstitial, and Rewarded Video Ads). AdMob may use cookies,
                  device identifiers, and location data to serve relevant ads.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    <span>Google Privacy Policy</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    <span>Google Ad Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* B. Google Play Services */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      B. Google Play Services
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Android Core
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Used for app infrastructure, security, and authentication
                    services.
                  </p>
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline pt-1"
                  >
                    <span>Google Play Services Privacy Policy</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* C. Backend & Database Services (Supabase) */}
                <div className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                      C. Backend &amp; Database Services (Supabase)
                    </h3>
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                      Cloud Storage
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Used to securely store user profile information, global
                    leaderboard rankings, and online quiz content.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: How We Use Your Information */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                How We Use Your Information
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              We use the collected information for the following purposes:
            </p>

            <ol className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-start gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>To Provide and Maintain the Application:</strong>{" "}
                  Enabling gameplay, score synchronization, profile
                  customization, and saving daily streaks, coin balances, and
                  power-up inventories.
                </span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Personalization &amp; Global Leaderboards:</strong>{" "}
                  Displaying your chosen display name, avatar, and quiz rankings
                  on competitive leaderboards and improving your overall game
                  experience.
                </span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong>Advertising &amp; Rewards:</strong> Serving relevant
                  personalized or non-personalized advertisements through Google
                  AdMob, including optional rewarded video ads that grant
                  in-game bonuses.
                </span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  <strong>Security, Stability &amp; Analytics:</strong>{" "}
                  Monitoring usage trends, diagnosing crashes or technical
                  errors, preventing fraud or abuse, and maintaining platform
                  integrity.
                </span>
              </li>
            </ol>
          </section>

          {/* Section 4: Children's Privacy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Children&apos;s Privacy
              </h2>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 sm:p-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm text-amber-900">
                  Not Intended for Children Under 16
                </h3>
                <p className="text-amber-900/85 text-xs leading-relaxed font-medium">
                  <strong>BrainBox Trivia</strong> is not intended for children
                  under the age of <strong>16</strong>. We do not knowingly
                  collect personally identifiable information from children under
                  16. If we discover that a child under 16 has provided us with
                  personal information, we will immediately delete such
                  information from our servers. If you are a parent or guardian
                  and believe your child has provided personal data, please
                  contact us at{" "}
                  <a
                    href="mailto:mobileseba247@gmail.com"
                    className="font-bold underline text-amber-950"
                  >
                    mobileseba247@gmail.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Data Retention and Deletion */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                5
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Data Retention and Deletion
              </h2>
            </div>

            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <Trash2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                <p>
                  We retain your profile and gameplay information only for as
                  long as your account remains active or as needed to provide
                  you with our services.
                </p>
                <p>
                  You have the right to request deletion of your account and
                  associated personal data at any time. To request account or
                  data deletion, please send an email to{" "}
                  <a
                    href="mailto:mobileseba247@gmail.com"
                    className="text-indigo-600 font-bold underline"
                  >
                    mobileseba247@gmail.com
                  </a>{" "}
                  with your registered email address or display name. Upon
                  verification, we will permanently delete your account data
                  within a reasonable timeframe.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Security of Your Information */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                6
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Security of Your Information
              </h2>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
              We use administrative, technical, and electronic security
              measures—including encrypted HTTPS/TLS data transmission and
              role-restricted database access controls—to help protect your
              personal information. While we strive to use commercially
              acceptable means to safeguard your data, no method of electronic
              transmission over the internet or digital storage is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 7: Changes to This Privacy Policy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                7
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
                <span>Changes to This Privacy Policy</span>
              </h2>
            </div>

            <div className="flex items-start gap-3">
              <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                We may update this Privacy Policy from time to time to reflect
                changes in our practices, technologies, or legal requirements.
                Any updates will be posted on this page with an updated
                &ldquo;Last Updated&rdquo; date. We encourage you to review this
                Privacy Policy periodically.
              </p>
            </div>
          </section>

          {/* Section 8: Contact Us */}
          <section className="bg-gradient-to-br from-indigo-50 to-violet-50/70 rounded-3xl p-6 sm:p-8 border border-indigo-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                  Section 8 • Contact Us
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900">
                  Questions or Privacy Requests?
                </h2>
              </div>
            </div>

            <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed">
              If you have any questions, concerns, or data deletion requests
              regarding this Privacy Policy for{" "}
              <strong>BrainBox Trivia</strong>, please contact us directly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Support &amp; Privacy Email
                </span>
                <a
                  href="mailto:mobileseba247@gmail.com"
                  className="font-black text-xs sm:text-sm text-indigo-600 hover:underline flex items-center gap-1.5 break-all"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>mobileseba247@gmail.com</span>
                </a>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Policy URL
                </span>
                <div className="font-bold text-xs text-slate-700 flex items-center gap-1.5 break-all">
                  <Globe className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>
                    https://jobmaster.com.bd/brainbox-trivia-privacy-policy
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer (Standalone BrainBox Trivia Branding) */}
      <footer className="bg-white border-t border-slate-200/80 py-7 px-4 sm:px-8 text-center text-slate-500 space-y-2">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-[10px]">
              BB
            </div>
            <span className="font-extrabold text-slate-800">
              BrainBox Trivia
            </span>
            <span>• Official Privacy Policy</span>
          </div>

          <a
            href="mailto:mobileseba247@gmail.com"
            className="text-indigo-600 font-bold hover:underline"
          >
            mobileseba247@gmail.com
          </a>
        </div>

        <p className="text-[11px] text-slate-400">
          All Rights Reserved © 2026 BrainBox Trivia.
        </p>
      </footer>
    </div>
  );
}
