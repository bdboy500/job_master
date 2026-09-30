const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.join(__dirname, '../public/screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper for mobile frame wrapper
function wrapInMobileFrame(title, screenContent, activeNav = 'home') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="960" viewBox="0 0 460 960">
  <defs>
    <!-- Background Gradient for Phone Body -->
    <linearGradient id="phone-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Glass Bezel Highlight -->
    <linearGradient id="bezel-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#64748B" stop-opacity="0.8" />
      <stop offset="20%" stop-color="#334155" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.9" />
    </linearGradient>

    <linearGradient id="primary-orange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A1A" />
      <stop offset="100%" stop-color="#FF5400" />
    </linearGradient>

    <linearGradient id="navy-card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <filter id="soft-shadow" x="-8%" y="-8%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.12" />
    </filter>

    <filter id="orange-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#FF5400" flood-opacity="0.35" />
    </filter>

    <clipPath id="screen-clip">
      <rect x="8" y="8" width="444" height="944" rx="40" />
    </clipPath>
  </defs>

  <!-- External Phone Chassis -->
  <rect x="0" y="0" width="460" height="960" rx="46" fill="url(#phone-body)" />
  <rect x="2" y="2" width="456" height="956" rx="45" fill="none" stroke="url(#bezel-highlight)" stroke-width="2.5" />

  <!-- Inner Screen Content Clipped to Bezel -->
  <g clip-path="url(#screen-clip)">
    <!-- Screen Canvas Background -->
    <rect x="8" y="8" width="444" height="944" fill="#F8FAFC" />

    <!-- Actual Screen Content -->
    ${screenContent}

    <!-- Dynamic Island Pill at Top -->
    <rect x="170" y="16" width="120" height="28" rx="14" fill="#000000" />
    <circle cx="270" cy="30" r="5" fill="#1E293B" />
    <circle cx="195" cy="30" r="4" fill="#0F172A" />

    <!-- Status Bar (09:41, Cellular, Wifi, Battery) -->
    <text x="36" y="35" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="13" fill="#0F172A">09:41</text>
    <g transform="translate(378, 23)">
      <!-- Signal Bars -->
      <rect x="0" y="8" width="3" height="4" rx="1" fill="#0F172A" />
      <rect x="5" y="6" width="3" height="6" rx="1" fill="#0F172A" />
      <rect x="10" y="3" width="3" height="9" rx="1" fill="#0F172A" />
      <rect x="15" y="0" width="3" height="12" rx="1" fill="#0F172A" />
      <!-- WiFi Icon -->
      <path d="M 24,11 A 7,7 0 0,1 36,11 M 26,8 A 10,10 0 0,1 34,8 M 28,5 A 13,13 0 0,1 32,5" stroke="#0F172A" stroke-width="1.8" fill="none" stroke-linecap="round" />
      <!-- Battery -->
      <rect x="42" y="1" width="22" height="11" rx="3" fill="none" stroke="#0F172A" stroke-width="1.5" />
      <rect x="44" y="3" width="15" height="7" rx="1.5" fill="#10B981" />
      <path d="M 65,4.5 L 65,8.5" stroke="#0F172A" stroke-width="1.5" stroke-linecap="round" />
    </g>

    <!-- Bottom Home Indicator Bar -->
    <rect x="160" y="938" width="140" height="4.5" rx="2.25" fill="#94A3B8" />
  </g>
</svg>`;
}

// ----------------------------------------------------
// 1. HOME DASHBOARD SCREEN
// ----------------------------------------------------
const homeContent = `
  <!-- Top App Header -->
  <rect x="8" y="8" width="444" height="120" fill="url(#navy-card)" />
  <g transform="translate(28, 62)">
    <!-- Mini Logo Badge -->
    <circle cx="20" cy="20" r="19" fill="#FF5400" />
    <circle cx="20" cy="20" r="15" fill="#0F172A" />
    <text x="20" y="24" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">JM</text>

    <!-- Title and Slogan -->
    <text x="48" y="16" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">Job Master</text>
    <text x="48" y="31" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#FF7A1A">চাকরি আপনার হাতে!</text>

    <!-- Top Right Actions (Streak, Bell) -->
    <g transform="translate(300, 4)">
      <rect x="0" y="0" width="60" height="28" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="30" y="19" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#F59E0B" text-anchor="middle">🔥 ৭ দিন</text>

      <circle cx="82" cy="14" r="14" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="82" y="19" font-family="system-ui, sans-serif" font-size="13" fill="#FFFFFF" text-anchor="middle">🔔</text>
      <circle cx="89" cy="7" r="4" fill="#EF4444" />
    </g>
  </g>

  <!-- Hero Live Model Test Banner -->
  <g transform="translate(28, 142)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="155" rx="18" fill="url(#navy-card)" stroke="#FF5400" stroke-width="1.5" />
    <!-- Live Badge -->
    <rect x="18" y="16" width="105" height="22" rx="11" fill="#EF4444" />
    <circle cx="28" cy="27" r="4" fill="#FFFFFF" />
    <text x="65" y="32" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" text-anchor="middle">লাইভ মডেল টেস্ট</text>

    <text x="18" y="66" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="17" fill="#FFFFFF">৪৬তম বিসিএস প্রিলিমিনারি টেস্ট</text>
    
    <!-- Meta chips -->
    <g transform="translate(18, 80)">
      <text x="0" y="14" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11.5" fill="#94A3B8">⏱️ ২ ঘণ্টা  •  📝 ২০০ প্রশ্ন  •  👥 ৩,৪৫০ জন</text>
    </g>

    <!-- Start Button -->
    <g transform="translate(18, 106)" filter="url(#orange-glow)">
      <rect x="0" y="0" width="180" height="34" rx="17" fill="url(#primary-orange)" />
      <text x="90" y="22" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF" text-anchor="middle">অংশগ্রহণ করুন →</text>
    </g>
    <!-- Mascot/Decoration icon on right -->
    <circle cx="340" cy="78" r="42" fill="#334155" fill-opacity="0.4" />
    <text x="340" y="93" font-size="44" text-anchor="middle">🎓</text>
  </g>

  <!-- Section Title: প্রস্তুতি ক্যাটাগরি -->
  <g transform="translate(28, 322)">
    <text x="0" y="0" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="16" fill="#0F172A">পরীক্ষার ক্যাটাগরি</text>
    <text x="404" y="0" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#FF5400" text-anchor="end">সব দেখুন →</text>
  </g>

  <!-- 4 Category Cards Grid -->
  <g transform="translate(28, 336)">
    <!-- 1. BCS -->
    <g filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="88" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <rect x="12" y="14" width="36" height="36" rx="10" fill="#EEF2FF" />
      <text x="30" y="39" font-size="20" text-anchor="middle">🏛️</text>
      <text x="56" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">বিসিএস প্রিলি</text>
      <text x="56" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10.5" fill="#64748B">২০,০০০+ প্রশ্ন</text>
      <rect x="12" y="60" width="170" height="18" rx="9" fill="#F1F5F9" />
      <text x="97" y="73" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="10" fill="#3B82F6" text-anchor="middle">মডেল টেস্ট শুরু করুন</text>
    </g>

    <!-- 2. Bank -->
    <g transform="translate(210, 0)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="88" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <rect x="12" y="14" width="36" height="36" rx="10" fill="#ECFDF5" />
      <text x="30" y="39" font-size="20" text-anchor="middle">🏦</text>
      <text x="56" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">ব্যাংক নিয়োগ</text>
      <text x="56" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10.5" fill="#64748B">৮,৫০০+ প্রশ্ন</text>
      <rect x="12" y="60" width="170" height="18" rx="9" fill="#F1F5F9" />
      <text x="97" y="73" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="10" fill="#10B981" text-anchor="middle">মডেল টেস্ট শুরু করুন</text>
    </g>

    <!-- 3. Primary -->
    <g transform="translate(0, 100)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="88" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <rect x="12" y="14" width="36" height="36" rx="10" fill="#FFFBEB" />
      <text x="30" y="39" font-size="20" text-anchor="middle">📚</text>
      <text x="56" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">প্রাথমিক শিক্ষক</text>
      <text x="56" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10.5" fill="#64748B">১০,০০০+ প্রশ্ন</text>
      <rect x="12" y="60" width="170" height="18" rx="9" fill="#F1F5F9" />
      <text x="97" y="73" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="10" fill="#F59E0B" text-anchor="middle">মডেল টেস্ট শুরু করুন</text>
    </g>

    <!-- 4. NTRCA -->
    <g transform="translate(210, 100)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="88" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <rect x="12" y="14" width="36" height="36" rx="10" fill="#FDF2F8" />
      <text x="30" y="39" font-size="20" text-anchor="middle">🎓</text>
      <text x="56" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">শিক্ষক নিবন্ধন</text>
      <text x="56" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10.5" fill="#64748B">৬,২০০+ প্রশ্ন</text>
      <rect x="12" y="60" width="170" height="18" rx="9" fill="#F1F5F9" />
      <text x="97" y="73" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="10" fill="#EC4899" text-anchor="middle">মডেল টেস্ট শুরু করুন</text>
    </g>
  </g>

  <!-- Daily Capsule & Quick Quiz Challenge -->
  <g transform="translate(28, 546)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="100" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    <rect x="14" y="14" width="44" height="44" rx="12" fill="#FFF7ED" />
    <text x="36" y="43" font-size="24" text-anchor="middle">⚡</text>
    <text x="68" y="32" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">আজকের কুইজ চ্যালেঞ্জ (Daily Quiz)</text>
    <text x="68" y="48" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B">বিষয়: বাংলাদেশ বিষয়াবলী ও সংবিধান  •  ১০ প্রশ্ন</text>

    <g transform="translate(14, 66)">
      <rect x="0" y="0" width="376" height="24" rx="12" fill="#FFF7ED" stroke="#FFEDD5" stroke-width="1" />
      <text x="188" y="17" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#FF5400" text-anchor="middle">কুইজ শুরু করুন ও পয়েন্ট অর্জন করুন ➔</text>
    </g>
  </g>

  <!-- Leaderboard Top 3 -->
  <g transform="translate(28, 668)">
    <text x="0" y="0" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">আজকের মেধাতালিকা শীর্ষ ৩</text>
    <text x="404" y="0" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#FF5400" text-anchor="end">পূর্ণ তালিকা 🏆</text>
  </g>

  <g transform="translate(28, 680)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="145" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    
    <!-- Rank 1 -->
    <g transform="translate(14, 12)">
      <circle cx="16" cy="18" r="14" fill="#FEF3C7" />
      <text x="16" y="23" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#B45309" text-anchor="middle">১</text>
      <text x="40" y="17" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">তানভীর আহমেদ</text>
      <text x="40" y="30" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10" fill="#64748B">৪৪তম বিসিএস ক্যাডার প্রত্যাশী</text>
      <text x="360" y="24" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="13" fill="#10B981" text-anchor="end">৯৮.৫০</text>
    </g>
    <line x1="14" y1="52" x2="390" y2="52" stroke="#F1F5F9" stroke-width="1" />

    <!-- Rank 2 -->
    <g transform="translate(14, 58)">
      <circle cx="16" cy="18" r="14" fill="#F1F5F9" />
      <text x="16" y="23" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#475569" text-anchor="middle">২</text>
      <text x="40" y="17" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">নুসরাত জাহান</text>
      <text x="40" y="30" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10" fill="#64748B">ব্যাংকার্স সিলেকশন প্রস্তুতি</text>
      <text x="360" y="24" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="13" fill="#10B981" text-anchor="end">৯৬.০০</text>
    </g>
    <line x1="14" y1="98" x2="390" y2="98" stroke="#F1F5F9" stroke-width="1" />

    <!-- Rank 3 -->
    <g transform="translate(14, 104)">
      <circle cx="16" cy="18" r="14" fill="#FFF7ED" />
      <text x="16" y="23" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#C2410C" text-anchor="middle">৩</text>
      <text x="40" y="17" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">রাকিবুল হাসান</text>
      <text x="40" y="30" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10" fill="#64748B">প্রাইমারি শিক্ষক নিয়োগ পরীক্ষার্থী</text>
      <text x="360" y="24" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="13" fill="#10B981" text-anchor="end">৯৫.৫০</text>
    </g>
  </g>

  <!-- Bottom Navigation Bar -->
  <rect x="8" y="870" width="444" height="74" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
  <g transform="translate(8, 875)">
    <!-- Tab 1: Home (Active) -->
    <g transform="translate(42, 10)">
      <circle cx="16" cy="16" r="16" fill="#FFF7ED" />
      <text x="16" y="22" font-size="18" text-anchor="middle">🏠</text>
      <text x="16" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#FF5400" text-anchor="middle">হোম</text>
    </g>

    <!-- Tab 2: Exams -->
    <g transform="translate(146, 10)">
      <text x="16" y="22" font-size="18" text-anchor="middle">📝</text>
      <text x="16" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B" text-anchor="middle">পরীক্ষা</text>
    </g>

    <!-- Tab 3: Courses -->
    <g transform="translate(250, 10)">
      <text x="16" y="22" font-size="18" text-anchor="middle">🎓</text>
      <text x="16" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B" text-anchor="middle">কোর্স</text>
    </g>

    <!-- Tab 4: Profile -->
    <g transform="translate(354, 10)">
      <text x="16" y="22" font-size="18" text-anchor="middle">👤</text>
      <text x="16" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B" text-anchor="middle">প্রোফাইল</text>
    </g>
  </g>
`;

// ----------------------------------------------------
// 2. LIVE MODEL TEST & QUIZ SCREEN
// ----------------------------------------------------
const examContent = `
  <!-- Top Exam Header -->
  <rect x="8" y="8" width="444" height="105" fill="url(#navy-card)" />
  <g transform="translate(28, 56)">
    <!-- Back arrow -->
    <rect x="0" y="0" width="34" height="34" rx="17" fill="#1E293B" stroke="#334155" stroke-width="1" />
    <text x="17" y="22" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF" text-anchor="middle">←</text>

    <!-- Title -->
    <text x="48" y="16" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#FFFFFF">৪৬তম বিসিএস স্পেশাল মডেল টেস্ট</text>
    <text x="48" y="30" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#94A3B8">প্রশ্ন ১২ / ৫০  (২৪% সম্পন্ন)</text>

    <!-- Countdown Timer Pill -->
    <g transform="translate(290, 2)" filter="url(#orange-glow)">
      <rect x="0" y="0" width="94" height="30" rx="15" fill="url(#primary-orange)" />
      <text x="47" y="20" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle">⏱️ ৩৭:৪৫</text>
    </g>
  </g>

  <!-- Progress Bar Line -->
  <rect x="8" y="113" width="444" height="4" fill="#1E293B" />
  <rect x="8" y="113" width="110" height="4" fill="#FF5400" />

  <!-- Subject Badge & Marks Info -->
  <g transform="translate(28, 134)">
    <rect x="0" y="0" width="130" height="24" rx="12" fill="#EEF2FF" />
    <text x="65" y="16" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#4F46E5" text-anchor="middle">বাংলা ভাষা ও সাহিত্য</text>

    <text x="404" y="16" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" text-anchor="end">মান: ১.০০  |  নেগেটিভ: ০.৫০</text>
  </g>

  <!-- Question Card -->
  <g transform="translate(28, 170)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="130" rx="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" />
    <circle cx="28" cy="30" r="14" fill="#FF5400" />
    <text x="28" y="35" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">১২</text>

    <text x="54" y="32" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="16" fill="#0F172A">রবীন্দ্রনাথ ঠাকুর তাঁর কোন নাটকটি</text>
    <text x="54" y="56" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="16" fill="#0F172A">কাজী নজরুল ইসলামকে উৎসর্গ করেছিলেন?</text>

    <!-- Bookmark / Flag icon -->
    <g transform="translate(360, 20)">
      <circle cx="12" cy="12" r="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <text x="12" y="17" font-size="14" text-anchor="middle">🔖</text>
    </g>

    <!-- Hints badge -->
    <rect x="20" y="90" width="135" height="24" rx="12" fill="#F1F5F9" />
    <text x="67" y="106" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="10.5" fill="#475569" text-anchor="middle">💡 প্রিভিয়াস বিসিএস প্রশ্ন</text>
  </g>

  <!-- 4 Interactive Option Buttons -->
  <g transform="translate(28, 318)">
    <!-- Option A -->
    <g filter="url(#soft-shadow)">
      <rect x="0" y="0" width="404" height="58" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" />
      <circle cx="30" cy="29" r="15" fill="#F1F5F9" />
      <text x="30" y="34" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#475569" text-anchor="middle">ক</text>
      <text x="60" y="34" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="15" fill="#1E293B">রক্তকরবী</text>
    </g>

    <!-- Option B (Selected / Active) -->
    <g transform="translate(0, 70)" filter="url(#orange-glow)">
      <rect x="0" y="0" width="404" height="58" rx="14" fill="#FFF7ED" stroke="#FF5400" stroke-width="2" />
      <circle cx="30" cy="29" r="15" fill="#FF5400" />
      <text x="30" y="34" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" text-anchor="middle">খ</text>
      <text x="60" y="34" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#FF5400">বসন্ত</text>
      <!-- Checked tick -->
      <circle cx="370" cy="29" r="12" fill="#FF5400" />
      <text x="370" y="33" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">✓</text>
    </g>

    <!-- Option C -->
    <g transform="translate(0, 140)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="404" height="58" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" />
      <circle cx="30" cy="29" r="15" fill="#F1F5F9" />
      <text x="30" y="34" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#475569" text-anchor="middle">গ</text>
      <text x="60" y="34" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="15" fill="#1E293B">কালের যাত্রা</text>
    </g>

    <!-- Option D -->
    <g transform="translate(0, 210)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="404" height="58" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" />
      <circle cx="30" cy="29" r="15" fill="#F1F5F9" />
      <text x="30" y="34" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#475569" text-anchor="middle">ঘ</text>
      <text x="60" y="34" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="15" fill="#1E293B">বিসর্জন</text>
    </g>
  </g>

  <!-- Question Quick Palette Sheet -->
  <g transform="translate(28, 608)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="140" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    <text x="16" y="24" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">প্রশ্ন প্যালেট ও নেভিগেশন</text>
    <text x="388" y="24" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#10B981" text-anchor="end">১১ উত্তর দেওয়া হয়েছে</text>

    <!-- Numbers Row 1 -->
    <g transform="translate(16, 38)">
      <!-- 1 to 10 -->
      <circle cx="16" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="16" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">১</text>
      <circle cx="52" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="52" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">২</text>
      <circle cx="88" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="88" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">৩</text>
      <circle cx="124" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="124" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">৪</text>
      <circle cx="160" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="160" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">৫</text>
      <circle cx="196" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="196" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">৬</text>
      <circle cx="232" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="232" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">৭</text>
      <circle cx="268" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="268" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">৮</text>
      <circle cx="304" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="304" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">৯</text>
      <circle cx="340" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="340" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">১০</text>
    </g>

    <!-- Numbers Row 2 -->
    <g transform="translate(16, 76)">
      <circle cx="16" cy="16" r="14" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" />
      <text x="16" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">১১</text>
      <!-- Current Active 12 -->
      <circle cx="52" cy="16" r="14" fill="#FF5400" />
      <text x="52" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">১২</text>
      <!-- Unvisited 13 to 20 -->
      <circle cx="88" cy="16" r="14" fill="#F1F5F9" />
      <text x="88" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">১৩</text>
      <circle cx="124" cy="16" r="14" fill="#F1F5F9" />
      <text x="124" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">১৪</text>
      <circle cx="160" cy="16" r="14" fill="#F1F5F9" />
      <text x="160" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">১৫</text>
      <circle cx="196" cy="16" r="14" fill="#F1F5F9" />
      <text x="196" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">১৬</text>
      <circle cx="232" cy="16" r="14" fill="#F1F5F9" />
      <text x="232" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">১৭</text>
      <circle cx="268" cy="16" r="14" fill="#F1F5F9" />
      <text x="268" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">১৮</text>
      <circle cx="304" cy="16" r="14" fill="#F1F5F9" />
      <text x="304" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">১৯</text>
      <circle cx="340" cy="16" r="14" fill="#F1F5F9" />
      <text x="340" y="20" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">২০</text>
    </g>
  </g>

  <!-- Bottom Action Bar (Previous, Next, Submit) -->
  <rect x="8" y="864" width="444" height="80" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
  <g transform="translate(28, 880)">
    <!-- Previous Button -->
    <rect x="0" y="0" width="110" height="46" rx="23" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1" />
    <text x="55" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#475569" text-anchor="middle">← পূর্ববর্তী</text>

    <!-- Review / Mark Button -->
    <rect x="122" y="0" width="120" height="46" rx="23" fill="#FFFBEB" stroke="#FDE68A" stroke-width="1" />
    <text x="182" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#B45309" text-anchor="middle">মার্ক করুন 🔖</text>

    <!-- Next Button (Primary) -->
    <g transform="translate(254, 0)" filter="url(#orange-glow)">
      <rect x="0" y="0" width="150" height="46" rx="23" fill="url(#primary-orange)" />
      <text x="75" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF" text-anchor="middle">পরবর্তী প্রশ্ন ➔</text>
    </g>
  </g>
`;

// ----------------------------------------------------
// 3. EXAM RESULTS & PERFORMANCE SCREEN
// ----------------------------------------------------
const resultContent = `
  <!-- Top Result Header -->
  <rect x="8" y="8" width="444" height="115" fill="url(#navy-card)" />
  <g transform="translate(28, 56)">
    <!-- Home / Back -->
    <rect x="0" y="0" width="34" height="34" rx="17" fill="#1E293B" stroke="#334155" stroke-width="1" />
    <text x="17" y="22" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF" text-anchor="middle">←</text>

    <!-- Title -->
    <text x="48" y="16" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="16" fill="#FFFFFF">পরীক্ষার ফলাফল ও মূল্যায়ন</text>
    <text x="48" y="32" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#FF7A1A">৪৬তম বিসিএস পূর্ণাঙ্গ মডেল টেস্ট - ০৪</text>

    <g transform="translate(320, 2)">
      <rect x="0" y="0" width="84" height="30" rx="15" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="42" y="20" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#10B981" text-anchor="middle">✓ সমাপ্ত</text>
    </g>
  </g>

  <!-- Big Circular Score Display Card -->
  <g transform="translate(28, 138)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="200" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" />
    
    <!-- Circular Meter (Gauge) -->
    <g transform="translate(202, 85)">
      <circle cx="0" cy="0" r="58" fill="none" stroke="#F1F5F9" stroke-width="10" />
      <circle cx="0" cy="0" r="58" fill="none" stroke="#FF5400" stroke-width="10" stroke-dasharray="364" stroke-dashoffset="54" stroke-linecap="round" transform="rotate(-90)" />
      
      <text x="0" y="-4" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#0F172A" text-anchor="middle">৮৮.৫০</text>
      <text x="0" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#64748B" text-anchor="middle">মোট ১০০</text>
    </g>

    <!-- Success Badge -->
    <g transform="translate(132, 160)">
      <rect x="0" y="0" width="140" height="26" rx="13" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1" />
      <text x="70" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#059669" text-anchor="middle">🎉 উত্তীর্ণ (Qualified)</text>
    </g>
  </g>

  <!-- 4 Metrics Grid -->
  <g transform="translate(28, 354)">
    <!-- Correct -->
    <g filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="68" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="26" cy="34" r="14" fill="#ECFDF5" />
      <text x="26" y="39" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#10B981" text-anchor="middle">✓</text>
      <text x="50" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">সঠিক উত্তর</text>
      <text x="50" y="46" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#10B981">৪৬ টি</text>
    </g>

    <!-- Incorrect -->
    <g transform="translate(210, 0)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="68" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="26" cy="34" r="14" fill="#FEF2F2" />
      <text x="26" y="39" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#EF4444" text-anchor="middle">✕</text>
      <text x="50" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">ভুল উত্তর</text>
      <text x="50" y="46" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#EF4444">৪ টি (-২.০০)</text>
    </g>

    <!-- Accuracy -->
    <g transform="translate(0, 80)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="68" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="26" cy="34" r="14" fill="#FFF7ED" />
      <text x="26" y="39" font-size="13" text-anchor="middle">🎯</text>
      <text x="50" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">নির্ভুলতার হার</text>
      <text x="50" y="46" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FF5400">৯২%</text>
    </g>

    <!-- Time Taken -->
    <g transform="translate(210, 80)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="68" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="26" cy="34" r="14" fill="#EEF2FF" />
      <text x="26" y="39" font-size="13" text-anchor="middle">⏱️</text>
      <text x="50" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#0F172A">মোট সময়</text>
      <text x="50" y="46" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="14" fill="#4F46E5">১৮ মি. ২৫ সে.</text>
    </g>
  </g>

  <!-- Nationwide Rank Banner Card -->
  <g transform="translate(28, 518)" filter="url(#orange-glow)">
    <rect x="0" y="0" width="404" height="88" rx="16" fill="url(#navy-card)" stroke="#FF5400" stroke-width="1.5" />
    <circle cx="42" cy="44" r="26" fill="#FF5400" fill-opacity="0.2" />
    <text x="42" y="53" font-size="28" text-anchor="middle">🏆</text>

    <text x="82" y="36" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#FFFFFF">জাতীয় মেধাতালিকায় আপনার অবস্থান</text>
    <text x="82" y="56" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="20" fill="#FF7A1A">#৮ম স্থান  <tspan font-size="13" fill="#94A3B8" font-weight="600">(৪,২৬০ জন পরীক্ষার্থীর মধ্যে)</tspan></text>
    <text x="82" y="74" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="11" fill="#10B981">✨ আপনি শীর্ষ ১% সেরা স্কোরারদের একজন!</text>
  </g>

  <!-- Subject-wise Accuracy Bars -->
  <g transform="translate(28, 624)">
    <text x="0" y="0" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">বিষয়ভিত্তিক পারফরম্যান্স</text>
  </g>

  <g transform="translate(28, 638)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="150" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    
    <!-- Bar 1: Bangla -->
    <g transform="translate(18, 14)">
      <text x="0" y="14" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#0F172A">বাংলা ভাষা ও সাহিত্য</text>
      <text x="368" y="14" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#10B981" text-anchor="end">৯৪%</text>
      <rect x="0" y="20" width="368" height="6" rx="3" fill="#F1F5F9" />
      <rect x="0" y="20" width="346" height="6" rx="3" fill="#10B981" />
    </g>

    <!-- Bar 2: English -->
    <g transform="translate(18, 56)">
      <text x="0" y="14" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#0F172A">ইংরেজি ভাষা ও সাহিত্য</text>
      <text x="368" y="14" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#3B82F6" text-anchor="end">৮৮%</text>
      <rect x="0" y="20" width="368" height="6" rx="3" fill="#F1F5F9" />
      <rect x="0" y="20" width="323" height="6" rx="3" fill="#3B82F6" />
    </g>

    <!-- Bar 3: GK & Math -->
    <g transform="translate(18, 98)">
      <text x="0" y="14" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#0F172A">বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলী</text>
      <text x="368" y="14" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#F59E0B" text-anchor="end">৯০%</text>
      <rect x="0" y="20" width="368" height="6" rx="3" fill="#F1F5F9" />
      <rect x="0" y="20" width="331" height="6" rx="3" fill="#F59E0B" />
    </g>
  </g>

  <!-- Bottom CTA Actions -->
  <rect x="8" y="864" width="444" height="80" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
  <g transform="translate(28, 880)">
    <!-- Review Answers Button -->
    <g filter="url(#orange-glow)">
      <rect x="0" y="0" width="230" height="46" rx="23" fill="url(#primary-orange)" />
      <text x="115" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#FFFFFF" text-anchor="middle">সঠিক সমাধান ও ব্যাখ্যা ➔</text>
    </g>

    <!-- Share Result Button -->
    <g transform="translate(244, 0)">
      <rect x="0" y="0" width="160" height="46" rx="23" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1" />
      <text x="80" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="13" fill="#475569" text-anchor="middle">শেয়ার করুন 📤</text>
    </g>
  </g>
`;

// ----------------------------------------------------
// 4. COURSE HUB & DETAILS SCREEN
// ----------------------------------------------------
const courseContent = `
  <!-- Top Course Header -->
  <rect x="8" y="8" width="444" height="110" fill="url(#navy-card)" />
  <g transform="translate(28, 56)">
    <rect x="0" y="0" width="34" height="34" rx="17" fill="#1E293B" stroke="#334155" stroke-width="1" />
    <text x="17" y="22" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF" text-anchor="middle">←</text>

    <text x="48" y="16" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="16" fill="#FFFFFF">কোর্স বিবরণী ও সিলেবাস</text>
    <text x="48" y="32" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#FF7A1A">Job Master প্রিমিয়াম লার্নিং</text>

    <g transform="translate(350, 4)">
      <circle cx="15" cy="15" r="15" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="15" y="20" font-size="14" text-anchor="middle">❤️</text>
    </g>
  </g>

  <!-- Big Course Hero Banner -->
  <g transform="translate(28, 134)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="175" rx="18" fill="url(#navy-card)" stroke="#334155" stroke-width="1" />
    
    <!-- Best Seller Badge -->
    <rect x="18" y="16" width="125" height="22" rx="11" fill="#FF5400" />
    <text x="80" y="32" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" text-anchor="middle">🔥 সর্বাধিক জনপ্রিয় কোর্স</text>

    <text x="18" y="66" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="18" fill="#FFFFFF">৪৬তম বিসিএস প্রিলিমিনারি</text>
    <text x="18" y="88" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="18" fill="#FF7A1A">সুপার স্পেশাল ক্র্যাশ কোর্স</text>

    <!-- Mentor info -->
    <text x="18" y="116" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="12" fill="#94A3B8">পরিচালনায়: বিসিএস প্রশাসন ও পুলিশ ক্যাডার প্যানেল</text>

    <!-- Ratings -->
    <g transform="translate(18, 136)">
      <text x="0" y="14" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#F59E0B">⭐ ৪.৯ (৩,৪০০+ রিভিউ)  •  👥 ১২,৫০০+ শিক্ষার্থী</text>
    </g>

    <!-- Icon on right -->
    <circle cx="345" cy="88" r="38" fill="#1E293B" />
    <text x="345" y="103" font-size="38" text-anchor="middle">📚</text>
  </g>

  <!-- 4 Feature Badges Grid -->
  <g transform="translate(28, 326)">
    <!-- 1 -->
    <g filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <rect x="10" y="12" width="36" height="36" rx="8" fill="#EEF2FF" />
      <text x="28" y="36" font-size="18" text-anchor="middle">🎥</text>
      <text x="54" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#0F172A">১২০+ লাইভ ক্লাস</text>
      <text x="54" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10" fill="#64748B">রেকর্ডেড ব্যাকআপসহ</text>
    </g>

    <!-- 2 -->
    <g transform="translate(210, 0)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <rect x="10" y="12" width="36" height="36" rx="8" fill="#ECFDF5" />
      <text x="28" y="36" font-size="18" text-anchor="middle">📄</text>
      <text x="54" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#0F172A">২০০+ লেকচার শিট</text>
      <text x="54" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10" fill="#64748B">প্রিন্টেবল পিডিএফ</text>
    </g>

    <!-- 3 -->
    <g transform="translate(0, 72)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <rect x="10" y="12" width="36" height="36" rx="8" fill="#FFF7ED" />
      <text x="28" y="36" font-size="18" text-anchor="middle">📝</text>
      <text x="54" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#0F172A">৫০+ মডেল টেস্ট</text>
      <text x="54" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10" fill="#64748B">রিয়েল-টাইম র‍্যাংক</text>
    </g>

    <!-- 4 -->
    <g transform="translate(210, 72)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="194" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <rect x="10" y="12" width="36" height="36" rx="8" fill="#FDF2F8" />
      <text x="28" y="36" font-size="18" text-anchor="middle">💬</text>
      <text x="54" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#0F172A">২৪/৭ মেন্টর সাপোর্ট</text>
      <text x="54" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10" fill="#64748B">সরাসরি সমাধান</text>
    </g>
  </g>

  <!-- Course Curriculum Breakdown -->
  <g transform="translate(28, 480)">
    <text x="0" y="0" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">কোর্স কারিকুলাম ও বিষয়ভিত্তিক অধ্যায়</text>
  </g>

  <g transform="translate(28, 495)">
    <!-- Chapter 1 -->
    <g filter="url(#soft-shadow)">
      <rect x="0" y="0" width="404" height="66" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="26" cy="33" r="16" fill="#EEF2FF" />
      <text x="26" y="39" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#4F46E5" text-anchor="middle">০১</text>
      <text x="52" y="27" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">বাংলা ভাষা ও সাহিত্য</text>
      <text x="52" y="45" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B">২৮টি ক্লাস  •  ৩৫টি লেকচার শিট  •  ১০টি কুইজ</text>
      <text x="380" y="37" font-family="system-ui, sans-serif" font-size="14" fill="#94A3B8" text-anchor="end">▼</text>
    </g>

    <!-- Chapter 2 -->
    <g transform="translate(0, 78)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="404" height="66" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="26" cy="33" r="16" fill="#ECFDF5" />
      <text x="26" y="39" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#10B981" text-anchor="middle">০২</text>
      <text x="52" y="27" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">গাণিতিক যুক্তি ও মানসিক দক্ষতা</text>
      <text x="52" y="45" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B">২২টি ক্লাস  •  ৩০টি লেকচার শিট  •  ৮টি কুইজ</text>
      <text x="380" y="37" font-family="system-ui, sans-serif" font-size="14" fill="#94A3B8" text-anchor="end">▼</text>
    </g>

    <!-- Chapter 3 -->
    <g transform="translate(0, 156)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="404" height="66" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="26" cy="33" r="16" fill="#FFF7ED" />
      <text x="26" y="39" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#FF5400" text-anchor="middle">০৩</text>
      <text x="52" y="27" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলী</text>
      <text x="52" y="45" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B">২৬টি ক্লাস  •  ৪০টি লেকচার শিট  •  ১২টি কুইজ</text>
      <text x="380" y="37" font-family="system-ui, sans-serif" font-size="14" fill="#94A3B8" text-anchor="end">▼</text>
    </g>

    <!-- Chapter 4 -->
    <g transform="translate(0, 234)" filter="url(#soft-shadow)">
      <rect x="0" y="0" width="404" height="66" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="26" cy="33" r="16" fill="#FEF3C7" />
      <text x="26" y="39" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#D97706" text-anchor="middle">০৪</text>
      <text x="52" y="27" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#0F172A">ইংরেজি ভাষা ও ব্যাকরণ</text>
      <text x="52" y="45" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B">২৪টি ক্লাস  •  ৩৫টি লেকচার শিট  •  ১০টি কুইজ</text>
      <text x="380" y="37" font-family="system-ui, sans-serif" font-size="14" fill="#94A3B8" text-anchor="end">▼</text>
    </g>
  </g>

  <!-- Sticky Bottom Purchase Bar -->
  <rect x="8" y="864" width="444" height="80" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
  <g transform="translate(28, 880)">
    <!-- Price Info -->
    <text x="0" y="18" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0F172A">৳ ১,৪৯৯</text>
    <text x="0" y="36" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#94A3B8"><tspan text-decoration="line-through">৳ ২,৯৯৯</tspan>  •  ৫০% বিশেষ ছাড়!</text>

    <!-- Enroll Button -->
    <g transform="translate(210, 0)" filter="url(#orange-glow)">
      <rect x="0" y="0" width="194" height="46" rx="23" fill="url(#primary-orange)" />
      <text x="97" y="28" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF" text-anchor="middle">কোর্সে ভর্তি হোন →</text>
    </g>
  </g>
`;

// ----------------------------------------------------
// 5. CURRENT AFFAIRS & JOB CIRCULARS SCREEN
// ----------------------------------------------------
const circularContent = `
  <!-- Top Circulars Header -->
  <rect x="8" y="8" width="444" height="120" fill="url(#navy-card)" />
  <g transform="translate(28, 56)">
    <!-- Brand -->
    <text x="0" y="16" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="900" font-size="17" fill="#FFFFFF">চাকরির খবর ও সার্কুলার</text>
    <text x="0" y="32" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#FF7A1A">দৈনিক কারেন্ট অ্যাফেয়ার্স ও নিয়োগ বিজ্ঞপ্তি</text>

    <g transform="translate(340, 2)">
      <rect x="0" y="0" width="64" height="28" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="32" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#10B981" text-anchor="middle">নতুন ৪টি</text>
    </g>

    <!-- Search Input Inside Header -->
    <g transform="translate(0, 44)">
      <rect x="0" y="0" width="404" height="34" rx="17" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="14" y="22" font-size="13">🔍</text>
      <text x="36" y="22" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="12" fill="#94A3B8">চাকরি বা সার্কুলার সার্চ করুন...</text>
    </g>
  </g>

  <!-- Filter Pills -->
  <g transform="translate(28, 146)">
    <!-- Tab 1: All (Active) -->
    <rect x="0" y="0" width="60" height="28" rx="14" fill="#FF5400" />
    <text x="30" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" text-anchor="middle">সকল</text>

    <!-- Tab 2: Govt -->
    <rect x="68" y="0" width="85" height="28" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    <text x="110" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#475569" text-anchor="middle">🏛️ সরকারি</text>

    <!-- Tab 3: Bank -->
    <rect x="161" y="0" width="75" height="28" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    <text x="198" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#475569" text-anchor="middle">🏦 ব্যাংক</text>

    <!-- Tab 4: GK Capsule -->
    <rect x="244" y="0" width="125" height="28" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    <text x="306" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#475569" text-anchor="middle">⚡ কারেন্ট অ্যাফেয়ার্স</text>
  </g>

  <!-- Circular Card 1 (Govt Special) -->
  <g transform="translate(28, 192)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="135" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    
    <!-- Top badge -->
    <rect x="14" y="14" width="80" height="22" rx="11" fill="#EEF2FF" />
    <text x="54" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#4F46E5" text-anchor="middle">🏛️ সরকারি চাকরি</text>

    <text x="390" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="11" fill="#EF4444" text-anchor="end">⏱️ শেষ তারিখ: ১৫ নভেম্বর</text>

    <text x="14" y="58" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">৪৪তম বিসিএস নন-ক্যাডার বিভিন্ন পদে নিয়োগ</text>
    
    <g transform="translate(14, 70)">
      <text x="0" y="14" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11.5" fill="#64748B">পদসংখ্যা: ৩,১৪২ জন  •  বেতন স্কেল: ২২,০০০ - ৫৩,০৬০/-</text>
    </g>

    <!-- Bottom Actions -->
    <g transform="translate(14, 96)">
      <rect x="0" y="0" width="130" height="26" rx="13" fill="#FFF7ED" stroke="#FFEDD5" stroke-width="1" />
      <text x="65" y="17" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#FF5400" text-anchor="middle">সার্কুলার বিস্তারিত ➔</text>

      <text x="376" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" text-anchor="end">📄 নোটিশ ডাউনলোড</text>
    </g>
  </g>

  <!-- Circular Card 2 (Bank Special) -->
  <g transform="translate(28, 344)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="135" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    
    <rect x="14" y="14" width="85" height="22" rx="11" fill="#ECFDF5" />
    <text x="56" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#059669" text-anchor="middle">🏦 ব্যাংকার্স সিলেকশন</text>

    <text x="390" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="11" fill="#EF4444" text-anchor="end">⏱️ শেষ তারিখ: ২৮ অক্টোবর</text>

    <text x="14" y="58" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">সোনালী ব্যাংক পিএলসি - সিনিয়র অফিসার</text>
    
    <g transform="translate(14, 70)">
      <text x="0" y="14" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11.5" fill="#64748B">পদসংখ্যা: ৮৫০ জন  •  শিক্ষাগত যোগ্যতা: যেকোনো বিষয়ে মাস্টার্স</text>
    </g>

    <!-- Bottom Actions -->
    <g transform="translate(14, 96)">
      <rect x="0" y="0" width="130" height="26" rx="13" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1" />
      <text x="65" y="17" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#059669" text-anchor="middle">সার্কুলার বিস্তারিত ➔</text>

      <text x="376" y="18" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="11" fill="#64748B" text-anchor="end">📄 নোটিশ ডাউনলোড</text>
    </g>
  </g>

  <!-- Daily Current Affairs Digest Box -->
  <g transform="translate(28, 498)">
    <text x="0" y="0" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="15" fill="#0F172A">আজকের সেরা কারেন্ট অ্যাফেয়ার্স ক্যাপসুল</text>
    <text x="404" y="0" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="12" fill="#FF5400" text-anchor="end">পিডিএফ শিট 📥</text>
  </g>

  <g transform="translate(28, 512)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="150" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />

    <!-- Bullet 1 -->
    <g transform="translate(16, 16)">
      <circle cx="6" cy="6" r="4" fill="#FF5400" />
      <text x="18" y="10" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12.5" fill="#0F172A">বাংলাদেশ অর্থনৈতিক সমীক্ষা ২০২৬-এর গুরুত্বপূর্ণ তথ্য</text>
      <text x="18" y="24" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10.5" fill="#64748B">মাথাপিছু আয়, জিডিপি প্রবৃদ্ধি ও রেমিট্যান্স প্রবাহ সংক্রান্ত বিশ্লেষণ</text>
    </g>
    <line x1="16" y1="52" x2="388" y2="52" stroke="#F1F5F9" stroke-width="1" />

    <!-- Bullet 2 -->
    <g transform="translate(16, 62)">
      <circle cx="6" cy="6" r="4" fill="#3B82F6" />
      <text x="18" y="10" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12.5" fill="#0F172A">জাতিসংঘ ও আন্তর্জাতিক সামিট সম্মেলন আপডেট</text>
      <text x="18" y="24" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10.5" fill="#64748B">কপ২৯ জলবায়ু সম্মেলন ও বৈশ্বিক পরিবেশ চুক্তি ২০২৬</text>
    </g>
    <line x1="16" y1="98" x2="388" y2="98" stroke="#F1F5F9" stroke-width="1" />

    <!-- Bullet 3 -->
    <g transform="translate(16, 108)">
      <circle cx="6" cy="6" r="4" fill="#10B981" />
      <text x="18" y="10" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="12.5" fill="#0F172A">সাহিত্য ও ক্রীড়া অঙ্গনের সাম্প্রতিক পুরস্কার ও রেকর্ড</text>
      <text x="18" y="24" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="10.5" fill="#64748B">বাংলা একাডেমি ও আন্তর্জাতিক পুরস্কারপ্রাপ্ত ব্যক্তিত্ববর্গ</text>
    </g>
  </g>

  <!-- Circular Card 3 (Primary Teacher) -->
  <g transform="translate(28, 680)" filter="url(#soft-shadow)">
    <rect x="0" y="0" width="404" height="96" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    <rect x="14" y="14" width="95" height="22" rx="11" fill="#FEF3C7" />
    <text x="61" y="29" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#B45309" text-anchor="middle">📚 প্রাথমিক শিক্ষা অধিদপ্তর</text>

    <text x="14" y="58" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="14.5" fill="#0F172A">সহকারী শিক্ষক নিয়োগ ৩য় ধাপের চূড়ান্ত ফলাফল ও ভাইভা</text>
    <text x="14" y="78" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="700" font-size="11.5" fill="#FF5400">বিস্তারিত নোটিশ দেখতে ক্লিক করুন ➔</text>
  </g>

  <!-- Bottom Navigation Bar -->
  <rect x="8" y="870" width="444" height="74" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
  <g transform="translate(8, 875)">
    <!-- Tab 1: Home -->
    <g transform="translate(42, 10)">
      <text x="16" y="22" font-size="18" text-anchor="middle">🏠</text>
      <text x="16" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B" text-anchor="middle">হোম</text>
    </g>

    <!-- Tab 2: Exams -->
    <g transform="translate(146, 10)">
      <text x="16" y="22" font-size="18" text-anchor="middle">📝</text>
      <text x="16" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B" text-anchor="middle">পরীক্ষা</text>
    </g>

    <!-- Tab 3: Courses -->
    <g transform="translate(250, 10)">
      <text x="16" y="22" font-size="18" text-anchor="middle">🎓</text>
      <text x="16" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="600" font-size="11" fill="#64748B" text-anchor="middle">কোর্স</text>
    </g>

    <!-- Tab 4: Circulars (Active) -->
    <g transform="translate(354, 10)">
      <circle cx="16" cy="16" r="16" fill="#FFF7ED" />
      <text x="16" y="22" font-size="18" text-anchor="middle">📢</text>
      <text x="16" y="44" font-family="'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif" font-weight="800" font-size="11" fill="#FF5400" text-anchor="middle">সার্কুলার</text>
    </g>
  </g>
`;

const screens = [
  {
    id: 1,
    name: 'mobile-screen-1-home',
    title: 'Job Master - Home Dashboard',
    content: homeContent
  },
  {
    id: 2,
    name: 'mobile-screen-2-exam',
    title: 'Job Master - Live Model Test & Quiz',
    content: examContent
  },
  {
    id: 3,
    name: 'mobile-screen-3-result',
    title: 'Job Master - Exam Result & Ranking',
    content: resultContent
  },
  {
    id: 4,
    name: 'mobile-screen-4-course',
    title: 'Job Master - BCS Preparation Course',
    content: courseContent
  },
  {
    id: 5,
    name: 'mobile-screen-5-circular',
    title: 'Job Master - Job Circulars & Current Affairs',
    content: circularContent
  }
];

async function generateAllScreenshots() {
  console.log('Generating 5 professional mobile mockup screenshots...');
  for (const s of screens) {
    const svgCode = wrapInMobileFrame(s.title, s.content);
    const svgPath = path.join(outputDir, `${s.name}.svg`);
    const pngPath = path.join(outputDir, `${s.name}.png`);

    // Write SVG file
    fs.writeFileSync(svgPath, svgCode, 'utf8');
    console.log(`[OK] Saved SVG: ${svgPath}`);

    // Render to high-res PNG (scale to 920x1920 or 460x960 crisp)
    await sharp(Buffer.from(svgCode))
      .resize(920, 1920) // 2x Retina resolution for ultra crispness
      .png({ quality: 95 })
      .toFile(pngPath);
    console.log(`[OK] Rendered 2x PNG: ${pngPath}`);
  }
  console.log('All 5 screenshots created successfully!');
}

generateAllScreenshots().catch(err => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});
