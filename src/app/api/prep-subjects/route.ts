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

function normalizePrepSubSubjects(raw: any): PrepSubjectItem["subSubjects"] {
  if (!raw) return [];
  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s: any) => s && s.name && String(s.name).trim() !== "")
    .map((s: any, idx: number) => ({
      ...s,
      id: String(s.id || `sub_${idx + 1}`),
      name: String(s.name).trim(),
      sub: String(s.sub || ""),
      serial: Number(s.serial) || idx + 1,
      subCategories2: Array.isArray(s.subCategories2)
        ? s.subCategories2.filter((s2: any) => s2 && s2.name && String(s2.name).trim() !== "")
        : []
    }));
}

function mapPrepItem(item: any): PrepSubjectItem {
  const showQt =
    item.showQuickTools !== undefined
      ? item.showQuickTools !== false && item.showQuickTools !== "false"
      : item.show_quick_tools !== undefined
      ? item.show_quick_tools !== false && item.show_quick_tools !== "false"
      : true;

  return {
    id: String(item.id),
    name: String(item.name || ""),
    bnName: String(item.bnName || item.bn_name || item.name || ""),
    icon: String(item.icon || "BookOpen"),
    bg: String(item.bg || "bg-[#FFF1E6]"),
    text: String(item.text || "text-orange-600"),
    sub: String(item.sub || ""),
    serial: Number(item.serial) || 1,
    subSubjects: normalizePrepSubSubjects(item.subSubjects ?? item.sub_subjects),
    active: item.active !== false,
    showQuickTools: showQt
  };
}

export async function GET() {
  try {
    // 1. Primary DB: Supabase (Vercel + Supabase production architecture)
    try {
      const supabase = getSupabase();
      if (supabase) {
        // Priority A: app_config preserves complete JSON including deleted/updated subSubjects, subCategories2 & showQuickTools
        const { data: configData } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "prep_subjects")
          .maybeSingle();

        if (configData && configData.value && Array.isArray(configData.value) && configData.value.length > 0) {
          const configMapped: PrepSubjectItem[] = configData.value.map(mapPrepItem);
          configMapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));

          memoryPrepCache = configMapped;
          saveToKvStore(configMapped);
          saveToDiskFile(TMP_CACHE_FILE, configMapped);
          return NextResponse.json({ prepSubjects: configMapped, source: "supabase_app_config" });
        }

        // Priority B: app_prep_subjects table
        const { data, error } = await supabase
          .from("app_prep_subjects")
          .select("*")
          .order("serial", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: PrepSubjectItem[] = data.map(mapPrepItem);
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
      const normalized = kvCached.map(mapPrepItem);
      memoryPrepCache = normalized;
      saveToDiskFile(TMP_CACHE_FILE, normalized);
      return NextResponse.json({ prepSubjects: normalized, source: "kv" });
    }

    // 3. Memory Cache (Warm Lambda)
    if (memoryPrepCache && memoryPrepCache.length > 0) {
      return NextResponse.json({ prepSubjects: memoryPrepCache, source: "memory" });
    }

    // 4. Temporary /tmp Cache
    const tmpCached = loadFromDiskFile(TMP_CACHE_FILE);
    if (tmpCached && tmpCached.length > 0) {
      const normalized = tmpCached.map(mapPrepItem);
      memoryPrepCache = normalized;
      return NextResponse.json({ prepSubjects: normalized, source: "tmp_file" });
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

    const sorted = [...prepSubjects]
      .map(mapPrepItem)
      .sort((a, b) => (a.serial || 99) - (b.serial || 99));

    // Update Memory, Disk & Cloud KV Store cleanly (await KV so subsequent refresh never reads stale KV)
    memoryPrepCache = sorted;
    saveToDiskFile(TMP_CACHE_FILE, sorted);
    saveToDiskFile(PROJECT_DATA_FILE, sorted);
    await saveToKvStore(sorted);

    // Persist to Supabase DB (Vercel + Supabase primary persistence)
    try {
      const supabase = getSupabase();
      if (supabase) {
        // 1. Save complete JSON to app_config FIRST (100% reliable fail-safe primary store)
        await supabase.from("app_config").upsert({
          key: "prep_subjects",
          value: sorted,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });

        // 2. Keep app_prep_subjects table in sync across schema variations
        try {
          const currentIds = sorted.map(s => s.id).filter(Boolean);
          if (currentIds.length > 0) {
            const quotedIds = currentIds.map(id => `"${String(id).replace(/"/g, '\\"')}"`).join(",");
            await supabase.from("app_prep_subjects").delete().not("id", "in", `(${quotedIds})`);
          }
        } catch (delErr) {
          console.warn("Delete old prep subjects note:", delErr);
        }

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
          // Retry snake_case columns (typical Postgres schema)
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
            // Retry camelCase columns
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
            const { error: errCamel } = await supabase.from("app_prep_subjects").upsert(camelPayload, { onConflict: "id" });
            if (errCamel) {
              console.warn("Supabase app_prep_subjects table upsert note:", errCamel);
            }
          }
        }
      }
    } catch (sbErr) {
      console.warn("Supabase upsert prep subjects note:", sbErr);
    }

    return NextResponse.json({ success: true, prepSubjects: sorted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save prep subjects" }, { status: 500 });
  }
}
