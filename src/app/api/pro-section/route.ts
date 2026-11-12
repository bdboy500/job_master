import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_PRO_SECTION, ProSectionItem } from "@/src/lib/courses_and_subjects";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PROJECT_DATA_FILE = path.join(process.cwd(), "src", "data", "pro_section_data.json");
const TMP_CACHE_FILE = path.join("/tmp", "jobmaster_pro_section_cache.json");
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_pro_section_v2";

let memoryProCache: ProSectionItem[] | null = null;

function loadFromDiskFile(filePath: string): ProSectionItem[] | null {
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

function saveToDiskFile(filePath: string, items: ProSectionItem[]) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf-8");
  } catch (e) {
    // Expected on read-only environments
  }
}

async function loadFromKvStore(): Promise<ProSectionItem[] | null> {
  try {
    const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Error reading pro section from KV store:", e);
  }
  return null;
}

async function saveToKvStore(items: ProSectionItem[]) {
  try {
    await fetch(CLOUD_KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items)
    });
  } catch (e) {
    console.warn("Error writing pro section to KV store:", e);
  }
}

function normalizeSubSubjects(raw: any) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

export async function GET() {
  try {
    // 1. Primary: Supabase
    try {
      const supabase = getSupabase();
      if (supabase) {
        // Priority A: app_config table preserves complete JSON including subSubjects
        const { data: configData } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "pro_section")
          .maybeSingle();

        if (configData && configData.value && Array.isArray(configData.value) && configData.value.length > 0) {
          const configMapped: ProSectionItem[] = configData.value.map((item: any) => ({
            id: String(item.id),
            name: String(item.name || ""),
            sub: String(item.sub || ""),
            icon: String(item.icon || "Briefcase"),
            bg: String(item.bg || "bg-[#FFF1E6]"),
            text: String(item.text || "text-orange-600"),
            serial: Number(item.serial) || 1,
            active: item.active !== false,
            subSubjects: normalizeSubSubjects(item.subSubjects || item.sub_subjects)
          }));
          configMapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));
          memoryProCache = configMapped;
          saveToKvStore(configMapped);
          saveToDiskFile(TMP_CACHE_FILE, configMapped);
          saveToDiskFile(PROJECT_DATA_FILE, configMapped);
          return NextResponse.json({ proSection: configMapped, source: "supabase_app_config" });
        }

        // Priority B: app_pro_section table
        const { data, error } = await supabase
          .from("app_pro_section")
          .select("id, name, sub, icon, bg, text, serial, active, subSubjects, sub_subjects")
          .order("serial", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: ProSectionItem[] = data.map((item: any) => ({
            id: String(item.id),
            name: String(item.name || ""),
            sub: String(item.sub || ""),
            icon: String(item.icon || "Briefcase"),
            bg: String(item.bg || "bg-[#FFF1E6]"),
            text: String(item.text || "text-orange-600"),
            serial: Number(item.serial) || 1,
            active: item.active !== false,
            subSubjects: normalizeSubSubjects(item.subSubjects || item.sub_subjects)
          }));
          mapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));

          memoryProCache = mapped;
          saveToKvStore(mapped);
          saveToDiskFile(TMP_CACHE_FILE, mapped);
          return NextResponse.json({ proSection: mapped, source: "supabase_table" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase pro section query note:", sbErr);
    }

    // 2. Cloud KV Store
    const kvCached = await loadFromKvStore();
    if (kvCached && kvCached.length > 0) {
      memoryProCache = kvCached;
      saveToDiskFile(TMP_CACHE_FILE, kvCached);
      return NextResponse.json({ proSection: kvCached, source: "kv" });
    }

    // 3. Local Disk Cache
    const diskCached = loadFromDiskFile(TMP_CACHE_FILE) || loadFromDiskFile(PROJECT_DATA_FILE);
    if (diskCached && diskCached.length > 0) {
      memoryProCache = diskCached;
      return NextResponse.json({ proSection: diskCached, source: "disk" });
    }

    // 4. Memory Cache
    if (memoryProCache && memoryProCache.length > 0) {
      return NextResponse.json({ proSection: memoryProCache, source: "memory" });
    }

    // 5. Default Fallback
    return NextResponse.json({ proSection: DEFAULT_PRO_SECTION, source: "default" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch pro section" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: ProSectionItem[] = Array.isArray(body) ? body : (Array.isArray(body?.proSection) ? body.proSection : []);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Invalid pro section data" }, { status: 400 });
    }

    const sorted = [...items].sort((a, b) => (a.serial || 99) - (b.serial || 99));
    memoryProCache = sorted;
    saveToDiskFile(TMP_CACHE_FILE, sorted);
    saveToDiskFile(PROJECT_DATA_FILE, sorted);
    await saveToKvStore(sorted);

    try {
      const supabase = getSupabase();
      if (supabase) {
        // 1. app_config holds complete JSON with subSubjects intact
        await supabase.from("app_config").upsert({
          key: "pro_section",
          value: sorted,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });

        // 2. app_pro_section table
        try {
          const payload = sorted.map(item => ({
            id: item.id,
            name: item.name,
            sub: item.sub || "",
            icon: item.icon || "Briefcase",
            bg: item.bg || "bg-[#FFF1E6]",
            text: item.text || "text-orange-600",
            serial: Number(item.serial) || 1,
            active: item.active !== false,
            sub_subjects: item.subSubjects || [],
            subSubjects: item.subSubjects || []
          }));

          const currentIds = sorted.map(i => i.id);
          if (currentIds.length > 0) {
            const formattedIds = currentIds.map(id => id).join(",");
            await supabase.from("app_pro_section").delete().not("id", "in", `(${formattedIds})`);
          }

          await supabase.from("app_pro_section").upsert(payload, { onConflict: "id" });
        } catch (tableErr) {
          // If subSubjects column does not exist on table, fallback to core fields
          const fallbackPayload = sorted.map(item => ({
            id: item.id,
            name: item.name,
            sub: item.sub || "",
            icon: item.icon || "Briefcase",
            bg: item.bg || "bg-[#FFF1E6]",
            text: item.text || "text-orange-600",
            serial: Number(item.serial) || 1,
            active: item.active !== false
          }));
          await supabase.from("app_pro_section").upsert(fallbackPayload, { onConflict: "id" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase pro section POST note:", sbErr);
    }

    return NextResponse.json({ success: true, proSection: sorted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update pro section" }, { status: 500 });
  }
}
