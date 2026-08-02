import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_COURSES, CourseItem } from "@/src/lib/courses_and_subjects";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PROJECT_DATA_FILE = path.join(process.cwd(), "src", "data", "courses_data.json");
const TMP_CACHE_FILE = path.join("/tmp", "jobmaster_courses_cache.json");
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_courses_v2";

let memoryCoursesCache: CourseItem[] | null = null;

function loadFromDiskFile(filePath: string): CourseItem[] | null {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Note reading disk file ${filePath}:`, e);
  }
  return null;
}

function saveToDiskFile(filePath: string, courses: CourseItem[]) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(courses, null, 2), "utf-8");
  } catch (e) {
    // Expected on Vercel read-only filesystem
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
    // 1. Primary DB: Supabase (Vercel + Supabase production architecture)
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
            iconColor: String(item.iconColor || item.icon_color || "text-orange-600"),
            serial: Number(item.serial) || 1,
            subSubjects: typeof item.subSubjects === "string" ? JSON.parse(item.subSubjects) : (item.sub_subjects ? (typeof item.sub_subjects === "string" ? JSON.parse(item.sub_subjects) : item.sub_subjects) : (item.subSubjects || [])),
            active: item.active !== false
          }));
          mapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));

          memoryCoursesCache = mapped;
          saveToKvStore(mapped);
          saveToDiskFile(TMP_CACHE_FILE, mapped);
          return NextResponse.json({ courses: mapped, source: "supabase" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase courses query note:", sbErr);
    }

    // 2. Persistent Backup: Cloud KV Store
    const kvCached = await loadFromKvStore();
    if (kvCached && kvCached.length > 0) {
      memoryCoursesCache = kvCached;
      saveToDiskFile(TMP_CACHE_FILE, kvCached);
      return NextResponse.json({ courses: kvCached, source: "kv" });
    }

    // 3. Memory Cache (Warm Lambda)
    if (memoryCoursesCache && memoryCoursesCache.length > 0) {
      return NextResponse.json({ courses: memoryCoursesCache, source: "memory" });
    }

    // 4. Temporary /tmp Cache
    const tmpCached = loadFromDiskFile(TMP_CACHE_FILE);
    if (tmpCached && tmpCached.length > 0) {
      memoryCoursesCache = tmpCached;
      return NextResponse.json({ courses: tmpCached, source: "tmp_file" });
    }

    // 5. Default Fallback
    const projectCached = loadFromDiskFile(PROJECT_DATA_FILE);
    const finalFallback = (projectCached && projectCached.length > 0) ? projectCached : DEFAULT_COURSES;
    return NextResponse.json({ courses: finalFallback, source: "default" });
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

    // Update Memory & Cloud KV Store immediately (single source of truth)
    memoryCoursesCache = sorted;
    saveToKvStore(sorted);
    saveToDiskFile(TMP_CACHE_FILE, sorted);
    saveToDiskFile(PROJECT_DATA_FILE, sorted);

    // Persist to Supabase DB (Vercel + Supabase primary persistence)
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
            const formattedIds = `(${currentIds.map(id => id).join(",")})`;
            await supabase.from("app_courses").delete().not("id", "in", formattedIds);
          }
        } catch (delErr) {}

        await supabase.from("app_courses").upsert(payload, { onConflict: "id" });
        await supabase.from("app_config").upsert({
          key: "app_courses",
          value: sorted,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
      }
    } catch (sbErr) {
      console.warn("Supabase upsert courses note:", sbErr);
    }

    return NextResponse.json({ success: true, courses: sorted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save courses" }, { status: 500 });
  }
}
