import { getSupabase } from "./supabase";

export interface JobCircularCategory {
  id: string;
  name: string;
  imageUrl: string;
  icon?: string;
  serial: number;
  active?: boolean;
}

export type CircularFileType = "pdf" | "image";

export interface JobCircularPost {
  id: string;
  categoryId: string;
  categoryIds?: string[];
  title: string;
  organization: string;
  vacancies?: string;
  deadline?: string;
  fileType?: CircularFileType;
  fileUrl?: string;
  applyUrl?: string;
  description?: string;
  views?: number;
  publishedAt: string;
  active?: boolean;
}

export interface CircularArtworkPreset {
  id: string;
  label: string;
  imageUrl: string;
  icon: string;
}

export const CIRCULAR_ARTWORK_PRESETS: CircularArtworkPreset[] = [
  { id: "govt", label: "সরকারি (Govt)", imageUrl: "/assets/circulars/govt.svg", icon: "Landmark" },
  { id: "private", label: "বেসরকারি (Private)", imageUrl: "/assets/circulars/private.svg", icon: "Building2" },
  { id: "bank", label: "ব্যাংক (Bank)", imageUrl: "/assets/circulars/bank.svg", icon: "Briefcase" },
  { id: "ngo", label: "এনজিও (NGO)", imageUrl: "/assets/circulars/ngo.svg", icon: "HeartHandshake" },
  { id: "ministry", label: "মন্ত্রণালয় (Ministry)", imageUrl: "/assets/circulars/ministry.svg", icon: "ShieldCheck" },
  { id: "defense", label: "ডিফেন্স (Defense)", imageUrl: "/assets/circulars/defense.svg", icon: "Shield" },
  { id: "education", label: "শিক্ষা প্রতিষ্ঠান (Education)", imageUrl: "/assets/circulars/education.svg", icon: "GraduationCap" },
  { id: "pharmacy", label: "ফার্মাসি (Pharmacy)", imageUrl: "/assets/circulars/pharmacy.svg", icon: "FlaskConical" },
];

export const DEFAULT_JOB_CIRCULAR_CATEGORIES: JobCircularCategory[] = [
  {
    id: "circ-govt",
    name: "সরকারি",
    imageUrl: "/assets/circulars/govt.svg",
    icon: "Landmark",
    serial: 1,
    active: true,
  },
  {
    id: "circ-private",
    name: "বেসরকারি",
    imageUrl: "/assets/circulars/private.svg",
    icon: "Building2",
    serial: 2,
    active: true,
  },
  {
    id: "circ-bank",
    name: "ব্যাংক",
    imageUrl: "/assets/circulars/bank.svg",
    icon: "Briefcase",
    serial: 3,
    active: true,
  },
  {
    id: "circ-ngo",
    name: "এনজিও",
    imageUrl: "/assets/circulars/ngo.svg",
    icon: "HeartHandshake",
    serial: 4,
    active: true,
  },
  {
    id: "circ-ministry",
    name: "মন্ত্রণালয়",
    imageUrl: "/assets/circulars/ministry.svg",
    icon: "ShieldCheck",
    serial: 5,
    active: true,
  },
  {
    id: "circ-defense",
    name: "ডিফেন্স",
    imageUrl: "/assets/circulars/defense.svg",
    icon: "Shield",
    serial: 6,
    active: true,
  },
  {
    id: "circ-education",
    name: "শিক্ষা প্রতিষ্ঠান",
    imageUrl: "/assets/circulars/education.svg",
    icon: "GraduationCap",
    serial: 7,
    active: true,
  },
  {
    id: "circ-pharmacy",
    name: "ফার্মাসি",
    imageUrl: "/assets/circulars/pharmacy.svg",
    icon: "FlaskConical",
    serial: 8,
    active: true,
  },
];

export const DEFAULT_JOB_CIRCULAR_POSTS: JobCircularPost[] = [];

