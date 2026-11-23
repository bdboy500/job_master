import { getSupabase } from "./supabase";

export interface SubCategory2Item {
  id: string;
  name: string;
  sub?: string;
  serial?: number;
}

export interface SubCategoryItem {
  id: string;
  name: string;
  sub: string;
  serial?: number;
  subCategories2?: SubCategory2Item[];
}

export interface CourseItem {
  id: string;
  name: string; // e.g. "BCS", "Office Assistant / অফিস সহায়ক"
  title: string;
  desc: string;
  category: string; // e.g. "BCS", "Bank", "Teachers", "Government Job", "Other"
  icon: string; // e.g. "BookOpen", "Calculator", "Globe", "GraduationCap", "FileText", "Briefcase", "Shield", "Award"
  bg: string; // e.g. "bg-[#FFF1E6]"
  iconColor: string; // e.g. "text-orange-600"
  serial: number; // Order 1, 2, 3...
  subSubjects?: SubCategoryItem[];
  active?: boolean;
}

export interface PrepSubjectItem {
  id: string;
  name: string; // Subject Name (Bangla / English)
  bnName?: string; // Optional for backward compatibility
  icon: string;
  bg: string;
  text: string;
  sub: string;
  serial: number; // Order 1, 2, 3...
  subSubjects: SubCategoryItem[];
  active?: boolean;
  showQuickTools?: boolean;
}

export const DEFAULT_COURSES: CourseItem[] = [
  { 
    id: "bcs", 
    name: "BCS", 
    title: "BCS Preparation Masterclass", 
    desc: "পূর্ণাঙ্গ বিসিএস সিলেবাসের ওপর ভিত্তি করে অধ্যায়ভিত্তিক লাইভ এমসিকিউ ও বিশ্লেষণমূলক লেকচার শীট।", 
    category: "BCS", 
    icon: "BookOpen", 
    bg: "bg-[#FFF1E6]", 
    iconColor: "text-orange-600",
    serial: 1,
    subSubjects: []
  },
  { 
    id: "bank", 
    name: "Bank", 
    title: "Bank Job Officer Premium", 
    desc: "সরকারি ও বেসরকারি ব্যাংক সিনিয়র অফিসার নিয়োগ পরীক্ষার উপযোগী প্রিপারেশন গাইড এবং শর্টকাট ম্যাথ।", 
    category: "Bank", 
    icon: "Calculator", 
    bg: "bg-[#E6F0FA]", 
    iconColor: "text-blue-600",
    serial: 2,
    subSubjects: []
  },
  { 
    id: "primary", 
    name: "Primary", 
    title: "Primary School Teacher Prep", 
    desc: "প্রাথমিক সহকারী শিক্ষক নিয়োগের বিগত বছরের প্রশ্ন এবং বোর্ড বই ভিত্তিক বিশেষ স্পিড কুইজ মডিউল।", 
    category: "Teachers", 
    icon: "Globe", 
    bg: "bg-[#EBF7EE]", 
    iconColor: "text-green-600",
    serial: 3,
    subSubjects: []
  },
  { 
    id: "ntrca", 
    name: "NTRCA", 
    title: "NTRCA School & College Registration", 
    desc: "১৭তম ও ১৮তম শিক্ষক নিবন্ধন পরীক্ষার সর্বশেষ সিলেবাস ভিত্তিক সাধারণ জ্ঞান এবং সাবজেক্ট প্রস্তুতি।", 
    category: "Teachers", 
    icon: "GraduationCap", 
    bg: "bg-[#F3E8FF]", 
    iconColor: "text-purple-600",
    serial: 4,
    subSubjects: []
  },
  { 
    id: "psc", 
    name: "PSC", 
    title: "PSC Non-Cadre Mock Series", 
    desc: "বাংলাদেশ সরকারী কর্ম কমিশন (PSC) আয়োজিত বিভিন্ন গ্রেডের ও নন-ক্যাডার পদের জন্য সুপার মক টেস্ট।", 
    category: "Other", 
    icon: "FileText", 
    bg: "bg-[#FCE7F3]", 
    iconColor: "text-rose-600",
    serial: 5,
    subSubjects: []
  },
  { 
    id: "office_assistant", 
    name: "Office Assistant / অফিস সহায়ক", 
    title: "অফিস সহায়ক ও কম্পিউটার অপারেটর স্পেশাল কোর্স", 
    desc: "বিভিন্ন মন্ত্রণালয় ও অধিদপ্তরের অফিস সহায়ক, কম্পিউটার অপারেটর ও ডাটা এন্ট্রি পদের সম্পূর্ণ প্রস্তুতি।", 
    category: "Government Job", 
    icon: "Briefcase", 
    bg: "bg-[#E0F2FE]", 
    iconColor: "text-sky-600",
    serial: 6,
    subSubjects: []
  },
  { 
    id: "social_service", 
    name: "Social Welfare / সমাজ সেবা", 
    title: "সমাজসেবা অধিদপ্তর শিক্ষক ও ফিল্ড অফিসার কোর্স", 
    desc: "সমাজসেবা অধিদপ্তরের সমাজকর্মী, ফিল্ড অফিসার ও ইউনিয়ন সমাজকর্মী পরীক্ষার বিশেষ সমাধান।", 
    category: "Government Job", 
    icon: "Users", 
    bg: "bg-[#FEF3C7]", 
    iconColor: "text-amber-600",
    serial: 7,
    subSubjects: []
  }
];

