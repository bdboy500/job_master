import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_PREP_SUBJECTS, PrepSubjectItem } from "@/src/lib/courses_and_subjects";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CACHE_FILE = path.join("/tmp", "jobmaster_prep_subjects_cache.json");
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_prep_subjects_v2";

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
    // Layer 1: Memory Cache (instant within process)
    if (memoryPrepCache && memoryPrepCache.length > 0) {
      return NextResponse.json({ prepSubjects: memoryPrepCache, source: "memory" });
    }

    // Layer 2: File Cache (/tmp directory)
    const fileCached = loadFromFileCache();
    if (fileCached && fileCached.length > 0) {
      memoryPrepCache = fileCached;
      return NextResponse.json({ prepSubjects: fileCached, source: "file" });
    }

    // Layer 3: Cloud KV Store (global persistent backup)
    const kvCached = await loadFromKvStore();
    if (kvCached && kvCached.length > 0) {
      memoryPrepCache = kvCached;
      saveToFileCache(kvCached);
      return NextResponse.json({ prepSubjects: kvCached, source: "kv" });
    }

    // Layer 4: Supabase Database Table
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
          saveToKvStore(mapped);
          return NextResponse.json({ prepSubjects: mapped, source: "supabase" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase prep query note:", sbErr);
    }

    // Layer 5: Fallback to default prep subjects
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

    // Update Memory & File Cache & Cloud KV Store immediately (single source of truth)
    memoryPrepCache = sorted;
    saveToFileCache(sorted);
    saveToKvStore(sorted);

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

        // Remove deleted prep subjects from Supabase
        const currentIds = sorted.map(s => s.id);
        if (currentIds.length > 0) {
          const formattedIds = currentIds.map(id => `'${id}'`).join(",");
          await supabase.from("app_prep_subjects").delete().not("id", "in", `(${formattedIds})`);
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
