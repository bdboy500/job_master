import { getSupabase } from "./supabase";

export interface PackageItem {
  id: string;
  title: string;
  desc: string;
  price: string;
  oldPrice?: string | null;
  badge?: string | null; // e.g. "POPULAR", "BEST VALUE", "NEW", "BASIC" or null
  category: "all" | "course"; // "all": Full App Access, "course": Course Based
  bg?: string;
  border?: string;
  order?: number;
  active?: boolean;
  createdAt?: string;
}

export const DEFAULT_PACKAGES: PackageItem[] = [
  {
    id: "pkg-1m",
    title: "১ মাসের ফুল অ্যাপ এক্সেস",
    desc: "৩০ দিনের জন্য বিসিএস, ব্যাংক, প্রাইমারি, শিক্ষক নিবন্ধন (NTRCA) সহ অ্যাপ এর সকল ফিচারের ফুল এক্সেস",
    price: "৳১৪৯",
    oldPrice: null,
    badge: null,
    category: "all",
    bg: "bg-white",
    border: "border-slate-200/80",
    order: 1,
    active: true
  },
  {
    id: "pkg-3m",
    title: "৩ মাসের ফুল অ্যাপ এক্সেস",
    desc: "৯০ দিনের জন্য বিসিএস, ব্যাংক, প্রাইমারি, শিক্ষক নিবন্ধন (NTRCA) সহ অ্যাপ এর সকল ফিচারের ফুল এক্সেস",
    price: "৳২৯৯",
    oldPrice: null,
    badge: null,
    category: "all",
    bg: "bg-white",
    border: "border-slate-200/80",
    order: 2,
    active: true
  },
  {
    id: "pkg-6m",
    title: "৬ মাসের ফুল অ্যাপ এক্সেস 🌟",
    desc: "১৮০ দিনের জন্য বিসিএস, ব্যাংক, প্রাইমারি, শিক্ষক নিবন্ধন (NTRCA) সহ অ্যাপ এর সকল ফিচারের ফুল এক্সেস",
    price: "৳৪৯৯",
    oldPrice: null,
    badge: "POPULAR",
    category: "all",
    bg: "bg-gradient-to-b from-white to-amber-50/20",
    border: "border-amber-200/80",
    order: 3,
    active: true
  },
  {
    id: "pkg-1y",
    title: "১ বছরের ফুল অ্যাপ এক্সেস 🌟",
    desc: "১ বছরের জন্য বিসিএস, ব্যাংক, প্রাইমারি, শিক্ষক নিবন্ধন (NTRCA) সহ অ্যাপ এর সকল ফিচারের ফুল এক্সেস",
    price: "৳৭৯৯",
    oldPrice: null,
    badge: "BEST VALUE",
    category: "all",
    bg: "bg-gradient-to-b from-white to-blue-50/20",
    border: "border-blue-200/80",
    order: 4,
    active: true
  },
  {
    id: "pkg-2y",
    title: "২ বছরের ফুল অ্যাপ এক্সেস",
    desc: "২ বছরের জন্য বিসিএস, ব্যাংক, প্রাইমারি, শিক্ষক নিবন্ধন (NTRCA) সহ অ্যাপ এর সকল ফিচারের ফুল এক্সেস",
    price: "৳৯৯৯",
    oldPrice: "৳১২৯৯",
    badge: "NEW",
    category: "all",
    bg: "bg-gradient-to-b from-white to-indigo-50/20",
    border: "border-indigo-200/80",
    order: 5,
    active: true
  },
  {
    id: "pkg-undergrad",
    title: "১ বছরের Undergrad - Student Package [শুধু Undergrad কোর্স এক্সেস]",
    desc: "১ বছরের জন্য শুধুমাত্র \"বিসিএস প্রস্তুতি - Undergrad [Student Package]\" কোর্স এর এক্সেস থাকবে",
    price: "৳৩৯৯",
    oldPrice: "৳৪৯৯",
    badge: null,
    category: "course",
    bg: "bg-white",
    border: "border-slate-200/80",
    order: 6,
    active: true
  }
];

const STORAGE_KEY = "jobmaster_packages_v2";
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_packages_v2";