export const DEFAULT_PREP_SUBJECTS: PrepSubjectItem[] = [
  {
    id: "prep-bangla",
    name: "Bangla",
    bnName: "বাংলা",
    icon: "BookOpen",
    bg: "bg-[#FFF1E6]",
    text: "text-orange-600",
    sub: "সাহিত্য ও ব্যাকরণ",
    serial: 1,
    subSubjects: []
  },
  {
    id: "prep-english",
    name: "English",
    bnName: "ইংরেজি",
    icon: "Globe",
    bg: "bg-[#F3E8FF]",
    text: "text-purple-600",
    sub: "Literature & Grammar",
    serial: 2,
    subSubjects: []
  },
  {
    id: "prep-math",
    name: "Mathematics",
    bnName: "গণিত",
    icon: "Calculator",
    bg: "bg-[#E6F0FA]",
    text: "text-blue-600",
    sub: "পাটিগণিত ও বীজগণিত",
    serial: 3,
    subSubjects: []
  },
  {
    id: "prep-science",
    name: "Science",
    bnName: "বিজ্ঞান",
    icon: "Sparkles",
    bg: "bg-[#EBF7EE]",
    text: "text-green-600",
    sub: "পদার্থ, রসায়ন ও জীব",
    serial: 4,
    subSubjects: []
  },
  {
    id: "prep-gk",
    name: "General Knowledge",
    bnName: "সাধারণ জ্ঞান",
    icon: "Award",
    bg: "bg-[#FCE7F3]",
    text: "text-rose-600",
    sub: "বাংলাদেশ ও আন্তর্জাতিক",
    serial: 5,
    subSubjects: []
  },
  {
    id: "prep-geography",
    name: "Geography",
    bnName: "ভূগোল",
    icon: "Globe",
    bg: "bg-[#E0F2FE]",
    text: "text-sky-600",
    sub: "পরিবেশ ও দুর্যোগ",
    serial: 6,
    subSubjects: []
  },
  {
    id: "prep-gen-science",
    name: "General Science",
    bnName: "সাধারণ বিজ্ঞান",
    icon: "Sparkles",
    bg: "bg-[#FEF3C7]",
    text: "text-amber-600",
    sub: "দৈনন্দিন বিজ্ঞান",
    serial: 7,
    subSubjects: []
  },
  {
    id: "prep-tech",
    name: "Technology",
    bnName: "কম্পিউটার ও তথ্যপ্রযুক্তি",
    icon: "Zap",
    bg: "bg-[#E0E7FF]",
    text: "text-indigo-600",
    sub: "কম্পিউটার ও আইসিটি",
    serial: 8,
    subSubjects: []
  },
  {
    id: "prep-mental",
    name: "Mental Ability",
    bnName: "মানসিক দক্ষতা",
    icon: "HelpCircle",
    bg: "bg-[#FEE2E2]",
    text: "text-red-600",
    sub: "গাণিতিক ও মানসিক যুক্তি",
    serial: 9,
    subSubjects: []
  },
  {
    id: "prep-governance",
    name: "Good Governance",
    bnName: "নৈতিকতা ও সুশাসন",
    icon: "ShieldCheck",
    bg: "bg-[#DCFCE7]",
    text: "text-emerald-600",
    sub: "মূল্যবোধ, সুশাসন ও নীতি",
    serial: 10,
    subSubjects: []
  },
  {
    id: "prep-physics",
    name: "Physics",
    bnName: "পদার্থবিজ্ঞান",
    icon: "Atom",
    bg: "bg-[#EFF6FF]",
    text: "text-blue-600",
    sub: "বলবিদ্যা, আলো, তাপ ও আধুনিক পদার্থবিজ্ঞান",
    serial: 11,
    subSubjects: []
  },
  {
    id: "prep-chemistry",
    name: "Chemistry",
    bnName: "রসায়ন",
    icon: "FlaskConical",
    bg: "bg-[#FDF2F8]",
    text: "text-pink-600",
    sub: "জৈব, অজৈব ও পরিবেশ রসায়ন",
    serial: 12,
    subSubjects: []
  },
  {
    id: "prep-biology",
    name: "Biology",
    bnName: "জীববিজ্ঞান",
    icon: "Sparkles",
    bg: "bg-[#ECFDF5]",
    text: "text-emerald-600",
    sub: "উদ্ভিদ ও প্রাণিবিজ্ঞান, মানবদেহ",
    serial: 13,
    subSubjects: []
  }
];

