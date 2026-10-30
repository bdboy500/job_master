import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { QUIZ_QUESTIONS, Question } from "@/src/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

// Unbiased Fisher-Yates Shuffle
function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleQuestionOptions(q: Question): Question {
  const originalOptions = [...q.options];
  const correctOptionText = originalOptions[q.correctIndex] ?? originalOptions[0];

  // Fisher-Yates shuffle options
  const shuffledOptions = fisherYatesShuffle(originalOptions);
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
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 10;

    // International quiz standard: support excludeIds to eliminate repeated questions across rounds
    const excludeIdsParam = searchParams.get("excludeIds") || searchParams.get("seenIds") || "";
    const excludeIds = new Set<string>(
      excludeIdsParam
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    );

    let dbPool: Question[] = [];

    // 1. Fetch questions from Supabase questions table
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("questions")
          .select("id, subjectName, questionText, options, correctOptionIndex, explanation, created_at");

        if (!error && data && data.length > 0) {
          dbPool = data.map(normalizeRawQuestion);
        }
      }
    } catch (e) {
      console.warn("Error querying Supabase in /api/quiz/random:", e);
    }

    let candidatePool: Question[] = [];

    if (isLiveQuiz) {
      // Live Quiz Game: ONLY "General Knowledge(GK)" questions allowed!
      const dbGkQuestions = dbPool.filter(q => {
        const subj = q.subject || q.subjectName || "";
        return isSubjectMatch(subj, "General Knowledge(GK)");
      });

      const fallbackGkQuestions = QUIZ_QUESTIONS.filter(q => {
        const subj = q.subject || q.subjectName || "";
        return isSubjectMatch(subj, "General Knowledge(GK)");
      }).map(normalizeRawQuestion);

      // Merge Supabase questions with fallback GK questions to guarantee a deep pool
      const seenIds = new Set<string | number>();
      const seenTexts = new Set<string>();

      for (const q of dbGkQuestions) {
        const textKey = q.question.trim().toLowerCase();
        if (!seenIds.has(q.id) && !seenTexts.has(textKey)) {
          seenIds.add(q.id);
          seenTexts.add(textKey);
          candidatePool.push(q);
        }
      }

      for (const q of fallbackGkQuestions) {
        const textKey = q.question.trim().toLowerCase();
        if (!seenIds.has(q.id) && !seenTexts.has(textKey)) {
          seenIds.add(q.id);
          seenTexts.add(textKey);
          candidatePool.push(q);
        }
      }
    } else {
      const subject = searchParams.get("subject");
      const fullPool = dbPool.length > 0 ? dbPool : QUIZ_QUESTIONS.map(normalizeRawQuestion);

      if (subject && subject !== "all") {
        candidatePool = fullPool.filter(q => isSubjectMatch(q.subject || "", subject));
      } else {
        candidatePool = fullPool;
      }

      if (candidatePool.length === 0) {
        candidatePool = QUIZ_QUESTIONS.map(normalizeRawQuestion);
      }
    }

    // Step A: Deduplicate candidate pool
    const uniqueCandidates: Question[] = [];
    const dedupKeys = new Set<string>();
    for (const q of candidatePool) {
      const key = `${q.id}:::${q.question.trim().toLowerCase()}`;
      if (!dedupKeys.has(key)) {
        dedupKeys.add(key);
        uniqueCandidates.push(q);
      }
    }

    // Step B: Partition into unseen (preferred) vs already seen (excluded)
    const unseenCandidates = uniqueCandidates.filter(q => {
      const idStr = String(q.id);
      const text = q.question.trim().toLowerCase();
      return !excludeIds.has(idStr) && !excludeIds.has(text);
    });

    const seenCandidates = uniqueCandidates.filter(q => {
      const idStr = String(q.id);
      const text = q.question.trim().toLowerCase();
      return excludeIds.has(idStr) || excludeIds.has(text);
    });

    const shuffledUnseen = fisherYatesShuffle(unseenCandidates);
    const shuffledSeen = fisherYatesShuffle(seenCandidates);

    let selectedQuestions: Question[] = [];
    let cycleReset = false;

    if (shuffledUnseen.length >= limit) {
      // Ideal case: Plenty of unseen questions! Pick exclusively from unseen
      selectedQuestions = shuffledUnseen.slice(0, limit);
    } else {
      // The unseen pool is nearly exhausted (or smaller than limit).
      // Take all remaining unseen questions, then fill remaining spots from shuffled seen questions.
      selectedQuestions = [
        ...shuffledUnseen,
        ...shuffledSeen.slice(0, Math.max(0, limit - shuffledUnseen.length))
      ];
      cycleReset = true; // Signal client that all questions have been seen and cycle can reset
    }

    // If still less than limit for any reason, re-shuffle candidate pool
    if (selectedQuestions.length < limit && uniqueCandidates.length > 0) {
      const remainingNeeded = limit - selectedQuestions.length;
      const alreadyPickedIds = new Set(selectedQuestions.map(q => q.id));
      const poolShuffled = fisherYatesShuffle(uniqueCandidates.filter(q => !alreadyPickedIds.has(q.id)));
      selectedQuestions = [...selectedQuestions, ...poolShuffled.slice(0, remainingNeeded)];
    }

    // Step C: Shuffle options for EVERY selected question
    const finalQuestions = selectedQuestions.map(shuffleQuestionOptions);

    return NextResponse.json({
      questions: finalQuestions,
      totalPoolCount: uniqueCandidates.length,
      unseenCountRemaining: Math.max(0, unseenCandidates.length - finalQuestions.length),
      cycleReset
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