export async function fetchPackagesFromDb(): Promise<PackageItem[]> {
  // 1. Try Cloud Store for worldwide live updates
  try {
    const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        return data as PackageItem[];
      }
    }
  } catch (err) {
    console.warn("Cloud packages fetch warning:", err);
  }

  // 2. Try Supabase
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("order", { ascending: true });

      if (!error && data && data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        return data as PackageItem[];
      }
    }
  } catch (err) {
    console.warn("Supabase packages fetch failed, using local storage fallback:", err);
  }

  // 3. Fallback to localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing stored packages:", e);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PACKAGES));
  }

  return DEFAULT_PACKAGES;
}

export async function savePackageToDb(pkg: PackageItem): Promise<PackageItem[]> {
  const packages = await fetchPackagesFromDb();
  const existingIndex = packages.findIndex(p => p.id === pkg.id);
  
  let updatedPackages: PackageItem[];
  if (existingIndex >= 0) {
    updatedPackages = [...packages];
    updatedPackages[existingIndex] = { ...pkg };
  } else {
    updatedPackages = [...packages, pkg];
  }

  // Sort by order or creation
  updatedPackages.sort((a, b) => (a.order || 99) - (b.order || 99));

  // Save to LocalStorage immediately
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPackages));
    window.dispatchEvent(new CustomEvent("jobmaster_packages_updated", { detail: updatedPackages }));
  }

  // Sync to Cloud Store so ALL users in the world get the update
  try {
    await fetch(CLOUD_KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPackages)
    });
  } catch (err) {
    console.warn("Cloud package sync failed:", err);
  }

  // Sync to Supabase
  try {
    const supabase = getSupabase();
    if (supabase) {
      const cleanPkgPayload = {
        id: pkg.id,
        title: pkg.title,
        desc: pkg.desc,
        price: pkg.price,
        oldPrice: pkg.oldPrice || null,
        badge: pkg.badge || null,
        category: pkg.category || "all",
        bg: pkg.bg || "bg-white",
        border: pkg.border || "border-slate-200/80",
        order: pkg.order || 1,
        active: pkg.active !== undefined ? pkg.active : true
      };
      await supabase.from("packages").upsert(cleanPkgPayload);
    }
  } catch (err) {
    console.warn("Supabase package save failed:", err);
  }

  return updatedPackages;
}

export async function deletePackageFromDb(id: string): Promise<PackageItem[]> {
  const packages = await fetchPackagesFromDb();
  const updatedPackages = packages.filter(p => p.id !== id);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPackages));
    window.dispatchEvent(new CustomEvent("jobmaster_packages_updated", { detail: updatedPackages }));
  }

  // Sync to Cloud Store
  try {
    await fetch(CLOUD_KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPackages)
    });
  } catch (err) {
    console.warn("Cloud package delete sync failed:", err);
  }

  // Sync to Supabase
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("packages").delete().eq("id", id);
    }
  } catch (err) {
    console.warn("Supabase package delete failed:", err);
  }

  return updatedPackages;
}

export function subscribeToPackages(callback: (pkgs: PackageItem[]) => void) {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    } else {
      fetchPackagesFromDb().then(callback);
    }
  };

  window.addEventListener("jobmaster_packages_updated", handleUpdate);
  window.addEventListener("storage", handleUpdate);

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      fetchPackagesFromDb().then(callback).catch(() => {});
    }
  };
  window.addEventListener("visibilitychange", handleVisibility);

  let supabaseChannel: any = null;
  try {
    const supabase = getSupabase();
    if (supabase) {
      supabaseChannel = supabase
        .channel("packages_realtime_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "packages" },
          () => {
            fetchPackagesFromDb().then(callback);
          }
        )
        .subscribe();
    }
  } catch (err) {
    console.warn("Packages realtime sub error:", err);
  }

  return () => {
    window.removeEventListener("jobmaster_packages_updated", handleUpdate);
    window.removeEventListener("storage", handleUpdate);
    window.removeEventListener("visibilitychange", handleVisibility);
    if (supabaseChannel) {
      supabaseChannel.unsubscribe();
    }
  };
}