const COURSES_KEY = "jobmaster_custom_courses_v2";
const PREP_KEY = "jobmaster_custom_prep_subjects_v2";
const PRO_SECTION_KEY = "jobmaster_custom_pro_section_v2";

const CLOUD_COURSES_KV = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_courses_v2";
const CLOUD_PREP_KV = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_prep_subjects_v2";
const CLOUD_PRO_SECTION_KV = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_pro_section_v2";

export interface ProSectionItem {
  id: string;
  name: string;
  sub?: string;
  icon: string;
  bg: string;
  text: string;
  serial: number;
  active?: boolean;
  subSubjects?: SubCategoryItem[];
}

export const DEFAULT_PRO_SECTION: ProSectionItem[] = [
  {
    id: "pro-job-solution",
    name: "জব সল্যুশন",
    sub: "বিগত বছরের প্রশ্ন ও বিস্তারিত সমাধান",
    icon: "Briefcase",
    bg: "bg-[#FFF1E6]",
    text: "text-orange-600",
    serial: 1,
    active: true
  },
  {
    id: "pro-live-class",
    name: "লাইভ ক্লাস",
    sub: "অভিজ্ঞ শিক্ষকদের লাইভ ক্লাস",
    icon: "Video",
    bg: "bg-[#F3E8FF]",
    text: "text-purple-600",
    serial: 2,
    active: true
  },
  {
    id: "pro-question-bank",
    name: "প্রশ্ন ব্যাংক",
    sub: "",
    icon: "Database",
    bg: "bg-[#E6F0FA]",
    text: "text-blue-600",
    serial: 3,
    active: true
  },
  {
    id: "pro-video-class",
    name: "ভিডিও ক্লাস",
    sub: "সকল বিষয়ভিত্তিক রেকর্ডেড ক্লাস",
    icon: "PlayCircle",
    bg: "bg-[#EBF7EE]",
    text: "text-green-600",
    serial: 4,
    active: true
  }
];

const HARDCODED_SUB_NAMES = [
  "full syllabus", "model test series", "model test", "bcs preliminary", "preliminary", "bcs",
  "1st paper", "2nd paper", "arithmetic", "algebra", "geometry",
  "physics", "chemistry", "biology", "bangladesh affairs", "international affairs",
  "environment & geography", "disaster management", "daily science", "general medical",
  "computer basics", "ict & technology", "mathematical logic", "mental skills",
  "ethics & values", "good governance", "সকল বিষয়ভিত্তিক", "নিয়মিত মডেল টেস্ট",
  "মডেল টেস্ট", "ফুল সিলেবাস", "সিলেবাস", "প্রিলিমিনারি", "স্পেশাল"
];

export function sanitizeSubSubjects<T extends { subSubjects?: SubCategoryItem[] }>(items: T[]): T[] {
  return items.map(item => {
    if (item.subSubjects && Array.isArray(item.subSubjects)) {
      const cleanSub = item.subSubjects.filter((s: any) => s && s.name && String(s.name).trim() !== "");
      return { ...item, subSubjects: cleanSub };
    }
    return item;
  });
}

export function sanitizeCourseSubSubjects(courses: CourseItem[]): CourseItem[] {
  return sanitizeSubSubjects(courses);
}

// Local cache retrievers for immediate 0ms rendering
export function getCachedCourses(): CourseItem[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(COURSES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeSubSubjects(parsed);
          localStorage.setItem(COURSES_KEY, JSON.stringify(sanitized));
          return sanitized.sort((a, b) => (a.serial || 99) - (b.serial || 99));
        }
      } catch (e) {}
    }
  }
  return DEFAULT_COURSES;
}

export function getCachedPrepSubjects(): PrepSubjectItem[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(PREP_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeSubSubjects(parsed);
          localStorage.setItem(PREP_KEY, JSON.stringify(sanitized));
          return sanitized.sort((a, b) => (a.serial || 99) - (b.serial || 99));
        }
      } catch (e) {}
    }
  }
  return DEFAULT_PREP_SUBJECTS;
}

let coursesInFlightPromise: Promise<CourseItem[]> | null = null;
let prepSubjectsInFlightPromise: Promise<PrepSubjectItem[]> | null = null;
let proSectionInFlightPromise: Promise<ProSectionItem[]> | null = null;

