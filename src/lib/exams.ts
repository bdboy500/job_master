import { getSupabase } from "./supabase";
import { Question, QUIZ_QUESTIONS } from "../data";

export interface ExamPaper {
  id: string;
  title: string;
  course: string; // "bcs", "bank", "primary", "ntrca", "psc", "all_job", "bangla", "english", "math", "science"
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
}

export function getExamStatus(paper: ExamPaper): "Live" | "Upcoming" | "Archive" {
  if (paper.startDateTime && paper.endDateTime) {
    const now = new Date();
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
  // Fallback if startDateTime or endDateTime not set
  const s = (paper.status || "Live").toLowerCase();
  if (s === "archive" || s === "archived" || s === "completed") return "Archive";
  if (s === "upcoming") return "Upcoming";
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
    examDate: "Fri, Jul 31, 2026",
    startDateTime: "2026-07-20T00:00",
    endDateTime: "2026-07-31T23:59",
    status: "Live",
    questions: QUIZ_QUESTIONS.slice(0, 20)
  },
  {
    id: "exam-bcs-health-01",
    title: "BCS Health Special: মেডিকেল ও স্বাস্থ্য ক্যাডার বিশেষ মডেল টেস্ট",
    course: "bcs",
    examType: "special",
    subject: "Medical Science & Health",
    questionCount: 15,
    timePerQuestionSeconds: 36,
    totalDurationSeconds: 15 * 36,
    totalMarks: 15,
    topic: "চিকিৎসাবিজ্ঞান, স্বাস্থ্যনীতি ও মানব শারীরবিদ্যা",
    examDate: "Sat, Aug 01, 2026",
    startDateTime: "2026-07-24T00:00",
    endDateTime: "2026-08-01T23:59",
    status: "Live",
    questions: QUIZ_QUESTIONS.slice(0, 15)
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
    examDate: "Thu, Jul 30, 2026",
    startDateTime: "2026-07-24T00:00",
    endDateTime: "2026-07-30T23:59",
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

export async function fetchExamPapersFromDb(): Promise<ExamPaper[]> {
  let localPapers: ExamPaper[] = [];
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem("job_master_exam_papers");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
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
      const { data, error } = await supabase.from("exam_papers").select("*");
      
      if (!error && data) {
        const parsedSupabaseData: ExamPaper[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          course: item.course,
          examType: item.examType || item.exam_type || "weekly",
          subject: item.subject,
          questionCount: item.questionCount || item.question_count || (Array.isArray(item.questions) ? item.questions.length : 10),
          timePerQuestionSeconds: item.timePerQuestionSeconds || item.time_per_question || 36,
          totalDurationSeconds: item.totalDurationSeconds || item.total_duration || 360,
          totalMarks: item.totalMarks || item.total_marks || 10,
          topic: item.topic || "মডেল টেস্ট",
          examDate: item.examDate || item.exam_date || "Today",
          startDateTime: item.startDateTime || item.start_date_time || item.startDate,
          endDateTime: item.endDateTime || item.end_date_time || item.endDate,
          status: item.status || "Live",
          questions: typeof item.questions === "string" 
            ? (item.questions ? JSON.parse(item.questions) : []) 
            : (Array.isArray(item.questions) ? item.questions : [])
        }));

        // Merge Supabase and Local papers (Local papers take precedence to preserve newly added/edited items)
        const mergedMap = new Map<string, ExamPaper>();
        parsedSupabaseData.forEach(p => mergedMap.set(p.id, p));
        localPapers.forEach(p => mergedMap.set(p.id, p));

        const mergedPapers = Array.from(mergedMap.values());

        if (typeof window !== "undefined") {
          localStorage.setItem("job_master_exam_papers", JSON.stringify(mergedPapers));
        }
        return mergedPapers;
      }
    }
  } catch (err) {
    console.warn("Falling back to local exam papers:", err);
  }

  if (localPapers && localPapers.length > 0) {
    return localPapers;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("job_master_exam_papers", JSON.stringify(DEFAULT_EXAM_PAPERS));
  }
  return DEFAULT_EXAM_PAPERS;
}

export async function saveExamPaperToDb(paper: ExamPaper): Promise<boolean> {
  const currentPapers = await fetchExamPapersFromDb();
  const index = currentPapers.findIndex(p => p.id === paper.id);
  
  let updatedPapers: ExamPaper[];
  if (index >= 0) {
    updatedPapers = [...currentPapers];
    updatedPapers[index] = paper;
  } else {
    updatedPapers = [paper, ...currentPapers];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("job_master_exam_papers", JSON.stringify(updatedPapers));
    window.dispatchEvent(new CustomEvent("jobmaster_exam_papers_updated", { detail: updatedPapers }));
    window.dispatchEvent(new Event("storage"));
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const payload = {
        id: paper.id,
        title: paper.title,
        course: paper.course,
        exam_type: paper.examType,
        subject: paper.subject || "All Subjects",
        question_count: paper.questionCount,
        time_per_question: paper.timePerQuestionSeconds,
        total_duration: paper.totalDurationSeconds,
        total_marks: paper.totalMarks,
        topic: paper.topic,
        exam_date: paper.examDate,
        start_date_time: paper.startDateTime,
        end_date_time: paper.endDateTime,
        status: paper.status,
        questions: typeof paper.questions === "string" ? paper.questions : JSON.stringify(paper.questions)
      };

      const { error } = await supabase.from("exam_papers").upsert(payload, { onConflict: "id" });
      if (error) {
        console.warn("Supabase upsert exam_paper error with snake_case, trying camelCase fallback:", error);
        const fallbackPayload = {
          id: paper.id,
          title: paper.title,
          course: paper.course,
          examType: paper.examType,
          subject: paper.subject || "All Subjects",
          questionCount: paper.questionCount,
          timePerQuestionSeconds: paper.timePerQuestionSeconds,
          totalDurationSeconds: paper.totalDurationSeconds,
          totalMarks: paper.totalMarks,
          topic: paper.topic,
          examDate: paper.examDate,
          startDateTime: paper.startDateTime,
          endDateTime: paper.endDateTime,
          status: paper.status,
          questions: typeof paper.questions === "string" ? paper.questions : JSON.stringify(paper.questions)
        };
        const { error: err2 } = await supabase.from("exam_papers").upsert(fallbackPayload, { onConflict: "id" });
        if (err2) {
          console.warn("Supabase upsert exam_paper fallback failed:", err2);
        }
      }
    }
  } catch (e) {
    console.warn("Supabase save exam paper failed:", e);
  }
  return true;
}

export async function deleteExamPaperFromDb(id: string): Promise<boolean> {
  const currentPapers = await fetchExamPapersFromDb();
  const filtered = currentPapers.filter(p => p.id !== id);

  if (typeof window !== "undefined") {
    localStorage.setItem("job_master_exam_papers", JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("jobmaster_exam_papers_updated", { detail: filtered }));
    window.dispatchEvent(new Event("storage"));
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

  let removeRealtimeChannel = () => {};

  try {
    const supabase = getSupabase();
    if (supabase) {
      const channel = supabase
        .channel("public:exam_papers")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "exam_papers" },
          async () => {
            const updatedPapers = await fetchExamPapersFromDb();
            onUpdate(updatedPapers);
          }
        )
        .subscribe();

      removeRealtimeChannel = () => {
        supabase.removeChannel(channel);
      };
    }
  } catch (e) {
    console.warn("Realtime subscription setup failed:", e);
  }

  return () => {
    removeRealtimeChannel();
    window.removeEventListener("jobmaster_exam_papers_updated", handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}
