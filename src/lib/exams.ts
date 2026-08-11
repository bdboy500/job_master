import { getSupabase } from "./supabase";
import { Question, QUIZ_QUESTIONS } from "../data";

export interface ExamPaper {
  id: string;
  title: string;
  course: string; // "all_courses", "bcs", "bank", "primary", "ntrca", "psc", "all_job", "bangla", "english", "mathematics", "science", etc.
  subSubject?: string; // "all", "Bangla 1st Paper", "Bangla 2nd Paper", "Physics", "Arithmetic (পাটিগণিত)", etc.
  categoryType?: "our_course" | "prep_hub";
  examType: "weekly" | "daily" | "subject" | "special";
  subject?: string;
  questionCount: number;
  timePerQuestionSeconds: number; // default 36s
  totalDurationSeconds: number; // questionCount * 36
  totalMarks: number;
  topic: string;
  examDate: string;
  startDateTime?: string; // YYYY-MM-DDTHH:mm
  endDateTime?: string;   // YYYY-MM-DDTHH:mm
  status: "Live" | "Upcoming" | "Completed" | "Archive";
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}

export function sortExamPapersForDisplay(papers: ExamPaper[]): ExamPaper[] {
  return [...papers].sort((a, b) => {
    const statusA = getExamStatus(a);
    const statusB = getExamStatus(b);

    const statusWeight = { Live: 1, Upcoming: 2, Archive: 3 };
    const wA = statusWeight[statusA] || 4;
    const wB = statusWeight[statusB] || 4;

    if (wA !== wB) {
      return wA - wB; // Live (1) before Upcoming (2) before Archive (3)
    }

    if (statusA === "Live") {
      // Live exams: newest live exam on top
      const timeA = new Date(a.updatedAt || a.createdAt || a.startDateTime || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || b.startDateTime || 0).getTime();
      return timeB - timeA;
    }

    if (statusA === "Upcoming") {
      // Upcoming exams: sorted by addition order (oldest added first, remains on top even when edited)
      const timeA = new Date(a.createdAt || a.startDateTime || 0).getTime();
      const timeB = new Date(b.createdAt || b.startDateTime || 0).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeA - timeB;
      }
      return a.id.localeCompare(b.id);
    }

    // Default or Archive sorting: newest updated/created first
    const updatedA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const updatedB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return updatedB - updatedA;
  });
}

export function getExamStatus(paper: ExamPaper): "Live" | "Upcoming" | "Archive" {
  const now = new Date();

  if (paper.startDateTime && paper.endDateTime) {
    const start = new Date(paper.startDateTime);
    const end = new Date(paper.endDateTime);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (now < start) {
        return "Upcoming";
      } else if (now >= start && now <= end) {
        return "Live";
      } else {
        return "Archive";
      }
    }
  }

  if (paper.endDateTime) {
    const end = new Date(paper.endDateTime);
    if (!isNaN(end.getTime())) {
      if (now > end) {
        return "Archive";
      } else {
        return "Live";
      }
    }
  }

  // Fallback if status is explicitly set to archive/completed/upcoming
  const s = (paper.status || "").toLowerCase();
  if (s === "archive" || s === "archived" || s === "completed") return "Archive";
  if (s === "upcoming") return "Upcoming";

  // Check examDate string if present (e.g. "Mon, Aug 3, 2026")
  if (paper.examDate && paper.examDate !== "Today") {
    const parsedDate = new Date(paper.examDate);
    if (!isNaN(parsedDate.getTime())) {
      const endOfExamDate = new Date(parsedDate);
      endOfExamDate.setHours(23, 59, 59, 999);
      if (now > endOfExamDate) {
        return "Archive";
      }
    }
  }

  return "Live";
}