let coursesMemoryCache: CourseItem[] | null = null;
let prepMemoryCache: PrepSubjectItem[] | null = null;
let proMemoryCache: ProSectionItem[] | null = null;

let hasRealCoursesLoaded = false;
let hasRealPrepLoaded = false;
let hasRealProLoaded = false;

export function isCoursesLoadedFromServer(): boolean {
  return hasRealCoursesLoaded;
}
export function isPrepSubjectsLoadedFromServer(): boolean {
  return hasRealPrepLoaded;
}
export function isProSectionLoadedFromServer(): boolean {
  return hasRealProLoaded;
}

export function invalidateCoursesCache() {
  coursesMemoryCache = null;
  coursesInFlightPromise = null;
  hasRealCoursesLoaded = false;
}

export function invalidatePrepSubjectsCache() {
  prepMemoryCache = null;
  prepSubjectsInFlightPromise = null;
  hasRealPrepLoaded = false;
}

export function invalidateProSectionCache() {
  proMemoryCache = null;
  proSectionInFlightPromise = null;
  hasRealProLoaded = false;
}

async function fetchCoursesDirectSupabaseFallback(): Promise<CourseItem[] | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: configData } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "app_courses")
      .maybeSingle();

    if (configData?.value && Array.isArray(configData.value) && configData.value.length > 0) {
      return configData.value.map((item: any) => ({
        id: String(item.id),
        name: String(item.name || ""),
        title: String(item.title || ""),
        desc: String(item.desc || ""),
        category: String(item.category || "Other"),
        icon: String(item.icon || "BookOpen"),
        bg: String(item.bg || "bg-[#FFF1E6]"),
        iconColor: String(item.iconColor || item.icon_color || "text-orange-600"),
        serial: Number(item.serial) || 1,
        subSubjects: Array.isArray(item.subSubjects) ? item.subSubjects : (Array.isArray(item.sub_subjects) ? item.sub_subjects : []),
        active: item.active !== false
      }));
    }

    const { data, error } = await supabase
      .from("app_courses")
      .select("id, name, title, desc, category, icon, bg, iconColor, icon_color, serial, subSubjects, sub_subjects, active")
      .order("serial", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: String(item.id),
        name: String(item.name || ""),
        title: String(item.title || ""),
        desc: String(item.desc || ""),
        category: String(item.category || "Other"),
        icon: String(item.icon || "BookOpen"),
        bg: String(item.bg || "bg-[#FFF1E6]"),
        iconColor: String(item.iconColor || item.icon_color || "text-orange-600"),
        serial: Number(item.serial) || 1,
        subSubjects: typeof item.subSubjects === "string" ? JSON.parse(item.subSubjects) : (item.sub_subjects ? (typeof item.sub_subjects === "string" ? JSON.parse(item.sub_subjects) : item.sub_subjects) : (item.subSubjects || [])),
        active: item.active !== false
      }));
    }
  } catch (e) {}
  return null;
}

// Global fetcher & sync methods for Courses
export async function fetchCoursesFromDb(forceRefresh = false): Promise<CourseItem[]> {
  if (!forceRefresh && hasRealCoursesLoaded && coursesMemoryCache && coursesMemoryCache.length > 0) {
    return coursesMemoryCache;
  }

  if (!forceRefresh && coursesInFlightPromise) return coursesInFlightPromise;

  const commitRealCourses = (list: CourseItem[]): CourseItem[] => {
    const cleanCourses = sanitizeCourseSubSubjects(list);
    cleanCourses.sort((a, b) => (a.serial || 99) - (b.serial || 99));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(COURSES_KEY, JSON.stringify(cleanCourses));
      } catch (e) {}
    }
    coursesMemoryCache = cleanCourses;
    hasRealCoursesLoaded = true;
    return cleanCourses;
  };

  coursesInFlightPromise = (async () => {
    try {
      // 1. Try Server API Route (/api/courses) with 10s slow-mobile tolerance
      try {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;
        const res = await fetch("/api/courses", {
          cache: "no-store",
          ...(controller ? { signal: controller.signal } : {})
        });
        if (timer) clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const courses: CourseItem[] = data.courses || [];
          const source = data.source;

          // Fail-safe: If server returned default fallback, check direct Supabase first; then local custom edits
          if (source === "default") {
            const directSb = await fetchCoursesDirectSupabaseFallback();
            if (directSb && directSb.length > 0) {
              return commitRealCourses(directSb);
            }
            if (typeof window !== "undefined") {
              const localCached = getCachedCourses();
              if (localCached && localCached.length > 0 && JSON.stringify(localCached) !== JSON.stringify(DEFAULT_COURSES)) {
                fetch("/api/courses", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(localCached)
                }).catch(() => {});
                coursesMemoryCache = localCached;
                hasRealCoursesLoaded = true;
                return localCached;
              }
            }
            return courses.length > 0 ? courses : getCachedCourses();
          }

          if (Array.isArray(courses) && courses.length > 0) {
            return commitRealCourses(courses);
          }
        }
      } catch (e) {
        console.warn("API courses fetch note:", e);
      }

      // 2. Direct Supabase fallback if /api/courses failed or timed out
      const directSb = await fetchCoursesDirectSupabaseFallback();
      if (directSb && directSb.length > 0) {
        return commitRealCourses(directSb);
      }

      // 3. Fallback to Local Storage / Default WITHOUT locking default into coursesMemoryCache
      const fallback = getCachedCourses();
      if (typeof window !== "undefined" && localStorage.getItem(COURSES_KEY)) {
        coursesMemoryCache = fallback;
      }
      return fallback;
    } finally {
      coursesInFlightPromise = null;
    }
  })();

  return coursesInFlightPromise;
}

