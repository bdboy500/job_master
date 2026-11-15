import { getSupabase } from "./supabase";

export interface JobCircularCategory {
  id: string;
  name: string;
  imageUrl: string;
  icon?: string;
  serial: number;
  active?: boolean;
}

export interface JobCircularPost {
  id: string;
  categoryId: string;
  title: string;
  organization: string;
  vacancies?: string;
  deadline?: string;
  applyUrl?: string;
  description?: string;
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

const CATEGORIES_CACHE_KEY = "jobmaster_cached_job_circular_categories_v1";
const POSTS_CACHE_KEY = "jobmaster_cached_job_circular_posts_v1";
const BROADCAST_CHANNEL_NAME = "jobmaster_circulars_sync";

function upgradeLegacyCircularImageUrl(url: string): string {
  return url.replace(/^(\/assets\/circulars\/[a-z]+)\.jpg$/i, "$1.svg");
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

export function normalizeCircularPosts(raw: any): JobCircularPost[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && typeof p === "object" && String(p.title || "").trim() !== "")
    .map((p, idx) => ({
      id: String(p.id || `post_${Date.now()}_${idx}`),
      categoryId: String(p.categoryId || ""),
      title: String(p.title || "").trim(),
      organization: String(p.organization || "").trim(),
      vacancies: p.vacancies ? String(p.vacancies).trim() : "",
      deadline: p.deadline ? String(p.deadline).trim() : "",
      applyUrl: p.applyUrl ? String(p.applyUrl).trim() : "",
      description: p.description ? String(p.description).trim() : "",
      publishedAt: String(p.publishedAt || new Date().toISOString()),
      active: p.active !== false,
    }));
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
        return normalizeCircularPosts(parsed);
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
      const categories = Array.isArray(data?.categories) && data.categories.length > 0
        ? normalizeCircularCategories(data.categories)
        : DEFAULT_JOB_CIRCULAR_CATEGORIES;
      const posts = Array.isArray(data?.posts)
        ? normalizeCircularPosts(data.posts)
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
      const finalPosts = Array.isArray(data?.posts)
        ? normalizeCircularPosts(data.posts)
        : cleaned;
      writeLocalCircularsCache(undefined, finalPosts);
      return { success: true, posts: finalPosts };
    }
  } catch (err) {
    console.warn("saveJobCircularPostsToDb error:", err);
  }
  return { success: false, posts: cleaned };
}

export function subscribeToJobCirculars(
  onCategoriesUpdate: (categories: JobCircularCategory[]) => void,
  onPostsUpdate?: (posts: JobCircularPost[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent)?.detail;
    if (detail?.categories) onCategoriesUpdate(normalizeCircularCategories(detail.categories));
    if (detail?.posts && onPostsUpdate) onPostsUpdate(normalizeCircularPosts(detail.posts));
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CATEGORIES_CACHE_KEY && e.newValue) {
      try {
        onCategoriesUpdate(normalizeCircularCategories(JSON.parse(e.newValue)));
      } catch (err) {}
    }
    if (e.key === POSTS_CACHE_KEY && e.newValue && onPostsUpdate) {
      try {
        onPostsUpdate(normalizeCircularPosts(JSON.parse(e.newValue)));
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
        if (msg?.data?.categories) onCategoriesUpdate(normalizeCircularCategories(msg.data.categories));
        if (msg?.data?.posts && onPostsUpdate) onPostsUpdate(normalizeCircularPosts(msg.data.posts));
      };
    } catch (e) {}
  }

  let sbChannel: any = null;
  try {
    const supabase = getSupabase();
    if (supabase) {
      sbChannel = supabase
        .channel("app_config_job_circulars_rt")
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
            if (key === "job_circular_categories" && Array.isArray(val)) {
              const norm = normalizeCircularCategories(val);
              writeLocalCircularsCache(norm, undefined);
              onCategoriesUpdate(norm);
            } else if (key === "job_circular_posts" && Array.isArray(val)) {
              const normPosts = normalizeCircularPosts(val);
              writeLocalCircularsCache(undefined, normPosts);
              if (onPostsUpdate) onPostsUpdate(normPosts);
            }
          }
        )
        .subscribe();
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
