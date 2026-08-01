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
  }
];

const COURSES_KEY = "jobmaster_custom_courses_v2";
const PREP_KEY = "jobmaster_custom_prep_subjects_v2";

const CLOUD_COURSES_KV = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_courses_v2";
const CLOUD_PREP_KV = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_prep_subjects_v2";

const HARDCODED_SUB_NAMES = [
  "full syllabus", "model test series", "bcs preliminary",
  "1st paper", "2nd paper", "arithmetic", "algebra", "geometry",
  "physics", "chemistry", "biology", "bangladesh affairs", "international affairs",
  "environment & geography", "disaster management", "daily science", "general medical",
  "computer basics", "ict & technology", "mathematical logic", "mental skills",
  "ethics & values", "good governance"
];

export function sanitizeSubSubjects<T extends CourseItem | PrepSubjectItem>(items: T[]): T[] {
  return items.map(item => {
    if (item.subSubjects && Array.isArray(item.subSubjects)) {
      const cleanSub = item.subSubjects.filter((s: any) => {
        if (!s || !s.name) return false;
        const lower = s.name.toLowerCase();
        return !HARDCODED_SUB_NAMES.some(h => lower.includes(h));
      });
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
          return sanitized.sort((a, b) => (a.serial || 99) - (b.serial || 99));
        }
      } catch (e) {}
    }
  }
  return DEFAULT_PREP_SUBJECTS;
}

// Global fetcher & sync methods for Courses
export async function fetchCoursesFromDb(): Promise<CourseItem[]> {
  // 1. Try Server API Route (/api/courses)
  try {
    const res = await fetch("/api/courses", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const courses: CourseItem[] = data.courses || [];
      const source = data.source;

      // Fail-safe: If server returned default fallback, but client has custom edited data in localStorage, preserve client's custom data and sync to server
      if (source === "default" && typeof window !== "undefined") {
        const localCached = getCachedCourses();
        if (localCached && localCached.length > 0 && JSON.stringify(localCached) !== JSON.stringify(DEFAULT_COURSES)) {
          // Re-sync local custom data to server
          fetch("/api/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localCached)
          }).catch(() => {});
          return localCached;
        }
      }

      if (Array.isArray(courses) && courses.length > 0) {
        const cleanCourses = sanitizeCourseSubSubjects(courses);
        cleanCourses.sort((a, b) => (a.serial || 99) - (b.serial || 99));
        if (typeof window !== "undefined") {
          localStorage.setItem(COURSES_KEY, JSON.stringify(cleanCourses));
        }
        return cleanCourses;
      }
    }
  } catch (e) {
    console.warn("API courses fetch note:", e);
  }

  // 2. Fallback to Local Storage / Default
  return getCachedCourses();
}

export async function saveCoursesToDb(courses: CourseItem[]): Promise<CourseItem[]> {
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
        title: c.title,
        desc: c.desc,
        category: c.category,
        icon: c.icon,
        bg: c.bg,
        iconColor: c.iconColor,
        serial: c.serial,
        subSubjects: JSON.stringify(c.subSubjects || []),
        active: c.active !== false
      }));

      const currentIds = sorted.map(c => c.id);
      if (currentIds.length > 0) {
        const formattedIds = currentIds.map(id => `'${id}'`).join(",");
        await supabase.from("app_courses").delete().not("id", "in", `(${formattedIds})`);
      }

      await supabase.from("app_courses").upsert(payload, { onConflict: "id" });
    }
  } catch (e) {}

  return sorted;
}

// Global fetcher & sync methods for Prep Subjects
export async function fetchPrepSubjectsFromDb(): Promise<PrepSubjectItem[]> {
  // 1. Try Server API Route (/api/prep-subjects)
  try {
    const res = await fetch("/api/prep-subjects", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const prepSubjects: PrepSubjectItem[] = data.prepSubjects || [];
      const source = data.source;

      // Fail-safe: If server returned default fallback, but client has custom edited data in localStorage, preserve client's custom data and sync to server
      if (source === "default" && typeof window !== "undefined") {
        const localCached = getCachedPrepSubjects();
        if (localCached && localCached.length > 0 && JSON.stringify(localCached) !== JSON.stringify(DEFAULT_PREP_SUBJECTS)) {
          // Re-sync local custom data to server
          fetch("/api/prep-subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localCached)
          }).catch(() => {});
          return localCached;
        }
      }

      if (Array.isArray(prepSubjects) && prepSubjects.length > 0) {
        const cleanPrep = sanitizeSubSubjects(prepSubjects);
        cleanPrep.sort((a, b) => (a.serial || 99) - (b.serial || 99));
        if (typeof window !== "undefined") {
          localStorage.setItem(PREP_KEY, JSON.stringify(cleanPrep));
        }
        return cleanPrep;
      }
    }
  } catch (e) {
    console.warn("API prep-subjects fetch note:", e);
  }

  // 2. Fallback to Local Storage / Default
  return getCachedPrepSubjects();
}

export async function savePrepSubjectsToDb(prepSubjects: PrepSubjectItem[]): Promise<PrepSubjectItem[]> {
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

  // 3. Try Supabase directly as well
  try {
    const supabase = getSupabase();
    if (supabase) {
      const payload = sorted.map(s => ({
        id: s.id,
        name: s.name,
        bnName: s.bnName,
        icon: s.icon,
        bg: s.bg,
        text: s.text,
        sub: s.sub,
        serial: s.serial,
        subSubjects: JSON.stringify(s.subSubjects || []),
        active: s.active !== false
      }));

      const currentIds = sorted.map(s => s.id);
      if (currentIds.length > 0) {
        const formattedIds = currentIds.map(id => `'${id}'`).join(",");
        await supabase.from("app_prep_subjects").delete().not("id", "in", `(${formattedIds})`);
      }

      await supabase.from("app_prep_subjects").upsert(payload, { onConflict: "id" });
    }
  } catch (e) {}

  return sorted;
}

// Subscription helper for real-time updates across users
export function subscribeToCoursesAndPrep(
  onCourses: (courses: CourseItem[]) => void,
  onPrep: (prep: PrepSubjectItem[]) => void
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

  window.addEventListener("jobmaster_courses_updated", handleCourses);
  window.addEventListener("jobmaster_prep_subjects_updated", handlePrep);
  window.addEventListener("storage", handleCourses);
  window.addEventListener("storage", handlePrep);

  // Re-fetch when tab becomes visible or focused
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      fetchCoursesFromDb().then(onCourses);
      fetchPrepSubjectsFromDb().then(onPrep);
    }
  };
  window.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.removeEventListener("jobmaster_courses_updated", handleCourses);
    window.removeEventListener("jobmaster_prep_subjects_updated", handlePrep);
    window.removeEventListener("storage", handleCourses);
    window.removeEventListener("storage", handlePrep);
    window.removeEventListener("visibilitychange", handleVisibility);
  };
}
