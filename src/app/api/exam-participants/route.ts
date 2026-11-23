import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";

export const dynamic = "force-dynamic";

const APP_CONFIG_KEY = "exam_real_participants_v1";
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_exam_participants_v1";
const TMP_CACHE_FILE = path.join("/tmp", "jobmaster_exam_participants_v1.json");
const CACHE_TTL_MS = 15000;

let memoryCountsCache: Record<string, number> | null = null;
let lastSyncMs = 0;

function normalizeCountsMap(raw: any): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const cleaned: Record<string, number> = {};
  for (const [key, val] of Object.entries(raw)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) continue;
    const num = Math.max(0, Math.floor(Number(val) || 0));
    if (num > 0) {
      cleaned[cleanKey] = num;
    }
  }
  return cleaned;
}

function mergeCountsMaps(
  base: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...base };
  for (const [k, v] of Object.entries(incoming)) {
    merged[k] = Math.max(merged[k] || 0, v || 0);
  }
  return merged;
}

function readDiskCache(): Record<string, number> | null {
  try {
    if (!fs.existsSync(TMP_CACHE_FILE)) return null;
    const raw = fs.readFileSync(TMP_CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeCountsMap(parsed);
  } catch {
    return null;
  }
}

function writeDiskCache(counts: Record<string, number>) {
  try {
    fs.writeFileSync(TMP_CACHE_FILE, JSON.stringify(counts), "utf8");
  } catch {}
}

async function loadAuthoritativeCounts(force = false): Promise<Record<string, number>> {
  const now = Date.now();
  if (!force && memoryCountsCache && now - lastSyncMs < CACHE_TTL_MS) {
    return memoryCountsCache;
  }

  let resolved: Record<string, number> = memoryCountsCache
    ? { ...memoryCountsCache }
    : readDiskCache() || {};

  // 1. Primary: Supabase app_config
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", APP_CONFIG_KEY)
        .maybeSingle();

      if (!error && data?.value && typeof data.value === "object") {
        resolved = mergeCountsMaps(resolved, normalizeCountsMap(data.value));
        memoryCountsCache = resolved;
        lastSyncMs = Date.now();
        writeDiskCache(resolved);
        return resolved;
      }
    }
  } catch (err) {
    console.warn("Supabase exam_real_participants read note:", err);
  }

  // 2. Fallback: Cloud KV Store
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(CLOUD_KV_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      const kvJson = await res.json();
      resolved = mergeCountsMaps(resolved, normalizeCountsMap(kvJson));
    }
  } catch {}

  memoryCountsCache = resolved;
  lastSyncMs = Date.now();
  writeDiskCache(resolved);
  return resolved;
}

async function persistCounts(counts: Record<string, number>) {
  memoryCountsCache = counts;
  lastSyncMs = Date.now();
  writeDiskCache(counts);

  // Persist to Supabase app_config
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("app_config").upsert(
        {
          key: APP_CONFIG_KEY,
          value: counts,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    }
  } catch (err) {
    console.warn("Supabase exam_real_participants write note:", err);
  }

  // Persist to Cloud KV Store
  try {
    await fetch(CLOUD_KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(counts),
    });
  } catch {}
}

export async function GET(req: NextRequest) {
  try {
    const force = req.nextUrl.searchParams.get("force") === "1";
    const counts = await loadAuthoritativeCounts(force);
    return NextResponse.json({ counts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load exam participants", counts: memoryCountsCache || {} },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const examId = String(body?.examId || "").trim();
    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    const currentCounts = await loadAuthoritativeCounts(true);
    const nextCount = (Number(currentCounts[examId]) || 0) + 1;
    const updatedCounts: Record<string, number> = {
      ...currentCounts,
      [examId]: nextCount,
    };

    await persistCounts(updatedCounts);

    return NextResponse.json({
      success: true,
      examId,
      count: nextCount,
      counts: updatedCounts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to increment exam participant count" },
      { status: 500 }
    );
  }
}
