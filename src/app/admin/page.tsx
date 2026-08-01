"use client";

import { useState, useEffect } from "react";
import MathRenderer from "@/src/components/MathRenderer";
import { 
  Users, 
  BookOpen, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  LogOut, 
  LogIn, 
  Award, 
  Check, 
  X, 
  HelpCircle, 
  Megaphone,
  Bell,
  ShieldCheck,
  AlertOctagon,
  Eye,
  Settings,
  Database,
  Lock,
  Compass,
  FileText,
  Pencil,
  Filter,
  Sparkles,
  RefreshCw,
  Archive,
  Package,
  Tag,
  ArrowUp,
  ArrowDown,
  Layers,
  Grid,
  ChevronRight,
  Briefcase,
  Zap,
  Globe,
  Calculator,
  GraduationCap,
  Sliders,
  Flame,
  Newspaper,
  TrendingUp,
  Laptop,
  Monitor,
  FlaskConical,
  Atom,
  Book
} from "lucide-react";
import Link from "next/link";
import { QUIZ_QUESTIONS, Question } from "../../data";
import { getSupabase } from "../../lib/supabase";
import { ExamPaper, fetchExamPapersFromDb, saveExamPaperToDb, deleteExamPaperFromDb, getExamStatus, subscribeToExamPapers } from "../../lib/exams";
import { PackageItem, fetchPackagesFromDb, savePackageToDb, deletePackageFromDb, subscribeToPackages, syncAllPackagesToSupabase } from "../../lib/packages";
import { getTodayVisitorCount } from "../../lib/visitors";
import { AppSettings, getCachedAppSettings, fetchAppSettingsFromDb, saveAppSettingsToDb } from "../../lib/app_settings";
import { 
  CourseItem, 
  PrepSubjectItem, 
  SubCategoryItem, 
  SubCategory2Item,
  getCachedCourses, 
  getCachedPrepSubjects, 
  fetchCoursesFromDb, 
  fetchPrepSubjectsFromDb, 
  saveCoursesToDb, 
  savePrepSubjectsToDb, 
  subscribeToCoursesAndPrep,
  sanitizeSubSubjects
} from "../../lib/courses_and_subjects";

// Interfaces for local state types
function renderPrepIcon(iconName?: string, className = "w-5 h-5 stroke-[2.2px]") {
  const iconMap: Record<string, any> = {
    BookOpen: BookOpen,
    Calculator: Calculator,
    Globe: Globe,
    GraduationCap: GraduationCap,
    FileText: FileText,
    Briefcase: Briefcase,
    Users: Users,
    Shield: ShieldCheck,
    ShieldCheck: ShieldCheck,
    Zap: Zap,
    Award: Award,
    Flame: Flame,
    Sparkles: Sparkles,
    Layers: Layers,
    Grid: Grid,
    Tag: Tag,
    Compass: Compass,
    HelpCircle: HelpCircle,
    Newspaper: Newspaper,
    TrendingUp: TrendingUp,
    Laptop: Laptop,
    Monitor: Monitor,
    FlaskConical: FlaskConical,
    Atom: Atom,
    Book: Book,
  };
  const IconComp = (iconName && iconMap[iconName]) || BookOpen;
  return <IconComp className={className} />;
}

function formatDisplayDate(dateTimeStr: string): string {
  if (!dateTimeStr) return "";
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[d.getDay()];
    const monthName = months[d.getMonth()];
    const dateNum = d.getDate();
    const year = d.getFullYear();
    return `${dayName}, ${monthName} ${dateNum}, ${year}`;
  } catch {
    return dateTimeStr;
  }
}

function getNowLocalDateTimeStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getTodayEndDateTimeStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T23:59`;
}

function normalizeQuestion(q: any): Question {
  if (!q) {
    return {
      id: 0,
      question: "",
      questionText: "",
      subject: "General",
      subjectName: "General",
      options: ["", "", "", ""],
      correctIndex: 0,
      correctOptionIndex: 0,
      explanation: ""
    };
  }
  const qText = String(q.question || q.questionText || q.question_text || q.title || "").trim();
  const subName = String(q.subject || q.subjectName || q.subject_name || "General").trim();
  const cIdx = q.correctIndex !== undefined && q.correctIndex !== null 
    ? Number(q.correctIndex) 
    : (q.correctOptionIndex !== undefined && q.correctOptionIndex !== null ? Number(q.correctOptionIndex) : 0);
  const opts = Array.isArray(q.options) ? q.options.map((o: any) => String(o || "")) : ["", "", "", ""];
  
  return {
    ...q,
    id: q.id || `q_${Math.random()}`,
    question: qText,
    questionText: qText,
    subject: subName,
    subjectName: subName,
    correctIndex: isNaN(cIdx) ? 0 : cIdx,
    correctOptionIndex: isNaN(cIdx) ? 0 : cIdx,
    options: opts,
    explanation: String(q.explanation || "").trim()
  };
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: "Active" | "Banned";
}

interface AdminOffer {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

export default function AdminPage() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");

  // Tab navigation states
  const [activeTab, setActiveTab] = useState<"questions" | "exam_papers" | "users" | "offers" | "packages" | "courses" | "prep_hub" | "switches">("questions");

  // App Settings State (Grid Display Limits)
  const [appSettings, setAppSettings] = useState<AppSettings>(getCachedAppSettings());

  // Packages Management State
  const [packagesList, setPackagesList] = useState<PackageItem[]>([]);
  const [pkgFormTitle, setPkgFormTitle] = useState("");
  const [pkgFormDesc, setPkgFormDesc] = useState("");
  const [pkgFormPrice, setPkgFormPrice] = useState("");
  const [pkgFormOldPrice, setPkgFormOldPrice] = useState("");
  const [pkgFormBadgePreset, setPkgFormBadgePreset] = useState<"none" | "POPULAR" | "BEST VALUE" | "NEW" | "BASIC" | "custom">("none");
  const [pkgFormBadgeCustom, setPkgFormBadgeCustom] = useState("");
  const [pkgFormCategory, setPkgFormCategory] = useState<"all" | "course">("all");
  const [pkgFormOrder, setPkgFormOrder] = useState<number>(1);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);

  // Our Courses Management State
  const [coursesList, setCoursesList] = useState<CourseItem[]>(getCachedCourses());
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormSerial, setCourseFormSerial] = useState<number>(1);
  const [courseFormId, setCourseFormId] = useState<string>("");
  const [courseFormName, setCourseFormName] = useState<string>("");
  const [courseFormTitle, setCourseFormTitle] = useState<string>("");
  const [courseFormDesc, setCourseFormDesc] = useState<string>("");
  const [courseFormCategory, setCourseFormCategory] = useState<string>("BCS");
  const [courseFormIcon, setCourseFormIcon] = useState<string>("BookOpen");
  const [courseFormBg, setCourseFormBg] = useState<string>("bg-[#FFF1E6]");
  const [courseFormIconColor, setCourseFormIconColor] = useState<string>("text-orange-600");
  const [courseFormSubSubjects, setCourseFormSubSubjects] = useState<SubCategoryItem[]>([]);

  // Preparation Hub Management State
  const [prepSubjectsList, setPrepSubjectsList] = useState<PrepSubjectItem[]>(getCachedPrepSubjects());
  const [editingPrepId, setEditingPrepId] = useState<string | null>(null);
  const [prepFormSerial, setPrepFormSerial] = useState<number>(1);
  const [prepFormId, setPrepFormId] = useState<string>("");
  const [prepFormName, setPrepFormName] = useState<string>("");
  const [prepFormBnName, setPrepFormBnName] = useState<string>("");
  const [prepFormSub, setPrepFormSub] = useState<string>("");
  const [prepFormIcon, setPrepFormIcon] = useState<string>("BookOpen");
  const [prepFormBg, setPrepFormBg] = useState<string>("bg-[#FFF1E6]");
  const [prepFormText, setPrepFormText] = useState<string>("text-orange-600");
  const [prepFormShowQuickTools, setPrepFormShowQuickTools] = useState<boolean>(true);
  const [prepFormSubSubjects, setPrepFormSubSubjects] = useState<SubCategoryItem[]>([]);

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Predefined Subjects required for Exam MCQ Hub
  const SUBJECTS = [
    "Bangla Literature",
    "Bangla Grammer",
    "English Literature",
    "English Grammer",
    "Bangladesh Affairs",
    "International Affairs",
    "Geography",
    "General Science",
    "Technology",
    "Mathematics (Arithmetic)",
    "Mathematics (Algebra )",
    "Mathematics (Geometry)",
    "Mental Ability",
    "Good Governance"
  ];

  // Dynamic Courses & Exam Types list
  const COURSES = [
    { id: "all_courses", name: "🌐 সকল কোর্স (All Courses - সব কোর্সে দেখাবে)" },
    ...coursesList.map(c => ({
      id: c.id,
      name: `${c.name} (${c.title})`
    }))
  ];

  // Dynamic Sub Subjects Map from dynamic Preparation Subjects and Courses
  const SUB_SUBJECTS_MAP: Record<string, { id: string; name: string }[]> = {
    all_courses: [{ id: "none", name: "None (কোনো সাব-সাবজেক্ট নেই)" }]
  };

  prepSubjectsList.forEach(subject => {
    const subs: { id: string; name: string }[] = [{ id: "none", name: "None (কোনো সাব-সাবজেক্ট নেই)" }];
    const cleanPrepSubs = sanitizeSubSubjects([subject])[0]?.subSubjects || [];
    cleanPrepSubs.forEach(sub => {
      subs.push({ id: sub.name, name: `${sub.name}${sub.sub ? ` (${sub.sub})` : ""}` });
      (sub.subCategories2 || []).forEach(sub2 => {
        subs.push({ id: sub2.name, name: `└─ ${sub2.name}` });
      });
    });

    if (subject.id) SUB_SUBJECTS_MAP[subject.id] = subs;
    if (subject.name) {
      SUB_SUBJECTS_MAP[subject.name] = subs;
      SUB_SUBJECTS_MAP[subject.name.toLowerCase()] = subs;
    }
    if (subject.bnName) {
      SUB_SUBJECTS_MAP[subject.bnName] = subs;
      SUB_SUBJECTS_MAP[subject.bnName.toLowerCase()] = subs;
    }
  });

  coursesList.forEach(course => {
    const subs: { id: string; name: string }[] = [{ id: "none", name: "None (কোনো সাব-সাবজেক্ট নেই)" }];
    const cleanCourseSubs = sanitizeSubSubjects([course])[0]?.subSubjects || [];
    cleanCourseSubs.forEach(sub => {
      subs.push({ id: sub.name, name: `${sub.name}${sub.sub ? ` (${sub.sub})` : ""}` });
      (sub.subCategories2 || []).forEach(sub2 => {
        subs.push({ id: sub2.name, name: `└─ ${sub2.name}` });
      });
    });

    if (course.id) {
      SUB_SUBJECTS_MAP[course.id] = subs;
      SUB_SUBJECTS_MAP[course.id.toLowerCase()] = subs;
    }
    if (course.name) {
      SUB_SUBJECTS_MAP[course.name] = subs;
      SUB_SUBJECTS_MAP[course.name.toLowerCase()] = subs;
    }
  });

  const EXAM_TYPES = [
    { id: "weekly", name: "সাপ্তাহিক মডেল টেস্ট (Weekly Model Test)" },
    { id: "daily", name: "ডেইলি কুইক টেস্ট (Daily Quick Test)" },
    { id: "subject", name: "বিষয়ভিত্তিক পরীক্ষা (Subject Wise Test)" }
  ];

  // ==========================================
  // EXAM PAPERS BUILDER STATE
  // ==========================================
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);

  // Form states for creating/editing paper
  const [paperCategoryType, setPaperCategoryType] = useState<"our_course" | "prep_hub">("our_course");
  const [paperTitle, setPaperTitle] = useState("Live MCQ ফ্রি সাপ্তাহিক ফুল মডেল টেস্ট: বিসিএস");
  const [paperCourse, setPaperCourse] = useState("bcs");
  const [paperSubSubject, setPaperSubSubject] = useState("all");
  const [paperPrepSubjectId, setPaperPrepSubjectId] = useState<string>("Bangla");
  const [paperPrepSubSubject, setPaperPrepSubSubject] = useState<string>("all");
  const [paperExamType, setPaperExamType] = useState<"weekly" | "daily" | "subject" | "special">("weekly");
  const [paperSubject, setPaperSubject] = useState("All Subjects");
  const [paperTopic, setPaperTopic] = useState('"Award Mania: Season - 20" এর জন্য প্রযোজ্য ও সকল বিষয়');
  const [paperStartDateTime, setPaperStartDateTime] = useState<string>("2026-07-24T00:00");
  const [paperEndDateTime, setPaperEndDateTime] = useState<string>("2026-07-31T23:59");
  const [paperDate, setPaperDate] = useState(() => formatDisplayDate("2026-07-24T00:00"));
  const [paperStatus, setPaperStatus] = useState<"Live" | "Upcoming" | "Completed" | "Archive">("Upcoming");
  const [paperTargetCount, setPaperTargetCount] = useState<number>(20);
  const [paperQuestions, setPaperQuestions] = useState<Question[]>([]);
  
  // Search & filter within question bank for adding to paper
  const [paperSearchQuery, setPaperSearchQuery] = useState("");
  const [paperSearchSubjects, setPaperSearchSubjects] = useState<string[]>(["All"]);

  const togglePaperSearchSubject = (sub: string) => {
    if (sub === "All") {
      setPaperSearchSubjects(["All"]);
      return;
    }
    setPaperSearchSubjects(prev => {
      let next = prev.filter(s => s !== "All");
      if (next.includes(sub)) {
        next = next.filter(s => s !== sub);
      } else {
        next.push(sub);
      }
      if (next.length === 0) return ["All"];
      return next;
    });
  };

  useEffect(() => {
    if (paperExamType !== "special" && paperSearchSubjects.includes("BCS Health Question")) {
      setPaperSearchSubjects(prev => {
        const filtered = prev.filter(s => s !== "BCS Health Question");
        return filtered.length === 0 ? ["All"] : filtered;
      });
    }
  }, [paperExamType, paperSearchSubjects]);

  // ==========================================
  // 1. QUESTIONS STATE & COMPONENT
  // ==========================================
  const [questions, setQuestions] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Search, Subject Filter & Display Limit states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("All");
  const [displayLimit, setDisplayLimit] = useState<number>(10);

  // Add Question form states
  const [newSubjectName, setNewSubjectName] = useState<string>("Bangla Literature");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);
  const [newExplanation, setNewExplanation] = useState("");

  // Edit Question modal state
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editSubjectName, setEditSubjectName] = useState<string>("Bangla Literature");
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>(["", "", "", ""]);
  const [editCorrectOptionIdx, setEditCorrectOptionIdx] = useState<number>(0);
  const [editExplanation, setEditExplanation] = useState("");

  // ==========================================
  // 2. USERS STATE & COMPONENT
  // ==========================================
  const [users, setUsers] = useState<AdminUser[]>([
    { id: "u-101", email: "hassan.bcs@gmail.com", role: "Student", status: "Active" },
    { id: "u-102", email: "tasnim_sheikh@yahoo.com", role: "Student", status: "Active" },
    { id: "u-103", email: "kamrul.dev@outlook.com", role: "Moderator", status: "Active" },
    { id: "u-104", email: "spambot99@gmail.com", role: "Student", status: "Banned" },
    { id: "u-105", email: "rahima_begum@gmail.com", role: "Student", status: "Active" },
  ]);

  // Daily Visitor Tracker state
  const [todayVisitors, setTodayVisitors] = useState<number>(0);

  useEffect(() => {
    const updateVisitorCount = () => {
      setTodayVisitors(getTodayVisitorCount());
    };
    updateVisitorCount();

    const handleVisitorEvent = (e: any) => {
      if (e.detail !== undefined) {
        setTodayVisitors(Number(e.detail));
      } else {
        updateVisitorCount();
      }
    };

    // Refresh every 1 hour (3600000ms) or on focus or custom storage events
    const interval = setInterval(updateVisitorCount, 3600000);
    const handleFocus = () => updateVisitorCount();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", updateVisitorCount);
    window.addEventListener("job_master_visitor_updated", handleVisitorEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", updateVisitorCount);
      window.removeEventListener("job_master_visitor_updated", handleVisitorEvent);
    };
  }, []);
  const [offers, setOffers] = useState<AdminOffer[]>([
    { 
      id: "o-1", 
      title: "🔥 বিসিএস স্পেশাল মাস্টারক্লাস - ৫০% ছাড়!", 
      description: "কুপন কোড BCS50 ব্যবহার করে আজই এনরোল করুন অর্ধেকেরও কম মূল্যে। অফারটি সীমিত সময়ের জন্য প্রযোজ্য।", 
      active: true 
    },
    { 
      id: "o-2", 
      title: "🚀 ফ্রি মেগা মক টেস্ট সপ্তাহ", 
      description: "সকল শিক্ষার্থীদের জন্য এই সপ্তাহের সবকয়টি স্পেশাল মডেল টেস্ট সম্পূর্ণ ফ্রি! এখনই প্র্যাকটিস শুরু করুন।", 
      active: true 
    },
    { 
      id: "o-3", 
      title: "📚 রেলওয়ে স্পেশাল স্পিড প্যাক বোনাস", 
      description: "রেলওয়ে রিক্রুটমেন্ট ইউনিভার্সাল প্যাকে অতিরিক্ত ২০টি স্পিড টেস্ট সেট একদম ফ্রিতে যোগ করা হয়েছে।", 
      active: false 
    }
  ]);
  const [newOfferTitle, setNewOfferTitle] = useState("");
  const [newOfferDesc, setNewOfferDesc] = useState("");
  const [newOfferActive, setNewOfferActive] = useState(true);

  // Load state and auth status from localStorage on mount
  useEffect(() => {
    // Check authentication
    const loggedIn = localStorage.getItem("job_master_admin_auth");
    if (loggedIn === "true") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    // Initialize static data from local storage if available
    const cachedUsers = localStorage.getItem("job_master_admin_users");
    if (cachedUsers) setUsers(JSON.parse(cachedUsers));

    const cachedOffers = localStorage.getItem("job_master_admin_offers");
    if (cachedOffers) setOffers(JSON.parse(cachedOffers));

    // Fetch questions & exam papers from Supabase/Storage
    loadQuestionsFromDb();
    loadExamPapersFromDb();
    const unsubExams = subscribeToExamPapers(setExamPapers);

    // Fetch packages & subscribe
    fetchPackagesFromDb().then((pkgs) => {
      setPackagesList(pkgs);
      setPkgFormOrder(pkgs.length + 1);
    });
    const unsubPkgs = subscribeToPackages(setPackagesList);

    // Fetch courses & prep subjects & appSettings & subscribe
    fetchAppSettingsFromDb().then((s) => {
      if (s) setAppSettings(s);
    });
    fetchCoursesFromDb().then((courses) => {
      setCoursesList(courses);
    });
    fetchPrepSubjectsFromDb().then((prep) => {
      setPrepSubjectsList(prep);
    });
    const unsubCoursesPrep = subscribeToCoursesAndPrep(setCoursesList, setPrepSubjectsList);

    return () => {
      unsubExams();
      unsubPkgs();
      unsubCoursesPrep();
    };
  }, []);

  // Auto-set default serial for new course or new prep subject (Issue 2)
  useEffect(() => {
    if (!editingCourseId) {
      setCourseFormSerial(coursesList.length + 1);
    }
  }, [coursesList, editingCourseId]);

  useEffect(() => {
    if (!editingPrepId) {
      setPrepFormSerial(prepSubjectsList.length + 1);
    }
  }, [prepSubjectsList, editingPrepId]);

  const loadExamPapersFromDb = async () => {
    const papers = await fetchExamPapersFromDb();
    setExamPapers(papers);
  };

  // Package Management Handlers
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgFormTitle.trim() || !pkgFormPrice.trim()) {
      triggerNotification("error", "প্যাকেজের শিরোনাম এবং মূল্য পূরণ করা বাধ্যতামূলক।");
      return;
    }

    let badgeVal: string | null = null;
    if (pkgFormBadgePreset === "custom") {
      badgeVal = pkgFormBadgeCustom.trim() || null;
    } else if (pkgFormBadgePreset !== "none") {
      badgeVal = pkgFormBadgePreset;
    }

    let bgVal = "bg-white";
    let borderVal = "border-slate-200/80";
    if (badgeVal === "POPULAR") {
      bgVal = "bg-gradient-to-b from-white to-amber-50/20";
      borderVal = "border-amber-200/80";
    } else if (badgeVal === "BEST VALUE") {
      bgVal = "bg-gradient-to-b from-white to-blue-50/20";
      borderVal = "border-blue-200/80";
    } else if (badgeVal === "NEW") {
      bgVal = "bg-gradient-to-b from-white to-indigo-50/20";
      borderVal = "border-indigo-200/80";
    }

    const pkgToSave: PackageItem = {
      id: editingPkgId || `pkg_${Date.now()}`,
      title: pkgFormTitle.trim(),
      desc: pkgFormDesc.trim(),
      price: pkgFormPrice.trim(),
      oldPrice: pkgFormOldPrice.trim() || null,
      badge: badgeVal,
      category: pkgFormCategory,
      bg: bgVal,
      border: borderVal,
      order: Number(pkgFormOrder) || (packagesList.length + 1),
      active: true,
      createdAt: new Date().toISOString()
    };

    const updated = await savePackageToDb(pkgToSave);
    setPackagesList(updated);
    triggerNotification("success", editingPkgId ? "প্যাকেজ আপডেট ও সার্ভারে সিঙ্ক করা হয়েছে!" : "নতুন প্যাকেজ যুক্ত ও সার্ভারে সিঙ্ক করা হয়েছে!");

    handleCancelPkgEdit();
  };

  const handleSyncPackagesToSupabase = async () => {
    triggerNotification("success", "সার্ভারে সিঙ্ক করা হচ্ছে...");
    const res = await syncAllPackagesToSupabase(packagesList);
    if (res.success) {
      triggerNotification("success", "✅ " + res.message);
    } else {
      triggerNotification("error", "⚠️ সিঙ্ক এরর: " + res.message);
    }
  };

  const handleStartEditPackage = (pkg: PackageItem) => {
    setEditingPkgId(pkg.id);
    setPkgFormTitle(pkg.title);
    setPkgFormDesc(pkg.desc);
    setPkgFormPrice(pkg.price);
    setPkgFormOldPrice(pkg.oldPrice || "");
    if (!pkg.badge) {
      setPkgFormBadgePreset("none");
      setPkgFormBadgeCustom("");
    } else if (["POPULAR", "BEST VALUE", "NEW", "BASIC"].includes(pkg.badge)) {
      setPkgFormBadgePreset(pkg.badge as any);
      setPkgFormBadgeCustom("");
    } else {
      setPkgFormBadgePreset("custom");
      setPkgFormBadgeCustom(pkg.badge);
    }
    setPkgFormCategory(pkg.category || "all");
    setPkgFormOrder(pkg.order || 1);
  };

  const handleCancelPkgEdit = () => {
    setEditingPkgId(null);
    setPkgFormTitle("");
    setPkgFormDesc("");
    setPkgFormPrice("");
    setPkgFormOldPrice("");
    setPkgFormBadgePreset("none");
    setPkgFormBadgeCustom("");
    setPkgFormCategory("all");
    setPkgFormOrder(packagesList.length + 1);
  };

  const handleDeletePackage = async (id: string, title: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${title}" প্যাকেজটি ডিলিট করতে চান?`)) {
      const updated = await deletePackageFromDb(id);
      setPackagesList(updated);
      triggerNotification("success", "প্যাকেজ সফলভাবে ডিলিট করা হয়েছে।");
      if (editingPkgId === id) {
        handleCancelPkgEdit();
      }
    }
  };

  // --- OUR COURSES HANDLERS ---
  const handleEditCourse = (course: CourseItem) => {
    setEditingCourseId(course.id);
    setCourseFormSerial(course.serial || 1);
    setCourseFormId(course.id);
    setCourseFormName(course.name);
    setCourseFormTitle(course.title);
    setCourseFormDesc(course.desc);
    setCourseFormCategory(course.category || "BCS");
    setCourseFormIcon(course.icon || "BookOpen");
    setCourseFormBg(course.bg || "bg-[#FFF1E6]");
    setCourseFormIconColor(course.iconColor || "text-orange-600");
    setCourseFormSubSubjects(course.subSubjects ? JSON.parse(JSON.stringify(course.subSubjects)) : []);
  };

  const handleCancelCourseEdit = () => {
    setEditingCourseId(null);
    setCourseFormSerial(coursesList.length + 1);
    setCourseFormId("");
    setCourseFormName("");
    setCourseFormTitle("");
    setCourseFormDesc("");
    setCourseFormCategory("BCS");
    setCourseFormIcon("BookOpen");
    setCourseFormBg("bg-[#FFF1E6]");
    setCourseFormIconColor("text-orange-600");
    setCourseFormSubSubjects([]);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormName.trim() || !courseFormTitle.trim()) {
      triggerNotification("error", "কোর্সের নাম এবং টাইটেল দেওয়া বাধ্যতামূলক।");
      return;
    }
    const cId = courseFormId.trim() || courseFormName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    const newCourse: CourseItem = {
      id: cId,
      name: courseFormName.trim(),
      title: courseFormTitle.trim(),
      desc: courseFormDesc.trim(),
      category: courseFormCategory,
      icon: courseFormIcon,
      bg: courseFormBg,
      iconColor: courseFormIconColor,
      serial: Number(courseFormSerial) || 1,
      subSubjects: courseFormSubSubjects
    };

    let updatedList = [...coursesList];
    if (editingCourseId) {
      const idx = updatedList.findIndex(c => c.id === editingCourseId);
      if (idx >= 0) updatedList[idx] = newCourse;
      else updatedList.push(newCourse);
    } else {
      updatedList.push(newCourse);
    }

    updatedList.sort((a, b) => (a.serial || 99) - (b.serial || 99));
    setCoursesList(updatedList);
    await saveCoursesToDb(updatedList);
    triggerNotification("success", "কোর্স সফলভাবে সার্ভারে আপডেট করা হয়েছে!");
    handleCancelCourseEdit();
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${name}" কোর্সটি ডিলিট করতে চান?`)) return;
    const updated = coursesList.filter(c => c.id !== id);
    setCoursesList(updated);
    await saveCoursesToDb(updated);
    triggerNotification("success", "কোর্স সফলভাবে ডিলিট করা হয়েছে।");
    if (editingCourseId === id) handleCancelCourseEdit();
  };

  const handleMoveCourseSerial = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= coursesList.length) return;
    const newList = [...coursesList];
    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;
    newList.forEach((item, idx) => { item.serial = idx + 1; });
    setCoursesList(newList);
    await saveCoursesToDb(newList);
    triggerNotification("success", "কোর্স সিরিয়াল আপডেট করা হয়েছে!");
  };

  // --- PREPARATION HUB HANDLERS ---
  const handleEditPrep = (prep: PrepSubjectItem) => {
    setEditingPrepId(prep.id);
    setPrepFormSerial(prep.serial || 1);
    setPrepFormId(prep.id);
    setPrepFormName(prep.name || prep.bnName || "");
    setPrepFormBnName(prep.bnName || prep.name || "");
    setPrepFormSub(prep.sub || "");
    setPrepFormIcon(prep.icon || "BookOpen");
    setPrepFormBg(prep.bg || "bg-[#FFF1E6]");
    setPrepFormText(prep.text || "text-orange-600");
    setPrepFormShowQuickTools(prep.showQuickTools !== false);
    setPrepFormSubSubjects(prep.subSubjects ? JSON.parse(JSON.stringify(prep.subSubjects)) : []);
  };

  const handleCancelPrepEdit = () => {
    setEditingPrepId(null);
    setPrepFormSerial(prepSubjectsList.length + 1);
    setPrepFormId("");
    setPrepFormName("");
    setPrepFormBnName("");
    setPrepFormSub("");
    setPrepFormIcon("BookOpen");
    setPrepFormBg("bg-[#FFF1E6]");
    setPrepFormText("text-orange-600");
    setPrepFormShowQuickTools(true);
    setPrepFormSubSubjects([]);
  };

  const handleSavePrep = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameVal = prepFormName.trim() || prepFormBnName.trim();
    if (!nameVal) {
      triggerNotification("error", "সাবজেক্টের নাম দেওয়া বাধ্যতামূলক।");
      return;
    }
    const pId = prepFormId.trim() || `prep_${nameVal.toLowerCase().replace(/\s+/g, "_")}`;

    const newPrep: PrepSubjectItem = {
      id: pId,
      name: nameVal,
      bnName: nameVal,
      sub: prepFormSub.trim(),
      icon: prepFormIcon,
      bg: prepFormBg,
      text: prepFormText,
      showQuickTools: prepFormShowQuickTools,
      serial: Number(prepFormSerial) || 1,
      subSubjects: prepFormSubSubjects
    };

    let updatedList = [...prepSubjectsList];
    if (editingPrepId) {
      const idx = updatedList.findIndex(p => p.id === editingPrepId);
      if (idx >= 0) updatedList[idx] = newPrep;
      else updatedList.push(newPrep);
    } else {
      updatedList.push(newPrep);
    }

    updatedList.sort((a, b) => (a.serial || 99) - (b.serial || 99));
    setPrepSubjectsList(updatedList);
    await savePrepSubjectsToDb(updatedList);
    triggerNotification("success", "প্রিপারেশন সাবজেক্ট সফলভাবে সার্ভারে আপডেট হয়েছে!");
    handleCancelPrepEdit();
  };

  const handleDeletePrep = async (id: string, name: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${name}" প্রিপারেশন সাবজেক্টটি ডিলিট করতে চান?`)) return;
    const updated = prepSubjectsList.filter(p => p.id !== id);
    setPrepSubjectsList(updated);
    await savePrepSubjectsToDb(updated);
    triggerNotification("success", "সাবজেক্ট ডিলিট করা হয়েছে।");
    if (editingPrepId === id) handleCancelPrepEdit();
  };

  const handleMovePrepSerial = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= prepSubjectsList.length) return;
    const newList = [...prepSubjectsList];
    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;
    newList.forEach((item, idx) => { item.serial = idx + 1; });
    setPrepSubjectsList(newList);
    await savePrepSubjectsToDb(newList);
    triggerNotification("success", "সাবজেক্ট সিরিয়াল আপডেট করা হয়েছে!");
  };

  // Exam Paper Builder handlers
  const handleAddQuestionToPaper = (q: any) => {
    const normQ = normalizeQuestion(q);
    if (paperQuestions.some(item => item.id === normQ.id || (item.question || item.questionText) === normQ.question)) {
      triggerNotification("error", "এই প্রশ্নটি ইতিমধ্যেই সিলেক্ট করা হয়েছে।");
      return;
    }
    setPaperQuestions(prev => [...prev, normQ]);
    triggerNotification("success", "প্রশ্নটি প্রশ্নপত্রে যোগ করা হয়েছে।");
  };

  const handleRemoveQuestionFromPaper = (index: number) => {
    setPaperQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAutoFillQuestions = () => {
    // Filter questions by subject if selected
    const availablePool = (questions.length > 0 ? questions : QUIZ_QUESTIONS).map(q => normalizeQuestion(q));
    let available = availablePool;

    // BCS Health Question is only included if paper type is BCS Health Quiz (special)
    if (paperExamType !== "special") {
      available = available.filter(q => (q.subject || q.subjectName) !== "BCS Health Question");
    }

    if (!paperSearchSubjects.includes("All") && paperSearchSubjects.length > 0) {
      available = available.filter(q => paperSearchSubjects.includes(q.subject || q.subjectName));
    }
    
    // Pick required number
    const needed = paperTargetCount - paperQuestions.length;
    if (needed <= 0) {
      triggerNotification("error", `প্রশ্নপত্র ইতিমধ্যেই ${paperQuestions.length} টি প্রশ্নে পূর্ণ!`);
      return;
    }

    const unselected = available.filter(q => !paperQuestions.some(pq => pq.id === q.id || (pq.question || pq.questionText) === q.question));
    const shuffled = [...unselected].sort(() => 0.5 - Math.random());
    const toAdd = shuffled.slice(0, needed);

    if (toAdd.length === 0) {
      triggerNotification("error", "সার্ভারে আর নতুন কোনো উপযুক্ত প্রশ্ন পাওয়া যায়নি।");
      return;
    }

    setPaperQuestions(prev => [...prev, ...toAdd]);
    triggerNotification("success", `${toAdd.length} টি প্রশ্ন অটোম্যাটিক যোগ করা হয়েছে!`);
  };

  const handlePublishExamPaper = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paperTitle.trim()) {
      triggerNotification("error", "দয়া করে পরীক্ষার নাম প্রদান করুন।");
      return;
    }

    if (paperQuestions.length === 0) {
      triggerNotification("error", "দয়া করে অন্তত ১ টি প্রশ্ন প্রশ্নপত্রে যোগ করুন।");
      return;
    }

    const normalizedPaperQuestions = paperQuestions.map(q => normalizeQuestion(q));
    const totalSeconds = normalizedPaperQuestions.length * 36; // 36 seconds per question

    let finalStatus: "Live" | "Upcoming" | "Archive" = "Upcoming";
    let finalStartDT: string | undefined = undefined;
    let finalEndDT: string | undefined = undefined;

    if (paperStatus === "Live") {
      finalStatus = "Live";
      finalStartDT = paperStartDateTime || getNowLocalDateTimeStr();
      finalEndDT = paperEndDateTime || getTodayEndDateTimeStr();
    } else if (paperStatus === "Archive" || paperStatus === "Completed") {
      finalStatus = "Archive";
    } else {
      // Upcoming
      finalStartDT = paperStartDateTime || undefined;
      finalEndDT = paperEndDateTime || undefined;
      finalStatus = "Upcoming";
    }

    const targetCourse = paperCategoryType === "prep_hub" ? paperPrepSubjectId : paperCourse;
    const targetSubSubject = paperCategoryType === "prep_hub" ? paperPrepSubSubject : paperSubSubject;

    const newPaper: ExamPaper = {
      id: editingPaperId || `exam-${Date.now()}`,
      title: paperTitle.trim(),
      course: targetCourse,
      subSubject: targetSubSubject,
      categoryType: paperCategoryType,
      examType: paperExamType,
      subject: targetSubSubject !== "all" ? targetSubSubject : paperSubject,
      questionCount: normalizedPaperQuestions.length,
      timePerQuestionSeconds: 36,
      totalDurationSeconds: totalSeconds,
      totalMarks: normalizedPaperQuestions.length,
      topic: paperTopic.trim() || "মডেল টেস্ট",
      examDate: paperDate.trim() || (finalStartDT ? formatDisplayDate(finalStartDT) : "Fri, Jul 31, 2026"),
      startDateTime: finalStartDT,
      endDateTime: finalEndDT,
      status: finalStatus,
      questions: normalizedPaperQuestions,
      createdAt: new Date().toISOString()
    };

    const success = await saveExamPaperToDb(newPaper);

    if (success) {
      triggerNotification("success", editingPaperId ? "প্রশ্ন পত্র সফলভাবে আপডেট করা হয়েছে!" : "প্রশ্ন পত্র সফলভাবে পাবলিশ করা হয়েছে!");
      // Reset form
      setEditingPaperId(null);
      setPaperSubSubject("all");
      setPaperPrepSubSubject("all");
      setPaperQuestions([]);
    } else {
      triggerNotification("error", "প্রশ্ন পত্র লোকাল সেভ হয়েছে কিন্তু সার্ভারে সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const handleEditExamPaper = (paper: ExamPaper) => {
    setEditingPaperId(paper.id);
    setPaperTitle(paper.title);
    
    // Determine if it belongs to Preparation Hub or Our Course
    const isPrep = paper.categoryType === "prep_hub" || prepSubjectsList.some(s => s.id === paper.course || s.name.toLowerCase() === paper.course.toLowerCase() || (s.bnName && s.bnName === paper.course));
    
    if (isPrep) {
      setPaperCategoryType("prep_hub");
      setPaperPrepSubjectId(paper.course);
      setPaperPrepSubSubject(paper.subSubject || "all");
    } else {
      setPaperCategoryType("our_course");
      setPaperCourse(paper.course);
      setPaperSubSubject(paper.subSubject || "all");
    }

    setPaperExamType(paper.examType);
    setPaperSubject(paper.subject || "All Subjects");
    setPaperTopic(paper.topic);
    setPaperDate(paper.examDate);
    setPaperStartDateTime(paper.startDateTime || "2026-07-24T00:00");
    setPaperEndDateTime(paper.endDateTime || "2026-07-31T23:59");
    setPaperStatus(paper.status);
    setPaperTargetCount(paper.questionCount);
    setPaperQuestions(paper.questions || []);
    setActiveTab("exam_papers");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteExamPaper = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই প্রশ্ন পত্রটি ডিলেট করতে চান?")) return;
    await deleteExamPaperFromDb(id);
    triggerNotification("success", "প্রশ্ন পত্র ডিলেট করা হয়েছে।");
  };

  const handleToggleArchiveExamPaper = async (paper: ExamPaper) => {
    const isArchived = paper.status === "Archive" || (paper.status as string).toLowerCase() === "archived";
    const updatedPaper: ExamPaper = {
      ...paper,
      status: isArchived ? "Live" : "Archive"
    };
    await saveExamPaperToDb(updatedPaper);
    triggerNotification("success", isArchived ? "প্রশ্নপত্রটি পুনরায় লাইভ করা হয়েছে!" : "প্রশ্নপত্রটি আর্কাইভে পাঠানো হয়েছে!");
  };

  // Sync users and offers updates
  const saveUsers = (updatedUsers: AdminUser[]) => {
    setUsers(updatedUsers);
    localStorage.setItem("job_master_admin_users", JSON.stringify(updatedUsers));
  };

  const saveOffers = (updatedOffers: AdminOffer[]) => {
    setOffers(updatedOffers);
    localStorage.setItem("job_master_admin_offers", JSON.stringify(updatedOffers));
  };

  // Helper to show brief toast notifications
  const triggerNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // -------------------------------------------------------------
  // SUPABASE ASYNC CRUD HANDLERS
  // -------------------------------------------------------------
  const loadQuestionsFromDb = async () => {
    try {
      setDbLoading(true);
      setDbError(null);
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from("questions")
        .select("*");

      if (error) {
        // If table doesn't exist yet, we still allow proceeding but log warn
        console.warn("Could not load from 'questions' table. Fallback to mock state.", error);
        setDbError("Supabase 'questions' table not found or query failed.");
        
        // Initialize with original mock questions
        const cachedMock = localStorage.getItem("job_master_admin_questions");
        if (cachedMock) {
          try {
            setQuestions(JSON.parse(cachedMock).map((item: any) => normalizeQuestion(item)));
          } catch {
            setQuestions(QUIZ_QUESTIONS.map(item => normalizeQuestion(item)));
          }
        } else {
          setQuestions(QUIZ_QUESTIONS.map(item => normalizeQuestion(item)));
        }
      } else if (data) {
        // Robust in-memory sorting so we don't depend on database column named createdAt
        const sortedData = [...data].sort((a: any, b: any) => {
          const aTime = a.createdAt || a.created_at || a.id || 0;
          const bTime = b.createdAt || b.created_at || b.id || 0;
          if (typeof aTime === "number" && typeof bTime === "number") {
            return bTime - aTime;
          }
          return String(bTime).localeCompare(String(aTime));
        });
        
        const normalized = sortedData.map(item => normalizeQuestion(item));
        setQuestions(normalized);
        localStorage.setItem("job_master_admin_questions", JSON.stringify(normalized));
      }
    } catch (err: any) {
      console.error("Error connecting to Supabase:", err);
      setDbError(err.message || "Unknown error connecting to Supabase");
    } finally {
      setDbLoading(false);
    }
  };

  // Handle Add Question to Supabase
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      triggerNotification("error", "দয়া করে প্রশ্নের মূল টেক্সট লিখুন।");
      return;
    }
    
    // Check options
    if (newOptions.some(opt => !opt.trim())) {
      triggerNotification("error", "দয়া করে সবকয়টি অপশনের মান প্রদান করুন।");
      return;
    }

    try {
      setDbLoading(true);
      const supabase = getSupabase();

      const payload = {
        subjectName: newSubjectName,
        questionText: newQuestionText.trim(),
        options: [...newOptions],
        correctOptionIndex: correctOptionIdx,
        explanation: newExplanation.trim() || null
      };

      const { data, error } = await supabase
        .from("questions")
        .insert([payload])
        .select();

      if (error) {
        throw error;
      }

      triggerNotification("success", "নতুন প্রশ্ন সফলভাবে Supabase ডেটাবেজে যুক্ত করা হয়েছে!");
      
      // Reset form fields
      setNewQuestionText("");
      setNewOptions(["", "", "", ""]);
      setCorrectOptionIdx(0);
      setNewExplanation("");

      // Reload database list
      await loadQuestionsFromDb();
    } catch (err: any) {
      console.error("Error creating question in Supabase:", err);
      // Fallback local operation if database not synced yet
      console.log("Adding question to local mockup fallback...");
      const nextId = questions.length > 0 ? Math.max(...questions.map(q => Number(q.id) || 0)) + 1 : 1;
      const fallbackQuestion = {
        id: nextId,
        subjectName: newSubjectName,
        questionText: newQuestionText.trim(),
        options: [...newOptions],
        correctOptionIndex: correctOptionIdx,
        explanation: newExplanation.trim() || null
      };
      const updated = [fallbackQuestion, ...questions];
      setQuestions(updated);
      localStorage.setItem("job_master_admin_questions", JSON.stringify(updated));
      triggerNotification("success", `প্রশ্ন #${nextId} সফলভাবে লোকাল মেমোরিতে সেভ হয়েছে (লোকাল ফলব্যাক)!`);

      // Reset form fields
      setNewQuestionText("");
      setNewOptions(["", "", "", ""]);
      setCorrectOptionIdx(0);
      setNewExplanation("");
    } finally {
      setDbLoading(false);
    }
  };

  // Handle Edit click: populates modal state
  const handleEditClick = (q: any) => {
    setEditingQuestion(q);
    setEditSubjectName(q.subjectName || q.subject_name || "Bangla Literature");
    setEditQuestionText(q.questionText || q.question_text || q.question || "");
    
    let opts = ["", "", "", ""];
    const rawOpts = q.options || q.choices || q.answers || q.option_list;
    if (Array.isArray(rawOpts)) {
      opts = rawOpts.map(String);
    }
    setEditOptions(opts);

    const correctIdxVal = q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.correct_option_index !== undefined ? q.correct_option_index : (q.correctIndex !== undefined ? q.correctIndex : 0));
    setEditCorrectOptionIdx(Number(correctIdxVal));
    setEditExplanation(q.explanation || "");
  };

  // Handle Update Question on Supabase
  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    if (!editQuestionText.trim()) {
      triggerNotification("error", "দয়া করে প্রশ্নের মূল টেক্সট লিখুন।");
      return;
    }
    if (editOptions.some(opt => !opt.trim())) {
      triggerNotification("error", "দয়া করে সবকয়টি অপশনের মান প্রদান করুন।");
      return;
    }

    try {
      setDbLoading(true);
      const supabase = getSupabase();

      // Dynamically map payload properties to prevent sending non-existent columns to Supabase
      const payload: any = {};
      
      const setFieldIfInModel = (standardKey: string, fallbacks: string[], val: any) => {
        let matchedKey = standardKey;
        // Check editingQuestion keys to find which exact key name is defined in database schema
        for (const key of [standardKey, ...fallbacks]) {
          if (editingQuestion && key in editingQuestion) {
            matchedKey = key;
            break;
          }
        }
        payload[matchedKey] = val;
      };

      setFieldIfInModel("subjectName", ["subject_name"], editSubjectName);
      setFieldIfInModel("questionText", ["question_text", "question", "text"], editQuestionText.trim());
      setFieldIfInModel("options", ["choices", "answers", "option_list"], [...editOptions]);
      setFieldIfInModel("correctOptionIndex", ["correct_option_index", "correctIndex", "correct_index"], editCorrectOptionIdx);
      
      // Explanation field
      let explanationKey = "explanation";
      if (editingQuestion) {
        if ("explanation" in editingQuestion) explanationKey = "explanation";
        else if ("explanation_text" in editingQuestion) explanationKey = "explanation_text";
      }
      payload[explanationKey] = editExplanation.trim() || null;

      const { error } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", editingQuestion.id);

      if (error) {
        throw error;
      }

      triggerNotification("success", "প্রশ্নটি সফলভাবে Supabase ডেটাবেজে আপডেট করা হয়েছে!");
      setEditingQuestion(null);
      await loadQuestionsFromDb();
    } catch (err: any) {
      console.error("Error updating question in Supabase:", err);
      // Fallback local update
      const updated = questions.map(q => {
        if (q.id === editingQuestion.id) {
          return {
            ...q,
            subjectName: editSubjectName,
            questionText: editQuestionText.trim(),
            options: [...editOptions],
            correctOptionIndex: editCorrectOptionIdx,
            explanation: editExplanation.trim() || null
          };
        }
        return q;
      });
      setQuestions(updated);
      localStorage.setItem("job_master_admin_questions", JSON.stringify(updated));
      triggerNotification("success", "প্রশ্নটি লোকাল মেমোরিতে সফলভাবে আপডেট হয়েছে!");
      setEditingQuestion(null);
    } finally {
      setDbLoading(false);
    }
  };

  // Handle Delete Question from Supabase
  const handleDeleteQuestion = async (id: string | number) => {
    try {
      setDbLoading(true);
      const supabase = getSupabase();

      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      triggerNotification("success", "প্রশ্নটি সফলভাবে Supabase থেকে ডিলিট করা হয়েছে!");
      await loadQuestionsFromDb();
    } catch (err: any) {
      console.error("Error deleting question from Supabase:", err);
      // Fallback local delete
      const updated = questions.filter(q => q.id !== id);
      setQuestions(updated);
      localStorage.setItem("job_master_admin_questions", JSON.stringify(updated));
      triggerNotification("success", "প্রশ্নটি লোকাল মেমোরি থেকে মুছে ফেলা হয়েছে।");
    } finally {
      setDbLoading(false);
    }
  };

  // Seeding Database Helper
  const handleSeedDatabase = async () => {
    if (!confirm("আপনি কি নিশ্চিত যে আপনি ৩১টি প্রাক-সংজ্ঞায়িত ডেমো প্রশ্ন Supabase ডেটাবেজে সিড করতে চান?")) return;
    try {
      setDbLoading(true);
      const supabase = getSupabase();

      const payloads = QUIZ_QUESTIONS.map((q, idx) => {
        const subIndex = idx % SUBJECTS.length;
        return {
          subjectName: SUBJECTS[subIndex],
          questionText: q.question,
          options: q.options,
          correctOptionIndex: q.correctIndex,
          explanation: `এটি ${SUBJECTS[subIndex]} বিষয়ের একটি অত্যন্ত গুরুত্বপূর্ণ প্রশ্ন যা বিগত বছরগুলোতে প্রতিযোগিতামূলক পরীক্ষায় এসেছে।`
        };
      });

      const { error } = await supabase
        .from("questions")
        .insert(payloads);

      if (error) {
        throw error;
      }

      triggerNotification("success", "৩১টি ডেমো প্রশ্ন সফলভাবে Supabase-এ সিড করা হয়েছে!");
      await loadQuestionsFromDb();
    } catch (err: any) {
      console.error("Error seeding database:", err);
      triggerNotification("error", `সিড করতে ব্যর্থ: ${err.message}`);
    } finally {
      setDbLoading(false);
    }
  };

  // Handle Option Value Change
  const handleOptionChange = (index: number, val: string) => {
    const updated = [...newOptions];
    updated[index] = val;
    setNewOptions(updated);
  };

  // Handle Edit Option Value Change
  const handleEditOptionChange = (index: number, val: string) => {
    const updated = [...editOptions];
    updated[index] = val;
    setEditOptions(updated);
  };

  // Handle Login passcode submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "123456") {
      localStorage.setItem("job_master_admin_auth", "true");
      setIsAuthenticated(true);
      setLoginError("");
      triggerNotification("success", "স্বাগতম! আপনি সফলভাবে অ্যাডমিন প্যানেলে লগইন করেছেন।");
    } else {
      setLoginError("ভুল পাসকোড! দয়া করে সঠিক কোডটি দিন (Demo: 123456)।");
      triggerNotification("error", "লগইন ব্যর্থ হয়েছে!");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("job_master_admin_auth");
    setIsAuthenticated(false);
    setPasscode("");
    triggerNotification("success", "সফলভাবে লগআউট করা হয়েছে।");
  };

  // Handle User Status Change (Ban/Unban toggle)
  const toggleUserStatus = (userId: string) => {
    const updated = users.map(user => {
      if (user.id === userId) {
        const nextStatus = user.status === "Active" ? "Banned" : "Active";
        triggerNotification(
          "success", 
          `ইউজার ${user.email} কে ${nextStatus === "Active" ? "সক্রিয়" : "নিষিদ্ধ"} করা হয়েছে।`
        );
        return { ...user, status: nextStatus as "Active" | "Banned" };
      }
      return user;
    });
    saveUsers(updated);
  };

  // Handle Add Offer Banner
  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferTitle.trim() || !newOfferDesc.trim()) {
      triggerNotification("error", "অফারের শিরোনাম এবং বিবরণ উভয়ই প্রদান করুন।");
      return;
    }

    const newOffer: AdminOffer = {
      id: `o-${Date.now()}`,
      title: newOfferTitle.trim(),
      description: newOfferDesc.trim(),
      active: newOfferActive
    };

    const updated = [newOffer, ...offers];
    saveOffers(updated);

    // Reset Form
    setNewOfferTitle("");
    setNewOfferDesc("");
    setNewOfferActive(true);
    triggerNotification("success", "নতুন অফার ব্যানারটি সফলভাবে তৈরি করা হয়েছে!");
  };

  // Toggle Offer Active State
  const toggleOfferActive = (offerId: string) => {
    const updated = offers.map(offer => {
      if (offer.id === offerId) {
        const nextActive = !offer.active;
        triggerNotification(
          "success", 
          `ব্যানার "${offer.title.slice(0, 20)}..." ${nextActive ? "চালু" : "বন্ধ"} করা হয়েছে।`
        );
        return { ...offer, active: nextActive };
      }
      return offer;
    });
    saveOffers(updated);
  };

  // Loading indicator for mounting hook consistency
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-[#FF6A00] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">লোডিং হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
      </div>
    );
  }

  // ==========================================
  // RENDER: LOGIN COMPONENT
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-950 flex flex-col items-center justify-center p-4 font-sans selection:bg-[#FF6A00] selection:text-white">
        
        {/* Toast Notification */}
        {notification && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border text-xs font-bold transition-all animate-bounce ${
            notification.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            {notification.type === "success" ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <X className="w-4 h-4 shrink-0 text-rose-600" />}
            {notification.message}
          </div>
        )}

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6A00] opacity-5 rounded-full translate-x-12 -translate-y-12"></div>
          
          <div className="text-center space-y-2">
            <div className="inline-flex w-14 h-14 bg-orange-50 text-[#FF6A00] rounded-2xl items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8 stroke-[2]" />
            </div>
            
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              অ্যাডমিন <span className="text-[#FF6A00]">প্যানেল লগইন</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Job Master MCQ Hub Admin Control
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block pl-1">
                পাসকোড (Passcode)
              </label>
              <div className="relative">
                <input 
                  type="password"
                  placeholder="৬ ডিজিটের কোডটি দিন..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent transition-all font-mono tracking-widest text-center"
                  required
                />
                <div className="absolute left-3.5 top-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pl-1 font-semibold">
                ডিপ্লয়মেন্ট বাইপাস ডেমো কোড: <span className="text-[#FF6A00] font-mono font-bold">123456</span>
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-2xl p-3 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#FF6A00] hover:bg-orange-600 active:scale-95 text-white font-black py-3.5 rounded-2xl text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              লগইন করুন (ADMIN ACCESS)
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400">
            <Link href="/" className="flex items-center gap-1 hover:text-[#FF6A00] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> মেইন সাইটে ফিরুন
            </Link>
            <span>v1.0.0 Stable</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: DASHBOARD COMPONENT
  // ==========================================
  return (
    <div className="admin-panel admin-root h-screen h-dvh w-full bg-slate-50/50 flex flex-col font-sans selection:bg-[#FF6A00] selection:text-white overflow-hidden">
      


      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border text-xs font-bold transition-all animate-bounce ${
          notification.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {notification.type === "success" ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <X className="w-4 h-4 shrink-0 text-rose-600" />}
          {notification.message}
        </div>
      )}

      {/* Header Container */}
      <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex flex-row justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-[0.1em] text-[#FF6A00] bg-orange-50 px-2 py-0.5 rounded uppercase">
                ADMIN HUB
              </span>
              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                ONLINE
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              Job <span className="text-[#FF6A00]">Master Panel</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* User profile identifier */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-black text-slate-800">Super Admin</span>
            <span className="text-[10px] font-bold text-slate-400">mobileseba247@gmail.com</span>
          </div>

          <button
            onClick={handleLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all border border-rose-100/50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">লগআউট (Logout)</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar Left / Tabs Header on Mobile */}
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-100 p-4 shrink-0 flex flex-row md:flex-col justify-between md:justify-start gap-2 overflow-x-auto md:overflow-y-auto">
          
          <div className="w-full flex flex-row md:flex-col gap-1.5">
            {/* Nav Title Desktop */}
            <h3 className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2.5 py-2">
              ম্যানেজমেন্ট ড্যাশবোর্ড
            </h3>

            {/* Tab Button 1: Questions */}
            <button
              onClick={() => setActiveTab("questions")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center md:text-left ${
                activeTab === "questions"
                  ? "bg-orange-50 text-[#FF6A00]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>প্রশ্ন ব্যাংক ({questions.length})</span>
            </button>

            {/* Tab Button 2: Exam Papers / Question Sets */}
            <button
              onClick={() => setActiveTab("exam_papers")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center md:text-left ${
                activeTab === "exam_papers"
                  ? "bg-orange-50 text-[#FF6A00]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>প্রশ্ন পত্র তৈরি ({examPapers.length})</span>
            </button>

            {/* Tab Button 3: Users */}
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center md:text-left ${
                activeTab === "users"
                  ? "bg-orange-50 text-[#FF6A00]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ইউজার লিস্ট ({users.length})</span>
            </button>

            {/* Tab Button 4: Offers */}
            <button
              onClick={() => setActiveTab("offers")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center md:text-left ${
                activeTab === "offers"
                  ? "bg-orange-50 text-[#FF6A00]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>ব্যানার ও অফার ({offers.length})</span>
            </button>

            {/* Tab Button 5: Packages Management */}
            <button
              onClick={() => setActiveTab("packages")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center md:text-left ${
                activeTab === "packages"
                  ? "bg-orange-50 text-[#FF6A00]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>প্যাকেজ কন্ট্রোল ({packagesList.length})</span>
            </button>

            {/* Tab Button 6: Our Courses Management */}
            <button
              onClick={() => setActiveTab("courses")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center md:text-left ${
                activeTab === "courses"
                  ? "bg-orange-50 text-[#FF6A00]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>কোর্সসমূহ ({coursesList.length})</span>
            </button>

            {/* Tab Button 7: Preparation Hub Management */}
            <button
              onClick={() => setActiveTab("prep_hub")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center md:text-left ${
                activeTab === "prep_hub"
                  ? "bg-orange-50 text-[#FF6A00]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>প্রিপারেশন হাব ({prepSubjectsList.length})</span>
            </button>

            {/* Tab Button 8: Control Switches */}
            <button
              onClick={() => setActiveTab("switches")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center md:text-left ${
                activeTab === "switches"
                  ? "bg-orange-50 text-[#FF6A00]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>কন্ট্রোল সুইচ (Settings)</span>
            </button>
          </div>

          {/* Infrastructure status - desktop footer */}
          <div className="hidden md:block mt-auto p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Supabase Status</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold leading-normal">
              Schema triggers are optimized. All mutation events log in standard JSON arrays.
            </p>
          </div>
        </aside>

        {/* Content Panel Right */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 touch-pan-y">
          
          {/* 1. Summary Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Stat Box 1: Questions */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-sm flex items-center gap-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF6A00] opacity-5 rounded-full translate-x-4 -translate-y-4"></div>
              <div className="w-10 h-10 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 stroke-[2.2px]" />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">মোট প্রশ্ন সংখ্যা</span>
                <span className="text-base sm:text-lg font-black text-slate-800 leading-none">{questions.length} টি</span>
              </div>
            </div>

            {/* Stat Box 2: Total Users */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-sm flex items-center gap-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600 opacity-5 rounded-full translate-x-4 -translate-y-4"></div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 stroke-[2.2px]" />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">মোট নিবন্ধিত ইউজার</span>
                <span className="text-base sm:text-lg font-black text-slate-800 leading-none">{users.length} জন</span>
              </div>
            </div>

            {/* Stat Box 3: Today's Visitors Count (12:00 AM to 11:59 PM) */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-sm flex items-center gap-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF6A00] opacity-5 rounded-full translate-x-4 -translate-y-4"></div>
              <div className="w-10 h-10 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5 stroke-[2.2px]" />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">আজকের মোট ভিজিটর</span>
                <span className="text-base sm:text-lg font-black text-slate-800 leading-none">
                  {todayVisitors} জন
                </span>
                <span className="text-[8px] font-bold text-slate-400 block pt-0.5">
                  ১২:০০ AM - ১১:৫৯ PM (২৪ ঘন্টা)
                </span>
              </div>
            </div>

            {/* Stat Box 4: Server Status */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-sm flex items-center gap-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-600 opacity-5 rounded-full translate-x-4 -translate-y-4"></div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.2px]" />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">সার্ভার লেটেন্সি</span>
                <span className="text-base sm:text-lg font-black text-emerald-600 leading-none">12ms (Good)</span>
              </div>
            </div>

          </div>

          {/* 2. Dynamic Panel Views */}
          
          {/* ========================================================= */}
          {/* VIEW A: QUESTIONS MANAGEMENT                               */}
          {/* ========================================================= */}
          {activeTab === "questions" && (() => {
            const filteredQuestions = questions.filter((q: any) => {
              const subName = q.subjectName || q.subject_name || "";
              const qText = q.questionText || q.question || q.title || q.question_text || "";
              const matchesSubject = selectedSubjectFilter === "All" || subName === selectedSubjectFilter;
              const matchesSearch = qText.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesSubject && matchesSearch;
            });

            const displayedQuestions = filteredQuestions.slice(0, displayLimit);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in text-left">
                
                {/* Left Column (Desktop View): Add New MCQ Question Form */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                      <div className="w-7 h-7 bg-orange-50 text-[#FF6A00] rounded-lg flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 stroke-[2.5px]" />
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                        নতুন প্রশ্ন যোগ করুন (Add New MCQ Question)
                      </h3>
                    </div>

                    <form onSubmit={handleAddQuestion} className="space-y-4">
                      <div className="space-y-3">
                        {/* Question Text */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            প্রশ্ন (Question Text in Bangla/English)
                          </label>
                          <input 
                            type="text"
                            placeholder="যেমন: বাংলাদেশের দীর্ঘতম নদী কোনটি?"
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                            required
                          />
                        </div>

                        {/* Subject Selector */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            বিষয় নির্বাচন করুন (MCQ Subject Group)
                          </label>
                          <select
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-all text-slate-800 cursor-pointer"
                          >
                            {SUBJECTS.map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Options inputs */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          সম্ভাব্য অপশনসমূহ (4 MCQ Options)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {newOptions.map((opt, idx) => (
                            <div key={idx} className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 pl-1">অপশন {idx + 1}</span>
                              <input 
                                type="text"
                                placeholder={`অপশন ${idx + 1} এর মান`}
                                value={opt}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all text-slate-800"
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Correct Answer Index Selector */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            সঠিক উত্তর নির্বাচন করুন (Correct Option Index)
                          </label>
                          <select
                            value={correctOptionIdx}
                            onChange={(e) => setCorrectOptionIdx(parseInt(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-all text-slate-800 cursor-pointer"
                          >
                            <option value={0}>অপশন ১ (Option 1)</option>
                            <option value={1}>অপশন ২ (Option 2)</option>
                            <option value={2}>অপশন ৩ (Option 3)</option>
                            <option value={3}>অপশন ৪ (Option 4)</option>
                          </select>
                        </div>

                        {/* Explanation */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            বিশ্লেষণ বা ব্যাখ্যা (Explanation - Multi-line auto-expand)
                          </label>
                          <textarea 
                            rows={3}
                            placeholder="যেমন: মেঘনা নদী বাংলাদেশের দীর্ঘতম ও বৃহত্তম নদী।&#10;প্রয়োজনে এন্টার চেপে নতুন লাইনে বিস্তারিত ব্যাখ্যা লিখুন..."
                            value={newExplanation}
                            onChange={(e) => {
                              setNewExplanation(e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800 resize-y min-h-[90px] leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Submit button */}
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={dbLoading}
                          className="bg-[#FF6A00] hover:bg-orange-600 disabled:bg-slate-400 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl active:scale-95 transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5px]" />
                          প্রশ্ন যুক্ত করুন
                        </button>

                        {dbLoading && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                            <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                            সংরক্ষণ হচ্ছে...
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right Column (Desktop View): Question Bank Filter, Controls & Question List */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Search, Filter, Refresh, Seeding Toolbar & Display Limit Selection */}
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-sm">প্রশ্ন ব্যাংক ফিল্টারিং ও অনুসন্ধান</h4>
                        <p className="text-[11px] text-slate-400 font-bold">বিষয়ভিত্তিক অনুসন্ধান এবং সরাসরি লাইভ ডেটাবেজ সিঙ্কিং টুলস</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Manual Sync */}
                        <button
                          onClick={loadQuestionsFromDb}
                          disabled={dbLoading}
                          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                          title="লাইভ Supabase থেকে ডেটা রিফ্রেশ করুন"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-[#FF6A00] ${dbLoading ? "animate-spin" : ""}`} />
                          রিফ্রেশ সিঙ্ক
                        </button>

                        {/* Seed Database button */}
                        <button
                          onClick={handleSeedDatabase}
                          disabled={dbLoading}
                          className="bg-orange-50 hover:bg-orange-100 border border-orange-200/50 text-[#FF6A00] font-black text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                          title="৩১টি প্রশ্ন দিয়ে ডেটাবেজ সিড করুন"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          ৩১টি ডেমো সিড
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {/* Search Query Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase pl-1 block">কীওয়ার্ড খুঁজুন</label>
                        <input 
                          type="text"
                          placeholder="প্রশ্ন টেক্সট দিয়ে সার্চ করুন..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all text-slate-800"
                        />
                      </div>

                      {/* Subject Filter Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase pl-1 block">বিষয় অনুযায়ী ফিল্টার</label>
                        <select
                          value={selectedSubjectFilter}
                          onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none transition-all text-slate-800 cursor-pointer"
                        >
                          <option value="All">সকল বিষয় (All Subjects)</option>
                          {SUBJECTS.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Display Limit Options (10, 20, 30, 40, 50) */}
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        সর্বোচ্চ কতটি প্রশ্ন দেখাবে (সর্বশেষ সংযোজিত):
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[10, 20, 30, 40, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setDisplayLimit(num)}
                            className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                              displayLimit === num
                                ? "bg-[#FF6A00] text-white shadow-sm shadow-orange-500/20"
                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                            }`}
                          >
                            {num}টি
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Table List Card */}
                  <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <h3 className="font-extrabold text-sm text-slate-800">
                          বিদ্যমান প্রশ্ন ব্যাংক তালিকা
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold">লাইভ Supabase প্রশ্ন ব্যাংক সংগ্রহশালা (সর্বশেষ প্রশ্নসমূহ প্রথমে)</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                          মোট: {questions.length} টি
                        </span>
                        <span className="text-[10px] font-extrabold bg-orange-50 text-[#FF6A00] border border-orange-100 px-3 py-1 rounded-full">
                          প্রদর্শিত: {displayedQuestions.length} / {filteredQuestions.length} টি (সর্বোচ্চ {displayLimit} টি)
                        </span>
                      </div>
                    </div>

                    {dbError && (
                      <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{dbError} প্যানেলটি এখন ডেমো/লোকাল মেমোরি ফলব্যাকে চলছে।</span>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-14">ID</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">বিষয় ও প্রশ্ন (Subject & MCQ)</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">সম্ভাব্য অপশনসমূহ (Options)</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-40">সঠিক উত্তর</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-32">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayedQuestions.map((q) => {
                            const idVal = q.id;
                            const subjectLabel = q.subjectName || q.subject_name || "Bangla Literature";
                            const questionText = q.questionText || q.question || q.title || q.question_text || "Untitled Question";
                            const explanationText = q.explanation || "";
                            
                            // options parsing safely
                            let options: string[] = ["", "", "", ""];
                            const rawOpts = q.options || q.choices || q.answers;
                            if (Array.isArray(rawOpts)) {
                              options = rawOpts.map(String);
                            } else if (typeof rawOpts === "string") {
                              try {
                                const parsed = JSON.parse(rawOpts);
                                if (Array.isArray(parsed)) options = parsed.map(String);
                              } catch {
                                options = rawOpts.split(",").map((s: string) => s.trim());
                              }
                            }

                            const correctIdxVal = q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.correct_option_index !== undefined ? q.correct_option_index : (q.correctIndex !== undefined ? q.correctIndex : 0));
                            const correctIdx = Number(correctIdxVal);

                            return (
                              <tr key={idVal} className="hover:bg-slate-50/20 transition-all">
                                <td className="p-4 text-[10px] font-mono font-bold text-slate-400 text-center truncate max-w-[60px]" title={String(idVal)}>
                                  {typeof idVal === "number" ? `#${idVal}` : `#${String(idVal).slice(0, 6)}...`}
                                </td>
                                <td className="p-4 max-w-sm">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-extrabold bg-[#FF6A00]/5 text-[#FF6A00] border border-[#FF6A00]/10 px-2 py-0.5 rounded-full inline-block">
                                      {subjectLabel}
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug block">
                                      <MathRenderer content={questionText} />
                                    </span>
                                    {explanationText && (
                                      <span className="text-[10px] font-semibold text-slate-400 block italic leading-normal">
                                        <MathRenderer content={`ব্যাখ্যা: ${explanationText}`} />
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="grid grid-cols-2 gap-1.5 max-w-sm">
                                    {options.map((opt, oIdx) => (
                                      <span 
                                        key={oIdx} 
                                        className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                                          oIdx === correctIdx 
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold" 
                                            : "bg-slate-50 text-slate-500 border border-transparent"
                                        }`}
                                      >
                                        <span className="font-extrabold mr-1">{oIdx + 1}.</span>
                                        <MathRenderer content={opt || `অপশন ${oIdx + 1}`} />
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg inline-block max-w-[150px]">
                                    <MathRenderer content={options[correctIdx] || options[0] || "অপশন ১"} />
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* Edit Button */}
                                    <button
                                      onClick={() => handleEditClick(q)}
                                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-600 rounded-xl transition-colors active:scale-90 cursor-pointer"
                                      title="Edit Question"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => {
                                        if (confirm(`আপনি কি নিশ্চিত যে আপনি এই প্রশ্নটি মুছে ফেলতে চান?`)) {
                                          handleDeleteQuestion(idVal);
                                        }
                                      }}
                                      className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100/50 text-rose-600 rounded-xl transition-colors active:scale-90 cursor-pointer"
                                      title="Delete Question"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                        {displayedQuestions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-xs font-bold text-slate-400">
                              কোনো প্রশ্ন পাওয়া যায়নি! দয়া করে ডেমো প্রশ্ন সিড করুন অথবা নতুন প্রশ্ন যোগ করুন।
                            </td>
                          </tr>
                        )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* VIEW EXAM PAPERS: CREATOR & MANAGEMENT                     */}
          {/* ========================================================= */}
          {activeTab === "exam_papers" && (
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* Paper Builder Form Card */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-orange-50 text-[#FF6A00] rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 stroke-[2.2px]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                        {editingPaperId ? "প্রশ্ন পত্র এডিট করুন" : "নতুন প্রশ্ন সেট / প্রশ্ন পত্র তৈরি করুন"}
                      </h3>
                    </div>
                  </div>

                  {editingPaperId && (
                    <button
                      onClick={() => {
                        setEditingPaperId(null);
                        setPaperQuestions([]);
                        setPaperTitle("Live MCQ ফ্রি সাপ্তাহিক ফুল মডেল টেস্ট: বিসিএস");
                        setPaperStatus("Upcoming");
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                    >
                      বাতিল করুন
                    </button>
                  )}
                </div>

                <form onSubmit={handlePublishExamPaper} className="space-y-6">
                  {/* Mode Selector: Our Course vs Preparation Hub */}
                  <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-2">
                    <label className="text-[11px] font-black text-slate-700 uppercase block">
                      প্রশ্নপত্র তৈরির সেকশন সিলেক্ট করুন (Target Section) *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaperCategoryType("our_course");
                          if (coursesList.length > 0 && !paperCourse) {
                            setPaperCourse(coursesList[0].id);
                          }
                        }}
                        className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paperCategoryType === "our_course"
                            ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Compass className="w-4 h-4" />
                        <span>আওয়ার কোর্স (Our Course)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaperCategoryType("prep_hub");
                          if (prepSubjectsList.length > 0 && !paperPrepSubjectId) {
                            setPaperPrepSubjectId(prepSubjectsList[0].name);
                          }
                        }}
                        className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paperCategoryType === "prep_hub"
                            ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>প্রেপারেশন হাব (Preparation Hub)</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 1: Title & Selection */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        ১. পরীক্ষার নাম (Exam Title) *
                      </label>
                      <input 
                        type="text"
                        placeholder="যেমন: Live MCQ ফ্রি সাপ্তাহিক ফুল মডেল টেস্ট: বিসিএস"
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                        required
                      />
                    </div>

                    {paperCategoryType === "prep_hub" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            ২. প্রেপারেশন সাবজেক্ট (Prep Subject) *
                          </label>
                          <select
                            value={paperPrepSubjectId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaperPrepSubjectId(val);
                              setPaperPrepSubSubject("none");
                            }}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800 cursor-pointer"
                          >
                            {prepSubjectsList.map(s => (
                              <option key={s.id} value={s.id}>{s.bnName || s.name} ({s.sub || "Subject"})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-[#FF6A00] uppercase block pl-1">
                            ২.১ সাব-সাবজেক্ট / পেপার (Sub-Subject / Paper) *
                          </label>
                          <select
                            value={paperPrepSubSubject}
                            onChange={(e) => setPaperPrepSubSubject(e.target.value)}
                            className="w-full bg-orange-50/50 border border-orange-200/90 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-all text-slate-800 cursor-pointer"
                          >
                            {(
                              SUB_SUBJECTS_MAP[paperPrepSubjectId] || 
                              SUB_SUBJECTS_MAP[paperPrepSubjectId.toLowerCase()] || 
                              (prepSubjectsList.find(s => s.id === paperPrepSubjectId || s.name === paperPrepSubjectId) ? 
                                SUB_SUBJECTS_MAP[prepSubjectsList.find(s => s.id === paperPrepSubjectId || s.name === paperPrepSubjectId)!.name] : null) || 
                              [{ id: "none", name: "None (কোনো সাব-সাবজেক্ট নেই)" }]
                            ).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            ২. কোর্স / ক্যাটাগরি (Course) *
                          </label>
                          <select
                            value={paperCourse}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaperCourse(val);
                              setPaperSubSubject("none");
                            }}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800 cursor-pointer"
                          >
                            {COURSES.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-[11px] font-extrabold text-[#FF6A00] uppercase block pl-1">
                            ২.১ বিষয় পেপার / সাব-ক্যাটাগরি (Sub-Subject / Paper) *
                          </label>
                          <select
                            value={paperSubSubject}
                            onChange={(e) => setPaperSubSubject(e.target.value)}
                            className="w-full bg-orange-50/50 border border-orange-200/90 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-all text-slate-800 cursor-pointer"
                          >
                            {(
                              SUB_SUBJECTS_MAP[paperCourse] || 
                              SUB_SUBJECTS_MAP[paperCourse.toLowerCase()] || 
                              [{ id: "none", name: "None (কোনো সাব-সাবজেক্ট নেই)" }]
                            ).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Exam Type & Topic */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        ৩. পরীক্ষার ধরন (Type) *
                      </label>
                      <select
                        value={paperExamType}
                        onChange={(e) => setPaperExamType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800 cursor-pointer"
                      >
                        {EXAM_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        ৪. টপিক / বিষয় বিবরণ (Topic)
                      </label>
                      <input 
                        type="text"
                        placeholder='যেমন: "Award Mania" এর জন্য প্রযোজ্য'
                        value={paperTopic}
                        onChange={(e) => setPaperTopic(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        ৫. ডিসপ্লে টেক্সট (Display Label Text) & স্ট্যাটাস
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          placeholder="যেমন: Fri, Jul 31, 2026"
                          value={paperDate}
                          onChange={(e) => setPaperDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none text-slate-800"
                        />
                        <select
                          value={paperStatus}
                          onChange={(e) => {
                            const newStatus = e.target.value as any;
                            setPaperStatus(newStatus);
                            if (newStatus === "Live") {
                              const nowLocal = getNowLocalDateTimeStr();
                              const todayEnd = getTodayEndDateTimeStr();
                              setPaperStartDateTime(nowLocal);
                              setPaperEndDateTime(todayEnd);
                              setPaperDate(formatDisplayDate(nowLocal));
                            }
                          }}
                          className="bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3 py-3 text-xs font-bold focus:outline-none text-slate-800 cursor-pointer shrink-0"
                        >
                          <option value="Upcoming">Upcoming (আসন্ন)</option>
                          <option value="Live">Live (লাইভ)</option>
                          <option value="Archive">Archive (আর্কাইভ)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 2.5: START & END DATE & TIME PICKER (CALENDAR) - For Upcoming and Live */}
                  {(paperStatus === "Upcoming" || paperStatus === "Live") && (
                    <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          📅 <span>পরীক্ষার সময়কাল নির্ধারণ (Start & End Date/Time Calendar) *</span>
                        </label>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          paperStatus === "Live" ? "text-emerald-700 bg-emerald-100" : "text-purple-700 bg-purple-100"
                        }`}>
                          {paperStatus === "Live" ? "🔴 লাইভ পরীক্ষার সময়সূচি নির্ধারণ" : "📅 আসন্ন পরীক্ষার সময়সূচি নির্ধারণ"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase block pl-1">
                            {paperStatus === "Live" ? "পরীক্ষা শুরুর সময় (আজকের তারিখ ও সময়)" : "কখন থেকে শুরু হবে (Start Date & Time)"}
                          </label>
                          <input 
                            type="datetime-local"
                            value={paperStartDateTime}
                            min={paperStatus === "Live" ? getNowLocalDateTimeStr() : undefined}
                            max={paperStatus === "Live" ? getTodayEndDateTimeStr() : undefined}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaperStartDateTime(val);
                              if (val) {
                                setPaperDate(formatDisplayDate(val));
                              }
                            }}
                            className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs"
                            required
                          />
                          {paperStatus === "Live" && (
                            <p className="text-[10px] font-bold text-amber-700 pl-1 pt-0.5">
                              * শুরুর তারিখ আজকের তারিখই থাকবে। আজকের রাতের ১১:৫৯ মিনিটের মধ্যের সময় সিলেক্ট করা যাবে।
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase block pl-1">
                            কখন শেষ হবে (End Date & Time)
                          </label>
                          <input 
                            type="datetime-local"
                            value={paperEndDateTime}
                            min={paperStartDateTime || getNowLocalDateTimeStr()}
                            onChange={(e) => setPaperEndDateTime(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs"
                            required
                          />
                          {paperStatus === "Live" && (
                            <p className="text-[10px] font-bold text-purple-700 pl-1 pt-0.5">
                              * লাইভ মেয়াদ শেষে পরীক্ষাটি স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট বিষয়ের আর্কাইভে চলে যাবে।
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold text-slate-600 pt-1">
                        <span className="text-slate-400">দ্রুত সময় সেট করুন:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nowLocal = getNowLocalDateTimeStr();
                            const todayEnd = getTodayEndDateTimeStr();
                            setPaperStartDateTime(nowLocal);
                            setPaperEndDateTime(todayEnd);
                            setPaperDate(formatDisplayDate(nowLocal));
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-slate-700 cursor-pointer active:scale-95 transition-all"
                        >
                          ⚡ আজকের লাইভ মক (এখন থেকে - রাত ১১:৫৯)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const nowLocal = getNowLocalDateTimeStr();
                            const future = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
                            const year = future.getFullYear();
                            const month = String(future.getMonth() + 1).padStart(2, '0');
                            const day = String(future.getDate()).padStart(2, '0');
                            const endVal = `${year}-${month}-${day}T23:59`;
                            setPaperStartDateTime(nowLocal);
                            setPaperEndDateTime(endVal);
                            setPaperDate(formatDisplayDate(nowLocal));
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-slate-700 cursor-pointer active:scale-95 transition-all"
                        >
                          📅 ৩ দিনের লাইভ এক্সাম
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const nowLocal = getNowLocalDateTimeStr();
                            const future = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
                            const year = future.getFullYear();
                            const month = String(future.getMonth() + 1).padStart(2, '0');
                            const day = String(future.getDate()).padStart(2, '0');
                            const endVal = `${year}-${month}-${day}T23:59`;
                            setPaperStartDateTime(nowLocal);
                            setPaperEndDateTime(endVal);
                            setPaperDate(formatDisplayDate(nowLocal));
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-slate-700 cursor-pointer active:scale-95 transition-all"
                        >
                          🗓️ ৭ দিনের লাইভ এক্সাম
                        </button>
                      </div>

                      {/* Calculated Live Status Banner */}
                      {paperStartDateTime && paperEndDateTime && (
                        <div className="pt-2 border-t border-purple-100/80 flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                          <span className="text-slate-600">নির্ধারিত সময়সূচি অনুযায়ী বর্তমান অবস্থা:</span>
                          {(() => {
                            const now = new Date();
                            const start = new Date(paperStartDateTime);
                            const end = new Date(paperEndDateTime);
                            if (now < start) {
                              return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-extrabold flex items-center gap-1">⏳ Upcoming (নির্ধারিত সময়ের আগে)</span>;
                            } else if (now >= start && now <= end) {
                              return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-extrabold flex items-center gap-1">🔴 Live (লাইভ পরীক্ষা চলছে)</span>;
                            } else {
                              return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-extrabold flex items-center gap-1">📂 Archive (সময় শেষ, আর্কাইভে চলে যাবে)</span>;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 3: Target Question Count & Timer Calc */}
                  <div className="p-4 bg-orange-50/50 border border-orange-100/80 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-[#FF6A00]" />
                        <span>৬. প্রতি সেটে কতটি প্রশ্ন থাকবে (Question Capacity):</span>
                      </label>
                      
                      <div className="flex items-center gap-1.5">
                        {[10, 20, 50, 100, 200].map(cnt => (
                          <button
                            type="button"
                            key={cnt}
                            onClick={() => setPaperTargetCount(cnt)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              paperTargetCount === cnt
                                ? "bg-[#FF6A00] text-white shadow-sm"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {cnt} টি
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-600 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-orange-100/60">
                      <span>
                        মোট সিলেক্টেড প্রশ্ন: <strong className="text-[#FF6A00]">{paperQuestions.length} / {paperTargetCount}</strong> টি
                      </span>
                      <span>
                        পরীক্ষার সময় নির্ধারণ: <strong className="text-slate-800">{paperQuestions.length * 36} সেকেন্ড</strong> ({Math.floor((paperQuestions.length * 36) / 60)} মিনিট {(paperQuestions.length * 36) % 60} সেকেন্ড @ ৩৬ সেকেন্ড/প্রশ্ন)
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Search & Select Questions from Server Bank */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-purple-600" />
                        <span>৭. সার্ভার প্রশ্ন ব্যাংক থেকে সার্চ ও প্রশ্ন যোগ করুন:</span>
                      </h4>

                      <button
                        type="button"
                        onClick={handleAutoFillQuestions}
                        className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>অটো সিলেক্ট / র‍্যান্ডম ফিল (Auto Fill)</span>
                      </button>
                    </div>

                    {/* Filter controls & Multi-subject Selection Chips */}
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="প্রশ্ন দিয়ে খুঁজুন..."
                        value={paperSearchQuery}
                        onChange={(e) => setPaperSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#FF6A00]"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pl-0.5">
                          <span>বিষয় ফিল্টার (একাধিক সাবজেক্ট সিলেক্ট করা যাবে):</span>
                          <span className="text-[#FF6A00] font-extrabold">
                            {paperSearchSubjects.includes("All") ? "সকল বিষয়" : `সিলেক্টেড: ${paperSearchSubjects.length} টি বিষয়`}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-32 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => togglePaperSearchSubject("All")}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                              paperSearchSubjects.includes("All")
                                ? "bg-purple-600 text-white shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            🌐 সকল বিষয় (All)
                          </button>

                          {SUBJECTS
                            .filter(s => paperExamType === "special" || s !== "BCS Health Question")
                            .map(s => {
                              const isSelected = !paperSearchSubjects.includes("All") && paperSearchSubjects.includes(s);
                              return (
                                <button
                                  type="button"
                                  key={s}
                                  onClick={() => togglePaperSearchSubject(s)}
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                      ? "bg-[#FF6A00] text-white shadow-2xs"
                                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  <span>{s}</span>
                                </button>
                              );
                            })
                          }
                        </div>
                      </div>
                    </div>

                    {/* Searched Results Box */}
                    <div className="max-h-52 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-2 space-y-2">
                      {questions
                        .map(q => normalizeQuestion(q))
                        .filter(q => {
                          const qSub = q.subject || q.subjectName || "";
                          const qText = q.question || q.questionText || "";
                          if (paperExamType !== "special" && qSub === "BCS Health Question") {
                            return false;
                          }
                          const matchesSub = paperSearchSubjects.includes("All") || paperSearchSubjects.length === 0 || paperSearchSubjects.includes(qSub);
                          const matchesText = !paperSearchQuery || qText.toLowerCase().includes(paperSearchQuery.toLowerCase());
                          return matchesSub && matchesText;
                        })
                        .slice(0, 12)
                        .map((q, idx) => {
                          const isAdded = paperQuestions.some(pq => pq.id === q.id || (pq.question || pq.questionText) === q.question);
                          return (
                            <div key={q.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                              <div className="text-xs text-slate-800 font-semibold line-clamp-1">
                                <span className="text-[10px] font-extrabold text-[#FF6A00] bg-orange-50 px-1.5 py-0.5 rounded mr-1.5">
                                  {q.subject || q.subjectName || "General"}
                                </span>
                                {q.question || q.questionText}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddQuestionToPaper(q)}
                                disabled={isAdded}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer shrink-0 ${
                                  isAdded
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {isAdded ? "যোগ করা হয়েছে ✓" : "+ যোগ করুন"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Selected Questions List */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>৮. প্রশ্নপত্রে যুক্ত প্রশ্নসমূহ ({paperQuestions.length} টি):</span>
                    </h4>

                    {paperQuestions.length === 0 ? (
                      <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs font-bold text-slate-400">
                        এখনো কোনো প্রশ্ন যোগ করা হয়নি! উপরের সার্চ বক্স থেকে অথবা "অটো সিলেক্ট" বাটনে ক্লিক করে প্রশ্ন যোগ করুন।
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {paperQuestions.map((pq, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="text-xs text-slate-800 font-bold flex items-center gap-2">
                              <span className="w-5 h-5 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                                {idx + 1}
                              </span>
                              <MathRenderer content={pq.question || pq.questionText} />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionFromPaper(idx)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all shrink-0 cursor-pointer"
                              title="প্রশ্নটি সরান"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      className="bg-[#FF6A00] hover:bg-orange-600 text-white font-black text-xs sm:text-sm px-8 py-3.5 rounded-2xl active:scale-95 transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5px]" />
                      <span>{editingPaperId ? "প্রশ্ন পত্র আপডেট করুন" : "প্রশ্ন পত্র পাবলিশ করুন"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Published Exam Papers Table / List */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#FF6A00]" />
                    <span>পাবলিশকৃত প্রশ্ন পত্রসমূহের তালিকা ({examPapers.length} টি)</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const sortedAdminPapers = [...examPapers].sort((a, b) => {
                      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                      return timeB - timeA;
                    });

                    return sortedAdminPapers.map((paper) => (
                      <div 
                        key={paper.id}
                        className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-200 transition-all"
                      >
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            paper.status === "Live" 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {paper.status}
                          </span>
                          <span className="text-[10px] font-extrabold text-[#FF6A00] bg-orange-50 px-2 py-0.5 rounded uppercase">
                            {(COURSES.find(c => c.id === paper.course)?.name || paper.course).toUpperCase()} • {paper.examType.toUpperCase()}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-black text-slate-800">
                          {paper.title}
                        </h4>

                        <div className="text-[11px] font-bold text-slate-500 flex flex-wrap items-center gap-3 pt-0.5">
                          <span>প্রশ্ন: {paper.questionCount} টি</span>
                          <span>সময়: {Math.floor(paper.totalDurationSeconds / 60)} মিনিট</span>
                          <span>তারিখ: {paper.examDate}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleArchiveExamPaper(paper)}
                          className={`px-3 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                            paper.status === "Archive" || (paper.status as string).toLowerCase() === "archived"
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                          }`}
                          title={paper.status === "Archive" || (paper.status as string).toLowerCase() === "archived" ? "লাইভ করুন" : "আর্কাইভ করুন"}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>{paper.status === "Archive" || (paper.status as string).toLowerCase() === "archived" ? "লাইভ করুন" : "আর্কাইভ"}</span>
                        </button>

                        <button
                          onClick={() => handleEditExamPaper(paper)}
                          className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>এডিট</span>
                        </button>

                        <button
                          onClick={() => handleDeleteExamPaper(paper.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                          title="ডিলেট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ));
                })()}

                  {examPapers.length === 0 && (
                    <div className="p-8 text-center text-xs font-bold text-slate-400">
                      এখনো কোনো প্রশ্ন পত্র তৈরি করা হয়নি। উপরের ফর্ম পূরণ করে আপনার প্রথম প্রশ্ন পত্র পাবলিশ করুন!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW B: USER MANAGEMENT                                    */}
          {/* ========================================================= */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">
                      নিবন্ধিত শিক্ষার্থীদের তালিকা (User Management)
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                      শিক্ষার্থীদের অ্যাকাউন্ট নিষিদ্ধ ও সক্রিয় করার ডিরেক্টরি
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                    মোট: {users.length} জন ইউজার
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-20">ID</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">ইমেইল এড্রেস (Email)</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-36">ভূমিকা (Role)</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-32 text-center">স্ট্যাটাস</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-40">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/20 transition-all">
                          <td className="p-4 text-xs font-mono font-bold text-slate-400 text-center">{user.id}</td>
                          <td className="p-4">
                            <span className="text-xs sm:text-sm font-bold text-slate-800">
                              {user.email}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-100 inline-block">
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full inline-block border ${
                              user.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                            }`}>
                              {user.status === "Active" ? "সক্রিয় (Active)" : "নিষিদ্ধ (Banned)"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all active:scale-95 border cursor-pointer ${
                                user.status === "Active"
                                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100/50"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100/50"
                              }`}
                            >
                              {user.status === "Active" ? "Ban Account" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW C: OFFERS & ANNOUNCEMENTS                             */}
          {/* ========================================================= */}
          {activeTab === "offers" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Add Offer Form Card */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                  <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 stroke-[2.5px]" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                    নতুন অফার ও প্রমোশনাল ব্যানার যোগ করুন
                  </h3>
                </div>

                <form onSubmit={handleAddOffer} className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                      ব্যানার শিরোনাম (Title)
                    </label>
                    <input 
                      type="text"
                      placeholder="যেমন: 🔥 বিসিএস মেগা কোর্স ২০% ছাড়!"
                      value={newOfferTitle}
                      onChange={(e) => setNewOfferTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                      বিস্তারিত অফার বিবরণ (Description)
                    </label>
                    <textarea 
                      placeholder="অফারটির বিশদ বিবরণ, কুপন কোড এবং শেষ হওয়ার সময়সীমা ইত্যাদি সুন্দর করে উল্লেখ করুন..."
                      value={newOfferDesc}
                      onChange={(e) => setNewOfferDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800 resize-none"
                      required
                    />
                  </div>

                  {/* Toggle Active state immediately */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="offer-active-checkbox"
                      checked={newOfferActive}
                      onChange={(e) => setNewOfferActive(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-[#FF6A00] focus:ring-[#FF6A00] cursor-pointer"
                    />
                    <label htmlFor="offer-active-checkbox" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      তৈরি করার সাথে সাথে ব্যানারটি সরাসরি ওয়েবসাইটে লাইভ দেখান
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="bg-[#FF6A00] hover:bg-orange-600 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl active:scale-95 transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5px]" />
                    ব্যানার যুক্ত করুন
                  </button>
                </form>
              </div>

              {/* Offers List Display Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                  বর্তমান সচল ও অচল ব্যানারসমূহ
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map((offer) => (
                    <div 
                      key={offer.id} 
                      className={`bg-white border rounded-[2rem] p-5 shadow-sm transition-all space-y-3 ${
                        offer.active ? "border-orange-100" : "border-slate-100 opacity-75"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1 text-left">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                            offer.active 
                              ? "bg-orange-50 text-[#FF6A00] border border-orange-100" 
                              : "bg-slate-100 text-slate-400 border border-transparent"
                          }`}>
                            {offer.active ? "ACTIVE BANNER" : "INACTIVE"}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-snug">
                            {offer.title}
                          </h4>
                        </div>

                        {/* Slide Toggle Switch */}
                        <button
                          onClick={() => toggleOfferActive(offer.id)}
                          className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                            offer.active ? "bg-[#FF6A00]" : "bg-slate-300"
                          }`}
                          title="ব্যানার স্ট্যাটাস পরিবর্তন করুন"
                        >
                          <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${
                            offer.active ? "translate-x-5" : "translate-x-0"
                          }`}></span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed text-left">
                        {offer.description}
                      </p>

                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>ID: {offer.id}</span>
                        <span className={offer.active ? "text-orange-500" : "text-slate-400"}>
                          {offer.active ? "● লাইভ প্রদর্শিত হচ্ছে" : "● ড্রাফট মোডে রয়েছে"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW E: PACKAGES MANAGEMENT                                */}
          {/* ========================================================= */}
          {activeTab === "packages" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in text-left">
              
              {/* Left Column: Add/Edit Package Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 stroke-[2.5px]" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                          {editingPkgId ? "প্যাকেজ এডিট করুন" : "নতুন প্যাকেজ যোগ করুন"}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {editingPkgId ? "প্যাকেজের তথ্য সংশোধন করুন" : "অ্যাপে প্রদর্শনের জন্য প্যাকেজ এড করুন"}
                        </p>
                      </div>
                    </div>
                    {editingPkgId && (
                      <button
                        onClick={handleCancelPkgEdit}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        বাতিল
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSavePackage} className="space-y-3.5">
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        প্যাকেজ শিরোনাম (Title) *
                      </label>
                      <input 
                        type="text"
                        placeholder="যেমন: ৬ মাসের ফুল অ্যাপ এক্সেস 🌟"
                        value={pkgFormTitle}
                        onChange={(e) => setPkgFormTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        বিস্তারিত বিবরণ (Description)
                      </label>
                      <textarea 
                        rows={2}
                        placeholder="যেমন: ১৮০ দিনের জন্য সকল ফিচারের ফুল এক্সেস..."
                        value={pkgFormDesc}
                        onChange={(e) => setPkgFormDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none transition-all text-slate-800 resize-none"
                      />
                    </div>

                    {/* Category & Order */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          ক্যাটাগরি
                        </label>
                        <select
                          value={pkgFormCategory}
                          onChange={(e) => setPkgFormCategory(e.target.value as "all" | "course")}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#007AFF] rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none text-slate-800 cursor-pointer"
                        >
                          <option value="all">ফুল অ্যাপ এক্সেস</option>
                          <option value="course">কোর্সভিত্তিক</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          ক্রম (Order)
                        </label>
                        <input 
                          type="number"
                          value={pkgFormOrder}
                          onChange={(e) => setPkgFormOrder(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#007AFF] rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none text-slate-800"
                          min={1}
                        />
                      </div>
                    </div>

                    {/* Price & Old Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          মূল্য (Price) *
                        </label>
                        <input 
                          type="text"
                          placeholder="যেমন: ৳৪৯৯"
                          value={pkgFormPrice}
                          onChange={(e) => setPkgFormPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#007AFF] rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none text-slate-800"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          পূর্বের মূল্য (Old Price)
                        </label>
                        <input 
                          type="text"
                          placeholder="যেমন: ৳৬৯৯ (ঐচ্ছিক)"
                          value={pkgFormOldPrice}
                          onChange={(e) => setPkgFormOldPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#007AFF] rounded-2xl px-3.5 py-2.5 text-xs font-bold focus:outline-none text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Badge Selection */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        ব্যাজ লেবেল (Badge Option)
                      </label>
                      <select
                        value={pkgFormBadgePreset}
                        onChange={(e) => setPkgFormBadgePreset(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#007AFF] rounded-2xl px-3 py-2.5 text-xs font-bold focus:outline-none text-slate-800 cursor-pointer"
                      >
                        <option value="none">কোনো ব্যাজ নেই (None)</option>
                        <option value="POPULAR">POPULAR (পপুলার)</option>
                        <option value="BEST VALUE">BEST VALUE (সেরা মান)</option>
                        <option value="NEW">NEW (নতুন)</option>
                        <option value="BASIC">BASIC (বেসিক)</option>
                        <option value="custom">✍️ নিজ থেকে কাস্টম ব্যাজ নাম লিখুন</option>
                      </select>

                      {pkgFormBadgePreset === "custom" && (
                        <input 
                          type="text"
                          placeholder="কাস্টম ব্যাজ টেক্সট (যেমন: SPECIAL OFFER)"
                          value={pkgFormBadgeCustom}
                          onChange={(e) => setPkgFormBadgeCustom(e.target.value)}
                          className="w-full bg-amber-50/50 border border-amber-200 focus:border-[#007AFF] rounded-2xl px-3.5 py-2 text-xs font-extrabold text-amber-900 placeholder:text-amber-400"
                        />
                      )}
                    </div>

                    {/* Submit Action */}
                    <div className="pt-3 flex items-center gap-2">
                      {editingPkgId && (
                        <button
                          type="button"
                          onClick={handleCancelPkgEdit}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                        >
                          বাতিল
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[2.5px]" />
                        <span>{editingPkgId ? "প্যাকেজ আপডেট করুন" : "প্যাকেজ সেভ করুন"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Packages List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#007AFF]" />
                    <h3 className="font-extrabold text-sm text-slate-800">
                      বিদ্যমান প্যাকেজসমূহ ({packagesList.length} টি)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncPackagesToSupabase}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#007AFF] font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="সকল প্যাকেজ Supabase লাইভ ডেটাবেসে আপলোড করুন"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Supabase এ সিঙ্ক করুন</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {packagesList.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-semibold text-xs">
                      কোনো প্যাকেজ পাওয়া যায়নি। বামপাশের ফর্ম থেকে নতুন প্যাকেজ যোগ করুন।
                    </div>
                  ) : (
                    packagesList.map((pkg) => (
                      <div 
                        key={pkg.id}
                        className={`bg-white border ${
                          editingPkgId === pkg.id ? "border-[#007AFF] ring-2 ring-[#007AFF]/10" : "border-slate-100"
                        } rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                #{pkg.order || 0}
                              </span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                pkg.category === "course"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {pkg.category === "course" ? "কোর্সভিত্তিক" : "ফুল অ্যাপ এক্সেস"}
                              </span>
                              {pkg.badge && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/80">
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                              {pkg.title}
                            </h4>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed">
                              {pkg.desc}
                            </p>
                          </div>

                          <div className="shrink-0 text-right space-y-1">
                            <div className="text-base font-black text-[#007AFF]">
                              {pkg.price}
                            </div>
                            {pkg.oldPrice && (
                              <div className="text-xs font-bold text-slate-400 line-through">
                                {pkg.oldPrice}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            ID: {pkg.id}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditPackage(pkg)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#007AFF] font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>এডিট</span>
                            </button>
                            <button
                              onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ডিলেট</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW F: OUR COURSES MANAGEMENT                             */}
          {/* ========================================================= */}
          {activeTab === "courses" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in text-left">
              
              {/* Left Column: Add/Edit Course Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-50 text-[#FF6A00] rounded-xl flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4 stroke-[2.5px]" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                          {editingCourseId ? "কোর্স এডিট করুন" : "নতুন কোর্স যোগ করুন"}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {editingCourseId ? "কোর্সের তথ্য সংশোধন করুন" : "হোম পেজে 'Our Courses' এ প্রদর্শনের জন্য"}
                        </p>
                      </div>
                    </div>
                    {editingCourseId && (
                      <button
                        onClick={handleCancelCourseEdit}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        বাতিল
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveCourse} className="space-y-3.5">
                    {/* Serial Order & ID */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          সিরিয়াল (Serial) *
                        </label>
                        <input 
                          type="number"
                          min={1}
                          value={courseFormSerial}
                          onChange={(e) => setCourseFormSerial(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all text-slate-800"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          কোর্স আইডি (ID)
                        </label>
                        <input 
                          type="text"
                          placeholder="যেমন: office_assistant"
                          value={courseFormId}
                          onChange={(e) => setCourseFormId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        কোর্সের নাম (Course Short Name) *
                      </label>
                      <input 
                        type="text"
                        placeholder="যেমন: অফিস সহায়ক (Office Assistant)"
                        value={courseFormName}
                        onChange={(e) => setCourseFormName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                        required
                      />
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        কোর্স ফুল টাইটেল (Title) *
                      </label>
                      <input 
                        type="text"
                        placeholder="যেমন: অফিস সহকারী ও কম্পিউটার অপারেটর স্পেশাল কোর্স"
                        value={courseFormTitle}
                        onChange={(e) => setCourseFormTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                        required
                      />
                    </div>

                    {/* Icon */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        আইকন (Icon)
                      </label>
                      <select
                        value={courseFormIcon}
                        onChange={(e) => setCourseFormIcon(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="BookOpen">📖 BookOpen (Open Book)</option>
                        <option value="Book">📘 Book (Closed Book)</option>
                        <option value="Laptop">💻 Laptop (Computer)</option>
                        <option value="Monitor">🖥️ Monitor (Computer)</option>
                        <option value="FlaskConical">🧪 Flask (Science)</option>
                        <option value="Atom">⚛️ Atom (Science)</option>
                        <option value="Calculator">🧮 Calculator</option>
                        <option value="Globe">🌐 Globe</option>
                        <option value="GraduationCap">🎓 GraduationCap</option>
                        <option value="FileText">📄 FileText</option>
                        <option value="Briefcase">💼 Briefcase</option>
                        <option value="Users">👥 Users</option>
                        <option value="Shield">🛡️ Shield</option>
                        <option value="Zap">⚡ Zap</option>
                        <option value="Award">🏆 Award</option>
                      </select>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          ব্যাকগ্রাউন্ড কালার Class
                        </label>
                        <select
                          value={courseFormBg}
                          onChange={(e) => setCourseFormBg(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="bg-[#FFF1E6]">Orange Tint (bg-[#FFF1E6])</option>
                          <option value="bg-[#E6F0FA]">Blue Tint (bg-[#E6F0FA])</option>
                          <option value="bg-[#EBF7EE]">Green Tint (bg-[#EBF7EE])</option>
                          <option value="bg-[#F3E8FF]">Purple Tint (bg-[#F3E8FF])</option>
                          <option value="bg-[#FCE7F3]">Rose Tint (bg-[#FCE7F3])</option>
                          <option value="bg-[#FEF3C7]">Amber Tint (bg-[#FEF3C7])</option>
                          <option value="bg-[#DCFCE7]">Emerald Tint (bg-[#DCFCE7])</option>
                          <option value="bg-[#E0F2FE]">Sky Tint (bg-[#E0F2FE])</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          আইকন কালার Class
                        </label>
                        <select
                          value={courseFormIconColor}
                          onChange={(e) => setCourseFormIconColor(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="text-orange-600">Orange (text-orange-600)</option>
                          <option value="text-blue-600">Blue (text-blue-600)</option>
                          <option value="text-green-600">Green (text-green-600)</option>
                          <option value="text-purple-600">Purple (text-purple-600)</option>
                          <option value="text-rose-600">Rose (text-rose-600)</option>
                          <option value="text-amber-600">Amber (text-amber-600)</option>
                          <option value="text-emerald-600">Emerald (text-emerald-600)</option>
                          <option value="text-sky-600">Sky (text-sky-600)</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        বিস্তারিত বিবরণ (Description)
                      </label>
                      <textarea 
                        rows={2}
                        placeholder="যেমন: সরকারি দপ্তর ও পরিদপ্তরে অফিস সহকারী ও কম্পিউটার অপারেটর পদের জন্য..."
                        value={courseFormDesc}
                        onChange={(e) => setCourseFormDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none transition-all text-slate-800 resize-none"
                      />
                    </div>

                    {/* MULTI-LEVEL SUB-CATEGORY EDITOR FOR OUR COURSES (Level 2 & Level 3) */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#FF6A00]" />
                            <span>সাব-ক্যাটাগরি ও সাব-টপিকসমূহ (Level 2 & Level 3)</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold">
                            লেভেল ২: সাব-ক্যাটাগরি/পেপার, লেভেল ৩: সাব-টপিকসমূহ
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSub: SubCategoryItem = {
                              id: `sub_${Date.now()}`,
                              name: "নতুন সাব-ক্যাটাগরি",
                              sub: "সংক্ষিপ্ত বিবরণ",
                              serial: courseFormSubSubjects.length + 1,
                              subCategories2: []
                            };
                            setCourseFormSubSubjects([...courseFormSubSubjects, newSub]);
                          }}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-[11px] rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                          <span>+ সাব-ক্যাটাগরি</span>
                        </button>
                      </div>

                      {/* List of Level 2 Sub-Categories */}
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {courseFormSubSubjects.length === 0 ? (
                          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-slate-400 text-xs">
                            কোনো সাব-ক্যাটাগরি যুক্ত হয়নি। '+ সাব-ক্যাটাগরি' বাটনে ক্লিক করে যোগ করুন।
                          </div>
                        ) : (
                          courseFormSubSubjects.map((subItem, sIdx) => (
                            <div key={subItem.id || sIdx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                              {/* Level 2 Sub-Category Header & Controls */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                                  Level 2 #{sIdx + 1}
                                </span>
                                <input 
                                  type="text"
                                  placeholder="সাব-ক্যাটাগরির নাম (e.g. BCS Preliminary)"
                                  value={subItem.name}
                                  onChange={(e) => {
                                    const updated = [...courseFormSubSubjects];
                                    updated[sIdx].name = e.target.value;
                                    setCourseFormSubSubjects(updated);
                                  }}
                                  className="flex-1 bg-white border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = courseFormSubSubjects.filter((_, i) => i !== sIdx);
                                    setCourseFormSubSubjects(updated);
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Level 2 Sub-text */}
                              <input 
                                type="text"
                                placeholder="বিবরণ / সাব-টাইটেল (e.g. সকল বিষয়ভিত্তিক মক টেস্ট)"
                                value={subItem.sub || ""}
                                onChange={(e) => {
                                  const updated = [...courseFormSubSubjects];
                                  updated[sIdx].sub = e.target.value;
                                  setCourseFormSubSubjects(updated);
                                }}
                                className="w-full bg-white border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
                              />

                              {/* Nested Level 3 Sub-Categories (subCategories2) */}
                              <div className="pl-3 border-l-2 border-orange-200 space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-extrabold text-orange-600">
                                    লেভেল ৩ টপিকসমূহ:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...courseFormSubSubjects];
                                      if (!updated[sIdx].subCategories2) updated[sIdx].subCategories2 = [];
                                      updated[sIdx].subCategories2!.push({
                                        id: `sub2_${Date.now()}`,
                                        name: "নতুন সাব-টপিক",
                                        serial: updated[sIdx].subCategories2!.length + 1
                                      });
                                      setCourseFormSubSubjects(updated);
                                    }}
                                    className="text-[10px] font-bold text-orange-600 hover:text-orange-800 bg-orange-100/60 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>+ সাব-টপিক (Level 3)</span>
                                  </button>
                                </div>

                                {(subItem.subCategories2 || []).map((sub2, sub2Idx) => (
                                  <div key={sub2.id || sub2Idx} className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">
                                      └─ #{sub2Idx + 1}
                                    </span>
                                    <input 
                                      type="text"
                                      placeholder="সাব-টপিক ৩ (e.g. বীজগণিত মান নির্ণয়)"
                                      value={sub2.name}
                                      onChange={(e) => {
                                        const updated = [...courseFormSubSubjects];
                                        updated[sIdx].subCategories2![sub2Idx].name = e.target.value;
                                        setCourseFormSubSubjects(updated);
                                      }}
                                      className="flex-1 bg-white border border-slate-200 focus:border-[#FF6A00] rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...courseFormSubSubjects];
                                        updated[sIdx].subCategories2 = updated[sIdx].subCategories2!.filter((_, i) => i !== sub2Idx);
                                        setCourseFormSubSubjects(updated);
                                      }}
                                      className="p-1 text-rose-400 hover:text-rose-600 transition-all shrink-0 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl active:scale-95 transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <Check className="w-4 h-4 stroke-[3px]" />
                      <span>{editingCourseId ? "কোর্স আপডেট করুন" : "কোর্স সেভ করুন"}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Courses List & Re-ordering */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                      কোর্স লিস্ট ও সিরিয়াল কন্ট্রোল ({coursesList.length})
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      উপরে/নিচে নিয়ে সিরিয়াল ঠিক করুন
                    </span>
                  </div>

                  <div className="space-y-3">
                    {coursesList.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                        কোনো কোর্স যুক্ত নেই। বামপাশের ফর্ম পূরণ করে যোগ করুন।
                      </div>
                    ) : (
                      coursesList.map((course, idx) => (
                        <div 
                          key={course.id}
                          className={`bg-white border ${
                            editingCourseId === course.id ? "border-[#FF6A00] ring-2 ring-[#FF6A00]/10" : "border-slate-100"
                          } rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Serial re-ordering controls */}
                            <div className="flex flex-col items-center justify-center gap-0.5 bg-slate-50 border border-slate-100 rounded-xl p-1 shrink-0">
                              <button
                                onClick={() => handleMoveCourseSerial(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 hover:bg-white text-slate-600 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                                title="উপরে সরান"
                              >
                                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5px]" />
                              </button>
                              <span className="text-[10px] font-mono font-black text-slate-700">
                                #{course.serial || idx + 1}
                              </span>
                              <button
                                onClick={() => handleMoveCourseSerial(idx, "down")}
                                disabled={idx === coursesList.length - 1}
                                className="p-1 hover:bg-white text-slate-600 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                                title="নিচে সরান"
                              >
                                <ArrowDown className="w-3.5 h-3.5 stroke-[2.5px]" />
                              </button>
                            </div>

                            {/* Course Icon & Details */}
                            <div className={`w-10 h-10 ${course.bg || "bg-orange-50"} rounded-xl flex items-center justify-center ${course.iconColor || "text-orange-600"} shrink-0`}>
                              {renderPrepIcon(course.icon, "w-5 h-5 stroke-[2.2px]")}
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs text-slate-900">
                                  {course.name}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {course.category}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 line-clamp-1">
                                {course.title}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF6A00] font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>এডিট</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id, course.name)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW G: PREPARATION HUB & SUB-CATEGORIES MANAGEMENT       */}
          {/* ========================================================= */}
          {activeTab === "prep_hub" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in text-left">
              
              {/* Left Column: Add/Edit Prep Subject & Multi-Level Sub-Categories Form */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 stroke-[2.5px]" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                          {editingPrepId ? "প্রিপারেশন সাবজেক্ট এডিট করুন" : "নতুন প্রিপারেশন সাবজেক্ট যোগ করুন"}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {editingPrepId ? "সাবজেক্ট ও সাব-ক্যাটাগরি আপডেট করুন" : "হোম পেজে Preparation Hub এ দেখাবে"}
                        </p>
                      </div>
                    </div>
                    {editingPrepId && (
                      <button
                        onClick={handleCancelPrepEdit}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        বাতিল
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSavePrep} className="space-y-4">
                    {/* Serial Order & ID */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          সিরিয়াল (Serial) *
                        </label>
                        <input 
                          type="number"
                          min={1}
                          value={prepFormSerial}
                          onChange={(e) => setPrepFormSerial(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all text-slate-800"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          সাবজেক্ট আইডি (ID)
                        </label>
                        <input 
                          type="text"
                          placeholder="যেমন: prep_bangla"
                          value={prepFormId}
                          onChange={(e) => setPrepFormId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Single Subject Name Field */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        সাবজেক্টের নাম (Subject Name) *
                      </label>
                      <input 
                        type="text"
                        placeholder="যেমন: বাংলা, English, সাধারণ জ্ঞান ইত্যাদি"
                        value={prepFormName}
                        onChange={(e) => {
                          setPrepFormName(e.target.value);
                          setPrepFormBnName(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800"
                        required
                      />
                    </div>

                    {/* Sub-title */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        ছোট বিবরণ / সাব-টাইটেল (Sub-title)
                      </label>
                      <input 
                        type="text"
                        placeholder="যেমন: সাহিত্য ও ব্যাকরণ"
                        value={prepFormSub}
                        onChange={(e) => setPrepFormSub(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    {/* Icon & Theme Color Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          আইকন (Icon) *
                        </label>
                        <select
                          value={prepFormIcon}
                          onChange={(e) => setPrepFormIcon(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="BookOpen">📖 BookOpen (Open Book)</option>
                          <option value="Book">📘 Book (Closed Book)</option>
                          <option value="Laptop">💻 Laptop (Computer)</option>
                          <option value="Monitor">🖥️ Monitor (Computer)</option>
                          <option value="FlaskConical">🧪 Flask (Science)</option>
                          <option value="Atom">⚛️ Atom (Science)</option>
                          <option value="Calculator">🧮 Calculator</option>
                          <option value="Globe">🌐 Globe</option>
                          <option value="GraduationCap">🎓 GraduationCap</option>
                          <option value="FileText">📄 FileText</option>
                          <option value="Briefcase">💼 Briefcase</option>
                          <option value="Users">👥 Users</option>
                          <option value="ShieldCheck">🛡️ Shield</option>
                          <option value="Zap">⚡ Zap</option>
                          <option value="Award">🏆 Award</option>
                          <option value="Flame">🔥 Flame</option>
                          <option value="Sparkles">✨ Sparkles</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          ব্যাকগ্রাউন্ড কালার
                        </label>
                        <select
                          value={prepFormBg}
                          onChange={(e) => setPrepFormBg(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="bg-[#FFF1E6]">Orange Tint</option>
                          <option value="bg-[#E6F0FA]">Blue Tint</option>
                          <option value="bg-[#EBF7EE]">Green Tint</option>
                          <option value="bg-[#F3E8FF]">Purple Tint</option>
                          <option value="bg-[#FCE7F3]">Rose Tint</option>
                          <option value="bg-[#FEF3C7]">Amber Tint</option>
                          <option value="bg-[#DCFCE7]">Emerald Tint</option>
                          <option value="bg-[#E0F2FE]">Sky Tint</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          আইকন কালার
                        </label>
                        <select
                          value={prepFormText}
                          onChange={(e) => setPrepFormText(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="text-orange-600">Orange</option>
                          <option value="text-blue-600">Blue</option>
                          <option value="text-green-600">Green</option>
                          <option value="text-purple-600">Purple</option>
                          <option value="text-rose-600">Rose</option>
                          <option value="text-amber-600">Amber</option>
                          <option value="text-emerald-600">Emerald</option>
                          <option value="text-sky-600">Sky</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                          কুইক টুলস দেখাবেন? (Quick Tools)
                        </label>
                        <select
                          value={prepFormShowQuickTools ? "yes" : "no"}
                          onChange={(e) => setPrepFormShowQuickTools(e.target.value === "yes")}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="yes">Yes (কুইক টুলস দেখাবে)</option>
                          <option value="no">No (কুইক টুলস দেখাবে না)</option>
                        </select>
                      </div>
                    </div>

                    {/* MULTI-LEVEL SUB-CATEGORY EDITOR (Level 2 & Level 3) */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-purple-600" />
                            <span>সাব-ক্যাটাগরি ও সাব-টপিকসমূহ (Level 2 & Level 3)</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold">
                            লেভেল ২: সাব-ক্যাটাগরি, লেভেল ৩: সাব-ক্যাটাগরি ২ (যেমন: ধ্বনি ও বর্ণ)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSub: SubCategoryItem = {
                              id: `sub_${Date.now()}`,
                              name: "নতুন সাব-ক্যাটাগরি",
                              sub: "সংক্ষিপ্ত তথ্য",
                              serial: prepFormSubSubjects.length + 1,
                              subCategories2: []
                            };
                            setPrepFormSubSubjects([...prepFormSubSubjects, newSub]);
                          }}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-[11px] rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                          <span>+ সাব-ক্যাটাগরি</span>
                        </button>
                      </div>

                      {/* List of Level 2 Sub-Categories */}
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {prepFormSubSubjects.length === 0 ? (
                          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-slate-400 text-xs">
                            কোনো সাব-ক্যাটাগরি যুক্ত হয়নি। '+ সাব-ক্যাটাগরি' বাটনে ক্লিক করে যোগ করুন।
                          </div>
                        ) : (
                          prepFormSubSubjects.map((subItem, sIdx) => (
                            <div key={subItem.id || sIdx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                              {/* Level 2 Sub-Category Header & Controls */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                                  Level 2 #{sIdx + 1}
                                </span>
                                <input 
                                  type="text"
                                  placeholder="সাব-ক্যাটাগরির নাম (e.g. Bangla 1st Paper)"
                                  value={subItem.name}
                                  onChange={(e) => {
                                    const updated = [...prepFormSubSubjects];
                                    updated[sIdx].name = e.target.value;
                                    setPrepFormSubSubjects(updated);
                                  }}
                                  className="flex-1 bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = prepFormSubSubjects.filter((_, i) => i !== sIdx);
                                    setPrepFormSubSubjects(updated);
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Level 2 Sub-text */}
                              <input 
                                type="text"
                                placeholder="বিবরণ / সাব-টাইটেল (e.g. বাংলা সাহিত্য)"
                                value={subItem.sub || ""}
                                onChange={(e) => {
                                  const updated = [...prepFormSubSubjects];
                                  updated[sIdx].sub = e.target.value;
                                  setPrepFormSubSubjects(updated);
                                }}
                                className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-slate-600"
                              />

                              {/* Level 3 Sub-Categories 2 (Sub-sub-categories) Manager */}
                              <div className="bg-white border border-slate-200/60 rounded-xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                  <span>🏷️ সাব-ক্যাটাগরি ২ / টপিকসমূহ (Level 3 Topics):</span>
                                  <span className="text-[10px] text-purple-600 font-bold">
                                    {(subItem.subCategories2 || []).length}টি টপিক
                                  </span>
                                </div>

                                {/* Tags list for Level 3 */}
                                <div className="flex flex-wrap gap-1.5">
                                  {(subItem.subCategories2 || []).map((sub2, sub2Idx) => (
                                    <span 
                                      key={sub2.id || sub2Idx}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-xs font-bold"
                                    >
                                      <span>{sub2.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...prepFormSubSubjects];
                                          updated[sIdx].subCategories2 = (updated[sIdx].subCategories2 || []).filter((_, i) => i !== sub2Idx);
                                          setPrepFormSubSubjects(updated);
                                        }}
                                        className="hover:text-rose-600 text-purple-400 p-0.5 cursor-pointer"
                                      >
                                        <X className="w-3 h-3 stroke-[3px]" />
                                      </button>
                                    </span>
                                  ))}
                                </div>

                                {/* Add Level 3 item form */}
                                <div className="flex items-center gap-2 pt-1">
                                  <input 
                                    type="text"
                                    id={`input_sub2_${sIdx}`}
                                    placeholder="নতুন টপিক যোগ করুন (যেমন: ধ্বনি ও বর্ণ)"
                                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg px-2.5 py-1 text-xs text-slate-800"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.currentTarget;
                                        if (input.value.trim()) {
                                          const updated = [...prepFormSubSubjects];
                                          if (!updated[sIdx].subCategories2) updated[sIdx].subCategories2 = [];
                                          updated[sIdx].subCategories2!.push({
                                            id: `sub2_${Date.now()}_${Math.random()}`,
                                            name: input.value.trim(),
                                            serial: updated[sIdx].subCategories2!.length + 1
                                          });
                                          setPrepFormSubSubjects(updated);
                                          input.value = "";
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById(`input_sub2_${sIdx}`) as HTMLInputElement;
                                      if (input && input.value.trim()) {
                                        const updated = [...prepFormSubSubjects];
                                        if (!updated[sIdx].subCategories2) updated[sIdx].subCategories2 = [];
                                        updated[sIdx].subCategories2!.push({
                                          id: `sub2_${Date.now()}_${Math.random()}`,
                                          name: input.value.trim(),
                                          serial: updated[sIdx].subCategories2!.length + 1
                                        });
                                        setPrepFormSubSubjects(updated);
                                        input.value = "";
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                                  >
                                    + যোগ করুন
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl active:scale-95 transition-all shadow-md shadow-purple-500/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <Check className="w-4 h-4 stroke-[3px]" />
                      <span>{editingPrepId ? "প্রিপারেশন সাবজেক্ট আপডেট করুন" : "সাবজেক্ট সার্ভারে সেভ করুন"}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Prep Subjects List & Re-ordering */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                      প্রিপারেশন সাবজেক্টস ({prepSubjectsList.length})
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      সিরিয়াল অর্ডার কন্ট্রোল
                    </span>
                  </div>

                  <div className="space-y-3">
                    {prepSubjectsList.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                        কোনো প্রিপারেশন সাবজেক্ট নেই। বামপাশের ফর্ম থেকে যুক্ত করুন।
                      </div>
                    ) : (
                      prepSubjectsList.map((prep, idx) => {
                        const totalSub2Count = (prep.subSubjects || []).reduce((acc, sub) => acc + (sub.subCategories2?.length || 0), 0);
                        return (
                          <div 
                            key={prep.id}
                            className={`bg-white border ${
                              editingPrepId === prep.id ? "border-purple-600 ring-2 ring-purple-600/10" : "border-slate-100"
                            } rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Serial re-ordering controls */}
                              <div className="flex flex-col items-center justify-center gap-0.5 bg-slate-50 border border-slate-100 rounded-xl p-1 shrink-0">
                                <button
                                  onClick={() => handleMovePrepSerial(idx, "up")}
                                  disabled={idx === 0}
                                  className="p-1 hover:bg-white text-slate-600 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                                  title="উপরে সরান"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5px]" />
                                </button>
                                <span className="text-[10px] font-mono font-black text-slate-700">
                                  #{prep.serial || idx + 1}
                                </span>
                                <button
                                  onClick={() => handleMovePrepSerial(idx, "down")}
                                  disabled={idx === prepSubjectsList.length - 1}
                                  className="p-1 hover:bg-white text-slate-600 disabled:opacity-30 rounded-lg transition-all cursor-pointer"
                                  title="নিচে সরান"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5px]" />
                                </button>
                              </div>

                              {/* Subject Icon & Title */}
                              <div className={`w-10 h-10 ${prep.bg || "bg-purple-50"} rounded-xl flex items-center justify-center ${prep.text || "text-purple-600"} shrink-0 font-extrabold`}>
                                {renderPrepIcon(prep.icon, "w-5 h-5 stroke-[2.2px]")}
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-xs text-slate-900">
                                    {prep.bnName && prep.bnName !== prep.name ? `${prep.bnName} (${prep.name})` : (prep.name || prep.bnName)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                  <span>Level 2: {(prep.subSubjects || []).length}টি</span>
                                  <span>•</span>
                                  <span>Level 3: {totalSub2Count}টি টপিক</span>
                                  <span>•</span>
                                  <span className={prep.showQuickTools !== false ? "text-emerald-600 font-extrabold" : "text-rose-500 font-extrabold"}>
                                    Quick Tools: {prep.showQuickTools !== false ? "Yes" : "No"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleEditPrep(prep)}
                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>এডিট</span>
                              </button>
                              <button
                                onClick={() => handleDeletePrep(prep.id, prep.bnName)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW: CONTROL SWITCHES & HOME LIMITS                       */}
          {/* ========================================================= */}
          {activeTab === "switches" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#FF6A00]" />
                    <span>হোম স্ক্রিন গ্রিড ডিসপ্লে কন্ট্রোল ও সেটিংস (Control Switches)</span>
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    এখানে আপনি হোম স্ক্রিনে বিষয় ও কোর্স কয়টি প্রদর্শিত হবে তা ১ থেকে ১২ টি পর্যন্ত নিমিষেই পরিবর্তন করতে পারবেন।
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Our Course Section Settings */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#FF6A00]" />
                        <span>১. আওয়ার কোর্স (Our Course)</span>
                      </h4>
                      <span className="text-xs font-black bg-orange-100 text-[#FF6A00] px-2.5 py-1 rounded-full">
                        {appSettings.ourCoursesHomeLimit || 5} টি কোর্স
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      ইউজার হোম স্ক্রিনের &quot;Our Course&quot; গ্রিডে কয়টি সাবজেক্ট/কোর্স শো করবে সিলেক্ট করুন (১ - ১২ টি):
                    </p>

                    <div className="grid grid-cols-6 gap-2 pt-1">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            const newSettings = { ...appSettings, ourCoursesHomeLimit: num };
                            setAppSettings(newSettings);
                            saveAppSettingsToDb(newSettings);
                          }}
                          className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            appSettings.ourCoursesHomeLimit === num
                              ? "bg-[#FF6A00] text-white shadow-sm shadow-orange-500/20 scale-105"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-orange-50 hover:border-orange-300"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] font-bold text-slate-400 bg-white p-2.5 rounded-xl border border-slate-100">
                      💡 তথ্য: বর্তমানে হোমে {appSettings.ourCoursesHomeLimit || 5} টি কোর্স কার্ড + ১ টি কমলা রঙের &apos;সকল কোর্স&apos; বাটন প্রদর্শিত হবে।
                    </p>
                  </div>

                  {/* Preparation Hub Section Settings */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#FF6A00]" />
                        <span>২. প্রেপারেশন হাব (Preparation Hub)</span>
                      </h4>
                      <span className="text-xs font-black bg-orange-100 text-[#FF6A00] px-2.5 py-1 rounded-full">
                        {appSettings.prepHubHomeLimit || 4} টি বিষয়
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      ইউজার হোম স্ক্রিনের &quot;Preparation Hub&quot; গ্রিডে কয়টি বিষয় শো করবে সিলেক্ট করুন (১ - ১২ টি):
                    </p>

                    <div className="grid grid-cols-6 gap-2 pt-1">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            const newSettings = { ...appSettings, prepHubHomeLimit: num };
                            setAppSettings(newSettings);
                            saveAppSettingsToDb(newSettings);
                          }}
                          className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            appSettings.prepHubHomeLimit === num
                              ? "bg-[#FF6A00] text-white shadow-sm shadow-orange-500/20 scale-105"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-orange-50 hover:border-orange-300"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] font-bold text-slate-400 bg-white p-2.5 rounded-xl border border-slate-100">
                      💡 তথ্য: বর্তমানে হোমে {appSettings.prepHubHomeLimit || 4} টি সাবজেক্ট কার্ড প্রদর্শিত হবে।
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await saveAppSettingsToDb(appSettings);
                      if (success) {
                        triggerNotification("success", "হোম স্ক্রিন গ্রিড ডিসপ্লে সেটিংস সফলভাবে সেভ করা হয়েছে!");
                      } else {
                        triggerNotification("error", "সেটিংস সেভ করতে সমস্যা হয়েছে।");
                      }
                    }}
                    className="bg-[#FF6A00] hover:bg-orange-600 text-white font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>সেটিংস সেভ করুন (Save Settings)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* 3. EDIT QUESTION MODAL */}
        {editingQuestion && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto text-left space-y-5 relative animate-fade-in">
              <button 
                onClick={() => setEditingQuestion(null)}
                className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4 stroke-[2.5px]" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                  প্রশ্ন এডিট ও আপডেট করুন (Edit MCQ Question)
                </h3>
              </div>

              <form onSubmit={handleUpdateQuestion} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Question Text */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                      প্রশ্ন (Question Text)
                    </label>
                    <input 
                      type="text"
                      placeholder="যেমন: বাংলাদেশের দীর্ঘতম নদী কোনটি?"
                      value={editQuestionText}
                      onChange={(e) => setEditQuestionText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                      required
                    />
                  </div>

                  {/* Subject Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                      বিষয় নির্বাচন (MCQ Subject Group)
                    </label>
                    <select
                      value={editSubjectName}
                      onChange={(e) => setEditSubjectName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-all text-slate-800 cursor-pointer"
                    >
                      {SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Options inputs */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                    সম্ভাব্য অপশনসমূহ (4 MCQ Options)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editOptions.map((opt, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 pl-1 font-sans">অপশন {idx + 1}</span>
                        <input 
                          type="text"
                          placeholder={`অপশন ${idx + 1} এর মান`}
                          value={opt}
                          onChange={(e) => handleEditOptionChange(idx, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all text-slate-800"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct Answer Index Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                    সঠিক উত্তর নির্বাচন (Correct Option Index)
                  </label>
                  <select
                    value={editCorrectOptionIdx}
                    onChange={(e) => setEditCorrectOptionIdx(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-all text-slate-800 cursor-pointer"
                  >
                    <option value={0}>অপশন ১ (Option 1)</option>
                    <option value={1}>অপশন ২ (Option 2)</option>
                    <option value={2}>অপশন ৩ (Option 3)</option>
                    <option value={3}>অপশন ৪ (Option 4)</option>
                  </select>
                </div>

                {/* Explanation - Full Width across Popup */}
                <div className="space-y-1 w-full">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                    বিশ্লেষণ বা ব্যাখ্যা (Explanation - Multi-line auto-expand)
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="যেমন: মেঘনা নদী বাংলাদেশের দীর্ঘতম ও বৃহত্তম নদী।&#10;প্রয়োজনে এন্টার চেপে নতুন লাইনে বিস্তারিত ব্যাখ্যা লিখুন..."
                    value={editExplanation}
                    onChange={(e) => {
                      setEditExplanation(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800 resize-y min-h-[100px] leading-relaxed"
                  />
                  
                  {/* Live Math / Markdown Preview */}
                  {editExplanation && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                      <span className="text-[10px] font-extrabold text-[#FF6A00] uppercase block">
                        📐 লাইভ গাণিতিক সংকেত প্রাকদর্শন (Live Math Preview):
                      </span>
                      <MathRenderer content={editExplanation} />
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="pt-4 border-t border-slate-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl active:scale-95 transition-all cursor-pointer animate-fade-in"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    disabled={dbLoading}
                    className="bg-[#FF6A00] hover:bg-orange-600 disabled:bg-slate-400 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                  >
                    {dbLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[2.5px]" />
                    )}
                    আপডেট করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