export const DEFAULT_EXAM_PAPERS: ExamPaper[] = [
  {
    id: "exam-bcs-weekly-01",
    title: "Live MCQ ফ্রি সাপ্তাহিক ফুল মডেল টেস্ট: বিসিএস প্রিলি",
    course: "bcs",
    examType: "weekly",
    subject: "All Subjects",
    questionCount: 20,
    timePerQuestionSeconds: 36,
    totalDurationSeconds: 20 * 36,
    totalMarks: 20,
    topic: '"Award Mania: Season - 20" এর জন্য প্রযোজ্য ও সাম্প্রতিক বিষয়াবলী',
    examDate: "Mon, Aug 3, 2026",
    startDateTime: "2026-08-01T00:00",
    endDateTime: "2026-08-15T23:59",
    status: "Live",
    questions: QUIZ_QUESTIONS.slice(0, 20)
  },
  {
    id: "exam-bcs-daily-01",
    title: "ডেইলি কুইক টেস্ট: বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলী",
    course: "bcs",
    examType: "daily",
    subject: "Bangladesh Affairs",
    questionCount: 10,
    timePerQuestionSeconds: 36,
    totalDurationSeconds: 10 * 36,
    totalMarks: 10,
    topic: "মুক্তিযুদ্ধ, মুজিবনগর সরকার ও সাম্প্রতিক আন্তর্জাতিক ঘটনাপ্রবাহ",
    examDate: "Mon, Aug 3, 2026",
    startDateTime: "2026-08-01T00:00",
    endDateTime: "2026-08-10T23:59",
    status: "Live",
    questions: QUIZ_QUESTIONS.filter(q => q.subject === "Bangladesh Affairs" || q.subject === "International Affairs").slice(0, 10)
  },
  {
    id: "exam-bank-weekly-01",
    title: "ব্যাংক নিয়োগ পরীক্ষার স্পেশাল ফুল মক টেস্ট",
    course: "bank",
    examType: "weekly",
    subject: "All Subjects",
    questionCount: 15,
    timePerQuestionSeconds: 36,
    totalDurationSeconds: 15 * 36,
    totalMarks: 15,
    topic: "English Grammar, Mathematics & Technology Special Focus",
    examDate: "Wed, Jul 29, 2026",
    startDateTime: "2026-07-01T00:00",
    endDateTime: "2026-07-20T23:59",
    status: "Archive",
    questions: QUIZ_QUESTIONS.filter(q => q.subject === "Technology" || q.subject === "General Science" || q.subject === "Geography").slice(0, 15)
  },
  {
    id: "exam-primary-01",
    title: "প্রাথমিক শিক্ষক নিয়োগ স্পেশাল মডেল টেস্ট - সেট ১",
    course: "primary",
    examType: "weekly",
    subject: "All Subjects",
    questionCount: 12,
    timePerQuestionSeconds: 36,
    totalDurationSeconds: 12 * 36,
    totalMarks: 12,
    topic: "বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞান পূর্ণাঙ্গ সেট",
    examDate: "Tue, Jul 28, 2026",
    startDateTime: "2026-07-01T00:00",
    endDateTime: "2026-07-22T23:59",
    status: "Archive",
    questions: QUIZ_QUESTIONS.slice(5, 17)
  }
];

export function getCachedExamPapers(): ExamPaper[] {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("job_master_exam_papers");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed parsing cached exam papers:", e);
      }
    }
  }
  return DEFAULT_EXAM_PAPERS;
}

let examPapersInFlightPromise: Promise<ExamPaper[]> | null = null;
let examPapersMemoryCache: ExamPaper[] | null = null;

export function invalidateExamPapersCache() {
  examPapersMemoryCache = null;
  examPapersInFlightPromise = null;
}

export async function fetchExamPapersFromDb(forceRefresh = false): Promise<ExamPaper[]> {
  if (!forceRefresh && examPapersMemoryCache && examPapersMemoryCache.length > 0) {
    return examPapersMemoryCache;
  }

  if (!forceRefresh && examPapersInFlightPromise) {
    return examPapersInFlightPromise;
  }

  examPapersInFlightPromise = (async () => {
    let localPapers: ExamPaper[] = [];
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("job_master_exam_papers");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localPapers = parsed;
          }
        } catch (e) {
          console.error("Failed parsing cached exam papers:", e);
        }
      }
    }

    try {
      const supabase = getSupabase();
      if (supabase) {
        // Fetch ONLY lightweight metadata for homepage cards (excluding heavy 'questions' column)
        const supabasePromise = supabase
          .from("exam_papers")
          .select("id, title, course, exam_type, subject, question_count, time_per_question, total_duration, total_marks, topic, exam_date, status, questions, created_at, sub_subject, category_type");
        
        const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error("Network Timeout") }), 2500)
        );

        const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);
        
        if (!error && data && Array.isArray(data) && data.length > 0) {
          const parsedSupabaseData: ExamPaper[] = data.map((item: any) => parseRawExamPaper(item));

          // Sort parsedSupabaseData by updatedAt / createdAt descending
          parsedSupabaseData.sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
          });

          // Store in memory cache
          if (typeof window !== "undefined") {
            localStorage.setItem("job_master_exam_papers", JSON.stringify(parsedSupabaseData));
          }
          examPapersMemoryCache = parsedSupabaseData;
          return parsedSupabaseData;
        }
      }
    } catch (err) {
      console.warn("Falling back to local exam papers:", err);
    } finally {
      examPapersInFlightPromise = null;
    }

    if (localPapers && localPapers.length > 0) {
      localPapers.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      examPapersMemoryCache = localPapers;
      return localPapers;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("job_master_exam_papers", JSON.stringify(DEFAULT_EXAM_PAPERS));
    }
    examPapersMemoryCache = DEFAULT_EXAM_PAPERS;
    return DEFAULT_EXAM_PAPERS;
  })();

  return examPapersInFlightPromise;
}