export async function saveCoursesToDb(courses: CourseItem[]): Promise<CourseItem[]> {
  invalidateCoursesCache();
  const sorted = [...courses].sort((a, b) => (a.serial || 99) - (b.serial || 99));

  if (typeof window !== "undefined") {
    localStorage.setItem(COURSES_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent("jobmaster_courses_updated", { detail: sorted }));
  }

  // 1. Send to Server API Route (/api/courses)
  try {
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sorted)
    });
  } catch (e) {
    console.warn("API courses save note:", e);
  }

  // 2. Direct sync to Cloud KV store
  try {
    await fetch(CLOUD_COURSES_KV, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sorted)
    });
  } catch (e) {}

  // 3. Try Supabase directly as well
  try {
    const supabase = getSupabase();
    if (supabase) {
      const payload = sorted.map(c => ({
        id: c.id,
        name: c.name,
        title: c.title || c.name,
        desc: c.desc || "",
        category: c.category || "Other",
        icon: c.icon || "BookOpen",
        bg: c.bg || "bg-[#FFF1E6]",
        iconColor: c.iconColor || "text-orange-600",
        icon_color: c.iconColor || "text-orange-600",
        serial: Number(c.serial) || 1,
        subSubjects: c.subSubjects || [],
        sub_subjects: c.subSubjects || [],
        active: c.active !== false
      }));

      try {
        const currentIds = sorted.map(c => c.id);
        if (currentIds.length > 0) {
          const formattedIds = currentIds.map(id => id).join(",");
          await supabase.from("app_courses").delete().not("id", "in", `(${formattedIds})`);
        }
      } catch (delErr) {}

      await supabase.from("app_courses").upsert(payload, { onConflict: "id" });
      await supabase.from("app_config").upsert({
        key: "app_courses",
        value: sorted,
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });
    }
  } catch (e) {}

  return sorted;
}

async function fetchPrepDirectSupabaseFallback(): Promise<PrepSubjectItem[] | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: configData } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "prep_subjects")
      .maybeSingle();

    const mapRow = (item: any): PrepSubjectItem => ({
      id: String(item.id),
      name: String(item.name || ""),
      bnName: String(item.bnName || item.bn_name || item.name || ""),
      icon: String(item.icon || "BookOpen"),
      bg: String(item.bg || "bg-[#FFF1E6]"),
      text: String(item.text || "text-orange-600"),
      sub: String(item.sub || ""),
      serial: Number(item.serial) || 1,
      subSubjects: Array.isArray(item.subSubjects) ? item.subSubjects : (Array.isArray(item.sub_subjects) ? item.sub_subjects : []),
      active: item.active !== false,
      showQuickTools: item.showQuickTools !== undefined ? item.showQuickTools !== false : item.show_quick_tools !== undefined ? item.show_quick_tools !== false : true,
    });

    if (configData?.value && Array.isArray(configData.value) && configData.value.length > 0) {
      return configData.value.map(mapRow);
    }

    const { data, error } = await supabase
      .from("app_prep_subjects")
      .select("*")
      .order("serial", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map(mapRow);
    }
  } catch (e) {}
  return null;
}

