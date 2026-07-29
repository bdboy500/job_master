import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";

export const dynamic = "force-static";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const supabase = getSupabase();
    let query = supabase.from("questions").select("*");

    if (subject) {
      // Support filtering by subject
      // Checks both camelCase and snake_case column names dynamically if present
      query = query.or(`subjectName.eq."${subject}",subject_name.eq."${subject}"`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // Shuffle the questions list
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);

    // Map each question to standard frontend interface format
    const mappedQuestions = selected.map((q: any) => {
      const questionText = q.questionText || q.question || q.title || q.question_text || q.text || "Untitled Question";
      
      let options: string[] = [];
      const rawOptions = q.options || q.choices || q.answers || q.option_list;
      if (Array.isArray(rawOptions)) {
        options = rawOptions.map(String);
      } else if (typeof rawOptions === "string") {
        try {
          const parsed = JSON.parse(rawOptions);
          if (Array.isArray(parsed)) {
            options = parsed.map(String);
          }
        } catch {
          options = rawOptions.split(",").map((s: string) => s.trim());
        }
      } else {
        options = ["Option 1", "Option 2", "Option 3", "Option 4"];
      }

      const correctOptionIndex = q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.correct_option_index !== undefined ? q.correct_option_index : (q.correctIndex !== undefined ? q.correctIndex : 0));

      return {
        id: q.id,
        question: questionText,
        options,
        correctIndex: Number(correctOptionIndex),
        subjectName: q.subjectName || q.subject_name || "",
        explanation: q.explanation || ""
      };
    });

    return NextResponse.json({ questions: mappedQuestions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
