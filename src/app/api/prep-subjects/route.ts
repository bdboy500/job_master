import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_PREP_SUBJECTS, PrepSubjectItem } from "@/src/lib/courses_and_subjects";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PROJECT_DATA_FILE = path.join(process.cwd(), "src", "data", "prep_subjects_data.json");
const TMP_CACHE_FILE = path.join("/tmp", "jobmaster_prep_subjects_cache.json");
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_prep_subjects_v2";

let memoryPrepCache: PrepSubjectItem[] | null = null;

function loadFromDiskFile(filePath: string): PrepSubjectItem[] | null {
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

function saveToDiskFile(filePath: string, prepSubjects: PrepSubjectItem[]) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(prepSubjects, null, 2), "utf-8");
  } catch (e) {
    // Expected on Vercel read-only filesystem
  }
}

async function loadFromKvStore(): Promise<PrepSubjectItem[] | null> {
  try {
    const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Error reading prep subjects from KV store:", e);
  }
  return null;
}

async function saveToKvStore(prepSubjects: PrepSubjectItem[]) {
  try {
    await fetch(CLOUD_KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prepSubjects)
    });
  } catch (e) {
    console.warn("Error writing prep subjects to KV store:", e);
  }
}

export async function GET() {
  try {
    // 1. Primary DB: Supabase (Vercel + Supabase production architecture)
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
            subSubjects: typeof item.subSubjects === "string" ? JSON.parse(item.subSubjects) : (item.sub_subjects ? (typeof item.sub_subjects === "string" ? JSON.parse(item.sub_subjects) : item.sub_subjects) : (item.subSubjects || [])),
            active: item.active !== false,
            showQuickTools: item.showQuickTools !== undefined ? (item.showQuickTools !== false && item.showQuickTools !== "false" && item.show_quick_tools !== false && item.show_quick_tools !== "false") : (item.show_quick_tools !== undefined ? (item.show_quick_tools !== false && item.show_quick_tools !== "false") : true)
          }));
          mapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));

          memoryPrepCache = mapped;
          saveToKvStore(mapped);
          saveToDiskFile(TMP_CACHE_FILE, mapped);
          return NextResponse.json({ prepSubjects: mapped, source: "supabase" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase prep query note:", sbErr);
    }

    // 2. Persistent Backup: Cloud KV Store
    const kvCached = await loadFromKvStore();
    if (kvCached && kvCached.length > 0) {
      memoryPrepCache = kvCached;
      saveToDiskFile(TMP_CACHE_FILE, kvCached);
      return NextResponse.json({ prepSubjects: kvCached, source: "kv" });
    }

    // 3. Memory Cache (Warm Lambda)
    if (memoryPrepCache && memoryPrepCache.length > 0) {
      return NextResponse.json({ prepSubjects: memoryPrepCache, source: "memory" });
    }

    // 4. Temporary /tmp Cache
    const tmpCached = loadFromDiskFile(TMP_CACHE_FILE);
    if (tmpCached && tmpCached.length > 0) {
      memoryPrepCache = tmpCached;
      return NextResponse.json({ prepSubjects: tmpCached, source: "tmp_file" });
    }

    // 5. Default Fallback
    const projectCached = loadFromDiskFile(PROJECT_DATA_FILE);
    const finalFallback = (projectCached && projectCached.length > 0) ? projectCached : DEFAULT_PREP_SUBJECTS;
    return NextResponse.json({ prepSubjects: finalFallback, source: "default" });
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

    // Update Memory & Cloud KV Store immediately (single source of truth)
    memoryPrepCache = sorted;
    saveToKvStore(sorted);
    saveToDiskFile(TMP_CACHE_FILE, sorted);
    saveToDiskFile(PROJECT_DATA_FILE, sorted);

    // Persist to Supabase DB (Vercel + Supabase primary persistence)
    try {
      const supabase = getSupabase();
      if (supabase) {
        const payload = sorted.map(s => ({
          id: s.id,
          name: s.name,
          bnName: s.bnName,
          bn_name: s.bnName,
          icon: s.icon,
          bg: s.bg,
          text: s.text,
          sub: s.sub,
          serial: s.serial,
          subSubjects: JSON.stringify(s.subSubjects || []),
          sub_subjects: JSON.stringify(s.subSubjects || []),
          active: s.active !== false,
          showQuickTools: s.showQuickTools !== false,
          show_quick_tools: s.showQuickTools !== false
        }));

        const currentIds = sorted.map(s => s.id);
        if (currentIds.length > 0) {
          const formattedIds = `(${currentIds.map(id => `'${id}'`).join(",")})`;
          await supabase.from("app_prep_subjects").delete().not("id", "in", formattedIds);
        }

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
