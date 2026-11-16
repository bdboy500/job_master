import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import {
  DEFAULT_JOB_CIRCULAR_CATEGORIES,
  normalizeCircularPosts,
} from "@/src/lib/job_circulars";
import {
  loadCircularsFromDiskFile,
  loadCircularsFromKvStore,
  memoryCircularsCache,
  saveCircularsToDiskFile,
  saveCircularsToKvStore,
  setMemoryCircularsCache,
} from "../route";
import path from "path";

export const dynamic = "force-dynamic";

const PROJECT_DATA_FILE = path.join(process.cwd(), "src", "data", "job_circulars_data.json");
const TMP_CACHE_FILE = path.join("/tmp", "jobmaster_job_circulars_cache.json");

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();
    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "postId required" }, { status: 400 });
    }

    let nextViews: number | null = null;
    const supabase = getSupabase();

    // 1. Update dedicated job_circulars table if present
    if (supabase) {
      try {
        const { data: row, error: rowErr } = await supabase
          .from("job_circulars")
          .select("views")
          .eq("id", postId)
          .maybeSingle();

        if (!rowErr && row) {
          nextViews = Math.max(0, Number(row.views || 0)) + 1;
          await supabase
            .from("job_circulars")
            .update({ views: nextViews, updated_at: new Date().toISOString() })
            .eq("id", postId);
        }
      } catch {}

      // 2. Also update app_config posts bundle
      try {
        const { data: postRow } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "job_circular_posts")
          .maybeSingle();

        if (postRow && Array.isArray(postRow.value)) {
          const updatedPosts = normalizeCircularPosts(
            postRow.value.map((p: any) => {
              if (String(p?.id) === postId) {
                const v = nextViews ?? Math.max(0, Number(p?.views || 0)) + 1;
                nextViews = v;
                return { ...p, views: v };
              }
              return p;
            })
          );

          await supabase.from("app_config").upsert(
            {
              key: "job_circular_posts",
              value: updatedPosts,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );
        }
      } catch {}
    }

    // 3. Sync memory/disk/KV caches
    const currentBundle =
      memoryCircularsCache ||
      loadCircularsFromDiskFile(TMP_CACHE_FILE) ||
      loadCircularsFromDiskFile(PROJECT_DATA_FILE) ||
      (await loadCircularsFromKvStore());

    if (currentBundle) {
      const updatedBundlePosts = normalizeCircularPosts(
        currentBundle.posts.map((p) => {
          if (p.id === postId) {
            const v = nextViews ?? (p.views || 0) + 1;
            nextViews = v;
            return { ...p, views: v };
          }
          return p;
        })
      );

      const nextBundle = {
        categories:
          currentBundle.categories.length > 0
            ? currentBundle.categories
            : DEFAULT_JOB_CIRCULAR_CATEGORIES,
        posts: updatedBundlePosts,
      };
      setMemoryCircularsCache(nextBundle);
      saveCircularsToDiskFile(TMP_CACHE_FILE, nextBundle);
      saveCircularsToDiskFile(PROJECT_DATA_FILE, nextBundle);
      await saveCircularsToKvStore(nextBundle);
    }

    return NextResponse.json({ success: true, views: nextViews ?? 1 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to increment circular view" },
      { status: 500 }
    );
  }
}
