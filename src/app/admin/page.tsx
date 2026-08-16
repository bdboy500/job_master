"use client";

import { useState, useEffect, useRef } from "react";
import MathRenderer from "@/src/components/MathRenderer";
import { LeaderboardUser, fetchLeaderboard, adminUpdateLeaderboardUser } from "@/src/lib/leaderboard";
import { 
  Users, 
  Search,
  BookOpen, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  LogOut, 
  LogIn, 
  Award, 
  Trophy,
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
  Calendar,
  Sliders,
  Flame,
  Newspaper,
  TrendingUp,
  Laptop,
  Monitor,
  Clock,
  FlaskConical,
  Atom,
  Book,
  Video,
  Database as DbIcon,
  PlayCircle,
  Tv,
  Film,
  User,
  Mail,
  UserCheck,
  UserX,
  UserPlus,
  UserCog,
  ShieldAlert,
  KeyRound,
  EyeOff,
  RotateCw
} from "lucide-react";
import Link from "next/link";
import { QUIZ_QUESTIONS, Question } from "../../data";
import { getSupabase } from "../../lib/supabase";
import { 
  fetchAllProfilesFromDb, 
  updateUserStatusInDb, 
  deleteUserProfileFromDb, 
  UserProfile 
} from "../../lib/user_profiles";
import { ExamPaper, fetchExamPapersFromDb, fetchExamPaperById, saveExamPaperToDb, deleteExamPaperFromDb, getExamStatus, sortExamPapersForDisplay, subscribeToExamPapers } from "../../lib/exams";
import { PackageItem, fetchPackagesFromDb, savePackageToDb, deletePackageFromDb, subscribeToPackages, syncAllPackagesToSupabase } from "../../lib/packages";
import { AppSettings, getCachedAppSettings, fetchAppSettingsFromDb, saveAppSettingsToDb } from "../../lib/app_settings";
import { 
  CourseItem, 
  PrepSubjectItem, 
  SubCategoryItem, 
  SubCategory2Item,
  ProSectionItem,
  DEFAULT_PRO_SECTION,
  getCachedCourses, 
  getCachedPrepSubjects, 
  getCachedProSection,
  fetchCoursesFromDb, 
  fetchPrepSubjectsFromDb, 
  fetchProSectionFromDb,
  saveCoursesToDb, 
  savePrepSubjectsToDb, 
  saveProSectionToDb,
  subscribeToCoursesAndPrep,
  sanitizeSubSubjects
} from "../../lib/courses_and_subjects";
import {
  AdminRole,
  AdminAccountStatus,
  AdminStaffUser,
  MASTER_ADMIN_EMAIL,
  canManageStaff,
  canManageSettings,
  canManageUsers,
  canManageExams,
  canManagePackages,
  canManageCourses,
  canManageOffers,
  canManageLeaderboard,
  canManageQuestions,
  getRoleLabelBangla,
  getStatusLabelBangla,
  getCachedAdminStaff,
  fetchAdminStaffFromDb,
  saveAdminStaffToDb,
  getCurrentAdminSession,
  loginAdminWithCredentials,
  registerAdminStaffRequest,
  approveStaffRequest,
  updateStaffRole,
  toggleStaffStatus,
  deleteStaffAccount,
  clearAdminSession
} from "../../lib/admin_auth";

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

function toDateTimeLocalInput(dateInput?: string | Date | null, fallback?: string): string {
  if (!dateInput) return fallback || getNowLocalDateTimeStr();
  try {
    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return fallback || getNowLocalDateTimeStr();
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return fallback || getNowLocalDateTimeStr();
  }
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

function matchesSubject(questionSubject: string, targetSubjects: string[]): boolean {
  if (!targetSubjects || targetSubjects.length === 0 || targetSubjects.includes("All")) return true;
  
  const qSub = (questionSubject || "").toLowerCase().trim();
  if (!qSub) return false;
  
  return targetSubjects.some(target => {
    const tSub = target.toLowerCase().trim();
    if (!tSub || tSub === "all") return true;

    // Direct exact match
    if (qSub === tSub) return true;

    // 1. Bangla Literature
    if (tSub.includes("bangla literature") || tSub.includes("বাংলা সাহিত্য")) {
      if (qSub.includes("gramm") || qSub.includes("ব্যাকরণ")) return false;
      return qSub.includes("bangla literature") || qSub.includes("বাংলা সাহিত্য") || qSub.includes("bangla lit");
    }

    // 2. Bangla Grammer / Grammar
    if (tSub.includes("bangla gramm") || tSub.includes("বাংলা ব্যাকরণ")) {
      if (qSub.includes("literat") || qSub.includes("সাহিত্য")) return false;
      return qSub.includes("bangla gramm") || qSub.includes("bangla gram") || qSub.includes("বাংলা ব্যাকরণ");
    }

    // 3. English Literature
    if (tSub.includes("english literature") || tSub.includes("ইংরেজি সাহিত্য")) {
      if (qSub.includes("gramm") || qSub.includes("ব্যাকরণ")) return false;
      return qSub.includes("english literature") || qSub.includes("ইংরেজি সাহিত্য") || qSub.includes("eng lit");
    }

    // 4. English Grammer / Grammar
    if (tSub.includes("english gramm") || tSub.includes("ইংরেজি ব্যাকরণ")) {
      if (qSub.includes("literat") || qSub.includes("সাহিত্য")) return false;
      return qSub.includes("english gramm") || qSub.includes("english gram") || qSub.includes("ইংরেজি ব্যাকরণ");
    }

    // 5. Bangladesh Affairs
    if (tSub.includes("bangladesh affairs") || tSub.includes("বাংলাদেশ বিষয়াবলী")) {
      if (qSub.includes("international") || qSub.includes("আন্তর্জাতিক")) return false;
      return qSub.includes("bangladesh affairs") || qSub.includes("বাংলাদেশ বিষয়াবলী") || qSub === "bangladesh";
    }

    // 6. International Affairs
    if (tSub.includes("international affairs") || tSub.includes("আন্তর্জাতিক বিষয়াবলী")) {
      if (qSub.includes("bangladesh") || qSub.includes("বাংলাদেশ")) return false;
      return qSub.includes("international affairs") || qSub.includes("আন্তর্জাতিক বিষয়াবলী") || qSub === "international";
    }

    // 7. Geography
    if (tSub.includes("geography") || tSub.includes("ভূগোল")) {
      return qSub.includes("geography") || qSub.includes("ভূগোল") || qSub.includes("environment");
    }

    // 8. General Science
    if (tSub.includes("general science") || tSub.includes("সাধারণ বিজ্ঞান")) {
      if (qSub.includes("computer") || qSub.includes("technology") || qSub.includes("ict") || qSub.includes("কম্পিউটার") || qSub.includes("তথ্যপ্রযুক্তি")) return false;
      return qSub.includes("general science") || qSub.includes("সাধারণ বিজ্ঞান") || qSub === "science";
    }

    // 9. Technology
    if (tSub.includes("technology") || tSub.includes("computer") || tSub.includes("ict") || tSub.includes("তথ্যপ্রযুক্তি")) {
      return qSub.includes("technology") || qSub.includes("computer") || qSub.includes("ict") || qSub.includes("কম্পিউটার") || qSub.includes("তথ্যপ্রযুক্তি");
    }

    // 10. Mathematics (Arithmetic)
    if (tSub.includes("arithmetic") || tSub.includes("পাটিগণিত")) {
      if (qSub.includes("algebra") || qSub.includes("geometry") || qSub.includes("বীজগণিত") || qSub.includes("জ্যামিতি")) return false;
      return qSub.includes("arithmetic") || qSub.includes("পাটিগণিত");
    }

    // 11. Mathematics (Algebra)
    if (tSub.includes("algebra") || tSub.includes("বীজগণিত")) {
      if (qSub.includes("arithmetic") || qSub.includes("geometry") || qSub.includes("পাটিগণিত") || qSub.includes("জ্যামিতি")) return false;
      return qSub.includes("algebra") || qSub.includes("বীজগণিত");
    }

    // 12. Mathematics (Geometry)
    if (tSub.includes("geometry") || tSub.includes("জ্যামিতি")) {
      if (qSub.includes("arithmetic") || qSub.includes("algebra") || qSub.includes("পাটিগণিত") || qSub.includes("বীজগণিত")) return false;
      return qSub.includes("geometry") || qSub.includes("জ্যামিতি");
    }

    // 13. Mental Ability
    if (tSub.includes("mental ability") || tSub.includes("মানসিক দক্ষতা")) {
      return qSub.includes("mental ability") || qSub.includes("মানসিক দক্ষতা") || qSub.includes("mental");
    }

    // 14. Good Governance
    if (tSub.includes("good governance") || tSub.includes("governance") || tSub.includes("ethics") || tSub.includes("সুশাসন")) {
      return qSub.includes("governance") || qSub.includes("ethics") || qSub.includes("সুশাসন") || qSub.includes("নৈতিকতা");
    }

    return qSub.includes(tSub) || tSub.includes(qSub);
  });
}

interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  student_id?: string;
  role: string;
  status: "Active" | "Banned";
  created_at?: string;
}

