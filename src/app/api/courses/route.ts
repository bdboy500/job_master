import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_COURSES, CourseItem } from "@/src/lib/courses_and_subjects";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CACHE_FILE = path.join("/tmp", "jobmaster_courses_cache.json");
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_courses_v2";

let memoryCoursesCache: CourseItem[] | null = null;

function loadFromFileCache(): CourseItem[] | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error reading courses file cache:", e);
  }
  return null;
}

function saveToFileCache(courses: CourseItem[]) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(courses, null, 2), "utf-8");
  } catch (e) {
    console.warn("Error writing courses file cache:", e);
  }
}

async function loadFromKvStore(): Promise<CourseItem[] | null> {
  try {
    const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Error reading courses from KV store:", e);
  }
  return null;
}

async function saveToKvStore(courses: CourseItem[]) {
  try {
    await fetch(CLOUD_KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courses)
    });
  } catch (e) {
    console.warn("Error writing courses to KV store:", e);
  }
}

export async function GET() {
  try {
    // Layer 1: Memory Cache (instant within process)
    if (memoryCoursesCache && memoryCoursesCache.length > 0) {
      return NextResponse.json({ courses: memoryCoursesCache, source: "memory" });
    }

    // Layer 2: File Cache (/tmp directory)
    const fileCached = loadFromFileCache();
    if (fileCached && fileCached.length > 0) {
      memoryCoursesCache = fileCached;
      return NextResponse.json({ courses: fileCached, source: "file" });
    }

    // Layer 3: Cloud KV Store (global persistent backup)
    const kvCached = await loadFromKvStore();
    if (kvCached && kvCached.length > 0) {
      memoryCoursesCache = kvCached;
      saveToFileCache(kvCached);
      return NextResponse.json({ courses: kvCached, source: "kv" });
    }

    // Layer 4: Supabase Database Table
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("app_courses")
          .select("*")
          .order("serial", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: CourseItem[] = data.map((item: any) => ({
            id: String(item.id),
            name: String(item.name || ""),
            title: String(item.title || ""),
            desc: String(item.desc || ""),
            category: String(item.category || "Other"),
            icon: String(item.icon || "BookOpen"),
            bg: String(item.bg || "bg-[#FFF1E6]"),
            iconColor: String(item.iconColor || "text-orange-600"),
            serial: Number(item.serial) || 1,
            subSubjects: typeof item.subSubjects === "string" ? JSON.parse(item.subSubjects) : (item.subSubjects || []),
            active: item.active !== false
          }));
          mapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));

          memoryCoursesCache = mapped;
          saveToFileCache(mapped);
          saveToKvStore(mapped);
          return NextResponse.json({ courses: mapped, source: "supabase" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase courses query note:", sbErr);
    }

    // Layer 5: Fallback to default courses
    return NextResponse.json({ courses: DEFAULT_COURSES, source: "default" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const courses: CourseItem[] = Array.isArray(body) ? body : (Array.isArray(body?.courses) ? body.courses : []);

    if (!courses || courses.length === 0) {
      return NextResponse.json({ error: "Invalid courses data" }, { status: 400 });
    }

    const sorted = [...courses].sort((a, b) => (a.serial || 99) - (b.serial || 99));

    // Update Memory & File Cache & Cloud KV Store immediately (single source of truth)
    memoryCoursesCache = sorted;
    saveToFileCache(sorted);
    saveToKvStore(sorted);

    // Try persisting to Supabase if table exists
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

        // Remove deleted courses from Supabase
        const currentIds = sorted.map(c => c.id);
        if (currentIds.length > 0) {
          const formattedIds = currentIds.map(id => `'${id}'`).join(",");
          await supabase.from("app_courses").delete().not("id", "in", `(${formattedIds})`);
        }

        await supabase.from("app_courses").upsert(payload, { onConflict: "id" });
      }
    } catch (sbErr) {
      console.warn("Supabase upsert courses note:", sbErr);
    }

    return NextResponse.json({ success: true, courses: sorted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save courses" }, { status: 500 });
  }
}