export const JOB_CIRCULARS_SUPABASE_SQL = `-- 1. App Config Table (stores categories & quick bundle sync)
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read app_config" ON public.app_config;
DROP POLICY IF EXISTS "Public write app_config" ON public.app_config;
CREATE POLICY "Public read app_config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Public write app_config" ON public.app_config FOR ALL USING (true);

-- 2. Dedicated Job Circulars Table (with Google Drive PDF/Image URL & View Counter)
CREATE TABLE IF NOT EXISTS public.job_circulars (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT DEFAULT '',
  vacancies TEXT DEFAULT '',
  deadline TEXT DEFAULT '',
  file_type TEXT DEFAULT 'pdf',
  file_url TEXT DEFAULT '',
  apply_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_circulars_category ON public.job_circulars(category_id);
CREATE INDEX IF NOT EXISTS idx_job_circulars_published ON public.job_circulars(published_at DESC);

ALTER TABLE public.job_circulars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read job_circulars" ON public.job_circulars;
DROP POLICY IF EXISTS "Admin manage job_circulars" ON public.job_circulars;
CREATE POLICY "Public read job_circulars" ON public.job_circulars FOR SELECT USING (true);
CREATE POLICY "Admin manage job_circulars" ON public.job_circulars FOR ALL USING (true);

-- 3. Enable Realtime Sync (Safe idempotent execution)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'job_circulars'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_circulars;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'app_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
  END IF;
END $$;`;

const CATEGORIES_CACHE_KEY = "jobmaster_cached_job_circular_categories_v1";
const POSTS_CACHE_KEY = "jobmaster_cached_job_circular_posts_v2";
const BROADCAST_CHANNEL_NAME = "jobmaster_circulars_sync";

function upgradeLegacyCircularImageUrl(url: string): string {
  return url.replace(/^(\/assets\/circulars\/[a-z]+)\.jpg$/i, "$1.svg");
}

export function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const dMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch?.[1]) return dMatch[1];
  const openMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch?.[1] && (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com"))) {
    return openMatch[1];
  }
  const ucMatch = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (ucMatch?.[1]) return ucMatch[1];
  return null;
}

export function detectCircularFileType(url?: string | null, explicit?: string): CircularFileType {
  if (explicit === "image" || explicit === "png" || explicit === "jpg") return "image";
  if (explicit === "pdf") return "pdf";
  const lower = (url || "").toLowerCase();
  if (/\.(png|jpg|jpeg|webp|gif|bmp)(\?|$)/i.test(lower)) return "image";
  return "pdf";
}

export function getCircularPreviewUrl(url?: string | null, fileType?: CircularFileType): string {
  const cleanUrl = (url || "").trim();
  if (!cleanUrl) return "";
  const type = detectCircularFileType(cleanUrl, fileType);
  const driveId = extractGoogleDriveFileId(cleanUrl);

  if (driveId) {
    if (type === "image") {
      return `/api/job-circulars/download?url=${encodeURIComponent(cleanUrl)}&type=image&mode=preview`;
    }
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  return cleanUrl;
}

export function toBanglaDigits(input: string | number): string {
  const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(input ?? "").replace(/\d/g, (d) => bnNums[Number(d)] ?? d);
}

export const BANGLA_MONTH_NAMES = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const;

export function formatBanglaDateFromISO(isoDate?: string | null): string {
  const clean = (isoDate || "").trim();
  const match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return clean;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (monthIdx < 0 || monthIdx > 11 || day < 1 || day > 31) return clean;
  return `${toBanglaDigits(day)} ${BANGLA_MONTH_NAMES[monthIdx]} ${toBanglaDigits(year)}`;
}

export function formatCircularDeadlineDisplay(deadline?: string | null): string {
  const clean = (deadline || "").trim();
  if (!clean) return "নির্ধারিত নয়";
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    return formatBanglaDateFromISO(clean);
  }
  return clean;
}

