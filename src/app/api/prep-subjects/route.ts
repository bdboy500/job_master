import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_PREP_SUBJECTS, PrepSubjectItem } from "@/src/lib/courses_and_subjects";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CACHE_FILE = path.join("/tmp", "jobmaster_prep_subjects_cache.json");

let memoryPrepCache: PrepSubjectItem[] | null = null;

function loadFromFileCache(): PrepSubjectItem[] | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Error reading prep subjects file cache:", e);
  }
  return null;
}

function saveToFileCache(prepSubjects: PrepSubjectItem[]) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(prepSubjects, null, 2), "utf-8");
  } catch (e) {
    console.warn("Error writing prep subjects file cache:", e);
  }
}

export async function GET() {
  try {
    // 1. Try Memory Cache (updated instantly when POST is called)
    if (memoryPrepCache && memoryPrepCache.length > 0) {
      return NextResponse.json({ prepSubjects: memoryPrepCache, source: "memory" });
    }

    // 2. Try File Cache
    const fileCached = loadFromFileCache();
    if (fileCached && fileCached.length > 0) {
      memoryPrepCache = fileCached;
      return NextResponse.json({ prepSubjects: fileCached, source: "file" });
    }

    // 3. Try Supabase if memory & file cache are empty
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("app_prep_subjects")
          .select("*")
          .order("serial", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: PrepSubjectItem[] = data.map((item: any) => ({
            id: String(item.id),
            name: String(item.name || ""),
            bnName: String(item.bnName || item.bn_name || ""),
            icon: String(item.icon || "BookOpen"),
            bg: String(item.bg || "bg-[#FFF1E6]"),
            text: String(item.text || "text-orange-600"),
            sub: String(item.sub || ""),
            serial: Number(item.serial) || 1,
            subSubjects: typeof item.subSubjects === "string" ? JSON.parse(item.subSubjects) : (item.subSubjects || []),
            active: item.active !== false
          }));
          mapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));

          memoryPrepCache = mapped;
          saveToFileCache(mapped);
          return NextResponse.json({ prepSubjects: mapped, source: "supabase" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase prep query note:", sbErr);
    }

    // 4. Fallback to default prep subjects
    memoryPrepCache = DEFAULT_PREP_SUBJECTS;
    saveToFileCache(DEFAULT_PREP_SUBJECTS);
    return NextResponse.json({ prepSubjects: DEFAULT_PREP_SUBJECTS, source: "default" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch prep subjects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prepSubjects: PrepSubjectItem[] = Array.isArray(body) ? body : (Array.isArray(body?.prepSubjects) ? body.prepSubjects : []);

    if (!prepSubjects || prepSubjects.length === 0) {
      return NextResponse.json({ error: "Invalid prep subjects data" }, { status: 400 });
    }

    const sorted = [...prepSubjects].sort((a, b) => (a.serial || 99) - (b.serial || 99));

    // Update in-memory & file cache immediately (single source of truth)
    memoryPrepCache = sorted;
    saveToFileCache(sorted);

    // Try persisting to Supabase if table exists
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

        await supabase.from("app_prep_subjects").upsert(payload, { onConflict: "id" });
      }
    } catch (sbErr) {
      console.warn("Supabase upsert prep subjects note:", sbErr);
    }

    return NextResponse.json({ success: true, prepSubjects: sorted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save prep subjects" }, { status: 500 });
  }
}