// Global fetcher & sync methods for Prep Subjects
export async function fetchPrepSubjectsFromDb(forceRefresh = false): Promise<PrepSubjectItem[]> {
  if (!forceRefresh && hasRealPrepLoaded && prepMemoryCache && prepMemoryCache.length > 0) {
    return prepMemoryCache;
  }

  if (!forceRefresh && prepSubjectsInFlightPromise) return prepSubjectsInFlightPromise;

  const commitRealPrep = (list: PrepSubjectItem[]): PrepSubjectItem[] => {
    const cleanPrep = sanitizeSubSubjects(list);
    cleanPrep.sort((a, b) => (a.serial || 99) - (b.serial || 99));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PREP_KEY, JSON.stringify(cleanPrep));
      } catch (e) {}
    }
    prepMemoryCache = cleanPrep;
    hasRealPrepLoaded = true;
    return cleanPrep;
  };

  prepSubjectsInFlightPromise = (async () => {
    try {
      // 1. Try Server API Route (/api/prep-subjects) with 10s slow-mobile tolerance
      try {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;
        const res = await fetch("/api/prep-subjects", {
          cache: "no-store",
          ...(controller ? { signal: controller.signal } : {})
        });
        if (timer) clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const prepSubjects: PrepSubjectItem[] = data.prepSubjects || [];
          const source = data.source;

          if (source === "default") {
            const directSb = await fetchPrepDirectSupabaseFallback();
            if (directSb && directSb.length > 0) {
              return commitRealPrep(directSb);
            }
            if (typeof window !== "undefined") {
              const localCached = getCachedPrepSubjects();
              if (localCached && localCached.length > 0 && JSON.stringify(localCached) !== JSON.stringify(DEFAULT_PREP_SUBJECTS)) {
                fetch("/api/prep-subjects", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(localCached)
                }).catch(() => {});
                prepMemoryCache = localCached;
                hasRealPrepLoaded = true;
                return localCached;
              }
            }
            return prepSubjects.length > 0 ? prepSubjects : getCachedPrepSubjects();
          }

          if (Array.isArray(prepSubjects) && prepSubjects.length > 0) {
            return commitRealPrep(prepSubjects);
          }
        }
      } catch (e) {
        console.warn("API prep-subjects fetch note:", e);
      }

      const directSb = await fetchPrepDirectSupabaseFallback();
      if (directSb && directSb.length > 0) {
        return commitRealPrep(directSb);
      }

      const fallback = getCachedPrepSubjects();
      if (typeof window !== "undefined" && localStorage.getItem(PREP_KEY)) {
        prepMemoryCache = fallback;
      }
      return fallback;
    } finally {
      prepSubjectsInFlightPromise = null;
    }
  })();

  return prepSubjectsInFlightPromise;
}

export async function savePrepSubjectsToDb(prepSubjects: PrepSubjectItem[]): Promise<PrepSubjectItem[]> {
  invalidatePrepSubjectsCache();
  const sorted = [...prepSubjects].sort((a, b) => (a.serial || 99) - (b.serial || 99));

  if (typeof window !== "undefined") {
    localStorage.setItem(PREP_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent("jobmaster_prep_subjects_updated", { detail: sorted }));
  }

  // 1. Send to Server API Route (/api/prep-subjects)
  try {
    await fetch("/api/prep-subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sorted)
    });
  } catch (e) {
    console.warn("API prep-subjects save note:", e);
  }

  // 2. Direct sync to Cloud KV store
  try {
    await fetch(CLOUD_PREP_KV, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sorted)
    });
  } catch (e) {}

  // 3. Try Supabase directly as well (app_config first + schema-safe table fallback)
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("app_config").upsert({
        key: "prep_subjects",
        value: sorted,
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

      try {
        const currentIds = sorted.map(s => s.id).filter(Boolean);
        if (currentIds.length > 0) {
          const quotedIds = currentIds.map(id => `"${String(id).replace(/"/g, '\\"')}"`).join(",");
          await supabase.from("app_prep_subjects").delete().not("id", "in", `(${quotedIds})`);
        }
      } catch (delErr) {}

      const fullPayload = sorted.map(s => ({
        id: s.id,
        name: s.name,
        bnName: s.bnName || s.name,
        bn_name: s.bnName || s.name,
        icon: s.icon || "BookOpen",
        bg: s.bg || "bg-[#FFF1E6]",
        text: s.text || "text-orange-600",
        sub: s.sub || "",
        serial: Number(s.serial) || 1,
        subSubjects: s.subSubjects || [],
        sub_subjects: s.subSubjects || [],
        active: s.active !== false
      }));

      const { error: errFull } = await supabase.from("app_prep_subjects").upsert(fullPayload, { onConflict: "id" });
      if (errFull) {
        const snakePayload = sorted.map(s => ({
          id: s.id,
          name: s.name,
          bn_name: s.bnName || s.name,
          icon: s.icon || "BookOpen",
          bg: s.bg || "bg-[#FFF1E6]",
          text: s.text || "text-orange-600",
          sub: s.sub || "",
          serial: Number(s.serial) || 1,
          sub_subjects: s.subSubjects || [],
          active: s.active !== false
        }));
        const { error: errSnake } = await supabase.from("app_prep_subjects").upsert(snakePayload, { onConflict: "id" });
        if (errSnake) {
          const camelPayload = sorted.map(s => ({
            id: s.id,
            name: s.name,
            bnName: s.bnName || s.name,
            icon: s.icon || "BookOpen",
            bg: s.bg || "bg-[#FFF1E6]",
            text: s.text || "text-orange-600",
            sub: s.sub || "",
            serial: Number(s.serial) || 1,
            subSubjects: s.subSubjects || [],
            active: s.active !== false
          }));
          await supabase.from("app_prep_subjects").upsert(camelPayload, { onConflict: "id" });
        }
      }
    }
  } catch (e) {}

  return sorted;
}