export function parseBanglaDateToISO(dateStr?: string | null): string {
  const clean = (dateStr || "")
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  if (!clean) return "";

  const bnToEn: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };

  const enStr = clean
    .replace(/[০-৯]/g, (d) => bnToEn[d] ?? d)
    .replace(/,/g, " ")
    .trim();

  // YYYY-MM-DD (or YYYY/MM/DD or YYYY-MM-DDT...)
  const isoPrefixMatch = enStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|T|\s)/);
  if (isoPrefixMatch) {
    const y = Number(isoPrefixMatch[1]);
    const m = Number(isoPrefixMatch[2]);
    const d = Number(isoPrefixMatch[3]);
    if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = enStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]);
    const y = Number(dmyMatch[3]);
    if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // Month name lookup (Bangla spelling variants + English months)
  const monthAliases: Array<{ month: number; patterns: string[] }> = [
    { month: 1, patterns: ["জানুয়ারি", "জানুয়ারি", "জানুয়ারী", "জানু", "january", "jan"] },
    { month: 2, patterns: ["ফেব্রুয়ারি", "ফেব্রুয়ারি", "ফেব্রুয়ারী", "ফেব্রু", "february", "feb"] },
    { month: 3, patterns: ["মার্চ", "march", "mar"] },
    { month: 4, patterns: ["এপ্রিল", "april", "apr"] },
    { month: 5, patterns: ["মে", "may"] },
    { month: 6, patterns: ["জুন", "june", "jun"] },
    { month: 7, patterns: ["জুলাই", "july", "jul"] },
    { month: 8, patterns: ["আগস্ট", "আগষ্ট", "অগাস্ট", "অগষ্ট", "august", "aug"] },
    { month: 9, patterns: ["সেপ্টেম্বর", "সেপ্টেম্বার", "সেপ্টে", "september", "sept", "sep"] },
    { month: 10, patterns: ["অক্টোবর", "অক্টবর", "অক্টো", "october", "oct"] },
    { month: 11, patterns: ["নভেম্বর", "নবেম্বর", "নভেম্বার", "নবেম্বার", "নভে", "নবে", "november", "nov"] },
    { month: 12, patterns: ["ডিসেম্বর", "ডিসেম্বার", "ডিসে", "december", "dec"] },
  ];

  const lowerTokens = enStr
    .toLowerCase()
    .split(/[\s\-/.,।]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  let matchedMonth = 0;
  for (const entry of monthAliases) {
    if (
      entry.patterns.some(
        (pat) =>
          lowerTokens.includes(pat) ||
          (pat.length >= 4 && enStr.toLowerCase().includes(pat))
      )
    ) {
      matchedMonth = entry.month;
      break;
    }
  }

  if (matchedMonth >= 1 && matchedMonth <= 12) {
    const nums = enStr.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const fourDigitYear = nums.find((n) => n.length === 4 && Number(n) >= 1900 && Number(n) <= 2100);
      const dayCandidate = nums.find((n) => n !== fourDigitYear && Number(n) >= 1 && Number(n) <= 31);
      if (fourDigitYear && dayCandidate) {
        return `${fourDigitYear}-${String(matchedMonth).padStart(2, "0")}-${String(Number(dayCandidate)).padStart(2, "0")}`;
      }
    }
  }

  return "";
}

