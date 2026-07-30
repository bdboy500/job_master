import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_COURSES, CourseItem } from "@/src/lib/courses_and_subjects";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CACHE_FILE = path.join("/tmp", "jobmaster_courses_cache.json");

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

export async function GET() {
  try {
    // 1. Try Memory Cache (updated instantly when POST is called)
    if (memoryCoursesCache && memoryCoursesCache.length > 0) {
      return NextResponse.json({ courses: memoryCoursesCache, source: "memory" });
    }

    // 2. Try File Cache
    const fileCached = loadFromFileCache();
    if (fileCached && fileCached.length > 0) {
      memoryCoursesCache = fileCached;
      return NextResponse.json({ courses: fileCached, source: "file" });
    }

    // 3. Try Supabase if memory & file cache are empty
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
          return NextResponse.json({ courses: mapped, source: "supabase" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase courses query note:", sbErr);
    }

    // 4. Fallback to default courses
    memoryCoursesCache = DEFAULT_COURSES;
    saveToFileCache(DEFAULT_COURSES);
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

    // Update in-memory & file cache immediately (single source of truth)
    memoryCoursesCache = sorted;
    saveToFileCache(sorted);

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