export function parseRawExamPaper(item: any): ExamPaper {
  let questionsArr: Question[] = [];
  let startDT: string | undefined = item.startDateTime || item.start_date_time || item.startDate;
  let endDT: string | undefined = item.endDateTime || item.end_date_time || item.endDate;
  let createdAt: string | undefined = item.createdAt || item.created_at;
  let updatedAt: string | undefined = item.updatedAt || item.updated_at;
  let subSubjectVal: string | undefined = item.subSubject || item.sub_subject;
  let categoryTypeVal: string | undefined = item.categoryType || item.category_type;
  
  if (typeof item.questions === "string") {
    try {
      const parsed = JSON.parse(item.questions);
      if (Array.isArray(parsed)) {
        questionsArr = parsed;
      } else if (parsed && typeof parsed === "object") {
        questionsArr = parsed.questions || [];
        if (parsed.subSubject) subSubjectVal = parsed.subSubject;
        if (parsed.categoryType) categoryTypeVal = parsed.categoryType;
        startDT = parsed.startDateTime || startDT;
        endDT = parsed.endDateTime || endDT;
        createdAt = parsed.createdAt || createdAt;
        updatedAt = parsed.updatedAt || updatedAt;
      }
    } catch (e) {
      questionsArr = [];
    }
  } else if (Array.isArray(item.questions)) {
    questionsArr = item.questions;
  } else if (item.questions && typeof item.questions === "object") {
    questionsArr = item.questions.questions || [];
    if (item.questions.subSubject) subSubjectVal = item.questions.subSubject;
    if (item.questions.categoryType) categoryTypeVal = item.questions.categoryType;
    startDT = item.questions.startDateTime || startDT;
    endDT = item.questions.endDateTime || endDT;
    createdAt = item.questions.createdAt || createdAt;
    updatedAt = item.questions.updatedAt || updatedAt;
  }

  return {
    id: item.id,
    title: item.title,
    course: item.course,
    subSubject: subSubjectVal || item.subject,
    categoryType: (categoryTypeVal as any) || "our_course",
    examType: item.examType || item.exam_type || "weekly",
    subject: item.subject,
    questionCount: item.questionCount || item.question_count || (Array.isArray(questionsArr) && questionsArr.length > 0 ? questionsArr.length : 10),
    timePerQuestionSeconds: item.timePerQuestionSeconds || item.time_per_question || 36,
    totalDurationSeconds: item.totalDurationSeconds || item.total_duration || 360,
    totalMarks: item.totalMarks || item.total_marks || 10,
    topic: item.topic || "মডেল টেস্ট",
    examDate: item.examDate || item.exam_date || "Today",
    startDateTime: startDT,
    endDateTime: endDT,
    status: item.status || "Live",
    questions: questionsArr,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || createdAt || new Date().toISOString()
  };
}

export async function fetchExamPaperById(id: string): Promise<ExamPaper | null> {
  // Check memory cache first
  if (examPapersMemoryCache) {
    const cached = examPapersMemoryCache.find(p => p.id === id);
    if (cached && Array.isArray(cached.questions) && cached.questions.length > 0) {
      return cached;
    }
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("exam_papers")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        const fullPaper = parseRawExamPaper(data);
        // If questions array is empty (e.g., fallback), slice from DEFAULT_EXAM_PAPERS if matching ID exists
        if (!fullPaper.questions || fullPaper.questions.length === 0) {
          const defaultMatch = DEFAULT_EXAM_PAPERS.find(p => p.id === id);
          if (defaultMatch && defaultMatch.questions) {
            fullPaper.questions = defaultMatch.questions;
          }
        }
        
        // Update memory cache
        if (examPapersMemoryCache) {
          const idx = examPapersMemoryCache.findIndex(p => p.id === id);
          if (idx >= 0) {
            examPapersMemoryCache[idx] = fullPaper;
          } else {
            examPapersMemoryCache.push(fullPaper);
          }
        }
        return fullPaper;
      }
    }
  } catch (err) {
    console.error("Error fetching full exam paper by id:", err);
  }

  // Fallback to DEFAULT_EXAM_PAPERS
  const defaultMatch = DEFAULT_EXAM_PAPERS.find(p => p.id === id);
  if (defaultMatch) return defaultMatch;

  return null;
}