export function getBangladeshTodayISO(now: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
      return formatted;
    }
  } catch (e) {}
  const bstDate = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const year = bstDate.getUTCFullYear();
  const month = String(bstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(bstDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoDateToUtcDayMs(isoDate: string): number {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return NaN;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export type CircularDeadlineLifecycle = "active" | "expired_grace" | "expired_delete" | "none";

export interface CircularDeadlineStatusInfo {
  status: CircularDeadlineLifecycle;
  deadlineISO: string;
  todayISO: string;
  daysPast: number;
  isExpired: boolean;
  shouldAutoDelete: boolean;
  displayText: string;
}

export const CIRCULAR_EXPIRED_GRACE_DAYS = 7;
export const CIRCULAR_EXPIRED_LABEL = "আবেদনের সময় শেষ";

export function getCircularDeadlineStatus(
  deadline?: string | null,
  now: Date = new Date()
): CircularDeadlineStatusInfo {
  const todayISO = getBangladeshTodayISO(now);
  const deadlineISO = parseBanglaDateToISO(deadline);

  if (!deadlineISO) {
    return {
      status: "none",
      deadlineISO: "",
      todayISO,
      daysPast: 0,
      isExpired: false,
      shouldAutoDelete: false,
      displayText: formatCircularDeadlineDisplay(deadline),
    };
  }

  const todayMs = isoDateToUtcDayMs(todayISO);
  const deadlineMs = isoDateToUtcDayMs(deadlineISO);
  if (Number.isNaN(todayMs) || Number.isNaN(deadlineMs)) {
    return {
      status: "none",
      deadlineISO,
      todayISO,
      daysPast: 0,
      isExpired: false,
      shouldAutoDelete: false,
      displayText: formatCircularDeadlineDisplay(deadline),
    };
  }

  const daysPast = Math.floor((todayMs - deadlineMs) / 86400000);

  if (daysPast <= 0) {
    return {
      status: "active",
      deadlineISO,
      todayISO,
      daysPast,
      isExpired: false,
      shouldAutoDelete: false,
      displayText: formatCircularDeadlineDisplay(deadline),
    };
  }

  if (daysPast <= CIRCULAR_EXPIRED_GRACE_DAYS) {
    return {
      status: "expired_grace",
      deadlineISO,
      todayISO,
      daysPast,
      isExpired: true,
      shouldAutoDelete: false,
      displayText: CIRCULAR_EXPIRED_LABEL,
    };
  }

  return {
    status: "expired_delete",
    deadlineISO,
    todayISO,
    daysPast,
    isExpired: true,
    shouldAutoDelete: true,
    displayText: CIRCULAR_EXPIRED_LABEL,
  };
}

export function isCircularAutoExpired(post: Pick<JobCircularPost, "deadline">, now: Date = new Date()): boolean {
  return getCircularDeadlineStatus(post?.deadline, now).shouldAutoDelete;
}

export function pruneExpiredCircularPosts(
  posts: JobCircularPost[],
  now: Date = new Date()
): { keptPosts: JobCircularPost[]; expiredPosts: JobCircularPost[] } {
  const keptPosts: JobCircularPost[] = [];
  const expiredPosts: JobCircularPost[] = [];
  for (const post of posts) {
    if (isCircularAutoExpired(post, now)) {
      expiredPosts.push(post);
    } else {
      keptPosts.push(post);
    }
  }
  return { keptPosts, expiredPosts };
}

// Live-Exam-style time-by-time public view counter:
// প্রথম ঘণ্টায় ১০+, প্রতি ঘণ্টায় +১০ (২৪ ঘণ্টায় ২৪০+), এরপর প্রতি ১ দিনে +১০ + রিয়েল ক্লিক ভিউ
export function getCircularPublicViewDisplay(
  publishedAt?: string | null,
  realViews = 0,
  _tick?: number
): string {
  let startMs = 0;
  if (publishedAt) {
    const parsed = Date.parse(publishedAt);
    if (!Number.isNaN(parsed)) startMs = parsed;
  }
  if (!startMs) startMs = Date.now();

  const elapsedMs = Math.max(0, Date.now() - startMs);
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));

  let baseCount = 10;
  if (elapsedHours < 24) {
    baseCount = (elapsedHours + 1) * 10;
  } else {
    const additionalDays = Math.floor((elapsedHours - 24) / 24) + 1;
    baseCount = 240 + additionalDays * 10;
  }

  const total = baseCount + Math.max(0, Number(realViews) || 0);
  return `${toBanglaDigits(total)}+`;
}

export function getCircularDownloadUrl(
  url?: string | null,
  title?: string,
  fileType?: CircularFileType
): string {
  const cleanUrl = (url || "").trim();
  if (!cleanUrl) return "";
  const type = detectCircularFileType(cleanUrl, fileType);
  const safeName = (title || "jobmaster-circular").trim().slice(0, 80);
  return `/api/job-circulars/download?url=${encodeURIComponent(cleanUrl)}&name=${encodeURIComponent(safeName)}&type=${type}&mode=download`;
}

export function normalizeCircularCategories(raw: any): JobCircularCategory[] {
  if (!Array.isArray(raw)) return DEFAULT_JOB_CIRCULAR_CATEGORIES;
  const cleaned: JobCircularCategory[] = raw
    .filter((c) => c && typeof c === "object" && String(c.name || "").trim() !== "")
    .map((c, idx) => ({
      id: String(c.id || `circ_${idx + 1}`),
      name: String(c.name).trim(),
      imageUrl: upgradeLegacyCircularImageUrl(String(c.imageUrl || "")),
      icon: String(c.icon || "Briefcase"),
      serial: Number(c.serial) || idx + 1,
      active: c.active !== false,
    }));
  cleaned.sort((a, b) => (a.serial || 99) - (b.serial || 99));
  return cleaned;
}

export function getCircularPostCategoryIds(post: JobCircularPost): string[] {
  const fromArr = Array.isArray(post.categoryIds)
    ? post.categoryIds.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const fromSingle = post.categoryId
    ? String(post.categoryId)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return Array.from(new Set([...fromArr, ...fromSingle]));
}

export function postMatchesCircularCategory(post: JobCircularPost, categoryId: string): boolean {
  if (!categoryId || categoryId === "all") return true;
  return getCircularPostCategoryIds(post).includes(categoryId);
}

export function normalizeCircularPosts(raw: any): JobCircularPost[] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw
    .filter((p) => p && typeof p === "object" && String(p.title || "").trim() !== "")
    .map((p, idx) => {
      const fileUrl = String(p.fileUrl ?? p.file_url ?? "").trim();
      const applyUrl = String(p.applyUrl ?? p.apply_url ?? "").trim();
      const effectiveUrl = fileUrl || applyUrl;
      const arrIds: string[] = Array.isArray(p.categoryIds)
        ? p.categoryIds
        : Array.isArray(p.category_ids)
        ? p.category_ids
        : [];
      const rawIdStr = String(p.categoryId ?? p.category_id ?? "").trim();
      const splitIds = rawIdStr
        ? rawIdStr.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const categoryIds = Array.from(
        new Set([...arrIds.map((s) => String(s).trim()).filter(Boolean), ...splitIds])
      );
      return {
        id: String(p.id || `post_${Date.now()}_${idx}`),
        categoryId: categoryIds[0] || "",
        categoryIds,
        title: String(p.title || "").trim(),
        organization: String(p.organization || "").trim(),
        vacancies: p.vacancies ? String(p.vacancies).trim() : "",
        deadline: p.deadline ? String(p.deadline).trim() : "",
        fileType: detectCircularFileType(effectiveUrl, String(p.fileType ?? p.file_type ?? "")),
        fileUrl,
        applyUrl,
        description: p.description ? String(p.description).trim() : "",
        views: Math.max(0, Number(p.views ?? 0) || 0),
        publishedAt: String(p.publishedAt ?? p.published_at ?? new Date().toISOString()),
        active: p.active !== false,
      } satisfies JobCircularPost;
    });

  // Always sort latest published circular first (Requirement ক)
  normalized.sort((a, b) => {
    const timeB = Date.parse(b.publishedAt) || 0;
    const timeA = Date.parse(a.publishedAt) || 0;
    return timeB - timeA;
  });

  return normalized;
}

