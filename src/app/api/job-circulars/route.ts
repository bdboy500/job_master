import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import {
  DEFAULT_JOB_CIRCULAR_CATEGORIES,
  DEFAULT_JOB_CIRCULAR_POSTS,
  JobCircularPost,
  normalizeCircularCategories,
  normalizeCircularPosts,
} from "@/src/lib/job_circulars";
import {
  CIRCULAR_PROJECT_DATA_FILE,
  CIRCULAR_TMP_CACHE_FILE,
  JobCircularsBundle,
  getMemoryCircularsCache,
  loadCircularsFromDiskFile,
  loadCircularsFromKvStore,
  saveCircularsToDiskFile,
  saveCircularsToKvStore,
  setMemoryCircularsCache,
} from "@/src/lib/job_circulars_store";

export const dynamic = "force-dynamic";

async function syncPostsToDedicatedSupabaseTable(posts: JobCircularPost[]) {
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: existingRows, error: checkErr } = await supabase
      .from("job_circulars")
      .select("id");

    // Silently skip if user hasn't created the dedicated job_circulars table yet (app_config still holds everything!)
    if (checkErr) return;

    const keepIds = new Set(posts.map((p) => p.id));
    const toDeleteIds = (existingRows || [])
      .map((r: any) => String(r.id))
      .filter((id) => !keepIds.has(id));

    if (toDeleteIds.length > 0) {
      await supabase.from("job_circulars").delete().in("id", toDeleteIds);
    }

    if (posts.length > 0) {
      const rows = posts.map((p) => ({
        id: p.id,
        category_id:
          p.categoryIds && p.categoryIds.length > 0 ? p.categoryIds.join(",") : p.categoryId,
        title: p.title,
        organization: p.organization || "",
        vacancies: p.vacancies || "",
        deadline: p.deadline || "",
        file_type: p.fileType || "pdf",
        file_url: p.fileUrl || "",
        apply_url: p.applyUrl || "",
        description: p.description || "",
        views: p.views ?? 0,
        active: p.active !== false,
        published_at: p.publishedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("job_circulars").upsert(rows, { onConflict: "id" });
    }
  } catch (e) {
    // Fallback gracefully to app_config
  }
}

export async function GET(req: NextRequest) {
  try {
    const categoriesOnly = req.nextUrl.searchParams.get("categoriesOnly") === "1";

    // Lightweight categories-only mode for initial Home render (never queries or transfers circular posts)
    if (categoriesOnly) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data: catRow } = await supabase
            .from("app_config")
            .select("value")
            .eq("key", "job_circular_categories")
            .maybeSingle();
          if (catRow && Array.isArray(catRow.value) && catRow.value.length > 0) {
            return NextResponse.json({
              categories: normalizeCircularCategories(catRow.value),
              source: "supabase_categories_only",
            });
          }
        }
      } catch (sbErr) {
        console.warn("Supabase categories-only query note:", sbErr);
      }

      const kvCats = await loadCircularsFromKvStore();
      if (kvCats && kvCats.categories.length > 0) {
        return NextResponse.json({ categories: kvCats.categories, source: "kv_categories_only" });
      }
      const diskCats =
        loadCircularsFromDiskFile(CIRCULAR_TMP_CACHE_FILE) ||
        loadCircularsFromDiskFile(CIRCULAR_PROJECT_DATA_FILE);
      if (diskCats && diskCats.categories.length > 0) {
        return NextResponse.json({ categories: diskCats.categories, source: "disk_categories_only" });
      }
      const memCats = getMemoryCircularsCache();
      if (memCats && memCats.categories.length > 0) {
        return NextResponse.json({ categories: memCats.categories, source: "memory_categories_only" });
      }
      return NextResponse.json({
        categories: DEFAULT_JOB_CIRCULAR_CATEGORIES,
        source: "default_categories_only",
      });
    }

    // 1. Primary: Supabase (dedicated job_circulars table + app_config)
    try {
      const supabase = getSupabase();
      if (supabase) {
        const [{ data: catRow }, { data: postRow }, { data: tableRows, error: tableErr }] =
          await Promise.all([
            supabase.from("app_config").select("value").eq("key", "job_circular_categories").maybeSingle(),
            supabase.from("app_config").select("value").eq("key", "job_circular_posts").maybeSingle(),
            supabase.from("job_circulars").select("*").order("published_at", { ascending: false }),
          ]);

        const hasCats = catRow && Array.isArray(catRow.value) && catRow.value.length > 0;
        const hasTablePosts = !tableErr && Array.isArray(tableRows) && tableRows.length > 0;
        const hasConfigPosts = postRow && Array.isArray(postRow.value);

        if (hasCats || hasTablePosts || hasConfigPosts) {
          const resolvedPosts = hasTablePosts
            ? normalizeCircularPosts(tableRows)
            : hasConfigPosts
            ? normalizeCircularPosts(postRow.value)
            : DEFAULT_JOB_CIRCULAR_POSTS;

          const bundle: JobCircularsBundle = {
            categories: hasCats
              ? normalizeCircularCategories(catRow.value)
              : DEFAULT_JOB_CIRCULAR_CATEGORIES,
            posts: resolvedPosts,
          };
          setMemoryCircularsCache(bundle);
          saveCircularsToDiskFile(CIRCULAR_TMP_CACHE_FILE, bundle);
          saveCircularsToDiskFile(CIRCULAR_PROJECT_DATA_FILE, bundle);
          return NextResponse.json({
            ...bundle,
            source: hasTablePosts ? "supabase_job_circulars" : "supabase_app_config",
          });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase job circulars query note:", sbErr);
    }

    // 2. Cloud KV Store
    const kvCached = await loadCircularsFromKvStore();
    if (kvCached && kvCached.categories.length > 0) {
      setMemoryCircularsCache(kvCached);
      saveCircularsToDiskFile(CIRCULAR_TMP_CACHE_FILE, kvCached);
      return NextResponse.json({ ...kvCached, source: "kv" });
    }

    // 3. Local Disk Cache
    const diskCached =
      loadCircularsFromDiskFile(CIRCULAR_TMP_CACHE_FILE) ||
      loadCircularsFromDiskFile(CIRCULAR_PROJECT_DATA_FILE);
    if (diskCached && diskCached.categories.length > 0) {
      setMemoryCircularsCache(diskCached);
      return NextResponse.json({ ...diskCached, source: "disk" });
    }

    // 4. Memory Cache
    const memCached = getMemoryCircularsCache();
    if (memCached && memCached.categories.length > 0) {
      return NextResponse.json({ ...memCached, source: "memory" });
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
      getMemoryCircularsCache() ||
      loadCircularsFromDiskFile(CIRCULAR_TMP_CACHE_FILE) ||
      loadCircularsFromDiskFile(CIRCULAR_PROJECT_DATA_FILE) || {
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

    setMemoryCircularsCache(bundle);
    saveCircularsToDiskFile(CIRCULAR_TMP_CACHE_FILE, bundle);
    saveCircularsToDiskFile(CIRCULAR_PROJECT_DATA_FILE, bundle);
    await saveCircularsToKvStore(bundle);

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

        if (Array.isArray(body?.posts)) {
          await syncPostsToDedicatedSupabaseTable(nextPosts);
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