interface AdminOffer {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

export default function AdminPage() {
  // Authentication & RBAC states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentStaffSession, setCurrentStaffSession] = useState<AdminStaffUser | null>(null);
  const [adminStaffList, setAdminStaffList] = useState<AdminStaffUser[]>(() => getCachedAdminStaff());
  const [adminAuthMode, setAdminAuthMode] = useState<"login" | "register">("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRequestedRole, setRegRequestedRole] = useState<AdminRole>("editor");
  const [authLoading, setAuthLoading] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");

  // Staff Management State
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>("all");
  const [staffStatusFilter, setStaffStatusFilter] = useState<string>("all");
  const [newStaffModalOpen, setNewStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false);
  const [newStaffRole, setNewStaffRole] = useState<AdminRole>("editor");

  // Tab navigation states
  const [activeTab, setActiveTab] = useState<"questions" | "exam_papers" | "users" | "offers" | "packages" | "courses" | "prep_hub" | "pro_section" | "switches" | "leaderboard" | "staff">("questions");

  // Leaderboard Admin Management State
  const [adminLeaderboardUsers, setAdminLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [leaderboardSearchQuery, setLeaderboardSearchQuery] = useState("");
  const [editingLeaderboardUser, setEditingLeaderboardUser] = useState<LeaderboardUser | null>(null);
  const [editTodayScore, setEditTodayScore] = useState<number>(0);
  const [editWeekScore, setEditWeekScore] = useState<number>(0);
  const [editMonthScore, setEditMonthScore] = useState<number>(0);
  const [editAllTimeScore, setEditAllTimeScore] = useState<number>(0);
  const [editUserName, setEditUserName] = useState<string>("");

  // Full Exam Paper Viewing State Modal
  const [viewingExamPaper, setViewingExamPaper] = useState<ExamPaper | null>(null);

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

  // Pro Section Management State
  const [proSectionList, setProSectionList] = useState<ProSectionItem[]>(getCachedProSection());
  const [editingProId, setEditingProId] = useState<string | null>(null);
  const [proFormSerial, setProFormSerial] = useState<number>(1);
  const [proFormId, setProFormId] = useState<string>("");
  const [proFormName, setProFormName] = useState<string>("");
  const [proFormSub, setProFormSub] = useState<string>("");
  const [proFormIcon, setProFormIcon] = useState<string>("Briefcase");
  const [proFormBg, setProFormBg] = useState<string>("bg-purple-50");
  const [proFormText, setProFormText] = useState<string>("text-purple-600");
  const [proFormActive, setProFormActive] = useState<boolean>(true);

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
    { id: "all_courses", name: "\uD83C\uDF10 সকল কোর্স (All Courses - সব কোর্সে দেখাবে)" },
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
  const [examPaperDisplayLimit, setExamPaperDisplayLimit] = useState<number>(10);

  // Dynamic Filtering for Published Exam Papers
  const [filterPaperCategory, setFilterPaperCategory] = useState<"all" | "our_course" | "prep_hub" | "pro_feature">("all");
  const [filterPaperCourse, setFilterPaperCourse] = useState<string>("all");
  const [filterPaperSubSubject, setFilterPaperSubSubject] = useState<string>("all");
  const [filterPaperExamType, setFilterPaperExamType] = useState<string>("all");
  const [filterPaperStatus, setFilterPaperStatus] = useState<string>("all");
  const [filterPaperSearch, setFilterPaperSearch] = useState<string>("");
  const [isSyncingPapers, setIsSyncingPapers] = useState<boolean>(false);

  const resetExamPaperForm = () => {
    setEditingPaperId(null);
    setPaperTitle("");
    setPaperTopic("");
    setPaperSubSubject("all");
    setPaperPrepSubSubject("all");
    setPaperQuestions([]);
    setPaperSearchQuery("");
    setPaperSearchSubjects(paperCategoryType === "prep_hub" ? [] : ["All"]);
    setPaperStartDateTime(getNowLocalDateTimeStr());
    setPaperEndDateTime(getTodayEndDateTimeStr());
    setPaperDate(formatDisplayDate(getNowLocalDateTimeStr()));
    setPaperStatus("Upcoming");
  };

  // Form states for creating/editing paper
  const [paperCategoryType, setPaperCategoryType] = useState<"our_course" | "prep_hub" | "pro_feature">("our_course");
  const [paperTitle, setPaperTitle] = useState("");
  const [paperCourse, setPaperCourse] = useState("bcs");
  const [paperSubSubject, setPaperSubSubject] = useState("all");
  const [paperPrepSubjectId, setPaperPrepSubjectId] = useState<string>("Bangla");
  const [paperPrepSubSubject, setPaperPrepSubSubject] = useState<string>("all");
  const [paperProModule, setPaperProModule] = useState<string>("question_bank");
  const [paperProSubSubject, setPaperProSubSubject] = useState<string>("none");
  const [paperExamType, setPaperExamType] = useState<"weekly" | "daily" | "subject" | "special">("weekly");
  const [paperSubject, setPaperSubject] = useState("All Subjects");
  const [paperTopic, setPaperTopic] = useState("");
  const [paperStartDateTime, setPaperStartDateTime] = useState<string>(() => getNowLocalDateTimeStr());
  const [paperEndDateTime, setPaperEndDateTime] = useState<string>(() => getTodayEndDateTimeStr());
  const [paperDate, setPaperDate] = useState(() => formatDisplayDate(getNowLocalDateTimeStr()));
  const [paperStatus, setPaperStatus] = useState<"Live" | "Upcoming" | "Completed" | "Archive">("Upcoming");
  const [paperTargetCount, setPaperTargetCount] = useState<number>(20);
  const [paperQuestions, setPaperQuestions] = useState<Question[]>([]);
  
  // Search & filter within question bank for adding to paper
  const [paperSearchQuery, setPaperSearchQuery] = useState("");
  const [paperSearchSubjects, setPaperSearchSubjects] = useState<string[]>(["All"]);
  const [paperAvailableQuestions, setPaperAvailableQuestions] = useState<Question[]>([]);
  const [paperLoadingQuestions, setPaperLoadingQuestions] = useState<boolean>(false);
  const [paperHasFetched, setPaperHasFetched] = useState<boolean>(false);
  const paperQuestionsCacheRef = useRef<Map<string, Question[]>>(new Map());
  const questionsCacheRef = useRef<Map<string, { questions: Question[]; totalCount: number }>>(new Map());

  const loadPaperQuestionsFromDb = async (
    overrideSubjects?: string[],
    overrideQuery?: string,
    overrideForceRefresh: boolean = false
  ): Promise<Question[]> => {
    const targetSubjects = overrideSubjects !== undefined ? overrideSubjects : paperSearchSubjects;
    const targetQuery = overrideQuery !== undefined ? overrideQuery : paperSearchQuery;
    const cleanQuery = targetQuery.trim();

    // Min 3 char requirement for text search (Point 4 & 5)
    const effectiveQuery = cleanQuery.length >= 3 ? cleanQuery.toLowerCase() : "";

    const cacheKey = `${paperCategoryType}_${paperPrepSubjectId}_${paperProModule}_${paperCourse}_${[...targetSubjects].sort().join(",")}_${effectiveQuery}`;

    if (!overrideForceRefresh && paperQuestionsCacheRef.current.has(cacheKey)) {
      const cached = paperQuestionsCacheRef.current.get(cacheKey)!;
      // Shuffle & pick top 10 random for display (Point 2)
      const random10 = [...cached].sort(() => 0.5 - Math.random()).slice(0, 10);
      setPaperAvailableQuestions(random10);
      setPaperHasFetched(true);
      return cached;
    }

    setPaperLoadingQuestions(true);
    let fetchedList: Question[] = [];

    try {
      const supabase = getSupabase();
      if (supabase) {
        let query = supabase
          .from("questions")
          .select("id, subjectName, questionText, options, correctOptionIndex, explanation, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        if (effectiveQuery.length >= 3) {
          query = query.ilike("questionText", `%${effectiveQuery}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          fetchedList = data.map(q => normalizeQuestion(q));
        }
      }
    } catch (err) {
      console.warn("Could not load paper questions from Supabase, using local pool fallback:", err);
    }

    // Always merge with local QUIZ_QUESTIONS fallback
    const localPool = QUIZ_QUESTIONS.map(q => normalizeQuestion(q));
    const combinedMap = new Map<string, Question>();

    fetchedList.forEach(q => {
      const norm = normalizeQuestion(q);
      const key = String(norm.id || norm.question);
      if (key) combinedMap.set(key, norm);
    });

    localPool.forEach(q => {
      const norm = normalizeQuestion(q);
      const key = String(norm.id || norm.question);
      if (key && !combinedMap.has(key)) {
        combinedMap.set(key, norm);
      }
    });

    let merged = Array.from(combinedMap.values());

    // Exclude BCS Health Question if not special exam
    if (paperExamType !== "special") {
      merged = merged.filter(q => (q.subject || q.subjectName) !== "BCS Health Question");
    }

    // Filter STRICTLY by subject using matchesSubject (Point 1)
    if (!targetSubjects.includes("All") && targetSubjects.length > 0) {
      merged = merged.filter(q => matchesSubject(q.subject || q.subjectName || "", targetSubjects));
    }

    // Filter by search query if length >= 3
    if (effectiveQuery.length >= 3) {
      merged = merged.filter(q => (q.question || q.questionText || "").toLowerCase().includes(effectiveQuery));
    }

    paperQuestionsCacheRef.current.set(cacheKey, merged);

    // Pick max 10 random questions from those selected subject(s) to show in search list (Point 2)
    const random10 = [...merged].sort(() => 0.5 - Math.random()).slice(0, 10);
    setPaperAvailableQuestions(random10);
    setPaperHasFetched(true);
    setPaperLoadingQuestions(false);
    return merged;
  };

  const togglePaperSearchSubject = (sub: string) => {
    let next: string[] = [];
    if (sub === "All") {
      if (paperCategoryType === "prep_hub") return;
      next = ["All"];
    } else {
      let prev = paperSearchSubjects.filter(s => s !== "All");
      if (prev.includes(sub)) {
        next = prev.filter(s => s !== sub);
      } else {
        next = [...prev, sub];
      }
      if (next.length === 0 && paperCategoryType !== "prep_hub") {
        next = ["All"];
      }
    }
    setPaperSearchSubjects(next);
    loadPaperQuestionsFromDb(next, paperSearchQuery);
  };

  useEffect(() => {
    if (paperCategoryType === "prep_hub" && paperSearchSubjects.includes("All")) {
      setPaperSearchSubjects(prev => prev.filter(s => s !== "All"));
    }
  }, [paperCategoryType, paperSearchSubjects]);

  useEffect(() => {
    if (!paperHasFetched) return;
    const timer = setTimeout(() => {
      loadPaperQuestionsFromDb(paperSearchSubjects, paperSearchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [paperSearchQuery]);

  useEffect(() => {
    if (paperExamType !== "special" && paperSearchSubjects.includes("BCS Health Question")) {
      setPaperSearchSubjects(prev => {
        const filtered = prev.filter(s => s !== "BCS Health Question");
        return filtered.length === 0 ? (paperCategoryType === "prep_hub" ? [] : ["All"]) : filtered;
      });
    }
  }, [paperExamType, paperSearchSubjects, paperCategoryType]);

  // ==========================================
  // 1. QUESTIONS STATE & COMPONENT
  // ==========================================
  const [questions, setQuestions] = useState<any[]>([]);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(0);
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
    { id: "u-101", email: "hassan.bcs@gmail.com", full_name: "হসান মাহমুদ", phone_number: "01711223344", student_id: "JM-884201", role: "Student", status: "Active" },
    { id: "u-102", email: "tasnim_sheikh@yahoo.com", full_name: "তাসনিম শেখ", phone_number: "01822334455", student_id: "JM-884202", role: "Student", status: "Active" },
    { id: "u-103", email: "kamrul.dev@outlook.com", full_name: "কামরুল ইসলাম", phone_number: "01933445566", student_id: "JM-884203", role: "Moderator", status: "Active" },
    { id: "u-104", email: "spambot99@gmail.com", full_name: "স্প্যাম ব্যবহারকারী", phone_number: "01544556677", student_id: "JM-884204", role: "Student", status: "Banned" },
    { id: "u-105", email: "rahima_begum@gmail.com", full_name: "রাহিমা বেগম", phone_number: "01655667788", student_id: "JM-884205", role: "Student", status: "Active" },
  ]);

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Offers state
  const [offers, setOffers] = useState<AdminOffer[]>([
    { 
      id: "o-1", 
      title: "\uD83D\uDD25 বিসিএস স্পেশাল মাস্টারক্লাস - ৫০% ছাড়!", 
      description: "কুপন কোড BCS50 ব্যবহার করে আজই এনরোল করুন অর্ধেকেরও কম মূল্যে। অফারটি সীমিত সময়ের জন্য প্রযোজ্য।", 
      active: true 
    },
    { 
      id: "o-2", 
      title: "\uD83D\uDE80 ফ্রি মেগা মক টেস্ট সপ্তাহ", 
      description: "সকল শিক্ষার্থীদের জন্য এই সপ্তাহের সবকয়টি স্পেশাল মডেল টেস্ট সম্পূর্ণ ফ্রি! এখনই প্র্যাকটিস শুরু করুন।", 
      active: true 
    },
    { 
      id: "o-3", 
      title: "\uD83D\uDCDA রেলওয়ে স্পেশাল স্পিড প্যাক বোনাস", 
      description: "রেলওয়ে রিক্রুটমেন্ট ইউনিভার্সাল প্যাকে অতিরিক্ত ২০টি স্পিড টেস্ট সেট একদম ফ্রিতে যোগ করা হয়েছে।", 
      active: false 
    }
  ]);
  const [newOfferTitle, setNewOfferTitle] = useState("");
  const [newOfferDesc, setNewOfferDesc] = useState("");
  const [newOfferActive, setNewOfferActive] = useState(true);

  // Load state and auth status from localStorage on mount
  useEffect(() => {
    // Check authentication and RBAC session
    const session = getCurrentAdminSession();
    if (session && session.status === "active") {
      setCurrentStaffSession(session);
      setIsAuthenticated(true);
      if (session.role === "editor") {
        setActiveTab("questions");
      }
    } else {
      setIsAuthenticated(false);
      setCurrentStaffSession(null);
    }

    // Load admin staff list from Supabase/cache
    fetchAdminStaffFromDb(true).then((staff) => {
      if (staff && staff.length > 0) {
        setAdminStaffList(staff);
      }
    });

    // Load users from Supabase DB or cache
    fetchAllProfilesFromDb().then((dbProfiles) => {
      if (dbProfiles && dbProfiles.length > 0) {
        setUsers(dbProfiles);
      } else {
        const cachedUsers = localStorage.getItem("job_master_registered_users") || localStorage.getItem("job_master_admin_users");
        if (cachedUsers) setUsers(JSON.parse(cachedUsers));
      }
    });

    const cachedOffers = localStorage.getItem("job_master_admin_offers");
    if (cachedOffers) setOffers(JSON.parse(cachedOffers));

    // Fetch questions & exam papers from Supabase/Storage
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
    fetchProSectionFromDb().then((pro) => {
      if (pro) setProSectionList(pro);
    });
    fetchLeaderboard().then((lbUsers) => {
      if (lbUsers) setAdminLeaderboardUsers(lbUsers);
    });
    const unsubCoursesPrep = subscribeToCoursesAndPrep(setCoursesList, setPrepSubjectsList, setProSectionList);

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

  // Pro Section Handlers
  const handleSavePro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proFormName.trim()) {
      triggerNotification("error", "দয়া করে নাম ফিল্ড পূরণ করুন।");
      return;
    }

    const newItem: ProSectionItem = {
      id: editingProId || proFormId.trim() || `pro_${Date.now()}`,
      serial: Number(proFormSerial) || (proSectionList.length + 1),
      name: proFormName.trim(),
      sub: proFormSub.trim(),
      icon: proFormIcon,
      bg: proFormBg,
      text: proFormText,
      active: proFormActive
    };

    let updated: ProSectionItem[] = [...proSectionList];
    if (editingProId) {
      const idx = updated.findIndex(p => p.id === editingProId);
      if (idx >= 0) updated[idx] = newItem;
      else updated.push(newItem);
    } else {
      updated.push(newItem);
    }

    updated.sort((a, b) => (a.serial || 99) - (b.serial || 99));
    setProSectionList(updated);
    await saveProSectionToDb(updated);
    triggerNotification("success", editingProId ? "প্রো সেকশন আইটেম আপডেট করা হয়েছে!" : "নতুন প্রো সেকশন আইটেম যোগ করা হয়েছে!");
    handleCancelProEdit();
  };

  const handleCancelProEdit = () => {
    setEditingProId(null);
    setProFormSerial(proSectionList.length + 1);
    setProFormId("");
    setProFormName("");
    setProFormSub("");
    setProFormIcon("Briefcase");
    setProFormBg("bg-purple-50");
    setProFormText("text-purple-600");
    setProFormActive(true);
  };

  const handleEditPro = (item: ProSectionItem) => {
    setEditingProId(item.id);
    setProFormSerial(item.serial || 1);
    setProFormId(item.id);
    setProFormName(item.name || "");
    setProFormSub(item.sub || "");
    setProFormIcon(item.icon || "Briefcase");
    setProFormBg(item.bg || "bg-purple-50");
    setProFormText(item.text || "text-purple-600");
    setProFormActive(item.active !== false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletePro = async (id: string, name: string) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${name}" প্রো সেকশন আইটেমটি ডিলিট করতে চান?`)) return;
    const updated = proSectionList.filter(p => p.id !== id);
    setProSectionList(updated);
    await saveProSectionToDb(updated);
    triggerNotification("success", `"${name}" ডিলিট করা হয়েছে।`);
    if (editingProId === id) handleCancelProEdit();
  };

  const handleMoveProSerial = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= proSectionList.length) return;
    const newList = [...proSectionList];
    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;
    newList.forEach((item, idx) => { item.serial = idx + 1; });
    setProSectionList(newList);
    await saveProSectionToDb(newList);
    triggerNotification("success", "প্রো সেকশন সিরিয়াল আপডেট করা হয়েছে!");
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

  const handleAutoFillQuestions = async () => {
    const needed = paperTargetCount - paperQuestions.length;
    if (needed <= 0) {
      triggerNotification("error", `প্রশ্নপত্র ইতিমধ্যেই ${paperQuestions.length} টি প্রশ্নে পূর্ণ!`);
      return;
    }

    setPaperLoadingQuestions(true);

    // Fetch candidate pool matching selected subjects
    const fullCandidates = await loadPaperQuestionsFromDb(paperSearchSubjects, paperSearchQuery, true);

    let candidates = fullCandidates.filter(q => 
      !paperQuestions.some(pq => pq.id === q.id || (pq.question || pq.questionText) === (q.question || q.questionText))
    );

    if (candidates.length < needed) {
      const extraLocal = QUIZ_QUESTIONS
        .map(q => normalizeQuestion(q))
        .filter(q => {
          if (paperExamType !== "special" && (q.subject || q.subjectName) === "BCS Health Question") return false;
          if (!paperSearchSubjects.includes("All") && paperSearchSubjects.length > 0) {
            if (!matchesSubject(q.subject || q.subjectName || "", paperSearchSubjects)) return false;
          }
          const alreadyInPaper = paperQuestions.some(pq => pq.id === q.id || (pq.question || pq.questionText) === (q.question || q.questionText));
          const alreadyInCandidates = candidates.some(cq => cq.id === q.id || (cq.question || cq.questionText) === (q.question || q.questionText));
          return !alreadyInPaper && !alreadyInCandidates;
        });
      candidates = [...candidates, ...extraLocal];
    }

    if (candidates.length === 0) {
      setPaperLoadingQuestions(false);
      triggerNotification("error", "সিলেক্টেড বিষয় বা ফিল্টারে নতুন কোনো প্রশ্ন পাওয়া যায়নি। অন্য বিষয় সিলেক্ট করুন বা সার্চ পরিবর্তন করুন।");
      return;
    }

    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const toAdd = shuffled.slice(0, needed);

    setPaperQuestions(prev => [...prev, ...toAdd]);
    setPaperLoadingQuestions(false);
    triggerNotification("success", `${toAdd.length} টি প্রশ্ন স্বয়ংক্রিয়ভাবে যোগ করা হয়েছে! (মোট: ${paperQuestions.length + toAdd.length}/${paperTargetCount})`);
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

    let targetCourse = paperCourse;
    let targetSubSubject = paperSubSubject;

    if (paperCategoryType === "prep_hub") {
      targetCourse = paperPrepSubjectId;
      targetSubSubject = paperPrepSubSubject;
    } else if (paperCategoryType === "pro_feature") {
      targetCourse = paperProModule;
      targetSubSubject = paperProSubSubject;
    }

    const newPaper: ExamPaper = {
      id: editingPaperId || `exam-${Date.now()}`,
      title: paperTitle.trim(),
      course: targetCourse,
      subSubject: targetSubSubject,
      categoryType: paperCategoryType,
      examType: paperExamType,
      subject: targetSubSubject !== "all" && targetSubSubject !== "none" ? targetSubSubject : paperSubject,
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
      resetExamPaperForm();
    } else {
      triggerNotification("error", "প্রশ্ন পত্র লোকাল সেভ হয়েছে কিন্তু সার্ভারে সেভ করতে সমস্যা হয়েছে।");
    }
  };

  const handleEditExamPaper = async (paper: ExamPaper) => {
    setEditingPaperId(paper.id);
    setPaperTitle(paper.title);
    
    if (paper.categoryType === "pro_feature") {
      setPaperCategoryType("pro_feature");
      setPaperProModule(paper.course || "question_bank");
      setPaperProSubSubject(paper.subSubject || "none");
    } else if (paper.categoryType === "prep_hub") {
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
    
    // Parse preserved exam paper dates properly
    const resolvedStartDT = toDateTimeLocalInput(paper.startDateTime || paper.examDate || paper.createdAt, getNowLocalDateTimeStr());
    const resolvedEndDT = toDateTimeLocalInput(paper.endDateTime, getTodayEndDateTimeStr());
    const resolvedDateStr = paper.examDate || formatDisplayDate(resolvedStartDT);
    
    setPaperDate(resolvedDateStr);
    setPaperStartDateTime(resolvedStartDT);
    setPaperEndDateTime(resolvedEndDT);
    setPaperStatus(paper.status);
    setActiveTab("exam_papers");

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);

    if (Array.isArray(paper.questions) && paper.questions.length > 0) {
      setPaperTargetCount(paper.questionCount || paper.questions.length || 10);
      setPaperQuestions(paper.questions);
    } else {
      setPaperLoadingQuestions(true);
      setPaperQuestions([]);
      try {
        const fullPaper = await fetchExamPaperById(paper.id);
        if (fullPaper && Array.isArray(fullPaper.questions) && fullPaper.questions.length > 0) {
          setPaperQuestions(fullPaper.questions);
          setPaperTargetCount(fullPaper.questionCount || fullPaper.questions.length || 10);
          paper.questions = fullPaper.questions;
        } else {
          setPaperTargetCount(paper.questionCount || 10);
        }
      } catch (err) {
        console.error("Error loading exam paper questions for edit:", err);
      } finally {
        setPaperLoadingQuestions(false);
      }
    }
  };

  const handleViewExamPaperDetails = async (paper: ExamPaper) => {
    setViewingExamPaper(paper);

    if (!paper.questions || paper.questions.length === 0) {
      try {
        const fullPaper = await fetchExamPaperById(paper.id);
        if (fullPaper) {
          setViewingExamPaper(fullPaper);
          paper.questions = fullPaper.questions;
        }
      } catch (err) {
        console.error("Error fetching full exam paper for view:", err);
      }
    }
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
  const loadQuestionsFromDb = async (
    overrideLimit?: number,
    overrideSubject?: string,
    overrideSearch?: string,
    overrideForceRefresh: boolean = false
  ) => {
    const limitVal = overrideLimit !== undefined ? overrideLimit : displayLimit;
    const subjectVal = overrideSubject !== undefined ? overrideSubject : selectedSubjectFilter;
    const searchVal = overrideSearch !== undefined ? overrideSearch : searchQuery;
    const cleanSearch = searchVal.trim();

    // Min 3 char threshold for search query
    const effectiveSearch = cleanSearch.length >= 3 ? cleanSearch.toLowerCase() : "";

    const cacheKey = `${limitVal}_${subjectVal}_${effectiveSearch}`;

    if (!overrideForceRefresh && questionsCacheRef.current.has(cacheKey)) {
      const cached = questionsCacheRef.current.get(cacheKey)!;
      setQuestions(cached.questions);
      setTotalQuestionsCount(cached.totalCount);
      return;
    }

    try {
      setDbLoading(true);
      setDbError(null);
      const supabase = getSupabase();
      
      if (supabase) {
        // 1. Exact count query for dashboard and stats without downloading table body
        const { count, error: countErr } = await supabase
          .from("questions")
          .select("id", { count: "exact", head: true });

        let currentTotal = count || 0;
        if (!countErr && count !== null && count !== undefined) {
          setTotalQuestionsCount(count);
        }

        // 2. Server-side pagination, on-demand search/filtering & optimized column selection
        let query = supabase
          .from("questions")
          .select("id, subjectName, questionText, options, correctOptionIndex, explanation, created_at")
          .order("created_at", { ascending: false })
          .limit(limitVal);

        if (subjectVal && subjectVal !== "All") {
          query = query.eq("subjectName", subjectVal);
        }

        if (effectiveSearch.length >= 3) {
          query = query.ilike("questionText", `%${effectiveSearch}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.warn("Could not load from 'questions' table. Fallback to mock state.", error);
          setDbError("Supabase 'questions' table not found or query failed.");
          
          const cachedMock = localStorage.getItem("job_master_admin_questions");
          if (cachedMock) {
            try {
              let parsed = JSON.parse(cachedMock).map((item: any) => normalizeQuestion(item));
              if (subjectVal && subjectVal !== "All") {
                parsed = parsed.filter((q: any) => matchesSubject(q.subjectName || q.subject || "", [subjectVal]));
              }
              if (effectiveSearch.length >= 3) {
                parsed = parsed.filter((q: any) => (q.question || q.questionText || "").toLowerCase().includes(effectiveSearch));
              }
              const sliced = parsed.slice(0, limitVal);
              setQuestions(sliced);
              setTotalQuestionsCount(parsed.length);
              questionsCacheRef.current.set(cacheKey, { questions: sliced, totalCount: parsed.length });
            } catch {
              let norm = QUIZ_QUESTIONS.map(item => normalizeQuestion(item));
              if (subjectVal && subjectVal !== "All") {
                norm = norm.filter((q: any) => matchesSubject(q.subjectName || q.subject || "", [subjectVal]));
              }
              if (effectiveSearch.length >= 3) {
                norm = norm.filter((q: any) => (q.question || q.questionText || "").toLowerCase().includes(effectiveSearch));
              }
              const sliced = norm.slice(0, limitVal);
              setQuestions(sliced);
              setTotalQuestionsCount(norm.length);
              questionsCacheRef.current.set(cacheKey, { questions: sliced, totalCount: norm.length });
            }
          } else {
            let norm = QUIZ_QUESTIONS.map(item => normalizeQuestion(item));
            if (subjectVal && subjectVal !== "All") {
              norm = norm.filter((q: any) => matchesSubject(q.subjectName || q.subject || "", [subjectVal]));
            }
            if (effectiveSearch.length >= 3) {
              norm = norm.filter((q: any) => (q.question || q.questionText || "").toLowerCase().includes(effectiveSearch));
            }
            const sliced = norm.slice(0, limitVal);
            setQuestions(sliced);
            setTotalQuestionsCount(norm.length);
            questionsCacheRef.current.set(cacheKey, { questions: sliced, totalCount: norm.length });
          }
        } else if (data) {
          let normalized = data.map(item => normalizeQuestion(item));
          if (subjectVal && subjectVal !== "All") {
            normalized = normalized.filter((q: any) => matchesSubject(q.subjectName || q.subject || "", [subjectVal]));
          }
          setQuestions(normalized);
          const finalCount = currentTotal || normalized.length;
          questionsCacheRef.current.set(cacheKey, { questions: normalized, totalCount: finalCount });
          localStorage.setItem("job_master_admin_questions", JSON.stringify(normalized));
        }
      }
    } catch (err: any) {
      console.error("Error connecting to Supabase:", err);
      setDbError(err.message || "Unknown error connecting to Supabase");
    } finally {
      setDbLoading(false);
    }
  };

  // Debounced Effect to handle initial load, limit changes, subject filter changes, and search query typing
  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuestionsFromDb(displayLimit, selectedSubjectFilter, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [displayLimit, selectedSubjectFilter, searchQuery]);

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

  // Handle Login authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setAuthLoading(true);

    const identifier = (loginIdentifier || passcode).trim();
    const pass = (loginPassword || passcode).trim();

    const result = await loginAdminWithCredentials(identifier, pass);
    setAuthLoading(false);

    if (result.success && result.user) {
      setCurrentStaffSession(result.user);
      setIsAuthenticated(true);
      if (result.user.role === "editor") {
        setActiveTab("questions");
      }
      setLoginIdentifier("");
      setLoginPassword("");
      setPasscode("");
      // Refresh staff list
      const staff = await fetchAdminStaffFromDb();
      setAdminStaffList(staff);
      triggerNotification("success", `স্বাগতম ${result.user.name}! (${getRoleLabelBangla(result.user.role)})`);
    } else {
      setLoginError(result.error || "লগইন ব্যর্থ হয়েছে! ইমেইল/ফোন ও পাসওয়ার্ড চেক করুন।");
      triggerNotification("error", result.error || "লগইন ব্যর্থ হয়েছে!");
    }
  };

  // Handle Staff Access Request / Registration
  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setAuthLoading(true);

    const res = await registerAdminStaffRequest(regName, regEmail, regPhone, regPassword, regRequestedRole);
    setAuthLoading(false);

    if (res.success) {
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setAdminAuthMode("login");
      const staff = await fetchAdminStaffFromDb();
      setAdminStaffList(staff);
      triggerNotification("success", res.message || "আবেদন সফলভাবে গৃহীত হয়েছে! অ্যাডমিন অনুমোদনের পর লগইন করতে পারবেন।");
    } else {
      setLoginError(res.error || "আবেদন জমা দিতে সমস্যা হয়েছে।");
      triggerNotification("error", res.error || "আবেদন জমা দিতে সমস্যা হয়েছে।");
    }
  };

  // Handle Staff Direct Create (Admin modal)
  const handleAddNewStaffDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) {
      triggerNotification("error", "দয়া করে নাম, ইমেইল ও পাসওয়ার্ড প্রদান করুন।");
      return;
    }

    const newStaff: AdminStaffUser = {
      id: `staff_${Date.now()}`,
      name: newStaffName.trim(),
      email: newStaffEmail.trim().toLowerCase(),
      phone: newStaffPhone.trim() || undefined,
      passwordHash: newStaffPassword.trim(),
      password: newStaffPassword.trim(),
      role: newStaffRole,
      status: "active",
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: currentStaffSession?.email || "admin"
    };

    const updated = await saveAdminStaffToDb([...adminStaffList.filter(s => s.email !== newStaff.email), newStaff]);
    setAdminStaffList(updated);
    setNewStaffModalOpen(false);
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setNewStaffPassword("");
    setNewStaffRole("editor");
    triggerNotification("success", `নতুন ${getRoleLabelBangla(newStaff.role)} (${newStaff.name}) সফলভাবে যুক্ত করা হয়েছে!`);
  };

  // Handle Approve Staff Request
  const handleApproveStaff = async (staffId: string, role?: AdminRole) => {
    const target = adminStaffList.find(s => s.id === staffId);
    if (!target) return;
    const targetRole = role || target.role || "editor";
    const updated = await approveStaffRequest(staffId, targetRole, currentStaffSession?.email || "admin");
    setAdminStaffList(updated);
    triggerNotification("success", `${target.name}-এর আবেদন (${getRoleLabelBangla(targetRole)}) সফলভাবে অনুমোদিত হয়েছে!`);
  };

  // Handle Update Staff Role
  const handleUpdateStaffRole = async (staffId: string, newRole: AdminRole) => {
    const target = adminStaffList.find(s => s.id === staffId);
    if (!target) return;
    if (target.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      triggerNotification("error", "মূল মাস্টার অ্যাডমিনের রোল পরিবর্তনযোগ্য নয়!");
      return;
    }
    const updated = await updateStaffRole(staffId, newRole);
    setAdminStaffList(updated);
    triggerNotification("success", `${target.name}-এর রোল সফলভাবে "${getRoleLabelBangla(newRole)}" হিসেবে আপডেট করা হয়েছে!`);
  };

  // Handle Toggle Staff Active/Suspended
  const handleToggleStaffStatus = async (staffId: string) => {
    const target = adminStaffList.find(s => s.id === staffId);
    if (!target) return;
    if (target.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      triggerNotification("error", "মূল মাস্টার অ্যাডমিনকে সাসপেন্ড করা যাবে না!");
      return;
    }
    const updated = await toggleStaffStatus(staffId);
    setAdminStaffList(updated);
    const newStatus = updated.find(s => s.id === staffId)?.status;
    triggerNotification("success", `${target.name}-এর একাউন্ট স্ট্যাটাস: ${newStatus === "active" ? "সক্রিয়" : "স্থগিত"} করা হয়েছে।`);
  };

  // Handle Delete Staff
  const handleDeleteStaff = async (staffId: string) => {
    const target = adminStaffList.find(s => s.id === staffId);
    if (!target) return;
    if (target.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      triggerNotification("error", "মূল মাস্টার অ্যাডমিন একাউন্ট মুছে ফেলা যাবে না!");
      return;
    }
    if (window.confirm(`আপনি কি নিশ্চিত যে "${target.name}" (${target.email}) এর অ্যাডমিন একাউন্ট মুছে ফেলতে চান?`)) {
      const updated = await deleteStaffAccount(staffId);
      setAdminStaffList(updated);
      triggerNotification("success", `${target.name}-এর একাউন্ট সফলভাবে মুছে ফেলা হয়েছে।`);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
    setCurrentStaffSession(null);
    setPasscode("");
    setLoginIdentifier("");
    setLoginPassword("");
    triggerNotification("success", "সফলভাবে লগআউট করা হয়েছে।");
  };

  // Handle User Status Change (Ban/Unban toggle) with Supabase DB sync
  const toggleUserStatus = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === "Active" ? "Banned" : "Active";

    const updated = users.map(user => {
      if (user.id === userId) {
        return { ...user, status: nextStatus as "Active" | "Banned" };
      }
      return user;
    });

    setUsers(updated);
    saveUsers(updated);

    // Sync to Supabase DB
    await updateUserStatusInDb(userId, nextStatus);

    triggerNotification(
      "success", 
      `ইউজার ${target.email} কে ${nextStatus === "Active" ? "সক্রিয়" : "নিষিদ্ধ"} করা হয়েছে।`
    );
  };

  // Handle Delete User Account
  const handleDeleteUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    if (window.confirm(`আপনি কি নিশ্চিত যে ইউজার (${target.email}) কে স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      const updated = users.filter(u => u.id !== userId);
      setUsers(updated);
      saveUsers(updated);

      // Sync to Supabase DB
      await deleteUserProfileFromDb(userId);

      triggerNotification("success", `ইউজার ${target.email} সফলভাবে মুছে ফেলা হয়েছে।`);
    }
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

        {/* EDIT LEADERBOARD USER SCORE MODAL */}
        {editingLeaderboardUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xl max-w-md w-full space-y-5 relative animate-fade-in">
              <button
                onClick={() => setEditingLeaderboardUser(null)}
                className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-500 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-orange-50 text-[#FF6A00] rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                    ইউজার কুইজ স্কোর মডিফাই করুন
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">
                    ID: {editingLeaderboardUser.student_id || editingLeaderboardUser.id}
                  </p>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const updatedUsers = await adminUpdateLeaderboardUser({
                    userId: editingLeaderboardUser.id,
                    name: editUserName,
                    today_score: editTodayScore,
                    week_score: editWeekScore,
                    month_score: editMonthScore,
                    all_time_score: editAllTimeScore
                  });
                  setAdminLeaderboardUsers(updatedUsers);
                  setEditingLeaderboardUser(null);
                  triggerNotification("success", "ইউজারের কুইজ স্কোর সফলভাবে সার্ভারে আপডেট করা হয়েছে!");
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                    ইউজার নাম (Name)
                  </label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                      Today Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editTodayScore}
                      onChange={(e) => setEditTodayScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                      Week Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editWeekScore}
                      onChange={(e) => setEditWeekScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                      Month Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editMonthScore}
                      onChange={(e) => setEditMonthScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                      All Time Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editAllTimeScore}
                      onChange={(e) => setEditAllTimeScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLeaderboardUser(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="bg-[#FF6A00] hover:bg-orange-600 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                  >
                    স্কোর সেভ করুন (Save Changes)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6A00] opacity-5 rounded-full translate-x-12 -translate-y-12"></div>
          
          <div className="text-center space-y-2">
            <div className="inline-flex w-14 h-14 bg-orange-50 text-[#FF6A00] rounded-2xl items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8 stroke-[2]" />
            </div>
            
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Job Master <span className="text-[#FF6A00]">Admin Hub</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Role-Based Access Control (Admin • Supervisor • Editor)
            </p>
          </div>

          {/* Auth Tab Switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => { setAdminAuthMode("login"); setLoginError(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                adminAuthMode === "login"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন (Sign In)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAdminAuthMode("register"); setLoginError(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                adminAuthMode === "register"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>এক্সেস আবেদন (Request Access)</span>
            </button>
          </div>

          {adminAuthMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block pl-1">
                  ইমেইল / মোবাইল নম্বর / পাসকোড
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="আপনার ইমেইল বা মোবাইল নম্বর দিন..."
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent transition-all font-semibold"
                    required
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block pl-1">
                  পাসওয়ার্ড (Password)
                </label>
                <div className="relative">
                  <input 
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="আপনার পাসওয়ার্ড দিন..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-11 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent transition-all font-semibold"
                    required
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showLoginPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-2xl p-3 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#FF6A00] hover:bg-orange-600 active:scale-95 text-white font-black py-3.5 rounded-2xl text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>লগইন করুন (ADMIN ACCESS)</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterStaff} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">
                  আপনার পূর্ণ নাম (Full Name)
                </label>
                <input 
                  type="text"
                  placeholder="যেমন: তানভীর আহমেদ"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-600 block mb-1">
                    ইমেইল (Email Address)
                  </label>
                  <input 
                    type="email"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-600 block mb-1">
                    মোবাইল নম্বর (Phone)
                  </label>
                  <input 
                    type="tel"
                    placeholder="017xxxxxxxx"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">
                  পাসওয়ার্ড সেট করুন
                </label>
                <div className="relative">
                  <input 
                    type={showRegPassword ? "text" : "password"}
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showRegPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 block mb-1">
                  কাঙ্ক্ষিত পদবী (Requested Role)
                </label>
                <select
                  value={regRequestedRole}
                  onChange={(e) => setRegRequestedRole(e.target.value as AdminRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
                >
                  <option value="editor">এডিটর (Editor - শুধুমাত্র প্রশ্ন ব্যাংক তৈরি ও এডিট)</option>
                  <option value="supervisor">সুপারভাইজার (Supervisor - ইউজার, অফার ও প্রশ্ন ম্যানেজ)</option>
                  <option value="admin">অ্যাডমিন (Admin - সম্পূর্ণ ক্ষমতা)</option>
                </select>
              </div>

              {loginError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-2xl p-3 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#FF6A00] hover:bg-orange-600 active:scale-95 text-white font-black py-3 rounded-2xl text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>এক্সেস আবেদন জমা দিন (Submit Request)</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-center items-center text-[11px] font-bold text-slate-400">
            <Link href="/" prefetch={false} className="flex items-center gap-1.5 hover:text-[#FF6A00] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> মেইন সাইটে ফিরুন
            </Link>
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
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-black text-slate-800">
                {currentStaffSession?.name || "Super Admin"}
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                (currentStaffSession?.role || "admin") === "admin"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : (currentStaffSession?.role || "admin") === "supervisor"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}>
                {getRoleLabelBangla(currentStaffSession?.role || "admin")}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {currentStaffSession?.email || "mobileseba247@gmail.com"}
            </span>
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
        
        {/* Navigation Tabs - Mobile Lazy Row UI */}
        <div className="block md:hidden w-full bg-white border-b border-slate-100 p-2.5 overflow-x-auto shrink-0 shadow-2xs">
          <div className="flex items-center gap-2 min-w-max px-1">
            {canManageQuestions(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("questions")}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === "questions"
                    ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                }`}
              >
                <HelpCircle className={`w-4 h-4 ${activeTab === "questions" ? "text-white" : "text-[#FF6A00]"}`} />
                <span>প্রশ্ন ব্যাংক ({totalQuestionsCount || questions.length})</span>
              </button>
            )}

            {canManageExams(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("exam_papers")}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === "exam_papers"
                    ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                }`}
              >
                <FileText className={`w-4 h-4 ${activeTab === "exam_papers" ? "text-white" : "text-[#FF6A00]"}`} />
                <span>প্রশ্ন পত্র তৈরি ({examPapers.length})</span>
              </button>
            )}

            {canManageUsers(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("users")}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === "users"
                    ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === "users" ? "text-white" : "text-[#FF6A00]"}`} />
                <span>ইউজার লিস্ট ({users.length})</span>
              </button>
            )}

            {canManageOffers(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("offers")}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === "offers"
                    ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                }`}
              >
                <Megaphone className={`w-4 h-4 ${activeTab === "offers" ? "text-white" : "text-[#FF6A00]"}`} />
                <span>ব্যানার ও অফার ({offers.length})</span>
              </button>
            )}

            {canManagePackages(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("packages")}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === "packages"
                    ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                }`}
              >
                <Package className={`w-4 h-4 ${activeTab === "packages" ? "text-white" : "text-[#FF6A00]"}`} />
                <span>প্যাকেজ কন্ট্রোল ({packagesList.length})</span>
              </button>
            )}

            {canManageCourses(currentStaffSession) && (
              <>
                <button
                  onClick={() => setActiveTab("courses")}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    activeTab === "courses"
                      ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                      : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                  }`}
                >
                  <Compass className={`w-4 h-4 ${activeTab === "courses" ? "text-white" : "text-[#FF6A00]"}`} />
                  <span>কোর্সসমূহ ({coursesList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("prep_hub")}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    activeTab === "prep_hub"
                      ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                      : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${activeTab === "prep_hub" ? "text-white" : "text-[#FF6A00]"}`} />
                  <span>প্রিপারেশন হাব ({prepSubjectsList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("pro_section")}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    activeTab === "pro_section"
                      ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                      : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                  }`}
                >
                  <Briefcase className={`w-4 h-4 ${activeTab === "pro_section" ? "text-white" : "text-[#FF6A00]"}`} />
                  <span>প্রো সেকশন ({proSectionList.length})</span>
                </button>
              </>
            )}

            {canManageSettings(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("switches")}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === "switches"
                    ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                }`}
              >
                <Sliders className={`w-4 h-4 ${activeTab === "switches" ? "text-white" : "text-[#FF6A00]"}`} />
                <span>কন্ট্রোল সুইচ</span>
              </button>
            )}

            {canManageLeaderboard(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === "leaderboard"
                    ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm shadow-orange-500/30 scale-[1.02]"
                    : "bg-slate-50 text-slate-700 border-slate-200/70 hover:bg-orange-50 hover:text-[#FF6A00]"
                }`}
              >
                <Trophy className={`w-4 h-4 ${activeTab === "leaderboard" ? "text-white" : "text-[#FF6A00]"}`} />
                <span>কুইজ লিডারবোর্ড ({adminLeaderboardUsers.length})</span>
              </button>
            )}

            {canManageStaff(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("staff")}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  activeTab === "staff"
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/30 scale-[1.02]"
                    : "bg-purple-50 text-purple-700 border-purple-200/70 hover:bg-purple-100"
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${activeTab === "staff" ? "text-white" : "text-purple-600"}`} />
                <span>স্টাফ ও রোল ({adminStaffList.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Left on Desktop */}
        <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-100 p-4 shrink-0 flex-col justify-between overflow-y-auto">
          
          <div className="w-full flex flex-col gap-1.5">
            {/* Nav Title Desktop */}
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2.5 py-2">
              ম্যানেজমেন্ট ড্যাশবোর্ড
            </h3>

            {/* Tab Button 1: Questions */}
            {canManageQuestions(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("questions")}
                className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                  activeTab === "questions"
                    ? "bg-orange-50 text-[#FF6A00]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>প্রশ্ন ব্যাংক ({totalQuestionsCount || questions.length})</span>
              </button>
            )}

            {/* Tab Button 2: Exam Papers / Question Sets */}
            {canManageExams(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("exam_papers")}
                className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                  activeTab === "exam_papers"
                    ? "bg-orange-50 text-[#FF6A00]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>প্রশ্ন পত্র তৈরি ({examPapers.length})</span>
              </button>
            )}

            {/* Tab Button 3: Users */}
            {canManageUsers(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("users")}
                className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                  activeTab === "users"
                    ? "bg-orange-50 text-[#FF6A00]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>ইউজার লিস্ট ({users.length})</span>
              </button>
            )}

            {/* Tab Button 4: Offers */}
            {canManageOffers(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("offers")}
                className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                  activeTab === "offers"
                    ? "bg-orange-50 text-[#FF6A00]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>ব্যানার ও অফার ({offers.length})</span>
              </button>
            )}

            {/* Tab Button 5: Packages Management */}
            {canManagePackages(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("packages")}
                className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                  activeTab === "packages"
                    ? "bg-orange-50 text-[#FF6A00]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>প্যাকেজ কন্ট্রোল ({packagesList.length})</span>
              </button>
            )}

            {/* Tab Button 6: Our Courses Management */}
            {canManageCourses(currentStaffSession) && (
              <>
                <button
                  onClick={() => setActiveTab("courses")}
                  className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                    activeTab === "courses"
                      ? "bg-orange-50 text-[#FF6A00]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>কোর্সসমূহ ({coursesList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("prep_hub")}
                  className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                    activeTab === "prep_hub"
                      ? "bg-orange-50 text-[#FF6A00]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>প্রিপারেশন হাব ({prepSubjectsList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("pro_section")}
                  className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                    activeTab === "pro_section"
                      ? "bg-orange-50 text-[#FF6A00]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>প্রো সেকশন ({proSectionList.length})</span>
                </button>
              </>
            )}

            {/* Tab Button 8: Control Switches */}
            {canManageSettings(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("switches")}
                className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                  activeTab === "switches"
                    ? "bg-orange-50 text-[#FF6A00]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>কন্ট্রোল সুইচ (Settings)</span>
              </button>
            )}

            {/* Tab Button 9: Quiz Leaderboard */}
            {canManageLeaderboard(currentStaffSession) && (
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                  activeTab === "leaderboard"
                    ? "bg-orange-50 text-[#FF6A00]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Trophy className="w-4 h-4 text-[#FF6A00]" />
                <span>কুইজ লিডারবোর্ড ({adminLeaderboardUsers.length})</span>
              </button>
            )}

            {/* Tab Button 10: Staff & RBAC Management */}
            {canManageStaff(currentStaffSession) && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab("staff")}
                  className={`w-full flex flex-none items-center justify-start gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-left ${
                    activeTab === "staff"
                      ? "bg-purple-100 text-purple-900 shadow-sm"
                      : "text-purple-700 bg-purple-50/70 hover:bg-purple-100"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>স্টাফ ও এডমিন এক্সেস ({adminStaffList.length})</span>
                </button>
              </div>
            )}
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
                <span className="text-base sm:text-lg font-black text-slate-800 leading-none">{totalQuestionsCount || questions.length} টি</span>
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

            {/* Stat Box 3: Total Packages */}
            <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-sm flex items-center gap-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF6A00] opacity-5 rounded-full translate-x-4 -translate-y-4"></div>
              <div className="w-10 h-10 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 stroke-[2.2px]" />
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">মোট প্যাকেজসমূহ</span>
                <span className="text-base sm:text-lg font-black text-slate-800 leading-none">
                  {packagesList.length} টি
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
            const displayedQuestions = questions;

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
                          onClick={() => loadQuestionsFromDb(displayLimit, selectedSubjectFilter, searchQuery)}
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
                          placeholder="প্রশ্ন টেক্সট দিয়ে সার্চ করুন (কমপক্ষে ৩ অক্ষর)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all text-slate-800"
                        />
                        {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                          <p className="text-[10px] font-bold text-amber-600 pl-1 flex items-center gap-1">
                            <span>⚠️ অনুসন্ধানের জন্য অন্তত ৩ টি অক্ষর টাইপ করুন (কমপক্ষে ৩ ক্যারেক্টার)</span>
                          </p>
                        )}
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
                            onClick={() => {
                              setDisplayLimit(num);
                              loadQuestionsFromDb(num, selectedSubjectFilter, searchQuery);
                            }}
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

                  {/* Table / Card List Container */}
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
                          মোট: {totalQuestionsCount || questions.length} টি
                        </span>
                        <span className="text-[10px] font-extrabold bg-orange-50 text-[#FF6A00] border border-orange-100 px-3 py-1 rounded-full">
                          প্রদর্শিত: {displayedQuestions.length} টি (সর্বোচ্চ {displayLimit} টি)
                        </span>
                      </div>
                    </div>

                    {dbError && (
                      <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{dbError} প্যানেলটি এখন ডেমো/লোকাল মেমোরি ফলব্যাকে চলছে।</span>
                      </div>
                    )}

                    {/* Question Bank Cards View (Desktop & Mobile) */}
                    <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 bg-slate-50/50">
                      {displayedQuestions.map((q) => {
                        const idVal = q.id;
                        const subjectLabel = q.subjectName || q.subject_name || "Bangla Literature";
                        const questionText = q.questionText || q.question || q.title || q.question_text || "Untitled Question";
                        const explanationText = q.explanation || "";
                        
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
                          <div key={idVal} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative space-y-3">
                            
                            {/* Header Row: Subject Badge + Edit Icon on Top Right */}
                            <div className="flex items-start justify-between gap-2 pr-12">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                  {typeof idVal === "number" ? `#${idVal}` : `#${String(idVal).slice(0, 6)}`}
                                </span>
                                <span className="text-[10px] font-extrabold bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20 px-3 py-0.5 rounded-full">
                                  {subjectLabel}
                                </span>
                              </div>
                            </div>

                            {/* Top Right Edit Button */}
                            <button
                              onClick={() => handleEditClick(q)}
                              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-90 cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-extrabold"
                              title="Edit Question"
                            >
                              <Pencil className="w-4 h-4 text-slate-600" />
                              <span className="hidden sm:inline">এডিট</span>
                            </button>

                            {/* 1. Question Text */}
                            <div className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug pt-0.5 pr-2">
                              <MathRenderer content={questionText} />
                            </div>

                            {/* 2. 4 Options Stacked One Below Another */}
                            <div className="space-y-1.5 pt-0.5">
                              {options.map((opt, oIdx) => (
                                <div 
                                  key={oIdx}
                                  className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-all ${
                                    oIdx === correctIdx 
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold" 
                                      : "bg-slate-50 text-slate-700 border-slate-100"
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 ${
                                    oIdx === correctIdx ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                                  }`}>
                                    {oIdx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0 leading-tight">
                                    <MathRenderer content={opt || `অপশন ${oIdx + 1}`} />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 3. Correct Answer */}
                            <div className="p-2.5 sm:p-3 bg-emerald-50/90 border border-emerald-100 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span>সঠিক উত্তর:</span>
                              <span className="font-extrabold text-emerald-950">
                                <MathRenderer content={options[correctIdx] || options[0] || "অপশন ১"} />
                              </span>
                            </div>

                            {/* 4. Explanation & Bottom Right Delete Button */}
                            <div className="flex items-start justify-between gap-3 pt-1">
                              <div className="flex-1 min-w-0 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm text-slate-600">
                                <span className="text-[11px] sm:text-xs font-black text-slate-700 block mb-1">ব্যাখ্যা:</span>
                                {explanationText ? (
                                  <MathRenderer content={explanationText} />
                                ) : (
                                  <span className="text-slate-400 italic">কোন ব্যাখ্যা দেওয়া নেই</span>
                                )}
                              </div>

                              {/* Bottom Right Delete Button */}
                              <button
                                onClick={() => {
                                  if (confirm(`আপনি কি নিশ্চিত যে আপনি এই প্রশ্নটি মুছে ফেলতে চান?`)) {
                                    handleDeleteQuestion(idVal);
                                  }
                                }}
                                className="p-2.5 sm:p-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition-all active:scale-90 cursor-pointer shrink-0 self-end flex items-center gap-1 text-xs font-extrabold"
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" />
                                <span className="hidden sm:inline">ডিলেট</span>
                              </button>
                            </div>

                          </div>
                        );
                      })}

                      {displayedQuestions.length === 0 && (
                        <div className="p-8 text-center text-xs font-bold text-slate-400">
                          কোনো প্রশ্ন পাওয়া যায়নি! দয়া করে ডেমো প্রশ্ন সিড করুন অথবা নতুন প্রশ্ন যোগ করুন।
                        </div>
                      )}
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
                        setPaperTitle("");
                        setPaperTopic("");
                        setPaperStatus("Upcoming");
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                    >
                      বাতিল করুন
                    </button>
                  )}
                </div>

                <form onSubmit={handlePublishExamPaper} className="space-y-6">
                  {/* Mode Selector: Our Course vs Preparation Hub vs Pro Feature */}
                  <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-2">
                    <label className="text-[11px] font-black text-slate-700 uppercase block">
                      প্রশ্নপত্র তৈরির সেকশন সিলেক্ট করুন (Target Section) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaperCategoryType("our_course");
                          if (paperSearchSubjects.includes("All")) setPaperSearchSubjects(["All"]);
                          if (coursesList.length > 0 && !paperCourse) {
                            setPaperCourse(coursesList[0].id);
                          }
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paperCategoryType === "our_course"
                            ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Compass className="w-4 h-4" />
                        <span>আওয়ার কোর্স (Our Courses)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaperCategoryType("prep_hub");
                          setPaperSearchSubjects(prev => prev.filter(s => s !== "All"));
                          if (prepSubjectsList.length > 0 && !paperPrepSubjectId) {
                            setPaperPrepSubjectId(prepSubjectsList[0].id || prepSubjectsList[0].name);
                          }
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paperCategoryType === "prep_hub"
                            ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>প্রেপারেশন হাব (Preparation Hub)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaperCategoryType("pro_feature");
                          setPaperSearchSubjects(prev => prev.filter(s => s !== "All"));
                          if (!paperProModule) setPaperProModule("question_bank");
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          paperCategoryType === "pro_feature"
                            ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>প্রো ফিচার (Pro Feature)</span>
                      </button>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    {/* 1. Exam Title */}
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

                    {/* 2. Topic (Moved from 4 to 2) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        ২. টপিক / বিষয় বিবরণ (Topic)
                      </label>
                      <input 
                        type="text"
                        placeholder='যেমন: "Award Mania" এর জন্য প্রযোজ্য'
                        value={paperTopic}
                        onChange={(e) => setPaperTopic(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800"
                      />
                    </div>

                    {/* 3. Target Section Selection */}
                    {paperCategoryType === "prep_hub" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            ৩. প্রেপারেশন সাবজেক্ট (Prep Subject) *
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
                            ৩.১ সাব-সাবজেক্ট / পেপার (Sub-Subject / Paper) *
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
                    ) : paperCategoryType === "pro_feature" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            ৩. প্রো ক্যাটাগরি / মডিউল (Pro Feature Module) *
                          </label>
                          <select
                            value={paperProModule}
                            onChange={(e) => {
                              setPaperProModule(e.target.value);
                              setPaperProSubSubject("none");
                            }}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none transition-all text-slate-800 cursor-pointer"
                          >
                            <option value="question_bank">📊 প্রশ্ন ব্যাংক (Question Bank)</option>
                            <option value="job_solution">💼 জব সল্যুশন (Job Solution)</option>
                            {proSectionList.filter(p => p.id !== "pro-question-bank" && p.id !== "pro-job-solution").map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-[#FF6A00] uppercase block pl-1">
                            ৩.১ টপিক / সাব-ক্যাটাগরি (Sub-Topic)
                          </label>
                          <select
                            value={paperProSubSubject}
                            onChange={(e) => setPaperProSubSubject(e.target.value)}
                            className="w-full bg-orange-50/50 border border-orange-200/90 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none transition-all text-slate-800 cursor-pointer"
                          >
                            <option value="none">None (সকল বিষয় / জেনারেল)</option>
                            {SUBJECTS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                            ৩. কোর্স / ক্যাটাগরি (Course) *
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
                            ৩.১ বিষয় পেপার / সাব-ক্যাটাগরি (Sub-Subject / Paper) *
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

                  {/* 4. Exam Type & 5. Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">
                        ৪. পরীক্ষার ধরন (Type) *
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
                        ৫. পরীক্ষার স্ট্যাটাস (Status) *
                      </label>
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
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none text-slate-800 cursor-pointer"
                      >
                        <option value="Upcoming">Upcoming (আসন্ন)</option>
                        <option value="Live">Live (লাইভ)</option>
                        <option value="Archive">Archive (আর্কাইভ)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2.5: START & END DATE & TIME PICKER (CALENDAR) - For Upcoming and Live */}
                  {(paperStatus === "Upcoming" || paperStatus === "Live") && (
                    <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          {"\uD83D\uDCC5"} <span>পরীক্ষার সময়কাল নির্ধারণ (Start & End Date/Time Calendar) *</span>
                        </label>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          paperStatus === "Live" ? "text-emerald-700 bg-emerald-100" : "text-purple-700 bg-purple-100"
                        }`}>
                          {paperStatus === "Live" ? "\uD83D\uDD34 লাইভ পরীক্ষার সময়সূচি নির্ধারণ" : "\uD83D\uDCC5 আসন্ন পরীক্ষার সময়সূচি নির্ধারণ"}
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
                          {"\uD83D\uDCC5"} ৩ দিনের লাইভ এক্সাম
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
                          {"\uD83D\uDDD3"}️ ৭ দিনের লাইভ এক্সাম
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
                              return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-extrabold flex items-center gap-1">{"\uD83D\uDD34"} Live (লাইভ পরীক্ষা চলছে)</span>;
                            } else {
                              return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-extrabold flex items-center gap-1">{"\uD83D\uDCC2"} Archive (সময় শেষ, আর্কাইভে চলে যাবে)</span>;
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

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => loadPaperQuestionsFromDb()}
                          disabled={paperLoadingQuestions}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${paperLoadingQuestions ? "animate-spin" : ""}`} />
                          <span>{paperLoadingQuestions ? "লোড হচ্ছে..." : "🔍 প্রশ্ন লোড করুন"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAutoFillQuestions}
                          disabled={paperLoadingQuestions}
                          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>অটো সিলেক্ট / র‍্যান্ডম ফিল (Auto Fill)</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter controls & Multi-subject Selection Chips */}
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="প্রশ্ন দিয়ে খুঁজুন (কমপক্ষে ৩ অক্ষর লিখুন)..."
                        value={paperSearchQuery}
                        onChange={(e) => setPaperSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#FF6A00]"
                      />
                      {paperSearchQuery.trim().length > 0 && paperSearchQuery.trim().length < 3 && (
                        <p className="text-[10px] font-bold text-amber-600 pl-1 flex items-center gap-1">
                          <span>⚠️ অনুসন্ধানের জন্য অন্তত ৩ টি অক্ষর টাইপ করুন (কমপক্ষে ৩ ক্যারেক্টার)</span>
                        </p>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pl-0.5">
                          <span>বিষয় ফিল্টার (একাধিক সাবজেক্ট সিলেক্ট করা যাবে):</span>
                          <span className="text-[#FF6A00] font-extrabold">
                            {paperCategoryType === "prep_hub" ? (
                              paperSearchSubjects.length === 0 
                                ? "কোনো বিষয় সিলেক্ট করা নেই" 
                                : `সিলেক্টেড: ${paperSearchSubjects.length} টি বিষয়`
                            ) : (
                              paperSearchSubjects.includes("All") 
                                ? "সকল বিষয় (All)" 
                                : `সিলেক্টেড: ${paperSearchSubjects.length} টি বিষয়`
                            )}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-32 overflow-y-auto">
                          {paperCategoryType !== "prep_hub" && (
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
                          )}

                          {SUBJECTS
                            .filter(s => paperExamType === "special" || s !== "BCS Health Question")
                            .map(s => {
                              const isSelected = paperCategoryType === "prep_hub"
                                ? paperSearchSubjects.includes(s)
                                : (!paperSearchSubjects.includes("All") && paperSearchSubjects.includes(s));
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
                    <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-2 space-y-2">
                      {paperLoadingQuestions ? (
                        <div className="p-6 text-center text-xs font-bold text-purple-600 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>সার্ভার থেকে প্রশ্ন লোড করা হচ্ছে...</span>
                        </div>
                      ) : !paperHasFetched && paperAvailableQuestions.length === 0 ? (
                        <div className="p-5 bg-purple-50/60 border border-purple-100 rounded-xl text-center space-y-2">
                          <p className="text-xs font-bold text-slate-700">
                            বিষয় ফিল্টারে ক্লিক করুন অথবা 'প্রশ্ন লোড করুন' বাটনে ক্লিক করে প্রশ্ন দেখুন
                          </p>
                          <button
                            type="button"
                            onClick={() => loadPaperQuestionsFromDb()}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>🔍 প্রশ্ন লোড করুন</span>
                          </button>
                        </div>
                      ) : paperAvailableQuestions.length === 0 ? (
                        <div className="p-5 text-center text-xs font-bold text-slate-400">
                          সিলেক্টেড ফিল্টার বা সার্চে কোনো প্রশ্ন পাওয়া যায়নি।
                        </div>
                      ) : (
                        paperAvailableQuestions
                          .slice(0, 30)
                          .map((q, idx) => {
                            const isAdded = paperQuestions.some(pq => pq.id === q.id || (pq.question || pq.questionText) === q.question);
                            return (
                              <div key={q.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-3 shadow-2xs hover:border-orange-200">
                                <div className="text-xs text-slate-800 font-semibold line-clamp-1 flex-1">
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
                          })
                      )}
                    </div>
                  </div>

                  {/* Selected Questions List */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>৮. প্রশ্নপত্রে যুক্ত প্রশ্নসমূহ ({paperQuestions.length} টি):</span>
                    </h4>

                    {paperLoadingQuestions ? (
                      <div className="p-6 border-2 border-dashed border-purple-200 bg-purple-50/50 rounded-2xl text-center text-xs font-bold text-purple-700 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                        <span>সংরক্ষিত প্রশ্নসমূহ লোড করা হচ্ছে...</span>
                      </div>
                    ) : paperQuestions.length === 0 ? (
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#FF6A00]" />
                    <span>পাবলিশকৃত প্রশ্ন পত্রসমূহের তালিকা ({examPapers.length} টি)</span>
                  </h3>

                  {/* Display Limit Selector: 10 / 20 / 30 / 40 / 50 */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-500 px-2">দেখান:</span>
                    {[10, 20, 30, 40, 50].map((limit) => (
                      <button
                        key={limit}
                        type="button"
                        onClick={() => setExamPaperDisplayLimit(limit)}
                        className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          examPaperDisplayLimit === limit
                            ? "bg-[#FF6A00] text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        {limit}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const sortedAdminPapers = sortExamPapersForDisplay(examPapers);
                    const visibleAdminPapers = sortedAdminPapers.slice(0, examPaperDisplayLimit);

                    return visibleAdminPapers.map((paper) => {
                      // Dynamically calculate actual status based on start/end date-time unless explicitly set to Archive
                      const computedStatus = paper.status === "Archive" || (paper.status as string).toLowerCase() === "archived"
                        ? "Archive"
                        : getExamStatus(paper);

                      return (
                        <div 
                          key={paper.id}
                          onClick={() => handleViewExamPaperDetails(paper)}
                          className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-200 transition-all cursor-pointer group"
                        >
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                computedStatus === "Live" 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold animate-pulse" 
                                  : computedStatus === "Upcoming"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200 font-extrabold"
                                  : "bg-slate-100 text-slate-600 border border-slate-200 font-bold"
                              }`}>
                                {computedStatus === "Live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>}
                                {computedStatus}
                              </span>
                              <span className="text-[10px] font-extrabold text-[#FF6A00] bg-orange-50 px-2 py-0.5 rounded uppercase">
                                {paper.categoryType === "pro_feature" ? "PRO FEATURE" : paper.categoryType === "prep_hub" ? "PREP HUB" : "OUR COURSE"} • {(COURSES.find(c => c.id === paper.course)?.name || paper.course).toUpperCase()} • {paper.examType.toUpperCase()}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-[#FF6A00] transition-colors">
                              {paper.title}
                            </h4>

                            <div className="text-[11px] font-bold text-slate-500 flex flex-wrap items-center gap-3 pt-0.5">
                              <span>প্রশ্ন: {paper.questionCount} টি</span>
                              <span>সময়: {Math.floor(paper.totalDurationSeconds / 60)} মিনিট</span>
                              <span>তারিখ: {paper.examDate}</span>
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewExamPaperDetails(paper);
                                }}
                                className="text-[10px] font-bold text-slate-400 underline group-hover:text-orange-500 cursor-pointer"
                              >
                                🔍 বিস্তারিত দেখতে ক্লিক করুন
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleArchiveExamPaper(paper); }}
                              className={`px-3 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                                computedStatus === "Archive"
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                              }`}
                              title={computedStatus === "Archive" ? "লাইভ করুন" : "আর্কাইভ করুন"}
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>{computedStatus === "Archive" ? "লাইভ করুন" : "আর্কাইভ"}</span>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditExamPaper(paper); }}
                              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>এডিট</span>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteExamPaper(paper.id); }}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                              title="ডিলেট করুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    });
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
              
              {/* User Management Card */}
              <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">
                      নিবন্ধিত শিক্ষার্থীদের তালিকা (User Directory)
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      স্টুডেন্ট আইডি, নাম, ইমেইল ও মোবাইল নম্বর দিয়ে খুঁজুন এবং স্ট্যাটাস ম্যানেজ করুন
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                      মোট: {users.length}
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1 rounded-full">
                      সক্রিয়: {users.filter(u => u.status === "Active").length}
                    </span>
                    <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80 px-3 py-1 rounded-full">
                      নিষিদ্ধ: {users.filter(u => u.status === "Banned").length}
                    </span>
                    <button
                      onClick={() => setShowSqlModal(!showSqlModal)}
                      className="text-[10px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/80 px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1"
                    >
                      <DbIcon className="w-3 h-3" />
                      <span>Supabase SQL কোড</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Search Input & Autocomplete Suggestions Bar */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-100 relative">
                  <div className="relative max-w-lg">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setShowSearchSuggestions(true);
                      }}
                      onFocus={() => setShowSearchSuggestions(true)}
                      placeholder="ইমেইল, মোবাইল নম্বর, স্টুডেন্ট আইডি বা নাম লিখে সার্চ করুন..."
                      className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => {
                          setUserSearchQuery("");
                          setShowSearchSuggestions(false);
                        }}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Live Suggestion Popover Dropdown */}
                    {showSearchSuggestions && userSearchQuery.trim() !== "" && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100 animate-fade-in">
                        <div className="p-2 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 flex items-center justify-between">
                          <span>সার্চ সাজেশন (Matching Users)</span>
                          <span className="text-[9px] text-[#FF6A00] font-bold">
                            {users.filter(u => 
                              u.email.toLowerCase().includes(userSearchQuery.toLowerCase().trim()) ||
                              (u.full_name && u.full_name.toLowerCase().includes(userSearchQuery.toLowerCase().trim())) ||
                              (u.phone_number && u.phone_number.includes(userSearchQuery.trim())) ||
                              (u.student_id && u.student_id.toLowerCase().includes(userSearchQuery.toLowerCase().trim()))
                            ).length} রেজাল্ট পাওয়া গেছে
                          </span>
                        </div>
                        {users
                          .filter(u => 
                            u.email.toLowerCase().includes(userSearchQuery.toLowerCase().trim()) ||
                            (u.full_name && u.full_name.toLowerCase().includes(userSearchQuery.toLowerCase().trim())) ||
                            (u.phone_number && u.phone_number.includes(userSearchQuery.trim())) ||
                            (u.student_id && u.student_id.toLowerCase().includes(userSearchQuery.toLowerCase().trim()))
                          )
                          .slice(0, 5)
                          .map((sug) => (
                            <div
                              key={sug.id}
                              onClick={() => {
                                setUserSearchQuery(sug.student_id || sug.email || sug.full_name || "");
                                setShowSearchSuggestions(false);
                              }}
                              className="p-3 hover:bg-orange-50/80 transition-colors cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-800 group-hover:text-[#FF6A00] truncate">
                                    {sug.full_name || "শিক্ষার্থী"}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {sug.student_id || `JM-${sug.id.substring(0,6)}`}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                                  ✉ {sug.email} {sug.phone_number ? `• 📱 ${sug.phone_number}` : ""}
                                </span>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                                sug.status === "Active" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {sug.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100">
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-36 whitespace-nowrap">স্টুডেন্ট ID</th>
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">ইউজারের নাম ও ইমেইল</th>
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-32">মোবাইল নম্বর</th>
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28 text-center">ভূমিকা</th>
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-28 text-center">স্ট্যাটাস</th>
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-44">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const q = userSearchQuery.toLowerCase().trim();
                        const list = users.filter((u) => {
                          if (!q) return true;
                          return (
                            u.email.toLowerCase().includes(q) ||
                            (u.full_name && u.full_name.toLowerCase().includes(q)) ||
                            (u.phone_number && u.phone_number.includes(q)) ||
                            (u.student_id && u.student_id.toLowerCase().includes(q)) ||
                            u.id.toLowerCase().includes(q)
                          );
                        });

                        if (list.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-xs font-bold text-slate-400">
                                🔍 কোনো ইউজার পাওয়া যায়নি। অন্য কিছু লিখে খুঁজুন।
                              </td>
                            </tr>
                          );
                        }

                        return list.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/40 transition-all">
                            <td className="p-3.5 text-xs font-mono font-bold text-slate-700 text-center whitespace-nowrap">
                              <span className="inline-block bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80 whitespace-nowrap shadow-2xs">
                                {user.student_id || `JM-${user.id.substring(0, 6)}`}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex flex-col">
                                <span className="text-xs sm:text-sm font-black text-slate-800">
                                  {user.full_name || "অজ্ঞাত শিক্ষার্থী"}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {user.email}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 text-xs font-semibold text-slate-700">
                              {user.phone_number || "—"}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200/60 inline-block">
                                {user.role || "Student"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block border ${
                                user.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {user.status === "Active" ? "সক্রিয় (Active)" : "নিষিদ্ধ (Banned)"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => toggleUserStatus(user.id)}
                                  className={`text-[10px] font-black px-3 py-1.5 rounded-xl transition-all active:scale-95 border cursor-pointer ${
                                    user.status === "Active"
                                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200/80"
                                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200/80"
                                  }`}
                                >
                                  {user.status === "Active" ? "Ban Account" : "Activate"}
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-slate-200/60"
                                  title="ইউজার ডিলিট করুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supabase SQL instructions Card / Drawer */}
              {showSqlModal && (
                <div className="bg-slate-900 text-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-xl space-y-4 border border-slate-800 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <DbIcon className="w-5 h-5 text-amber-400" />
                      <h4 className="font-extrabold text-sm text-white">
                        Supabase Database Setup Script (SQL Editor Code)
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowSqlModal(false)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300">
                    Supabase এর SQL Editor এ নিচের কোডটি হুবহু কপি করে Run চাপুন। এতে <code className="text-amber-300">profiles</code> টেবিল, অটো-ইউজার ট্রিগার ও ইনডেক্স তৈরি হয়ে যাবে:
                  </p>

                  <div className="bg-black/60 p-4 rounded-xl font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto border border-slate-800 selection:bg-amber-400 selection:text-black">
                    <pre>{`-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  student_id TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Student',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS or permissions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access" ON public.profiles FOR ALL USING (true);

-- 3. Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, student_id, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'student_id', CONCAT('JM-', FLOOR(100000 + RANDOM() * 900000)::TEXT)),
    'Student',
    'Active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Search Indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);`}</pre>
                  </div>
                </div>
              )}

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
                      placeholder="যেমন: \uD83D\uDD25 বিসিএস মেগা কোর্স ২০% ছাড়!"
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
                        placeholder="যেমন: ৬ মাসের ফুল অ্যাপ এক্সেস \uD83C\uDF1F"
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
                        <option value="BookOpen">{"\uD83D\uDCD6"} BookOpen (Open Book)</option>
                        <option value="Book">{"\uD83D\uDCD8"} Book (Closed Book)</option>
                        <option value="Laptop">{"\uD83D\uDCBB"} Laptop (Computer)</option>
                        <option value="Monitor">{"\uD83D\uDDA5"}️ Monitor (Computer)</option>
                        <option value="FlaskConical">{"\uD83E\uDDEA"} Flask (Science)</option>
                        <option value="Atom">⚛️ Atom (Science)</option>
                        <option value="Calculator">{"\uD83E\uDDEE"} Calculator</option>
                        <option value="Globe">{"\uD83C\uDF10"} Globe</option>
                        <option value="GraduationCap">{"\uD83C\uDF93"} GraduationCap</option>
                        <option value="FileText">{"\uD83D\uDCC4"} FileText</option>
                        <option value="Briefcase">{"\uD83D\uDCBC"} Briefcase</option>
                        <option value="Users">{"\uD83D\uDC65"} Users</option>
                        <option value="Shield">{"\uD83D\uDEE1"}️ Shield</option>
                        <option value="Zap">⚡ Zap</option>
                        <option value="Award">{"\uD83C\uDFC6"} Award</option>
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
                                      const updated = JSON.parse(JSON.stringify(courseFormSubSubjects));
                                      if (!updated[sIdx].subCategories2) updated[sIdx].subCategories2 = [];
                                      updated[sIdx].subCategories2.push({
                                        id: `sub2_${Date.now()}`,
                                        name: "নতুন সাব-টপিক",
                                        serial: updated[sIdx].subCategories2.length + 1
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
                                        const updated = JSON.parse(JSON.stringify(courseFormSubSubjects));
                                        if (updated[sIdx]?.subCategories2?.[sub2Idx]) {
                                          updated[sIdx].subCategories2[sub2Idx].name = e.target.value;
                                          setCourseFormSubSubjects(updated);
                                        }
                                      }}
                                      className="flex-1 bg-white border border-slate-200 focus:border-[#FF6A00] rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = JSON.parse(JSON.stringify(courseFormSubSubjects));
                                        if (updated[sIdx]?.subCategories2) {
                                          updated[sIdx].subCategories2 = updated[sIdx].subCategories2.filter((_: any, i: number) => i !== sub2Idx);
                                          setCourseFormSubSubjects(updated);
                                        }
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
                          <option value="BookOpen">{"\uD83D\uDCD6"} BookOpen (Open Book)</option>
                          <option value="Book">{"\uD83D\uDCD8"} Book (Closed Book)</option>
                          <option value="Laptop">{"\uD83D\uDCBB"} Laptop (Computer)</option>
                          <option value="Monitor">{"\uD83D\uDDA5"}️ Monitor (Computer)</option>
                          <option value="FlaskConical">{"\uD83E\uDDEA"} Flask (Science)</option>
                          <option value="Atom">⚛️ Atom (Science)</option>
                          <option value="Calculator">{"\uD83E\uDDEE"} Calculator</option>
                          <option value="Globe">{"\uD83C\uDF10"} Globe</option>
                          <option value="GraduationCap">{"\uD83C\uDF93"} GraduationCap</option>
                          <option value="FileText">{"\uD83D\uDCC4"} FileText</option>
                          <option value="Briefcase">{"\uD83D\uDCBC"} Briefcase</option>
                          <option value="Users">{"\uD83D\uDC65"} Users</option>
                          <option value="ShieldCheck">{"\uD83D\uDEE1"}️ Shield</option>
                          <option value="Zap">⚡ Zap</option>
                          <option value="Award">{"\uD83C\uDFC6"} Award</option>
                          <option value="Flame">{"\uD83D\uDD25"} Flame</option>
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
                                  <span>{"\uD83C\uDFF7"}️ সাব-ক্যাটাগরি ২ / টপিকসমূহ (Level 3 Topics):</span>
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
                                          const updated = JSON.parse(JSON.stringify(prepFormSubSubjects));
                                          if (updated[sIdx]?.subCategories2) {
                                            updated[sIdx].subCategories2 = updated[sIdx].subCategories2.filter((_: any, i: number) => i !== sub2Idx);
                                            setPrepFormSubSubjects(updated);
                                          }
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
                                          const updated = JSON.parse(JSON.stringify(prepFormSubSubjects));
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
                                        const updated = JSON.parse(JSON.stringify(prepFormSubSubjects));
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
          {/* VIEW: PRO SECTION MANAGEMENT                               */}
          {/* ========================================================= */}
          {activeTab === "pro_section" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in text-left">
              {/* Left Column: Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                      <span>{editingProId ? "প্রো সেকশন আইটেম এডিট করুন" : "নতুন প্রো সেকশন আইটেম যোগ করুন"}</span>
                    </h3>
                    {editingProId && (
                      <button
                        type="button"
                        onClick={handleCancelProEdit}
                        className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg hover:bg-rose-100 cursor-pointer"
                      >
                        বাতিল করুন
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSavePro} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">সিরিয়াল নম্বর</label>
                        <input
                          type="number"
                          value={proFormSerial}
                          onChange={(e) => setProFormSerial(parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">আইডি (Unique ID)</label>
                        <input
                          type="text"
                          placeholder="e.g. pro_bcs"
                          value={proFormId}
                          onChange={(e) => setProFormId(e.target.value)}
                          disabled={!!editingProId}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">শিরোনাম/নাম (Name)</label>
                      <input
                        type="text"
                        placeholder="e.g. বিসিএস প্রিলি বিশেষ"
                        value={proFormName}
                        onChange={(e) => setProFormName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">সাবটাইটেল (Subtitle)</label>
                      <input
                        type="text"
                        placeholder="e.g. প্রিলিমিনারি প্রিপারেশন"
                        value={proFormSub}
                        onChange={(e) => setProFormSub(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">আইকন নাম (Lucide Icon)</label>
                        <select
                          value={proFormIcon}
                          onChange={(e) => setProFormIcon(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          {["Briefcase", "Sparkles", "Zap", "Award", "Video", "PlayCircle", "Tv", "Film", "BookOpen", "Globe", "GraduationCap", "FileText", "ShieldCheck", "HelpCircle"].map(ic => (
                            <option key={ic} value={ic}>{ic}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase block pl-1">ব্যাকগ্রাউন্ড কালার Class</label>
                        <select
                          value={proFormBg}
                          onChange={(e) => setProFormBg(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value="bg-purple-50">bg-purple-50 (Purple)</option>
                          <option value="bg-orange-50">bg-orange-50 (Orange)</option>
                          <option value="bg-blue-50">bg-blue-50 (Blue)</option>
                          <option value="bg-rose-50">bg-rose-50 (Rose)</option>
                          <option value="bg-emerald-50">bg-emerald-50 (Emerald)</option>
                          <option value="bg-amber-50">bg-amber-50 (Amber)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs font-extrabold text-slate-700">স্ট্যাটাস (Active / Inactive)</span>
                      <button
                        type="button"
                        onClick={() => setProFormActive(!proFormActive)}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                          proFormActive ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {proFormActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-3 rounded-2xl transition-all cursor-pointer shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5px]" />
                      <span>{editingProId ? "সংরক্ষণ করুন" : "নতুন আইটেম যোগ করুন"}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-600" />
                      <span>বিদ্যমান প্রো সেকশন তালিকা ({proSectionList.length} টি)</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {proSectionList.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
                            <button
                              onClick={() => handleMoveProSerial(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 hover:bg-white text-slate-600 disabled:opacity-30 rounded-lg cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-black text-slate-700">#{item.serial || idx + 1}</span>
                            <button
                              onClick={() => handleMoveProSerial(idx, "down")}
                              disabled={idx === proSectionList.length - 1}
                              className="p-1 hover:bg-white text-slate-600 disabled:opacity-30 rounded-lg cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className={`w-9 h-9 ${item.bg || "bg-purple-50"} rounded-xl flex items-center justify-center ${item.text || "text-purple-600"} shrink-0`}>
                            {renderPrepIcon(item.icon, "w-4 h-4 stroke-[2.2px]")}
                          </div>

                          <div className="flex flex-col min-w-0 text-left">
                            <span className="font-extrabold text-xs text-slate-900 truncate">{item.name}</span>
                            {item.sub && <span className="text-[10px] font-bold text-slate-400 truncate">{item.sub}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditPro(item)}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>এডিট</span>
                          </button>
                          <button
                            onClick={() => handleDeletePro(item.id, item.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
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
                        <span>১. আওয়ার কোর্স (Our Courses)</span>
                      </h4>
                      <span className="text-xs font-black bg-orange-100 text-[#FF6A00] px-2.5 py-1 rounded-full">
                        {appSettings.ourCoursesHomeLimit || 5} টি কোর্স
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      ইউজার হোম স্ক্রিনের &quot;Our Courses&quot; গ্রিডে কয়টি সাবজেক্ট/কোর্স শো করবে সিলেক্ট করুন (১ - ১২ টি):
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
                      {"\uD83D\uDCA1"} তথ্য: বর্তমানে হোমে {appSettings.ourCoursesHomeLimit || 5} টি কোর্স কার্ড + ১ টি কমলা রঙের &apos;সকল কোর্স&apos; বাটন প্রদর্শিত হবে।
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
                      {"\uD83D\uDCA1"} তথ্য: বর্তমানে হোমে {appSettings.prepHubHomeLimit || 4} টি সাবজেক্ট কার্ড প্রদর্শিত হবে।
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

          {/* TAB 9: LEADERBOARD MANAGEMENT */}
          {activeTab === "leaderboard" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-[#FF6A00]" />
                      <span>কুইজ লিডারবোর্ড ও ইউজার র‍্যাঙ্কিং ম্যানেজমেন্ট (Leaderboard)</span>
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      এখানে লাইভ কুইজ গেমের টপ ইউজারের পয়েন্ট তালিকা দেখা যাবে এবং এডমিন যে কারো পয়েন্ট পরিবর্তন করতে পারবে।
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      const users = await fetchLeaderboard();
                      setAdminLeaderboardUsers(users);
                      triggerNotification("success", "লিডারবোর্ড তথ্য রিফ্রেশ করা হয়েছে।");
                    }}
                    className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>রিফ্রেশ (Refresh)</span>
                  </button>
                </div>

                {/* Search Filter */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ইউজার নাম বা স্টুডেন্ট আইডি খুঁজুন..."
                    value={leaderboardSearchQuery}
                    onChange={(e) => setLeaderboardSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase border-b border-slate-100">
                        <th className="p-3.5">র‍্যাঙ্ক ও ইউজার</th>
                        <th className="p-3.5">স্টুডেন্ট আইডি</th>
                        <th className="p-3.5">Today Score</th>
                        <th className="p-3.5">Week Score</th>
                        <th className="p-3.5">Month Score</th>
                        <th className="p-3.5">All Time Score</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                      {adminLeaderboardUsers
                        .filter(
                          (u) =>
                            u.name.toLowerCase().includes(leaderboardSearchQuery.toLowerCase()) ||
                            u.student_id?.toLowerCase().includes(leaderboardSearchQuery.toLowerCase())
                        )
                        .map((user, idx) => (
                          <tr key={user.id || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 flex items-center gap-3">
                              <span className="w-6 text-center font-black text-slate-400">{idx + 1}</span>
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                <img
                                  src={
                                    user.avatar_url ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f1f5f9&color=475569`
                                  }
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-extrabold text-slate-900">{user.name}</span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-500">{user.student_id || "—"}</td>
                            <td className="p-3.5 font-black text-emerald-600">{user.today_score || 0} pt</td>
                            <td className="p-3.5 font-black text-blue-600">{user.week_score || 0} pt</td>
                            <td className="p-3.5 font-black text-purple-600">{user.month_score || 0} pt</td>
                            <td className="p-3.5 font-black text-[#FF6A00]">{user.all_time_score || 0} pt</td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setEditingLeaderboardUser(user);
                                  setEditUserName(user.name);
                                  setEditTodayScore(user.today_score || 0);
                                  setEditWeekScore(user.week_score || 0);
                                  setEditMonthScore(user.month_score || 0);
                                  setEditAllTimeScore(user.all_time_score || 0);
                                }}
                                className="bg-orange-50 hover:bg-orange-100 text-[#FF6A00] font-black px-3.5 py-1.5 rounded-xl border border-orange-200/60 cursor-pointer transition-all inline-flex items-center gap-1.5"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>স্কোর মডিফাই</span>
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

          {/* TAB 10: STAFF & RBAC MANAGEMENT */}
          {activeTab === "staff" && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Header & Quick Stats */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        RBAC Security
                      </span>
                      <span className="text-[11px] font-black text-slate-400">
                        মোট {adminStaffList.length} জন কর্মী
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      <span>স্টাফ ও রোল-বেসড এক্সেস কন্ট্রোল (Staff & RBAC Directory)</span>
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      অ্যাডমিন, সুপারভাইজার ও এডিটরদের এক্সেস ম্যানেজমেন্ট, রোল অনুমোদন ও পারমিশন কন্ট্রোল করুন।
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={async () => {
                        const fresh = await fetchAdminStaffFromDb(true);
                        setAdminStaffList(fresh);
                        triggerNotification("success", "স্টাফ তালিকা রিলোড করা হয়েছে!");
                      }}
                      className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-purple-600" />
                      <span>রিফ্রেশ (Sync DB)</span>
                    </button>

                    <button
                      onClick={() => setNewStaffModalOpen(true)}
                      className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all shadow-md shadow-purple-500/20 active:scale-95"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ নতুন স্টাফ যোগ করুন</span>
                    </button>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-purple-800 uppercase block">প্রধান অ্যাডমিন</span>
                      <span className="text-base font-black text-purple-950">
                        {adminStaffList.filter(s => s.role === "admin").length} জন
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                      <UserCog className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-blue-800 uppercase block">সুপারভাইজার</span>
                      <span className="text-base font-black text-blue-950">
                        {adminStaffList.filter(s => s.role === "supervisor").length} জন
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">এডিটর</span>
                      <span className="text-base font-black text-emerald-950">
                        {adminStaffList.filter(s => s.role === "editor").length} জন
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase block">পেন্ডিং আবেদন</span>
                      <span className="text-base font-black text-amber-950">
                        {adminStaffList.filter(s => s.status === "pending").length} টি
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pending Requests Banner (if any) */}
                {adminStaffList.some(s => s.status === "pending") && (
                  <div className="p-4 sm:p-5 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                      <h4 className="font-extrabold text-xs sm:text-sm text-amber-900">
                        অপেক্ষমাণ এক্সেস আবেদন ({adminStaffList.filter(s => s.status === "pending").length} টি)
                      </h4>
                    </div>
                    <div className="divide-y divide-amber-200/70">
                      {adminStaffList.filter(s => s.status === "pending").map((pending) => (
                        <div key={pending.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-slate-900">{pending.name}</span>
                              <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                                কাঙ্ক্ষিত রোল: {getRoleLabelBangla(pending.role)}
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-3 flex-wrap">
                              <span>✉ {pending.email}</span>
                              {pending.phone && <span>☎ {pending.phone}</span>}
                              <span>আবেদনের সময়: {formatDisplayDate(pending.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleApproveStaff(pending.id, "editor")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>এডিটর হিসেবে অনুমোদন</span>
                            </button>
                            <button
                              onClick={() => handleApproveStaff(pending.id, "supervisor")}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>সুপারভাইজার অনুমোদন</span>
                            </button>
                            <button
                              onClick={() => handleApproveStaff(pending.id, "admin")}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>অ্যাডমিন অনুমোদন</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(pending.id)}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={staffRoleFilter}
                      onChange={(e) => setStaffRoleFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">সকল রোল (All Roles)</option>
                      <option value="admin">প্রধান এডমিন (Admin)</option>
                      <option value="supervisor">সুপারভাইজার (Supervisor)</option>
                      <option value="editor">এডিটর (Editor)</option>
                    </select>

                    <select
                      value={staffStatusFilter}
                      onChange={(e) => setStaffStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">সকল স্ট্যাটাস (All Status)</option>
                      <option value="active">সক্রিয় (Active)</option>
                      <option value="pending">পেন্ডিং (Pending)</option>
                      <option value="suspended">স্থগিত (Suspended)</option>
                    </select>
                  </div>
                </div>

                {/* Staff Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase border-b border-slate-100">
                        <th className="p-3.5">স্টাফ মেম্বার</th>
                        <th className="p-3.5">যোগাযোগ</th>
                        <th className="p-3.5">রোল / পদবী</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5">অনুমতি ও এক্সেস</th>
                        <th className="p-3.5">লাস্ট লগইন</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                      {adminStaffList
                        .filter((staff) => {
                          const q = staffSearchQuery.toLowerCase();
                          const matchSearch =
                            !q ||
                            staff.name.toLowerCase().includes(q) ||
                            staff.email.toLowerCase().includes(q) ||
                            (staff.phone && staff.phone.includes(q));
                          const matchRole = staffRoleFilter === "all" || staff.role === staffRoleFilter;
                          const matchStatus = staffStatusFilter === "all" || staff.status === staffStatusFilter;
                          return matchSearch && matchRole && matchStatus;
                        })
                        .map((staff, idx) => {
                          const isMaster =
                            staff.isPrimaryMaster ||
                            staff.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
                          const statusMeta = getStatusLabelBangla(staff.status);

                          return (
                            <tr key={staff.id || idx} className="hover:bg-slate-50/80 transition-colors">
                              {/* Member Info */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center font-black text-xs shrink-0">
                                    {staff.name ? staff.name.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-slate-900">{staff.name}</span>
                                      {isMaster && (
                                        <span className="text-[9px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                          Master
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 block font-mono">
                                      {staff.email}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Phone / Contact */}
                              <td className="p-3.5 font-mono text-slate-600">
                                {staff.phone || "—"}
                              </td>

                              {/* Role Selector */}
                              <td className="p-3.5">
                                {isMaster ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-xl">
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                                    <span>প্রধান অ্যাডমিন</span>
                                  </span>
                                ) : (
                                  <select
                                    value={staff.role}
                                    onChange={(e) => handleUpdateStaffRole(staff.id, e.target.value as AdminRole)}
                                    className={`text-[11px] font-black px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                                      staff.role === "admin"
                                        ? "bg-purple-50 text-purple-900 border-purple-200"
                                        : staff.role === "supervisor"
                                        ? "bg-blue-50 text-blue-900 border-blue-200"
                                        : "bg-emerald-50 text-emerald-900 border-emerald-200"
                                    }`}
                                  >
                                    <option value="editor">এডিটর (Editor)</option>
                                    <option value="supervisor">সুপারভাইজার (Supervisor)</option>
                                    <option value="admin">প্রধান এডমিন (Admin)</option>
                                  </select>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="p-3.5">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.textCol}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    staff.status === "active" ? "bg-emerald-500" : staff.status === "pending" ? "bg-amber-500" : "bg-rose-500"
                                  }`}></span>
                                  <span>{statusMeta.text}</span>
                                </span>
                              </td>

                              {/* Permissions summary */}
                              <td className="p-3.5 text-[11px]">
                                {staff.role === "admin" ? (
                                  <span className="text-purple-700 font-extrabold">পূর্ণ ক্ষমতা (Full Control)</span>
                                ) : staff.role === "supervisor" ? (
                                  <span className="text-blue-700 font-extrabold">প্রশ্ন, ইউজার, অফার ও কোর্স</span>
                                ) : (
                                  <span className="text-emerald-700 font-extrabold">শুধুমাত্র প্রশ্ন তৈরি ও এডিট</span>
                                )}
                              </td>

                              {/* Last Login / Joined */}
                              <td className="p-3.5 text-[11px] text-slate-500 font-medium">
                                {staff.lastLoginAt ? formatDisplayDate(staff.lastLoginAt) : "লগইন হয়নি"}
                              </td>

                              {/* Actions */}
                              <td className="p-3.5 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {!isMaster && (
                                    <>
                                      <button
                                        onClick={() => handleToggleStaffStatus(staff.id)}
                                        title={staff.status === "active" ? "সাসপেন্ড করুন" : "সক্রিয় করুন"}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                                          staff.status === "active"
                                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                        }`}
                                      >
                                        {staff.status === "active" ? "সাসপেন্ড" : "সক্রিয় করুন"}
                                      </button>

                                      <button
                                        onClick={() => handleDeleteStaff(staff.id)}
                                        title="অ্যাকাউন্ট ডিলিট করুন"
                                        className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                  {isMaster && (
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                      রক্ষিত (Protected)
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Role Matrix Helper Cards */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>রোল ও পারমিশন গাইডলাইন (RBAC Access Levels)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-1">
                      <span className="font-black text-purple-800 block">১. প্রধান অ্যাডমিন (Super Admin)</span>
                      <p className="text-[11px] text-slate-600 font-medium">
                        সকল ফিচারে পূর্ণ নিয়ন্ত্রণ: প্রশ্ন তৈরি/এডিট, ইউজার ব্যান/আনব্যান, অফার, প্যাকেজ, কোর্স, সুইচ সেটিংস এবং নতুন স্টাফ যোগ ও রোল পরিবর্তন।
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1">
                      <span className="font-black text-blue-800 block">২. সুপারভাইজার (Supervisor)</span>
                      <p className="text-[11px] text-slate-600 font-medium">
                        প্রশ্নপত্র তৈরি, প্রশ্ন এডিট, ইউজার পরিচালনা, ব্যানার-অফার, প্যাকেজ ও কোর্স ম্যানেজ করতে পারবেন। স্টাফ পরিবর্তন করতে পারবেন না।
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-1">
                      <span className="font-black text-emerald-800 block">৩. এডিটর (Editor)</span>
                      <p className="text-[11px] text-slate-600 font-medium">
                        শুধুমাত্র প্রশ্ন ব্যাংকে নতুন প্রশ্ন যুক্ত করা এবং বিদ্যমান প্রশ্ন এডিট করার ক্ষমতা পাবেন। অন্যান্য স্পর্শকাতর মেনু দেখতে পাবেন না।
                      </p>
                    </div>
                  </div>
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
                        {"\uD83D\uDCD0"} লাইভ গাণিতিক সংকেত প্রাকদর্শন (Live Math Preview):
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



        {/* VIEW FULL EXAM PAPER MODAL */}
        {viewingExamPaper && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-[2rem] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
              
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-[#1A0B2E] text-white flex items-center justify-between shrink-0">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black bg-[#FF6A00] text-white px-2.5 py-0.5 rounded-full uppercase">
                      {(COURSES.find(c => c.id === viewingExamPaper.course)?.name || viewingExamPaper.course).toUpperCase()}
                    </span>
                    <span className="text-[10px] font-extrabold bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full uppercase">
                      {viewingExamPaper.examType}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white">{viewingExamPaper.title}</h2>
                  {viewingExamPaper.topic && <p className="text-xs text-purple-200 font-medium">টপিক: {viewingExamPaper.topic}</p>}
                </div>

                <button
                  onClick={() => setViewingExamPaper(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer shrink-0"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Exam Info Metadata Bar */}
              <div className="bg-purple-50/70 border-b border-purple-100 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">মোট সময়</span>
                  <span className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    {Math.floor(viewingExamPaper.totalDurationSeconds / 60)} মিনিট
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">মোট প্রশ্ন</span>
                  <span className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                    {viewingExamPaper.questionCount || (viewingExamPaper.questions || []).length} টি
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">মোট মার্কস</span>
                  <span className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    {viewingExamPaper.totalMarks || viewingExamPaper.questionCount}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">তৈরির তারিখ</span>
                  <span className="text-xs sm:text-sm font-black text-purple-900 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    {viewingExamPaper.examDate}
                  </span>
                </div>
              </div>

              {/* Questions List with Correct Answers Highlighted in Green */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {!viewingExamPaper.questions ? (
                  <div className="py-12 text-center text-purple-600 font-bold flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                    <span>প্রশ্নপত্র লোড করা হচ্ছে...</span>
                  </div>
                ) : viewingExamPaper.questions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-bold">
                    এই প্রশ্নপত্রে কোনো প্রশ্ন সংরক্ষিত নেই।
                  </div>
                ) : (
                  viewingExamPaper.questions.map((q, qIndex) => {
                    const normQ = normalizeQuestion(q);
                    return (
                      <div key={q.id || qIndex} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1A0B2E] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                            {qIndex + 1}
                          </span>
                          <div className="space-y-1 flex-1">
                            <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                              {normQ.questionText || normQ.question}
                            </h4>
                            {normQ.subjectName && (
                              <span className="inline-block text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                {normQ.subjectName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                          {normQ.options.map((opt, optIndex) => {
                            const rawQ = q as any;
                            const isCorrect = optIndex === normQ.correctOptionIndex || optIndex === rawQ?.correctIndex || optIndex === rawQ?.correctOptionIndex || opt === rawQ?.correctAnswer || optIndex.toString() === rawQ?.correctAnswer;
                            return (
                              <div
                                key={optIndex}
                                className={`p-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-between ${
                                  isCorrect
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs font-black"
                                    : "bg-white border-slate-200 text-slate-700 opacity-80"
                                }`}
                              >
                                <span>{String.fromCharCode(65 + optIndex)}. {opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Check className="w-3 h-3" /> সঠিক উত্তর
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {normQ.explanation && (
                          <div className="ml-8 mt-2 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950 space-y-1">
                            <span className="font-extrabold text-amber-800 block">ব্যাখ্যা:</span>
                            <p className="leading-relaxed font-medium">{normQ.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  মোট {viewingExamPaper.questions?.length || 0} টি প্রশ্ন প্রদর্শিত হচ্ছে
                </span>
                <button
                  onClick={() => setViewingExamPaper(null)}
                  className="bg-slate-900 hover:bg-black text-white font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  বন্ধ করুন (Close)
                </button>
              </div>

            </div>
          </div>
        )}

        {/* EDIT LEADERBOARD USER SCORE MODAL */}
        {editingLeaderboardUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xl max-w-md w-full space-y-5 relative animate-fade-in">
              <button
                onClick={() => setEditingLeaderboardUser(null)}
                className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-500 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-orange-50 text-[#FF6A00] rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                    ইউজার কুইজ স্কোর মডিফাই করুন
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">
                    ID: {editingLeaderboardUser.student_id || editingLeaderboardUser.id}
                  </p>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const updatedUsers = await adminUpdateLeaderboardUser({
                    userId: editingLeaderboardUser.id,
                    name: editUserName,
                    today_score: editTodayScore,
                    week_score: editWeekScore,
                    month_score: editMonthScore,
                    all_time_score: editAllTimeScore
                  });
                  setAdminLeaderboardUsers(updatedUsers);
                  setEditingLeaderboardUser(null);
                  triggerNotification("success", "ইউজারের কুইজ স্কোর সফলভাবে সার্ভারে আপডেট করা হয়েছে!");
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                    ইউজার নাম (Name)
                  </label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                      Today Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editTodayScore}
                      onChange={(e) => setEditTodayScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                      Week Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editWeekScore}
                      onChange={(e) => setEditWeekScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                      Month Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editMonthScore}
                      onChange={(e) => setEditMonthScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                      All Time Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editAllTimeScore}
                      onChange={(e) => setEditAllTimeScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLeaderboardUser(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="bg-[#FF6A00] hover:bg-orange-600 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                  >
                    স্কোর সেভ করুন (Save Changes)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DIRECT ADD NEW STAFF MODAL */}
        {newStaffModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-2xl max-w-md w-full space-y-5 relative animate-fade-in text-left">
              <button
                onClick={() => setNewStaffModalOpen(false)}
                className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-500 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                    নতুন স্টাফ মেম্বার যোগ করুন
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">
                    সরাসরি সক্রিয় একাউন্ট তৈরি করে ভূমিকা বরাদ্দ করুন
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddNewStaffDirect} className="space-y-4">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                    পুরো নাম (Full Name)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: মোঃ কামরুল ইসলাম"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                    ইমেইল এড্রেস (Email)
                  </label>
                  <input
                    type="email"
                    placeholder="staff@example.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                    মোবাইল নম্বর (Phone - ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    placeholder="017xxxxxxxx"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                    পাসওয়ার্ড সেট করুন (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewStaffPassword ? "text" : "password"}
                      placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড..."
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title={showNewStaffPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                    >
                      {showNewStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase block mb-1">
                    রোল / পদবী নির্ধারণ করুন
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as AdminRole)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="editor">এডিটর (Editor - শুধুমাত্র প্রশ্ন তৈরি ও এডিট)</option>
                    <option value="supervisor">সুপারভাইজার (Supervisor - প্রশ্ন, অফার, প্যাকেজ, ইউজার)</option>
                    <option value="admin">প্রধান এডমিন (Super Admin - সম্পূর্ণ ক্ষমতা)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStaffModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md shadow-purple-500/20 cursor-pointer transition-all active:scale-95"
                  >
                    স্টাফ যুক্ত করুন (Add Staff)
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