export function getCachedJobCircularCategories(): JobCircularCategory[] {
  if (typeof window === "undefined") return DEFAULT_JOB_CIRCULAR_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeCircularCategories(parsed);
      }
    }
  } catch (e) {}
  return DEFAULT_JOB_CIRCULAR_CATEGORIES;
}

export function getCachedJobCircularPosts(): JobCircularPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(POSTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return pruneExpiredCircularPosts(normalizeCircularPosts(parsed)).keptPosts;
      }
    }
  } catch (e) {}
  return [];
}

function writeLocalCircularsCache(categories?: JobCircularCategory[], posts?: JobCircularPost[]) {
  if (typeof window === "undefined") return;
  try {
    if (categories) {
      localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
    }
    if (posts) {
      localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(posts));
    }
    window.dispatchEvent(
      new CustomEvent("jobmaster_circulars_updated", {
        detail: { categories, posts },
      })
    );
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.postMessage({ type: "updated", categories, posts });
        bc.close();
      } catch (e) {}
    }
  } catch (e) {}
}

export async function fetchJobCircularCategoriesOnlyFromDb(): Promise<JobCircularCategory[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch("/api/job-circulars?categoriesOnly=1", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      const categories =
        Array.isArray(data?.categories) && data.categories.length > 0
          ? normalizeCircularCategories(data.categories)
          : DEFAULT_JOB_CIRCULAR_CATEGORIES;
      writeLocalCircularsCache(categories, undefined);
      return categories;
    }
  } catch (err) {
    console.warn("fetchJobCircularCategoriesOnlyFromDb note:", err);
  } finally {
    clearTimeout(timer);
  }
  return getCachedJobCircularCategories();
}