export async function saveExamPaperToDb(paper: ExamPaper): Promise<boolean> {
  invalidateExamPapersCache();
  const paperWithTimestamps: ExamPaper = {
    ...paper,
    createdAt: paper.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  let currentPapers: ExamPaper[] = [];
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("job_master_exam_papers");
    if (cached) {
      try { currentPapers = JSON.parse(cached); } catch (e) {}
    }
  }
  
  // Remove existing paper with same ID if exists
  const filtered = currentPapers.filter(p => p.id !== paperWithTimestamps.id);
  // Put updated or newly created paper at the VERY TOP
  const updatedPapers = [paperWithTimestamps, ...filtered];

  if (typeof window !== "undefined") {
    localStorage.setItem("job_master_exam_papers", JSON.stringify(updatedPapers));
    window.dispatchEvent(new CustomEvent("jobmaster_exam_papers_updated", { detail: updatedPapers }));
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const questionsData = JSON.stringify({
        questions: paperWithTimestamps.questions || [],
        subSubject: paperWithTimestamps.subSubject,
        categoryType: paperWithTimestamps.categoryType,
        startDateTime: paperWithTimestamps.startDateTime,
        endDateTime: paperWithTimestamps.endDateTime,
        createdAt: paperWithTimestamps.createdAt,
        updatedAt: paperWithTimestamps.updatedAt
      });

      const payload: any = {
        id: paperWithTimestamps.id,
        title: paperWithTimestamps.title,
        course: paperWithTimestamps.course,
        exam_type: paperWithTimestamps.examType,
        subject: paperWithTimestamps.subSubject || paperWithTimestamps.subject || "All Subjects",
        sub_subject: paperWithTimestamps.subSubject,
        category_type: paperWithTimestamps.categoryType,
        question_count: paperWithTimestamps.questionCount,
        time_per_question: paperWithTimestamps.timePerQuestionSeconds,
        total_duration: paperWithTimestamps.totalDurationSeconds,
        total_marks: paperWithTimestamps.totalMarks,
        topic: paperWithTimestamps.topic,
        exam_date: paperWithTimestamps.examDate,
        status: paperWithTimestamps.status,
        questions: questionsData
      };

      const { error } = await supabase.from("exam_papers").upsert(payload, { onConflict: "id" });
      if (error) {
        console.warn("Supabase upsert exam_paper error:", error);
        return false;
      }
    }
  } catch (e) {
    console.warn("Supabase save exam paper failed:", e);
    return false;
  }
  return true;
}

export async function deleteExamPaperFromDb(id: string): Promise<boolean> {
  invalidateExamPapersCache();
  let filtered: ExamPaper[] = [];
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("job_master_exam_papers");
    if (cached) {
      try {
        const parsed: ExamPaper[] = JSON.parse(cached);
        filtered = parsed.filter(p => p.id !== id);
        localStorage.setItem("job_master_exam_papers", JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("jobmaster_exam_papers_updated", { detail: filtered }));
      } catch (e) {}
    }
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("exam_papers").delete().eq("id", id);
    }
  } catch (e) {
    console.warn("Supabase delete exam paper failed:", e);
  }
  return true;
}

export function subscribeToExamPapers(onUpdate: (papers: ExamPaper[]) => void) {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = (e: any) => {
    if (e.detail) {
      onUpdate(e.detail);
    } else {
      fetchExamPapersFromDb().then(onUpdate);
    }
  };

  window.addEventListener("jobmaster_exam_papers_updated", handleUpdate);
  window.addEventListener("storage", handleUpdate);

  let supabaseChannel: any = null;
  let supabaseRef: any = null;

  try {
    const supabase = getSupabase();
    if (supabase) {
      supabaseRef = supabase;
      supabaseChannel = supabase
        .channel("public:exam_papers")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "exam_papers" },
          async () => {
            invalidateExamPapersCache();
            const updatedPapers = await fetchExamPapersFromDb(true);
            onUpdate(updatedPapers);
          }
        )
        .subscribe();
    }
  } catch (e) {
    console.warn("Realtime subscription setup failed:", e);
  }

  return () => {
    if (supabaseRef && supabaseChannel) {
      try {
        supabaseRef.removeChannel(supabaseChannel);
      } catch (err) {
        console.warn("Error removing exam_papers realtime channel:", err);
      }
    }
    window.removeEventListener("jobmaster_exam_papers_updated", handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}
