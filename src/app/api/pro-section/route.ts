import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_PRO_SECTION, ProSectionItem } from "@/src/lib/courses_and_subjects";

export const dynamic = "force-dynamic";

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_pro_section_v2";

let memoryProCache: ProSectionItem[] | null = null;

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

export async function GET() {
  try {
    // 1. Supabase
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("app_pro_section")
          .select("*")
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
            active: item.active !== false
          }));
          mapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));

          memoryProCache = mapped;
          saveToKvStore(mapped);
          return NextResponse.json({ proSection: mapped, source: "supabase" });
        }

        // Try app_config table
        const { data: configData } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "pro_section")
          .maybeSingle();

        if (configData && configData.value && Array.isArray(configData.value) && configData.value.length > 0) {
          const configMapped: ProSectionItem[] = configData.value;
          configMapped.sort((a, b) => (a.serial || 99) - (b.serial || 99));
          memoryProCache = configMapped;
          saveToKvStore(configMapped);
          return NextResponse.json({ proSection: configMapped, source: "supabase_app_config" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase pro section query note:", sbErr);
    }

    // 2. Cloud KV Store
    const kvCached = await loadFromKvStore();
    if (kvCached && kvCached.length > 0) {
      memoryProCache = kvCached;
      return NextResponse.json({ proSection: kvCached, source: "kv" });
    }

    // 3. Memory Cache
    if (memoryProCache && memoryProCache.length > 0) {
      return NextResponse.json({ proSection: memoryProCache, source: "memory" });
    }

    // 4. Default Fallback
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
    await saveToKvStore(sorted);

    try {
      const supabase = getSupabase();
      if (supabase) {
        const payload = sorted.map(item => ({
          id: item.id,
          name: item.name,
          sub: item.sub || "",
          icon: item.icon || "Briefcase",
          bg: item.bg || "bg-[#FFF1E6]",
          text: item.text || "text-orange-600",
          serial: Number(item.serial) || 1,
          active: item.active !== false
        }));

        try {
          const currentIds = sorted.map(i => i.id);
          if (currentIds.length > 0) {
            const formattedIds = currentIds.map(id => id).join(",");
            await supabase.from("app_pro_section").delete().not("id", "in", `(${formattedIds})`);
          }
        } catch (delErr) {}

        await supabase.from("app_pro_section").upsert(payload, { onConflict: "id" });
        await supabase.from("app_config").upsert({
          key: "pro_section",
          value: sorted,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
      }
    } catch (sbErr) {
      console.warn("Supabase pro section POST note:", sbErr);
    }

    return NextResponse.json({ success: true, proSection: sorted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update pro section" }, { status: 500 });
  }
}
