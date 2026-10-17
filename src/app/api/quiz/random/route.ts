import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { QUIZ_QUESTIONS, Question } from "@/src/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIVE_QUIZ_ALLOWED_SUBJECTS = [
  "General Knowledge(GK)"
];

function isSubjectMatch(subjectName: string, targetSubject: string): boolean {
  if (!subjectName) return false;
  const s = subjectName.trim().toLowerCase();
  const t = targetSubject.trim().toLowerCase();

  if (s === t || s.includes(t) || t.includes(s)) return true;

  if (t === "general knowledge(gk)" || t === "general knowledge" || t === "gk") {
    return (
      s === "general knowledge(gk)" ||
      s === "general knowledge (gk)" ||
      s.includes("general knowledge") ||
      s.includes("gk") ||
      s.includes("সাধারণ জ্ঞান")
    );
  }

  if (t === "recent & updated" || t === "recent" || t === "updated") {
    return s.includes("recent") || s.includes("updated") || s.includes("সাম্প্রতিক") || s.includes("আপডেট");
  }

  if (t === "bangladesh affairs") return s.includes("bangladesh") || s.includes("বাংলাদেশ");
  if (t === "international affairs") return s.includes("international") || s.includes("আন্তর্জাতিক");
  if (t === "geography") return s.includes("geography") || s.includes("ভূগোল");
  if (t === "general science") return s.includes("science") || s.includes("বিজ্ঞান");
  if (t === "technology") return s.includes("tech") || s.includes("ict") || s.includes("প্রযুক্তি") || s.includes("কম্পিউটার");
  if (t === "mental ability") return s.includes("mental") || s.includes("iq") || s.includes("মানসিক");

  return false;
}

function normalizeRawQuestion(q: any): Question {
  const questionText = q.questionText || q.question || q.title || q.question_text || q.text || "Untitled Question";
  
  let options: string[] = [];
  const rawOptions = q.options || q.choices || q.answers || q.option_list;
  if (Array.isArray(rawOptions)) {
    options = rawOptions.map(String);
  } else if (typeof rawOptions === "string") {
    try {
      const parsed = JSON.parse(rawOptions);
      if (Array.isArray(parsed)) options = parsed.map(String);
    } catch {
      options = rawOptions.split(",").map((s: string) => s.trim());
    }
  } else {
    options = ["Option 1", "Option 2", "Option 3", "Option 4"];
  }

  let correctIndex = Number(
    q.correctOptionIndex !== undefined ? q.correctOptionIndex :
    q.correct_option_index !== undefined ? q.correct_option_index :
    q.correctIndex !== undefined ? q.correctIndex : 0
  );
  if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
    correctIndex = 0;
  }

  return {
    id: q.id || Date.now(),
    question: questionText,
    options,
    correctIndex,
    subject: q.subjectName || q.subject_name || q.subject || "",
    explanation: q.explanation || ""
  };
}

export function shuffleQuestionOptions(q: Question): Question {
  const originalOptions = [...q.options];
  const correctOptionText = originalOptions[q.correctIndex] ?? originalOptions[0];

  // Fisher-Yates shuffle options
  const shuffledOptions = [...originalOptions];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }

  const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);

  return {
    ...q,
    options: shuffledOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const isLiveQuiz = mode === "live_quiz" || searchParams.get("subject") === "Live Quiz Game";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    let pool: Question[] = [];

    // 1. Try fetching from Supabase questions table
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("questions")
          .select("id, subjectName, questionText, options, correctOptionIndex, explanation, created_at");

        if (!error && data && data.length > 0) {
          pool = data.map(normalizeRawQuestion);
        }
      }
    } catch (e) {
      console.warn("Error querying Supabase in /api/quiz/random:", e);
    }

    // 2. Fallback to QUIZ_QUESTIONS if pool is empty
    if (pool.length === 0) {
      pool = QUIZ_QUESTIONS.map(normalizeRawQuestion);
    }

    let selectedQuestions: Question[] = [];

    if (isLiveQuiz) {
      // Live Quiz Game: ONLY "General Knowledge(GK)" questions allowed!
      const candidateQuestions = pool.filter(q => {
        const subj = q.subject || q.subjectName || "";
        return isSubjectMatch(subj, "General Knowledge(GK)");
      });

      let safeCandidates = [...candidateQuestions];
      if (safeCandidates.length < limit) {
        const fallbackCandidates = QUIZ_QUESTIONS.filter(q => {
          const subj = q.subject || q.subjectName || "";
          return isSubjectMatch(subj, "General Knowledge(GK)");
        }).map(normalizeRawQuestion);

        const existingIds = new Set(safeCandidates.map(q => q.id));
        for (const f of fallbackCandidates) {
          if (!existingIds.has(f.id)) {
            safeCandidates.push(f);
          }
        }
      }

      // Shuffle candidate questions randomly
      const shuffledCandidates = [...safeCandidates].sort(() => Math.random() - 0.5);
      selectedQuestions = shuffledCandidates.slice(0, limit);
    } else {
      const subject = searchParams.get("subject");
      let filteredPool = pool;
      if (subject && subject !== "all") {
        filteredPool = pool.filter(q => isSubjectMatch(q.subject || "", subject));
      }
      if (filteredPool.length === 0) filteredPool = pool;

      const shuffled = [...filteredPool].sort(() => Math.random() - 0.5);
      selectedQuestions = shuffled.slice(0, limit);
    }

    // Step C: Shuffle options for EVERY selected question so option positions are randomized
    const finalQuestions = selectedQuestions.map(shuffleQuestionOptions);

    return NextResponse.json({ questions: finalQuestions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