export async function fetchJobCircularsFromDb(): Promise<{
  categories: JobCircularCategory[];
  posts: JobCircularPost[];
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch("/api/job-circulars", {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      const categories =
        Array.isArray(data?.categories) && data.categories.length > 0
          ? normalizeCircularCategories(data.categories)
          : DEFAULT_JOB_CIRCULAR_CATEGORIES;
      const posts = Array.isArray(data?.posts)
        ? pruneExpiredCircularPosts(normalizeCircularPosts(data.posts)).keptPosts
        : [];
      writeLocalCircularsCache(categories, posts);
      return { categories, posts };
    }
  } catch (err) {
    console.warn("fetchJobCircularsFromDb note:", err);
  } finally {
    clearTimeout(timer);
  }
  return {
    categories: getCachedJobCircularCategories(),
    posts: getCachedJobCircularPosts(),
  };
}

export async function saveJobCircularCategoriesToDb(
  categories: JobCircularCategory[]
): Promise<{ success: boolean; categories: JobCircularCategory[] }> {
  const sorted = normalizeCircularCategories(categories);
  writeLocalCircularsCache(sorted, undefined);
  try {
    const res = await fetch("/api/job-circulars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: sorted }),
    });
    if (res.ok) {
      const data = await res.json();
      const finalCats = Array.isArray(data?.categories)
        ? normalizeCircularCategories(data.categories)
        : sorted;
      writeLocalCircularsCache(finalCats, undefined);
      return { success: true, categories: finalCats };
    }
  } catch (err) {
    console.warn("saveJobCircularCategoriesToDb error:", err);
  }
  return { success: false, categories: sorted };
}

export async function saveJobCircularPostsToDb(
  posts: JobCircularPost[]
): Promise<{ success: boolean; posts: JobCircularPost[] }> {
  const cleaned = normalizeCircularPosts(posts);
  writeLocalCircularsCache(undefined, cleaned);
  try {
    const res = await fetch("/api/job-circulars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: cleaned }),
    });
    if (res.ok) {
      const data = await res.json();
      const finalPosts = Array.isArray(data?.posts) ? normalizeCircularPosts(data.posts) : cleaned;
      writeLocalCircularsCache(undefined, finalPosts);
      return { success: true, posts: finalPosts };
    }
  } catch (err) {
    console.warn("saveJobCircularPostsToDb error:", err);
  }
  return { success: false, posts: cleaned };
}