export function getCachedProSection(): ProSectionItem[] {
  if (typeof window === "undefined") return DEFAULT_PRO_SECTION;
  try {
    const raw = localStorage.getItem(PRO_SECTION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return DEFAULT_PRO_SECTION;
}

async function fetchProDirectSupabaseFallback(): Promise<ProSectionItem[] | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: configData } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "pro_section")
      .maybeSingle();

    const mapPro = (item: any): ProSectionItem => ({
      id: String(item.id),
      name: String(item.name || ""),
      sub: String(item.sub || ""),
      icon: String(item.icon || "Briefcase"),
      bg: String(item.bg || "bg-[#FFF1E6]"),
      text: String(item.text || "text-orange-600"),
      serial: Number(item.serial) || 1,
      active: item.active !== false,
      subSubjects: Array.isArray(item.subSubjects) ? item.subSubjects : (Array.isArray(item.sub_subjects) ? item.sub_subjects : [])
    });

    if (configData?.value && Array.isArray(configData.value) && configData.value.length > 0) {
      return configData.value.map(mapPro);
    }

    const { data, error } = await supabase
      .from("app_pro_section")
      .select("id, name, sub, icon, bg, text, serial, active, subSubjects, sub_subjects")
      .order("serial", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map(mapPro);
    }
  } catch (e) {}
  return null;
}

export async function fetchProSectionFromDb(forceRefresh = false): Promise<ProSectionItem[]> {
  if (!forceRefresh && hasRealProLoaded && proMemoryCache && proMemoryCache.length > 0) {
    return proMemoryCache;
  }

  if (!forceRefresh && proSectionInFlightPromise) return proSectionInFlightPromise;

  const commitRealPro = (items: ProSectionItem[]): ProSectionItem[] => {
    items.sort((a, b) => (a.serial || 99) - (b.serial || 99));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PRO_SECTION_KEY, JSON.stringify(items));
      } catch (e) {}
    }
    proMemoryCache = items;
    hasRealProLoaded = true;
    return items;
  };

  proSectionInFlightPromise = (async () => {
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;
      const res = await fetch("/api/pro-section", {
        cache: "no-store",
        ...(controller ? { signal: controller.signal } : {})
      });
      if (timer) clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const items: ProSectionItem[] = data.proSection || [];
        const source = data.source;
        if (source === "default") {
          const directSb = await fetchProDirectSupabaseFallback();
          if (directSb && directSb.length > 0) {
            return commitRealPro(directSb);
          }
          return items.length > 0 ? items : getCachedProSection();
        }
        if (Array.isArray(items) && items.length > 0) {
          return commitRealPro(items);
        }
      }
    } catch (e) {} finally {
      proSectionInFlightPromise = null;
    }

    const directSb = await fetchProDirectSupabaseFallback();
    if (directSb && directSb.length > 0) {
      return commitRealPro(directSb);
    }

    const fallback = getCachedProSection();
    if (typeof window !== "undefined" && localStorage.getItem(PRO_SECTION_KEY)) {
      proMemoryCache = fallback;
    }
    return fallback;
  })();

  return proSectionInFlightPromise;
}

