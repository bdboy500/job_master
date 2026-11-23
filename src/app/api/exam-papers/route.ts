import { NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const TMP_CACHE_FILE = path.join("/tmp", "jobmaster_exam_papers_meta_cache.json");
let memoryPapersCache: any[] | null = null;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function loadFromTmp(): any[] | null {
  try {
    if (fs.existsSync(TMP_CACHE_FILE)) {
      const raw = fs.readFileSync(TMP_CACHE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return null;
}

function saveToTmp(rows: any[]) {
  try {
    fs.writeFileSync(TMP_CACHE_FILE, JSON.stringify(rows), "utf-8");
  } catch (e) {}
}

export async function GET() {
  try {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const supabasePromise = supabase
          .from("exam_papers")
          .select(
            "id, title, course, exam_type, subject, question_count, time_per_question, total_duration, total_marks, topic, exam_date, status, created_at, sub_subject, category_type"
          );

        const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error("Server Supabase timeout") }), 7000)
        );

        const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);

        if (!error && Array.isArray(data) && data.length > 0) {
          memoryPapersCache = data;
          saveToTmp(data);
          return NextResponse.json(
            { papers: data, source: "supabase" },
            { headers: NO_STORE_HEADERS }
          );
        }
      } catch (err) {
        console.warn("/api/exam-papers Supabase query note:", err);
      }
    }

    if (memoryPapersCache && memoryPapersCache.length > 0) {
      return NextResponse.json(
        { papers: memoryPapersCache, source: "memory" },
        { headers: NO_STORE_HEADERS }
      );
    }

    const tmp = loadFromTmp();
    if (tmp && tmp.length > 0) {
      memoryPapersCache = tmp;
      return NextResponse.json(
        { papers: tmp, source: "tmp_file" },
        { headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      { papers: [], source: "empty" },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch exam papers", papers: [], source: "error" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