export async function incrementJobCircularViewCount(postId: string): Promise<number | null> {
  if (!postId) return null;
  try {
    const cached = getCachedJobCircularPosts();
    const updatedLocal = cached.map((p) =>
      p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p
    );
    writeLocalCircularsCache(undefined, updatedLocal);

    const res = await fetch("/api/job-circulars/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.views === "number") {
        const syncedLocal = getCachedJobCircularPosts().map((p) =>
          p.id === postId ? { ...p, views: data.views } : p
        );
        writeLocalCircularsCache(undefined, syncedLocal);
        return data.views;
      }
    }
  } catch (e) {}
  return null;
}

export function subscribeToJobCirculars(
  onCategoriesUpdate?: (categories: JobCircularCategory[]) => void,
  onPostsUpdate?: (posts: JobCircularPost[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const includePosts = Boolean(onPostsUpdate);

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent)?.detail;
    if (detail?.categories && onCategoriesUpdate) {
      onCategoriesUpdate(normalizeCircularCategories(detail.categories));
    }
    if (detail?.posts && onPostsUpdate) {
      onPostsUpdate(pruneExpiredCircularPosts(normalizeCircularPosts(detail.posts)).keptPosts);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CATEGORIES_CACHE_KEY && e.newValue && onCategoriesUpdate) {
      try {
        onCategoriesUpdate(normalizeCircularCategories(JSON.parse(e.newValue)));
      } catch (err) {}
    }
    if (e.key === POSTS_CACHE_KEY && e.newValue && onPostsUpdate) {
      try {
        onPostsUpdate(pruneExpiredCircularPosts(normalizeCircularPosts(JSON.parse(e.newValue))).keptPosts);
      } catch (err) {}
    }
  };

  window.addEventListener("jobmaster_circulars_updated", handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (msg) => {
        if (msg?.data?.categories && onCategoriesUpdate) {
          onCategoriesUpdate(normalizeCircularCategories(msg.data.categories));
        }
        if (msg?.data?.posts && onPostsUpdate) {
          onPostsUpdate(pruneExpiredCircularPosts(normalizeCircularPosts(msg.data.posts)).keptPosts);
        }
      };
    } catch (e) {}
  }

  let sbChannel: any = null;
  try {
    const supabase = getSupabase();
    if (supabase) {
      const channelName = includePosts
        ? "app_config_job_circulars_posts_rt"
        : "app_config_job_circulars_cats_rt";

      let channelBuilder = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "app_config",
          },
          (payload: any) => {
            const key = payload?.new?.key;
            const val = payload?.new?.value;
            if (key === "job_circular_categories" && Array.isArray(val) && onCategoriesUpdate) {
              const norm = normalizeCircularCategories(val);
              writeLocalCircularsCache(norm, undefined);
              onCategoriesUpdate(norm);
            } else if (key === "job_circular_posts" && Array.isArray(val) && onPostsUpdate) {
              const normPosts = pruneExpiredCircularPosts(normalizeCircularPosts(val)).keptPosts;
              writeLocalCircularsCache(undefined, normPosts);
              onPostsUpdate(normPosts);
            }
          }
        );

      if (includePosts) {
        channelBuilder = channelBuilder.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "job_circulars",
          },
          () => {
            fetchJobCircularsFromDb().then(({ posts }) => {
              if (onPostsUpdate) onPostsUpdate(posts);
            });
          }
        );
      }

      sbChannel = channelBuilder.subscribe();
    }
  } catch (e) {}

  return () => {
    window.removeEventListener("jobmaster_circulars_updated", handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    if (bc) {
      try {
        bc.close();
      } catch (e) {}
    }
    if (sbChannel) {
      try {
        const supabase = getSupabase();
        if (supabase) supabase.removeChannel(sbChannel);
      } catch (e) {}
    }
  };
}