export async function saveProSectionToDb(items: ProSectionItem[]): Promise<ProSectionItem[]> {
  invalidateProSectionCache();
  const sorted = [...items].sort((a, b) => (a.serial || 99) - (b.serial || 99));

  if (typeof window !== "undefined") {
    localStorage.setItem(PRO_SECTION_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent("jobmaster_pro_section_updated", { detail: sorted }));
  }

  try {
    await fetch("/api/pro-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sorted)
    });
  } catch (e) {}

  try {
    await fetch(CLOUD_PRO_SECTION_KV, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sorted)
    });
  } catch (e) {}

  try {
    const supabase = getSupabase();
    if (supabase) {
      // 1. app_config holds complete JSON including subSubjects intact
      await supabase.from("app_config").upsert({
        key: "pro_section",
        value: sorted,
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

      // 2. app_pro_section table
      try {
        const payload = sorted.map(item => ({
          id: item.id,
          name: item.name,
          sub: item.sub || "",
          icon: item.icon || "Briefcase",
          bg: item.bg || "bg-[#FFF1E6]",
          text: item.text || "text-orange-600",
          serial: Number(item.serial) || 1,
          active: item.active !== false,
          sub_subjects: item.subSubjects || [],
          subSubjects: item.subSubjects || []
        }));

        try {
          const currentIds = sorted.map(i => i.id);
          if (currentIds.length > 0) {
            const formattedIds = currentIds.map(id => id).join(",");
            await supabase.from("app_pro_section").delete().not("id", "in", `(${formattedIds})`);
          }
        } catch (delErr) {}

        await supabase.from("app_pro_section").upsert(payload, { onConflict: "id" });
      } catch (eTable) {
        const fallback = sorted.map(item => ({
          id: item.id,
          name: item.name,
          sub: item.sub || "",
          icon: item.icon || "Briefcase",
          bg: item.bg || "bg-[#FFF1E6]",
          text: item.text || "text-orange-600",
          serial: Number(item.serial) || 1,
          active: item.active !== false
        }));
        await supabase.from("app_pro_section").upsert(fallback, { onConflict: "id" });
      }
    }
  } catch (e) {}

  return sorted;
}

// Subscription helper for real-time updates across users
export function subscribeToCoursesAndPrep(
  onCourses: (courses: CourseItem[]) => void,
  onPrep: (prep: PrepSubjectItem[]) => void,
  onPro?: (pro: ProSectionItem[]) => void
) {
  if (typeof window === "undefined") return () => {};

  const handleCourses = (e: any) => {
    if (e.detail) onCourses(e.detail);
    else fetchCoursesFromDb().then(onCourses);
  };

  const handlePrep = (e: any) => {
    if (e.detail) onPrep(e.detail);
    else fetchPrepSubjectsFromDb().then(onPrep);
  };

  const handlePro = (e: any) => {
    if (onPro) {
      if (e.detail) onPro(e.detail);
      else fetchProSectionFromDb().then(onPro);
    }
  };

  window.addEventListener("jobmaster_courses_updated", handleCourses);
  window.addEventListener("jobmaster_prep_subjects_updated", handlePrep);
  window.addEventListener("jobmaster_pro_section_updated", handlePro);
  window.addEventListener("storage", handleCourses);
  window.addEventListener("storage", handlePrep);
  window.addEventListener("storage", handlePro);

  // Re-fetch when tab becomes visible, focused, or back online — force refresh if server data hasn't loaded yet
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      fetchCoursesFromDb(!hasRealCoursesLoaded).then(onCourses).catch(() => {});
      fetchPrepSubjectsFromDb(!hasRealPrepLoaded).then(onPrep).catch(() => {});
      if (onPro) fetchProSectionFromDb(!hasRealProLoaded).then(onPro).catch(() => {});
    }
  };
  const handleRecoverOnline = () => {
    if (!hasRealCoursesLoaded) fetchCoursesFromDb(true).then(onCourses).catch(() => {});
    if (!hasRealPrepLoaded) fetchPrepSubjectsFromDb(true).then(onPrep).catch(() => {});
    if (onPro && !hasRealProLoaded) fetchProSectionFromDb(true).then(onPro).catch(() => {});
  };
  window.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("online", handleRecoverOnline);
  window.addEventListener("focus", handleRecoverOnline);

  let supabaseChannel: any = null;
  let supabaseRef: any = null;

  try {
    const supabase = getSupabase();
    if (supabase) {
      supabaseRef = supabase;
      supabaseChannel = supabase
        .channel("courses_prep_realtime_sync")
        .on("postgres_changes", { event: "*", schema: "public", table: "app_courses" }, () => {
          invalidateCoursesCache();
          fetchCoursesFromDb(true).then(onCourses);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "app_prep_subjects" }, () => {
          invalidatePrepSubjectsCache();
          fetchPrepSubjectsFromDb(true).then(onPrep);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "app_pro_section" }, () => {
          invalidateProSectionCache();
          if (onPro) fetchProSectionFromDb(true).then(onPro);
        })
        .subscribe();
    }
  } catch (err) {
    console.warn("Courses/Prep realtime sub error:", err);
  }

  return () => {
    window.removeEventListener("jobmaster_courses_updated", handleCourses);
    window.removeEventListener("jobmaster_prep_subjects_updated", handlePrep);
    window.removeEventListener("jobmaster_pro_section_updated", handlePro);
    window.removeEventListener("storage", handleCourses);
    window.removeEventListener("storage", handlePrep);
    window.removeEventListener("storage", handlePro);
    window.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("online", handleRecoverOnline);
    window.removeEventListener("focus", handleRecoverOnline);
    if (supabaseRef && supabaseChannel) {
      try {
        supabaseRef.removeChannel(supabaseChannel);
      } catch (err) {
        console.warn("Error removing courses_prep realtime channel:", err);
      }
    }
  };
}
