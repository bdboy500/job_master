import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import {
  DEFAULT_JOB_CIRCULAR_CATEGORIES,
  DEFAULT_JOB_CIRCULAR_POSTS,
  JobCircularCategory,
  JobCircularPost,
  normalizeCircularCategories,
  normalizeCircularPosts,
} from "@/src/lib/job_circulars";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface JobCircularsBundle {
  categories: JobCircularCategory[];
  posts: JobCircularPost[];
}

const PROJECT_DATA_FILE = path.join(process.cwd(), "src", "data", "job_circulars_data.json");
const TMP_CACHE_FILE = path.join("/tmp", "jobmaster_job_circulars_cache.json");
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_job_circulars_v1";

let memoryCircularsCache: JobCircularsBundle | null = null;

function loadFromDiskFile(filePath: string): JobCircularsBundle | null {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.categories)) {
        return {
          categories: normalizeCircularCategories(parsed.categories),
          posts: normalizeCircularPosts(parsed.posts || []),
        };
      }
    }
  } catch (e) {
    console.warn(`Note reading job circulars disk file ${filePath}:`, e);
  }
  return null;
}

function saveToDiskFile(filePath: string, bundle: JobCircularsBundle) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), "utf-8");
  } catch (e) {
    // Expected on read-only environments
  }
}

async function loadFromKvStore(): Promise<JobCircularsBundle | null> {
  try {
    const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
    if (res.ok) {
      const parsed = await res.json();
      if (parsed && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        return {
          categories: normalizeCircularCategories(parsed.categories),
          posts: normalizeCircularPosts(parsed.posts || []),
        };
      }
    }
  } catch (e) {
    console.warn("Error reading job circulars from KV store:", e);
  }
  return null;
}

async function saveToKvStore(bundle: JobCircularsBundle) {
  try {
    await fetch(CLOUD_KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bundle),
    });
  } catch (e) {
    console.warn("Error writing job circulars to KV store:", e);
  }
}

export async function GET() {
  try {
    // 1. Primary: Supabase app_config
    try {
      const supabase = getSupabase();
      if (supabase) {
        const [{ data: catRow }, { data: postRow }] = await Promise.all([
          supabase.from("app_config").select("value").eq("key", "job_circular_categories").maybeSingle(),
          supabase.from("app_config").select("value").eq("key", "job_circular_posts").maybeSingle(),
        ]);

        const hasCats = catRow && Array.isArray(catRow.value) && catRow.value.length > 0;
        const hasPosts = postRow && Array.isArray(postRow.value);

        if (hasCats || hasPosts) {
          const bundle: JobCircularsBundle = {
            categories: hasCats
              ? normalizeCircularCategories(catRow.value)
              : DEFAULT_JOB_CIRCULAR_CATEGORIES,
            posts: hasPosts ? normalizeCircularPosts(postRow.value) : DEFAULT_JOB_CIRCULAR_POSTS,
          };
          memoryCircularsCache = bundle;
          saveToDiskFile(TMP_CACHE_FILE, bundle);
          saveToDiskFile(PROJECT_DATA_FILE, bundle);
          return NextResponse.json({ ...bundle, source: "supabase_app_config" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase job circulars query note:", sbErr);
    }

    // 2. Cloud KV Store
    const kvCached = await loadFromKvStore();
    if (kvCached && kvCached.categories.length > 0) {
      memoryCircularsCache = kvCached;
      saveToDiskFile(TMP_CACHE_FILE, kvCached);
      return NextResponse.json({ ...kvCached, source: "kv" });
    }

    // 3. Local Disk Cache
    const diskCached = loadFromDiskFile(TMP_CACHE_FILE) || loadFromDiskFile(PROJECT_DATA_FILE);
    if (diskCached && diskCached.categories.length > 0) {
      memoryCircularsCache = diskCached;
      return NextResponse.json({ ...diskCached, source: "disk" });
    }

    // 4. Memory Cache
    if (memoryCircularsCache && memoryCircularsCache.categories.length > 0) {
      return NextResponse.json({ ...memoryCircularsCache, source: "memory" });
    }

    // 5. Default Fallback
    return NextResponse.json({
      categories: DEFAULT_JOB_CIRCULAR_CATEGORIES,
      posts: DEFAULT_JOB_CIRCULAR_POSTS,
      source: "default",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch job circulars" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Load current bundle so partial updates (categories-only or posts-only) keep the other intact
    const currentFallback =
      memoryCircularsCache ||
      loadFromDiskFile(TMP_CACHE_FILE) ||
      loadFromDiskFile(PROJECT_DATA_FILE) || {
        categories: DEFAULT_JOB_CIRCULAR_CATEGORIES,
        posts: DEFAULT_JOB_CIRCULAR_POSTS,
      };

    const nextCategories = Array.isArray(body?.categories)
      ? normalizeCircularCategories(body.categories)
      : currentFallback.categories;

    const nextPosts = Array.isArray(body?.posts)
      ? normalizeCircularPosts(body.posts)
      : currentFallback.posts;

    const bundle: JobCircularsBundle = {
      categories: nextCategories,
      posts: nextPosts,
    };

    memoryCircularsCache = bundle;
    saveToDiskFile(TMP_CACHE_FILE, bundle);
    saveToDiskFile(PROJECT_DATA_FILE, bundle);
    await saveToKvStore(bundle);

    try {
      const supabase = getSupabase();
      if (supabase) {
        const upserts: any[] = [];
        if (Array.isArray(body?.categories)) {
          upserts.push({
            key: "job_circular_categories",
            value: nextCategories,
            updated_at: new Date().toISOString(),
          });
        }
        if (Array.isArray(body?.posts)) {
          upserts.push({
            key: "job_circular_posts",
            value: nextPosts,
            updated_at: new Date().toISOString(),
          });
        }
        if (upserts.length > 0) {
          await supabase.from("app_config").upsert(upserts, { onConflict: "key" });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase job circulars POST note:", sbErr);
    }

    return NextResponse.json({
      success: true,
      categories: nextCategories,
      posts: nextPosts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update job circulars" },
      { status: 500 }
    );
  }
}
