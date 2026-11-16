import fs from "fs";
import path from "path";
import {
  JobCircularCategory,
  JobCircularPost,
  normalizeCircularCategories,
  normalizeCircularPosts,
} from "@/src/lib/job_circulars";

export interface JobCircularsBundle {
  categories: JobCircularCategory[];
  posts: JobCircularPost[];
}

export const CIRCULAR_PROJECT_DATA_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "job_circulars_data.json"
);
export const CIRCULAR_TMP_CACHE_FILE = path.join("/tmp", "jobmaster_job_circulars_cache.json");
const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_job_circulars_v1";

let memoryCircularsCache: JobCircularsBundle | null = null;

export function getMemoryCircularsCache(): JobCircularsBundle | null {
  return memoryCircularsCache;
}

export function setMemoryCircularsCache(bundle: JobCircularsBundle) {
  memoryCircularsCache = bundle;
}

export function loadCircularsFromDiskFile(filePath: string): JobCircularsBundle | null {
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

export function saveCircularsToDiskFile(filePath: string, bundle: JobCircularsBundle) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2), "utf-8");
  } catch {
    // Expected on read-only environments
  }
}

export async function loadCircularsFromKvStore(): Promise<JobCircularsBundle | null> {
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

export async function saveCircularsToKvStore(bundle: JobCircularsBundle) {
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
