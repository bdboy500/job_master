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

interface CacheEntry {
  questions: Question[];
  timestamp: number;
}

// In-memory cache to eliminate repeated Supabase queries, maximize speed, and reduce egress to near-zero
const serverQuizCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutes

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

    let candidatePool: Question[] = [];

    if (isLiveQuiz) {
      // 1. Check in-memory server cache for Live Quiz GK questions (0 egress, sub-10ms response)
      const cacheKey = "live_quiz_gk";
      const cached = serverQuizCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.questions.length > 0) {
        candidatePool = [...cached.questions];
      } else {
        // Query Supabase ONLY for GK questions with essential columns (drastically cuts egress)
        let fetchedGk: Question[] = [];
        try {
          const supabase = getSupabase();
          if (supabase) {
            const { data, error } = await supabase
              .from("questions")
              .select("id, subjectName, questionText, options, correctOptionIndex, explanation")
              .in("subjectName", [
                "General Knowledge(GK)",
                "General Knowledge (GK)",
                "General Knowledge",
                "GK",
                "general knowledge",
                "gk",
                "সাধারণ জ্ঞান"
              ]);

            if (!error && data && data.length > 0) {
              fetchedGk = data.map(normalizeRawQuestion);
            }
          }
        } catch (e) {
          console.warn("Error querying GK questions from Supabase:", e);
        }

        const fallbackGkQuestions = QUIZ_QUESTIONS.filter(q => {
          const subj = q.subject || q.subjectName || "";
          return isSubjectMatch(subj, "General Knowledge(GK)");
        }).map(normalizeRawQuestion);

        // Merge Supabase questions with fallback GK questions to guarantee a deep pool
        const seenIds = new Set<string | number>();
        const seenTexts = new Set<string>();
        const merged: Question[] = [];

        for (const q of fetchedGk) {
          const textKey = q.question.trim().toLowerCase();
          if (!seenIds.has(q.id) && !seenTexts.has(textKey)) {
            seenIds.add(q.id);
            seenTexts.add(textKey);
            merged.push(q);
          }
        }

        for (const q of fallbackGkQuestions) {
          const textKey = q.question.trim().toLowerCase();
          if (!seenIds.has(q.id) && !seenTexts.has(textKey)) {
            seenIds.add(q.id);
            seenTexts.add(textKey);
            merged.push(q);
          }
        }

        if (merged.length > 0) {
          serverQuizCache.set(cacheKey, { questions: merged, timestamp: Date.now() });
          candidatePool = [...merged];
        } else {
          candidatePool = fallbackGkQuestions;
        }
      }
    } else {
      const subject = searchParams.get("subject") || "all";
      const cacheKey = `subject_${subject.toLowerCase()}`;
      const cached = serverQuizCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.questions.length > 0) {
        candidatePool = [...cached.questions];
      } else {
        let fetched: Question[] = [];
        try {
          const supabase = getSupabase();
          if (supabase) {
            let query = supabase
              .from("questions")
              .select("id, subjectName, questionText, options, correctOptionIndex, explanation")
              .limit(60);

            if (subject !== "all" && subject.trim() !== "") {
              query = query.ilike("subjectName", `%${subject}%`);
            }

            const { data, error } = await query;
            if (!error && data && data.length > 0) {
              fetched = data.map(normalizeRawQuestion);
            }
          }
        } catch (e) {
          console.warn("Error querying questions from Supabase:", e);
        }

        const fallback = QUIZ_QUESTIONS.filter(q => {
          if (subject === "all") return true;
          return isSubjectMatch(q.subject || "", subject);
        }).map(normalizeRawQuestion);

        const merged = fetched.length > 0 ? fetched : fallback;
        if (merged.length > 0) {
          serverQuizCache.set(cacheKey, { questions: merged, timestamp: Date.now() });
        }
        candidatePool = merged.length > 0 ? merged : QUIZ_QUESTIONS.map(normalizeRawQuestion);
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
