"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import MathRenderer from "@/src/components/MathRenderer";
import { 
  Play, 
  RotateCcw, 
  Check, 
  X, 
  Timer, 
  Award, 
  AlertTriangle, 
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Menu,
  Search,
  Bell,
  BookOpen,
  Calculator,
  Globe,
  GraduationCap,
  FileText,
  Briefcase,
  Users,
  Home as HomeIcon,
  Calendar,
  ClipboardList,
  CircleUser,
  Plus,
  Trash2,
  ArrowLeft,
  Volume2,
  VolumeX,
  Flame,
  Clock,
  Sparkles,
  Bookmark,
  Settings,
  LogOut,
  LogIn,
  Package,
  Download,
  ShieldCheck,
  Archive,
  Filter,
  Zap,
  LayoutGrid,
  Newspaper,
  TrendingUp,
  User,
  Lock,
  Pencil,
  Laptop,
  Monitor,
  FlaskConical,
  Atom,
  Book
} from "lucide-react";
import Link from "next/link";
import { QUIZ_QUESTIONS, Question, LIVE_QUIZ_ALLOWED_SUBJECTS } from "../data";
import { getSupabase } from "../lib/supabase";
import { fetchExamPapersFromDb, subscribeToExamPapers, ExamPaper, getExamStatus, sortExamPapersForDisplay, DEFAULT_EXAM_PAPERS, getCachedExamPapers } from "../lib/exams";
import { PackageItem, fetchPackagesFromDb, subscribeToPackages, DEFAULT_PACKAGES, getCachedPackages } from "../lib/packages";
import { CourseItem, PrepSubjectItem, getCachedCourses, getCachedPrepSubjects, fetchCoursesFromDb, fetchPrepSubjectsFromDb, subscribeToCoursesAndPrep } from "../lib/courses_and_subjects";
import { AppSettings, getCachedAppSettings, fetchAppSettingsFromDb } from "../lib/app_settings";
import { quizAudio } from "../lib/audio";
import { PwaProvider, BottomInstallBanner, InstallPwaPopup } from "../components/InstallPwaPopup";
import { recordVisit } from "../lib/visitors";

// Type definition for routine items
interface RoutineItem {
  id: string;
  title: string;
  completed: boolean;
  category: string;
}

// Type definition for Taken Test
interface TakenTest {
  id: string;
  name: string;
  score: number;
  total: number;
  time: string;
  percentage: number;
}

// Live Exam Elapsed Time Formatter
function formatLiveElapsed(startDateTime?: string, createdAt?: string): string {
  const startMs = startDateTime 
    ? new Date(startDateTime).getTime() 
    : (createdAt ? new Date(createdAt).getTime() : Date.now());
  const nowMs = Date.now();
  const diffMs = Math.max(0, nowMs - startMs);
  const totalSecs = Math.floor(diffMs / 1000);

  if (totalSecs < 86400) {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const hStr = String(hours).padStart(2, '0');
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  } else {
    const days = Math.floor(totalSecs / 86400);
    const remSecs = totalSecs % 86400;
    const hours = Math.floor(remSecs / 3600);
    const mins = Math.floor((remSecs % 3600) / 60);
    return `${days} দিন ${hours} ঘণ্টা ${mins} মিনিট`;
  }
}

// Extra mock question databases for other test subjects
const BANGLA_1ST_QUESTIONS: Question[] = [
  {
    id: 1001,
    question: "'কবর' কবিতাটি কার রচনা?",
    options: ["কাজী নজরুল ইসলাম", "রবীন্দ্রনাথ ঠাকুর", "জসীমউদ্দীন", "জীবনানন্দ দাশ"],
    correctIndex: 2
  },
  {
    id: 1002,
    question: "'গীতাঞ্জলি' কাব্যের জন্য রবীন্দ্রনাথ ঠাকুর কত সালে নোবেল পুরস্কার পান?",
    options: ["১৯১০", "১৯১৩", "১৯২১", "১৯৩০"],
    correctIndex: 1
  },
  {
    id: 1003,
    question: "'লালসালু' উপন্যাসের লেখক কে?",
    options: ["শওকত ওসমান", "সৈয়দ ওয়ালীউল্লাহ", "মানিক বন্দ্যোপাধ্যায়", "তারাশঙ্কর বন্দ্যোপাধ্যায়"],
    correctIndex: 1
  }
];

const BANGLA_2ND_QUESTIONS: Question[] = [
  {
    id: 1004,
    question: "বাংলা ব্যাকরণের প্রধান আলোচ্য বিষয় কয়টি?",
    options: ["২টি", "৩টি", "৪টি", "৫টি"],
    correctIndex: 2
  },
  {
    id: 1005,
    question: "'সন্ধি' ব্যাকরণের কোন অংশে আলোচিত হয়?",
    options: ["ধ্বনি তত্ত্বে", "শব্দ তত্ত্বে", "বাক্য তত্ত্বে", "অর্থ তত্ত্বে"],
    correctIndex: 0
  },
  {
    id: 1006,
    question: "'নীল আকাশ' কোন সমাস?",
    options: ["দ্বন্দ্ব সমাস", "তৎপুরুষ সমাস", "বহুব্রীহি সমাস", "কর্মধারয় সমাস"],
    correctIndex: 3
  }
];

const ENGLISH_1ST_QUESTIONS: Question[] = [
  {
    id: 1007,
    question: "Who wrote 'Paradise Lost'?",
    options: ["John Milton", "William Shakespeare", "William Wordsworth", "John Keats"],
    correctIndex: 0
  },
  {
    id: 1008,
    question: "'To be or not to be, that is the question' is from which play?",
    options: ["Macbeth", "Othello", "Hamlet", "King Lear"],
    correctIndex: 2
  },
  {
    id: 1009,
    question: "Who is known as the 'Poet of Nature' in English literature?",
    options: ["Lord Byron", "P. B. Shelley", "William Wordsworth", "John Keats"],
    correctIndex: 2
  }
];

const ENGLISH_2ND_QUESTIONS: Question[] = [
  {
    id: 1010,
    question: "What is the plural form of 'Louse'?",
    options: ["Louses", "Lice", "Lices", "Louse"],
    correctIndex: 1
  },
  {
    id: 1011,
    question: "Choose the correct spelling:",
    options: ["Leiutenant", "Lieutenant", "Liautenant", "Lieutanant"],
    correctIndex: 1
  },
  {
    id: 1012,
    question: "What is the antonym of 'Gentle'?",
    options: ["Kind", "Rude/Harsh", "Soft", "Polite"],
    correctIndex: 1
  }
];

const PHYSICS_QUESTIONS: Question[] = [
  {
    id: 1013,
    question: "শব্দের গতি কোন মাধ্যমে সবচেয়ে বেশি?",
    options: ["বায়বীয় মাধ্যম", "তরল মাধ্যম", "কঠিন মাধ্যম", "শূন্য মাধ্যম"],
    correctIndex: 2
  },
  {
    id: 1014,
    question: "ক্ষমতার একক কী?",
    options: ["জুল", "ওয়াট", "প্যাসকেল", "নিউটন"],
    correctIndex: 1
  },
  {
    id: 1015,
    question: "মহাকর্ষীয় ধ্রুবক (G) এর মান কত?",
    options: ["6.673 x 10^-11 N m^2/kg^2", "9.8 m/s^2", "3 x 10^8 m/s", "1.6 x 10^-19 C"],
    correctIndex: 0
  }
];

const CHEMISTRY_QUESTIONS: Question[] = [
  {
    id: 1016,
    question: "সাধারণ লবণের রাসায়নিক সংকেত কোনটি?",
    options: ["HCl", "NaOH", "NaCl", "CaCO3"],
    correctIndex: 2
  },
  {
    id: 1017,
    question: "পর্যায় সারণির প্রথম মৌল কোনটি?",
    options: ["হিলিয়াম", "হাইড্রোজেন", "লিথিয়াম", "অক্সিজেন"],
    correctIndex: 1
  },
  {
    id: 1018,
    question: "উড়োজাহাজের টায়ারে কোন নিষ্ক্রিয় গ্যাস ব্যবহার করা হয়?",
    options: ["আর্গন", "নিয়ন", "হিলিয়াম", "ক্রিপ্টন"],
    correctIndex: 2
  }
];

const BIOLOGY_QUESTIONS: Question[] = [
  {
    id: 1019,
    question: "রক্তের গ্রুপ কে আবিষ্কার করেন?",
    options: ["আলেকজান্ডার ফ্লেমিং", "কার্ল ল্যান্ডস্টেইনার", "রবার্ট হুক", "লুই পাস্তুর"],
    correctIndex: 1
  },
  {
    id: 1020,
    question: "কোষের পাওয়ার হাউস (Power House) বলা হয় কাকে?",
    options: ["নিউক্লিয়াস", "ক্রোমোজোম", "সাইটোপ্লাজম", "মাইটোকন্ড্রিয়া"],
    correctIndex: 3
  },
  {
    id: 1021,
    question: "লোহিত রক্তকণিকার গড় আয়ু কত দিন?",
    options: ["৬০ দিন", "৯০ দিন", "১২০ দিন", "১৫০ দিন"],
    correctIndex: 2
  }
];

const ARITHMETIC_QUESTIONS: Question[] = [
  {
    id: 1022,
    question: "১ থেকে ১০০ পর্যন্ত মৌলিক সংখ্যা কয়টি?",
    options: ["১৫টি", "২০টি", "২৫টি", "৩০টি"],
    correctIndex: 2
  },
  {
    id: 1023,
    question: "৩, ৯ ও ৪ এর চতুর্থ সমানুপাতী কত?",
    options: ["৮", "১০", "১২", "১৬"],
    correctIndex: 2
  },
  {
    id: 1024,
    question: "পিতা ও পুত্রের বয়সের সমষ্টি ৬০ বছর। পিতার বয়স পুত্রের বয়সের ৪ গুণ হলে, পুত্রের বয়স কত?",
    options: ["১০ বছর", "১২ বছর", "১৫ বছর", "২০ বছর"],
    correctIndex: 1
  }
];

const ALGEBRA_QUESTIONS: Question[] = [
  {
    id: 1025,
    question: "(a + b)^2 এর সঠিক সূত্র কোনটি?",
    options: ["a^2 - 2ab + b^2", "a^2 + 2ab + b^2", "a^2 + b^2", "a^2 - b^2"],
    correctIndex: 1
  },
  {
    id: 1026,
    question: "x^2 - 5x + 6 = 0 সমীকরণের মূলদ্বয় কত?",
    options: ["1, 6", "2, 3", "-2, -3", "0, 5"],
    correctIndex: 1
  },
  {
    id: 1027,
    question: "log2 (8) এর মান কত?",
    options: ["১", "২", "৩", "৪"],
    correctIndex: 2
  }
];

const GEOMETRY_QUESTIONS: Question[] = [
  {
    id: 1028,
    question: "ত্রিভুজের তিন কোণের সমষ্টি কত ডিগ্রি?",
    options: ["৯০°", "১৮০°", "৩৬০°", "২৭০°"],
    correctIndex: 1,
    explanation: "যেকোনো ত্রিভুজের তিন কোণের সমষ্টি সর্বদা ১৮০ ডিগ্রি (বা ২ সমকোণ)।"
  },
  {
    id: 1029,
    question: "বৃত্তের ব্যাস ব্যাসার্ধের কত গুণ?",
    options: ["সমান", "দ্বিগুণ", "তিনগুণ", "অর্ধেক"],
    correctIndex: 1,
    explanation: "বৃত্তের কেন্দ্রগামী জ্যা-কে ব্যাস বলে। ব্যাস ব্যাসার্ধের দ্বিগুণ (d = 2r)।"
  },
  {
    id: 1030,
    question: "সমকোণী ত্রিভুজের অতিভুজের ওপর অঙ্কিত বর্গক্ষেত্রের ক্ষেত্রফল অপর দুই বাহুর ওপর অঙ্কিত বর্গক্ষেত্রদ্বয়ের ক্ষেত্রফলের কীসের সমান?",
    options: ["সমষ্টির সমান", "অন্তরের সমান", "গুণফলের সমান", "অর্ধেকের সমান"],
    correctIndex: 0,
    explanation: "পিথাগোরাসের উপপাদ্য অনুযায়ী: অতিভুজ^২ = লম্ব^২ + ভূমি^২।"
  }
];

const BANGLA_QUESTIONS: Question[] = [...BANGLA_1ST_QUESTIONS, ...BANGLA_2ND_QUESTIONS];
const ENGLISH_QUESTIONS: Question[] = [...ENGLISH_1ST_QUESTIONS, ...ENGLISH_2ND_QUESTIONS];
const SCIENCE_QUESTIONS: Question[] = [...PHYSICS_QUESTIONS, ...CHEMISTRY_QUESTIONS, ...BIOLOGY_QUESTIONS];
const MATH_QUESTIONS: Question[] = [...ARITHMETIC_QUESTIONS, ...ALGEBRA_QUESTIONS, ...GEOMETRY_QUESTIONS];

const ALL_COURSES_DATA = [
  { id: "bcs", name: "BCS", title: "BCS Preparation Masterclass", desc: "পূর্ণাঙ্গ বিসিএস সিলেবাসের ওপর ভিত্তি করে অধ্যায়ভিত্তিক লাইভ এমসিকিউ ও বিশ্লেষণমূলক লেকচার শীট।", category: "BCS", icon: BookOpen, bg: "bg-[#FFF1E6]", iconColor: "text-orange-600" },
  { id: "bank", name: "Bank", title: "Bank Job Officer Premium", desc: "সরকারি ও বেসরকারি ব্যাংক সিনিয়র অফিসার নিয়োগ পরীক্ষার উপযোগী প্রিপারেশন গাইড এবং শর্টকাট ম্যাথ।", category: "Bank", icon: Calculator, bg: "bg-[#E6F0FA]", iconColor: "text-blue-600" },
  { id: "primary", name: "Primary", title: "Primary School Teacher Prep", desc: "প্রাথমিক সহকারী শিক্ষক নিয়োগের বিগত বছরের প্রশ্ন এবং বোর্ড বই ভিত্তিক বিশেষ স্পিড কুইজ মডিউল।", category: "Teachers", icon: Globe, bg: "bg-[#EBF7EE]", iconColor: "text-green-600" },
  { id: "ntrca", name: "NTRCA", title: "NTRCA School & College Registration", desc: "১৭তম ও ১৮তম শিক্ষক নিবন্ধন পরীক্ষার সর্বশেষ সিলেবাস ভিত্তিক সাধারণ জ্ঞান এবং সাবজেক্ট প্রস্তুতি।", category: "Teachers", icon: GraduationCap, bg: "bg-[#F3E8FF]", iconColor: "text-purple-600" },
  { id: "psc", name: "PSC", title: "PSC Non-Cadre Mock Series", desc: "বাংলাদেশ সরকারী কর্ম কমিশন (PSC) আয়োজিত বিভিন্ন গ্রেডের ও নন-ক্যাডার পদের জন্য সুপার মক টেস্ট।", category: "Other", icon: FileText, bg: "bg-[#FCE7F3]", iconColor: "text-rose-600" },
  { id: "yuba", name: "যুব উন্নয়ন", title: "Youth Development Officer Prep", desc: "যুব উন্নয়ন অধিদপ্তরের বিভিন্ন পদ ও পরীক্ষার বিষয়ভিত্তিক প্রস্তুতি ও স্পেশাল মক টেস্ট।", category: "Other", icon: Award, bg: "bg-[#E0F2FE]", iconColor: "text-sky-600" },
  { id: "somaj", name: "সমাজ সেবা", title: "Social Services Dept Prep", desc: "সমাজসেবা অধিদপ্তরের ফিল্ড অফিসার, সমাজকর্মী ও অন্যান্য পদের নিয়োগ পরীক্ষা প্রস্তুতি।", category: "Other", icon: Briefcase, bg: "bg-[#FEF3C7]", iconColor: "text-amber-600" },
  { id: "office", name: "অফিস সহায়ক", title: "Office Assistant Preparation", desc: "সরকারি দপ্তর ও পরিদপ্তরে অফিস সহকারী ও কম্পিউটার অপারেটর পদের জন্য বিশেষ সিলেবাস কুইজ।", category: "Other", icon: FileText, bg: "bg-[#DCFCE7]", iconColor: "text-emerald-600" }
];

export default function Home() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<"home" | "quiz" | "courses" | "routine" | "tests" | "profile" | "course-detail" | "prep-sub" | "prep-sub-detail" | "prep-all-subjects" | "packages" | "search" | "notice" | "all-live-exams">("home");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<any | null>(null);
  const [previousScreen, setPreviousScreen] = useState<"home" | "quiz" | "courses" | "routine" | "tests" | "profile" | "course-detail" | "prep-sub" | "prep-sub-detail" | "prep-all-subjects" | "packages" | "search" | "notice" | "all-live-exams">("home");
  const [selectedPrepSubject, setSelectedPrepSubject] = useState<string>("");
  const [selectedPrepSubSubject, setSelectedPrepSubSubject] = useState<{ name: string; sub: string; questions: Question[]; subCategories2?: any[] } | null>(null);
  const [selectedLevel3Topic, setSelectedLevel3Topic] = useState<string | null>(null);
  const [selectedPrepExamTypeFilter, setSelectedPrepExamTypeFilter] = useState<"daily" | "weekly">("daily");
  const [prepSubjectSearchQuery, setPrepSubjectSearchQuery] = useState<string>("");
  const [selectedPurchasePkg, setSelectedPurchasePkg] = useState<any | null>(null);
  
  // Drawer & Overlay States
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<"BN" | "EN">("BN");
  const [activeDrawerModal, setActiveDrawerModal] = useState<"none" | "package" | "bookstore" | "language" | "settings" | "ourapps" | "contact">("none");
  
  // User Profile States
  const [profileName, setProfileName] = useState<string>("Tanvir Hossain");
  const [profileEmail, setProfileEmail] = useState<string>("mobileseba247@gmail.com");
  const [profilePhone, setProfilePhone] = useState<string>("01712345678");
  const [profileId, setProfileId] = useState<string>("284710");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string>("");
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setProfileAvatarUrl(dataUrl);
          if (typeof window !== "undefined") {
            localStorage.setItem("job_master_user_avatar", dataUrl);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  
  // Database & Loaded Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allRawQuestions, setAllRawQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [activeQuizTitle, setActiveQuizTitle] = useState<string>("General Quiz Game");
  const [activeQuizSubtitle, setActiveQuizSubtitle] = useState<string>("45th BCS International Affairs");

  // Dynamic Exam Papers & Packages State (Initialized synchronously with cached/default data for instant 0ms display)
  const [examPapers, setExamPapers] = useState<ExamPaper[]>(DEFAULT_EXAM_PAPERS);
  const [isExamsLoading, setIsExamsLoading] = useState<boolean>(false);
  const [packagesList, setPackagesList] = useState<PackageItem[]>(DEFAULT_PACKAGES);
  const [coursesList, setCoursesList] = useState<CourseItem[]>([]);
  const [prepSubjectsList, setPrepSubjectsList] = useState<PrepSubjectItem[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(getCachedAppSettings());
  const [selectedExamCategory, setSelectedExamCategory] = useState<"all" | "daily" | "weekly" | "subject" | "special">("all");
  const [activeExamSection, setActiveExamSection] = useState<"daily" | "weekly" | "subject" | "special" | null>(null);

  // Live Exam Carousel & Modal State
  const [activeLiveExamIndex, setActiveLiveExamIndex] = useState<number>(0);
  const [isLiveTransitioning, setIsLiveTransitioning] = useState<boolean>(true);
  const [selectedLiveExamModal, setSelectedLiveExamModal] = useState<ExamPaper | null>(null);
  const [liveTick, setLiveTick] = useState<number>(0);
  const [isLivePaused, setIsLivePaused] = useState<boolean>(false);

  // Quick Tools Archive & Modal State
  const [archiveModalOpen, setArchiveModalOpen] = useState<boolean>(false);
  const [archiveFilterCourse, setArchiveFilterCourse] = useState<string>("all");
  const [archiveFilterCategory, setArchiveFilterCategory] = useState<string>("all");
  const [quickToolModal, setQuickToolModal] = useState<{ name: string; icon: string } | null>(null);
  
  // View Question Paper Modal ("প্রশ্নপত্র") State
  const [viewingPaperModal, setViewingPaperModal] = useState<ExamPaper | null>(null);
  const [paperFilterSubject, setPaperFilterSubject] = useState<string>("All");
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<number, boolean>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<number, boolean>>({});

  // Take Exam Modal ("পরীক্ষা দিন") State
  const [takingExamModal, setTakingExamModal] = useState<ExamPaper | null>(null);
  const [examUserAnswers, setExamUserAnswers] = useState<Record<number, number>>({});
  const [examInitialTime, setExamInitialTime] = useState<number>(0);
  const [examTimer, setExamTimer] = useState<number>(0);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [examResultSummary, setExamResultSummary] = useState<any | null>(null);
  const [showExamNoticeAlert, setShowExamNoticeAlert] = useState<boolean>(true);
  const [examQuestionsDrawerOpen, setExamQuestionsDrawerOpen] = useState<boolean>(false);
  const [showExamSubmitConfirmModal, setShowExamSubmitConfirmModal] = useState<boolean>(false);

  // Detailed Answer Sheet State
  const answerSheetScrollRef = useRef<HTMLDivElement>(null);
  const [showAnswerSheetScrollTop, setShowAnswerSheetScrollTop] = useState<boolean>(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [viewingAnswerSheetData, setViewingAnswerSheetData] = useState<{
    paper: ExamPaper;
    summary: any;
    userAnswers: Record<number, number>;
  } | null>(null);

  // Desktop Navigation Modals
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [desktopSearchQuery, setDesktopSearchQuery] = useState<string>("");
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<"all" | "exams" | "courses" | "subjects" | "questions">("all");

  // Game/Quiz States
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [submittedCount, setSubmittedCount] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  // Quit Confirm Modal State
  const [showQuitConfirmModal, setShowQuitConfirmModal] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Helper function to shuffle questions
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Derive active question
  const currentQuestion: Question | undefined = questions[currentQuestionIndex];
  const isCompleted = quizStarted && questions.length > 0 && currentQuestionIndex >= questions.length;

  // Intercept navigation during active quiz
  const attemptExitQuiz = (targetAction?: () => void) => {
    if (currentScreen === "quiz" && quizStarted && !isCompleted && !isTimedOut) {
      setPendingNavigation(() => targetAction || null);
      setShowQuitConfirmModal(true);
    } else {
      if (targetAction) targetAction();
    }
  };

  // Exit quiz early and calculate current score result
  const finishQuizEarly = () => {
    const totalAnswered = submittedCount;
    const scoreObtained = score;
    const pct = totalAnswered > 0 ? Math.round((scoreObtained / totalAnswered) * 100) : 0;

    if (totalAnswered > 0) {
      const newTestLog: TakenTest = {
        id: "log_" + Date.now(),
        name: activeQuizTitle + " (" + activeQuizSubtitle + ")",
        score: scoreObtained,
        total: totalAnswered,
        time: "Just now",
        percentage: pct
      };
      saveTakenTests([newTestLog, ...takenTests]);
    }

    setCurrentQuestionIndex(questions.length);
  };

  // Search filter
  const [coursesSearchQuery, setCoursesSearchQuery] = useState<string>("");
  const [selectedCourseCategory, setSelectedCourseCategory] = useState<string>("All");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // Custom User Routine State (persisted inside localStorage if client-side)
  const [routineTasks, setRoutineTasks] = useState<RoutineItem[]>([]);
  const [newRoutineText, setNewRoutineText] = useState<string>("");
  const [newRoutineCategory, setNewRoutineCategory] = useState<string>("GK");

  // Test History State (persisted inside localStorage)
  const [takenTests, setTakenTests] = useState<TakenTest[]>([]);

  // Load state from local storage on mount (Safe client-side execution)
  useEffect(() => {
    if (typeof window !== "undefined") {
      recordVisit();

      const savedRoutine = localStorage.getItem("job_master_routine");
      if (savedRoutine) {
        try {
          setRoutineTasks(JSON.parse(savedRoutine));
        } catch (e) {
          console.warn("Failed to parse saved routine:", e);
        }
      }

      const savedTests = localStorage.getItem("job_master_tests_history");
      if (savedTests) {
        try {
          setTakenTests(JSON.parse(savedTests));
        } catch (e) {
          console.warn("Failed to parse saved tests history:", e);
        }
      }

      const savedSound = localStorage.getItem("job_master_sound");
      if (savedSound !== null) {
        setSoundEnabled(savedSound === "true");
      }

      const savedAvatar = localStorage.getItem("job_master_user_avatar");
      if (savedAvatar) {
        setProfileAvatarUrl(savedAvatar);
      }

      // Synchronously load cached exam papers & packages for instant 0ms rendering
      const cachedExams = getCachedExamPapers();
      if (cachedExams && cachedExams.length > 0) {
        setExamPapers(cachedExams);
        setIsExamsLoading(false);
      }

      const cachedPkgs = getCachedPackages();
      if (cachedPkgs && cachedPkgs.length > 0) {
        setPackagesList(cachedPkgs);
      }

      const cachedCourses = getCachedCourses();
      if (cachedCourses && cachedCourses.length > 0) {
        setCoursesList(cachedCourses);
      }

      const cachedPrep = getCachedPrepSubjects();
      if (cachedPrep && cachedPrep.length > 0) {
        setPrepSubjectsList(cachedPrep);
      }

      fetchAppSettingsFromDb().then(settings => {
        if (settings) setAppSettings(settings);
      });

      // Background fetch dynamic published exam papers & subscribe to real-time changes (SWR pattern)
      fetchExamPapersFromDb()
        .then(papers => {
          if (papers && papers.length > 0) {
            setExamPapers(papers);
          }
          setIsExamsLoading(false);
        })
        .catch(() => {
          setIsExamsLoading(false);
        });

      const unsubscribe = subscribeToExamPapers((updatedPapers) => {
        if (updatedPapers && updatedPapers.length > 0) {
          setExamPapers(updatedPapers);
        }
        setIsExamsLoading(false);
      });

      // Fetch dynamic packages & subscribe
      fetchPackagesFromDb().then(pkgs => {
        if (pkgs && pkgs.length > 0) {
          setPackagesList(pkgs);
        }
      });

      const unsubPkgs = subscribeToPackages((updatedPkgs) => {
        if (updatedPkgs && updatedPkgs.length > 0) {
          setPackagesList(updatedPkgs);
        }
      });

      // Fetch dynamic courses & prep subjects & subscribe
      fetchCoursesFromDb().then(courses => {
        if (courses && courses.length > 0) {
          setCoursesList(courses);
        }
      });
      fetchPrepSubjectsFromDb().then(prep => {
        if (prep && prep.length > 0) {
          setPrepSubjectsList(prep);
        }
      });

      const unsubCoursesPrep = subscribeToCoursesAndPrep(
        (updatedCourses) => setCoursesList(updatedCourses),
        (updatedPrep) => setPrepSubjectsList(updatedPrep)
      );

      return () => {
        if (unsubscribe) unsubscribe();
        if (unsubPkgs) unsubPkgs();
        if (unsubCoursesPrep) unsubCoursesPrep();
      };
    }
  }, []);

  // 1-second interval tick for live exam elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Memoized current active live exams (instant 0ms filtering & sorting)
  const liveExamsList = useMemo(() => {
    const lives = examPapers.filter(p => getExamStatus(p) === "Live");
    return sortExamPapersForDisplay(lives);
  }, [examPapers, liveTick]);

  // 4-second carousel auto-rotation with continuous left-sliding infinite loop
  useEffect(() => {
    if (liveExamsList.length <= 1 || isLivePaused) return;
    const interval = setInterval(() => {
      setIsLiveTransitioning(true);
      setActiveLiveExamIndex(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [liveExamsList.length, isLivePaused]);

  // Seamless reset when reaching the clone item at the end of the carousel
  useEffect(() => {
    if (liveExamsList.length <= 1) return;
    if (activeLiveExamIndex === liveExamsList.length) {
      const timer = setTimeout(() => {
        setIsLiveTransitioning(false);
        setActiveLiveExamIndex(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeLiveExamIndex, liveExamsList.length]);

  // Timer effect for Taking Exam Modal
  useEffect(() => {
    let timerId: any = null;
    if (takingExamModal && !examSubmitted && examTimer > 0) {
      timerId = setInterval(() => {
        setExamTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [takingExamModal, examSubmitted, examTimer]);

  // Save routine tasks
  const saveRoutine = (updated: RoutineItem[]) => {
    setRoutineTasks(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("job_master_routine", JSON.stringify(updated));
    }
  };

  // Save taken tests
  const saveTakenTests = (updated: TakenTest[]) => {
    setTakenTests(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("job_master_tests_history", JSON.stringify(updated));
    }
  };

  // Exam Paper Handlers
  const handleOpenTakeExam = (paper: ExamPaper) => {
    const currentStatus = getExamStatus(paper);
    if (currentStatus === "Upcoming") {
      const startTimeFormatted = paper.startDateTime 
        ? new Date(paper.startDateTime).toLocaleString("bn-BD", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
        : paper.examDate;
      alert(`⏳ পরীক্ষাটি এখনো শুরু হয়নি!\n\nপরীক্ষা শুরুর সময়:\n${startTimeFormatted}\n\nনির্ধারিত সময় শুরু হলেই আপনি লাইভ পরীক্ষায় অংশ নিতে পারবেন।`);
      return;
    }

    const duration = paper.totalDurationSeconds || (paper.questions?.length || 10) * 36;
    setTakingExamModal(paper);
    setExamUserAnswers({});
    setExamSubmitted(false);
    setExamResultSummary(null);
    setExamInitialTime(duration);
    setExamTimer(duration);
    setShowExamNoticeAlert(true);
    setExamQuestionsDrawerOpen(false);
    setShowExamSubmitConfirmModal(false);
    if (soundEnabled) quizAudio.playClick();
  };

  const handleOpenViewPaper = (paper: ExamPaper) => {
    setViewingPaperModal(paper);
    setPaperFilterSubject("All");
    setRevealedAnswers({});
    setRevealedExplanations({});
    if (soundEnabled) quizAudio.playClick();
  };

  const handleOptionSelectExam = (qIndex: number, optionIdx: number) => {
    if (examSubmitted) return;
    setExamUserAnswers(prev => ({ ...prev, [qIndex]: optionIdx }));
    if (soundEnabled) quizAudio.playClick();
  };

  const handleFinishExam = () => {
    if (!takingExamModal || examSubmitted) return;

    const paper = takingExamModal;
    const questionsList = paper.questions || [];
    const totalQuestions = questionsList.length;

    let correctCount = 0;
    let wrongCount = 0;
    let answeredCount = 0;

    questionsList.forEach((q, idx) => {
      if (examUserAnswers[idx] !== undefined) {
        answeredCount++;
        if (examUserAnswers[idx] === q.correctIndex) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const skippedCount = totalQuestions - answeredCount;
    const penalty = wrongCount * 0.50; // -0.50 per wrong answer
    const netMarks = Math.max(0, correctCount - penalty);
    const percentage = totalQuestions > 0 ? Math.round((netMarks / totalQuestions) * 100) : 0;

    const timeTakenSecs = Math.max(1, examInitialTime - examTimer);
    const mins = Math.floor(timeTakenSecs / 60);
    const secs = timeTakenSecs % 60;
    const timeTakenFormatted = `${mins > 0 ? `${mins} মি: ` : ""}${secs} সে:`;

    setExamSubmitted(true);
    setExamResultSummary({
      totalQuestions,
      answeredCount,
      correctCount,
      wrongCount,
      skippedCount,
      penalty: penalty.toFixed(2),
      netMarks: netMarks.toFixed(2),
      percentage,
      timeTakenFormatted,
      timeTakenSecs
    });

    // Save to test history log
    const newLog: TakenTest = {
      id: "exam_" + Date.now(),
      name: paper.title,
      score: Math.round(netMarks),
      total: totalQuestions,
      time: "Just now",
      percentage
    };
    saveTakenTests([newLog, ...takenTests]);

    if (soundEnabled) {
      if (percentage >= 50) quizAudio.playSuccess();
      else quizAudio.playError();
    }
  };

  // Fetch BCS Daily Challenge questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        setError(null);
        const supabase = getSupabase();
        
        const { data, error: sbError } = await supabase
          .from("questions")
          .select("*");

        if (sbError) {
          throw sbError;
        }

        if (data && data.length > 0) {
          const mappedQuestions: Question[] = data.map((q: any) => {
            let questionText = "Untitled Question";
            const possibleQuestionKeys = ["questionText", "question_text", "question", "title", "text", "questiontext"];
            for (const key of possibleQuestionKeys) {
              if (q[key] !== undefined && q[key] !== null) {
                questionText = String(q[key]);
                break;
              }
            }

            let rawOptions: any = null;
            const possibleOptionKeys = ["options", "choices", "answers", "answers_list", "option_list"];
            for (const key of possibleOptionKeys) {
              if (q[key] !== undefined && q[key] !== null) {
                rawOptions = q[key];
                break;
              }
            }

            let options: string[] = [];
            if (Array.isArray(rawOptions)) {
              options = rawOptions.map(String);
            } else if (typeof rawOptions === "string") {
              try {
                const parsed = JSON.parse(rawOptions);
                if (Array.isArray(parsed)) {
                  options = parsed.map(String);
                } else if (typeof parsed === "object" && parsed !== null) {
                  options = Object.values(parsed).map(String);
                }
              } catch {
                options = rawOptions.split(",").map((s: string) => s.trim());
              }
            } else if (typeof rawOptions === "object" && rawOptions !== null) {
              options = Object.values(rawOptions).map(String);
            } else {
              options = ["Option 1", "Option 2", "Option 3", "Option 4"];
            }

            let correctIndexVal: any = undefined;
            const possibleIndexKeys = [
              "correctIndex", "correct_index", "correctOptionIndex", "correct_option_index",
              "correctoptionindex", "correct_option", "correctoption", "correct", "answer",
              "answer_index", "answerindex"
            ];
            for (const key of possibleIndexKeys) {
              if (q[key] !== undefined && q[key] !== null) {
                correctIndexVal = q[key];
                break;
              }
            }

            let correctIndex = 0;
            if (correctIndexVal !== undefined && correctIndexVal !== null) {
              if (typeof correctIndexVal === "string") {
                const parsedNum = parseInt(correctIndexVal, 10);
                if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < options.length) {
                  correctIndex = parsedNum;
                } else {
                  const foundIdx = options.findIndex(opt => opt.toLowerCase().trim() === correctIndexVal.toLowerCase().trim());
                  if (foundIdx !== -1) {
                    correctIndex = foundIdx;
                  }
                }
              } else if (typeof correctIndexVal === "number") {
                correctIndex = correctIndexVal;
              }
            }

            let id = Date.now();
            if (q.id !== undefined && q.id !== null) {
              id = Number(q.id);
            }

            let subjectVal: string | undefined = undefined;
            const possibleSubjectKeys = ["subject", "subject_name", "category", "topic", "subjectName", "subject_title"];
            for (const key of possibleSubjectKeys) {
              if (q[key] !== undefined && q[key] !== null) {
                subjectVal = String(q[key]);
                break;
              }
            }

            return {
              id,
              question: questionText,
              options,
              correctIndex,
              subject: subjectVal
            };
          });

          mappedQuestions.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
          setAllRawQuestions(mappedQuestions);
          setQuestions(mappedQuestions);
          setIsUsingFallback(false);
        } else {
          setAllRawQuestions(QUIZ_QUESTIONS);
          setQuestions(QUIZ_QUESTIONS);
          setIsUsingFallback(true);
        }
      } catch (err: any) {
        console.warn("Falling back to local quiz questions:", err);
        setError(err.message || "Failed to load questions from database.");
        setAllRawQuestions(QUIZ_QUESTIONS);
        setQuestions(QUIZ_QUESTIONS);
        setIsUsingFallback(true);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (currentScreen !== "quiz" || !quizStarted || isSubmitted || isTimedOut || isCompleted || showQuitConfirmModal) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentScreen, quizStarted, isSubmitted, isTimedOut, currentQuestionIndex, isCompleted, showQuitConfirmModal]);

  // Handle start quiz action (Sets screen to 'quiz' and resets statistics)
  const startQuizFlow = (title: string, subtitle: string, customQuestionSet?: Question[]) => {
    setActiveQuizTitle(title);
    setActiveQuizSubtitle(subtitle);
    
    let pool: Question[] = [];
    if (customQuestionSet && customQuestionSet.length > 0) {
      pool = customQuestionSet;
    } else {
      pool = allRawQuestions.length > 0 ? allRawQuestions : QUIZ_QUESTIONS;
    }

    if (title === "Live Quiz Game") {
      const allowed = LIVE_QUIZ_ALLOWED_SUBJECTS;
      const filtered = pool.filter(q => {
        if (!q.subject) return true;
        const s = q.subject.toLowerCase();
        return allowed.some(a => 
          s.includes(a.toLowerCase()) || 
          (a === "Bangladesh Affairs" && (s.includes("bangladesh") || s.includes("বাংলাদেশ"))) ||
          (a === "International Affairs" && (s.includes("international") || s.includes("আন্তর্জাতিক"))) ||
          (a === "Geography" && (s.includes("geography") || s.includes("ভূগোল"))) ||
          (a === "General Science" && (s.includes("science") || s.includes("বিজ্ঞান"))) ||
          (a === "Technology" && (s.includes("tech") || s.includes("ict") || s.includes("প্রযুক্তি") || s.includes("কম্পিউটার"))) ||
          (a === "Mental Ability" && (s.includes("mental") || s.includes("iq") || s.includes("মানসিক")))
        );
      });

      const candidateSet = filtered.length >= 5 ? filtered : pool;
      const randomized = shuffleArray(candidateSet);
      setQuestions(randomized.slice(0, 10));
    } else {
      const randomized = shuffleArray(pool);
      setQuestions(randomized.slice(0, 10));
    }

    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSubmittedCount(0);
    setSelectedOptionIndex(null);
    setIsSubmitted(false);
    setTimeLeft(30);
    setIsTimedOut(false);
    setCurrentScreen("quiz");
    
    if (soundEnabled) quizAudio.playClick();
  };

  // Handle option select - Instant feedback & score update
  const handleSelectOption = (index: number) => {
    if (isSubmitted || isTimedOut || !currentQuestion) return;

    setSelectedOptionIndex(index);
    const correct = index === currentQuestion.correctIndex;
    
    if (correct) {
      setScore((prev) => prev + 1);
      if (soundEnabled) quizAudio.playSuccess();
    } else {
      if (soundEnabled) quizAudio.playError();
    }

    setSubmittedCount((prev) => prev + 1);
    setIsSubmitted(true);
  };

  // Handle loading next question
  const handleNext = () => {
    setSelectedOptionIndex(null);
    setIsSubmitted(false);
    setTimeLeft(30);
    setIsTimedOut(false);
    
    if (currentQuestionIndex + 1 >= questions.length) {
      // Completed! Add to Taken Tests history log
      const scoreObtained = score;
      const totalQuestions = questions.length;
      const pct = Math.round((scoreObtained / totalQuestions) * 100);
      
      const newTestLog: TakenTest = {
        id: "log_" + Date.now(),
        name: activeQuizTitle + " (" + activeQuizSubtitle + ")",
        score: scoreObtained,
        total: totalQuestions,
        time: "Just now",
        percentage: pct
      };

      const updatedHistory = [newTestLog, ...takenTests];
      saveTakenTests(updatedHistory);
    }

    setCurrentQuestionIndex((prev) => prev + 1);
  };

  // Handle restart quiz with fresh random questions from allowed subjects
  const handleRestart = () => {
    let pool = allRawQuestions.length > 0 ? allRawQuestions : QUIZ_QUESTIONS;
    if (activeQuizTitle === "Live Quiz Game") {
      const allowed = LIVE_QUIZ_ALLOWED_SUBJECTS;
      const filtered = pool.filter(q => {
        if (!q.subject) return true;
        const s = q.subject.toLowerCase();
        return allowed.some(a => 
          s.includes(a.toLowerCase()) || 
          (a === "Bangladesh Affairs" && (s.includes("bangladesh") || s.includes("বাংলাদেশ"))) ||
          (a === "International Affairs" && (s.includes("international") || s.includes("আন্তর্জাতিক"))) ||
          (a === "Geography" && (s.includes("geography") || s.includes("ভূগোল"))) ||
          (a === "General Science" && (s.includes("science") || s.includes("বিজ্ঞান"))) ||
          (a === "Technology" && (s.includes("tech") || s.includes("ict") || s.includes("প্রযুক্তি") || s.includes("কম্পিউটার"))) ||
          (a === "Mental Ability" && (s.includes("mental") || s.includes("iq") || s.includes("মানসিক")))
        );
      });
      const candidateSet = filtered.length >= 5 ? filtered : pool;
      const randomized = shuffleArray(candidateSet);
      setQuestions(randomized.slice(0, 10));
    } else {
      const randomized = shuffleArray(pool);
      setQuestions(randomized.slice(0, 10));
    }

    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSubmittedCount(0);
    setSelectedOptionIndex(null);
    setIsSubmitted(false);
    setTimeLeft(30);
    setIsTimedOut(false);
  };

  // Handle Routine progress checking
  const handleToggleRoutine = (id: string) => {
    const updated = routineTasks.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveRoutine(updated);
    if (soundEnabled) quizAudio.playClick();
  };

  // Handle adding new routine item
  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineText.trim()) return;

    const newItem: RoutineItem = {
      id: "routine_" + Date.now(),
      title: newRoutineText.trim(),
      completed: false,
      category: newRoutineCategory
    };

    const updated = [...routineTasks, newItem];
    saveRoutine(updated);
    setNewRoutineText("");
    if (soundEnabled) quizAudio.playSuccess();
  };

  // Delete routine task
  const handleDeleteRoutine = (id: string) => {
    const updated = routineTasks.filter(item => item.id !== id);
    saveRoutine(updated);
  };

  // Clear all taken tests history
  const handleClearTestHistory = () => {
    saveTakenTests([]);
  };

  // Calculate routine progress percentage
  const completedRoutineCount = routineTasks.filter(r => r.completed).length;
  const routinePercentage = routineTasks.length > 0 ? Math.round((completedRoutineCount / routineTasks.length) * 100) : 0;

  const ICON_MAP: Record<string, any> = useMemo(() => ({
    BookOpen,
    Calculator,
    Globe,
    GraduationCap,
    FileText,
    Briefcase,
    Users,
    Award,
    ShieldCheck,
    Zap,
    HelpCircle,
    Sparkles,
    Newspaper,
    TrendingUp,
    LayoutGrid,
    Laptop,
    Monitor,
    FlaskConical,
    Atom,
    Book
  }), []);

  const allCoursesData = useMemo(() => {
    if (coursesList && coursesList.length > 0) {
      return coursesList.map(c => ({
        ...c,
        icon: ICON_MAP[c.icon || "BookOpen"] || BookOpen
      }));
    }
    return ALL_COURSES_DATA;
  }, [coursesList, ICON_MAP]);

  const DEFAULT_PREP_SUBJECTS = useMemo(() => [
    { name: "বাংলা", bnName: "বাংলা", icon: BookOpen, bg: "bg-[#FFF1E6]", text: "text-orange-600", sub: "সাহিত্য ও ব্যাকরণ" },
    { name: "English", bnName: "English", icon: Globe, bg: "bg-[#F3E8FF]", text: "text-purple-600", sub: "Literature & Grammar" },
    { name: "গণিত", bnName: "গণিত", icon: Calculator, bg: "bg-[#E6F0FA]", text: "text-blue-600", sub: "পাটিগণিত ও বীজগণিত" },
    { name: "সাধারণ জ্ঞান", bnName: "সাধারণ জ্ঞান", icon: Award, bg: "bg-[#FCE7F3]", text: "text-rose-600", sub: "বাংলাদেশ ও আন্তর্জাতিক" },
    { name: "প্রযুক্তি", bnName: "প্রযুক্তি", icon: Zap, bg: "bg-[#E0E7FF]", text: "text-indigo-600", sub: "কম্পিউটার ও আইসিটি" },
    { name: "সাধারণ বিজ্ঞান", bnName: "সাধারণ বিজ্ঞান", icon: Sparkles, bg: "bg-[#FEF3C7]", text: "text-amber-600", sub: "দৈনন্দিন বিজ্ঞান" },
    { name: "ভূগোল", bnName: "ভূগোল", icon: Globe, bg: "bg-[#E0F2FE]", text: "text-sky-600", sub: "পরিবেশ ও দুর্যোগ" },
    { name: "মানসিক দক্ষতা", bnName: "মানসিক দক্ষতা", icon: HelpCircle, bg: "bg-[#FEE2E2]", text: "text-red-600", sub: "গাণিতিক ও মানসিক যুক্তি" },
    { name: "নৈতিকতা ও সুশাসন", bnName: "নৈতিকতা ও সুশাসন", icon: ShieldCheck, bg: "bg-[#DCFCE7]", text: "text-emerald-600", sub: "মূল্যবোধ, সুশাসন ও নীতি" }
  ], []);

  const allPrepSubjectsData = useMemo(() => {
    if (prepSubjectsList && prepSubjectsList.length > 0) {
      return prepSubjectsList.map(s => ({
        ...s,
        icon: ICON_MAP[s.icon || "BookOpen"] || BookOpen,
        text: s.text || (s as any).iconColor || "text-orange-600"
      }));
    }
    return DEFAULT_PREP_SUBJECTS;
  }, [prepSubjectsList, ICON_MAP, DEFAULT_PREP_SUBJECTS]);

  // Search filter for courses
  const filteredCoursesList = useMemo(() => {
    return allCoursesData.filter(course => {
      const query = coursesSearchQuery.toLowerCase();
      const matchesSearch = !query || 
                            (course.name && course.name.toLowerCase().includes(query)) ||
                            (course.title && course.title.toLowerCase().includes(query)) || 
                            (course.desc && course.desc.toLowerCase().includes(query));
      return matchesSearch;
    });
  }, [allCoursesData, coursesSearchQuery]);

  return (
    <PwaProvider>
      <div className="min-h-screen h-[100dvh] w-full bg-slate-50 flex flex-col items-center justify-start p-0 selection:bg-orange-500 selection:text-white relative overflow-hidden sm:overflow-y-auto">
        
        {/* Global PWA Toast & Guide Modals */}
        <InstallPwaPopup />

        {/* Floating Bottom Sheet Banner directly above Bottom Navigation */}
        <BottomInstallBanner />

        {/* Dynamic Background Blur Balls */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-300/25 rounded-full blur-[120px] pointer-events-none z-0 hidden sm:block" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/25 rounded-full blur-[120px] pointer-events-none z-0 hidden sm:block" />

        {/* Primary Container - Adaptive Full Desktop & Tablet View */}
        <div className="w-full max-w-full bg-slate-50 h-[100dvh] md:h-screen md:max-h-screen rounded-none border-none shadow-none flex flex-col justify-between relative overflow-hidden z-10">

        {/* Main Header of the App (Strictly Fixed on Top, Never Scrolls Out of View) */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 md:px-20 lg:px-48 xl:px-72 2xl:px-96 pt-3 pb-3 sm:pt-4 sm:pb-3 flex items-center justify-between shadow-sm z-40 shrink-0 sticky top-0 touch-none select-none">
          {/* Left side: Hamburger/Back (Hidden on desktop md:hidden) and brand name */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setDrawerOpen(false);
                if (currentScreen === "quiz") {
                  if (quizStarted && !isCompleted && !isTimedOut) {
                    attemptExitQuiz(() => {
                      setDrawerOpen(false);
                      setCurrentScreen("home");
                    });
                  } else {
                    setDrawerOpen(false);
                    setCurrentScreen("home");
                  }
                } else if (currentScreen === "course-detail") {
                  if (activeExamSection) {
                    setActiveExamSection(null);
                  } else {
                    setDrawerOpen(false);
                    const dest = previousScreen || "home";
                    setCurrentScreen(dest);
                    if (dest === "courses") {
                      setPreviousScreen("home");
                    }
                  }
                } else if (currentScreen === "courses") {
                  setDrawerOpen(false);
                  setCurrentScreen("home");
                  setPreviousScreen("home");
                } else if (currentScreen === "prep-all-subjects") {
                  setDrawerOpen(false);
                  setCurrentScreen("home");
                } else if (currentScreen === "prep-sub") {
                  setDrawerOpen(false);
                  setCurrentScreen("prep-all-subjects");
                } else if (currentScreen === "prep-sub-detail") {
                  setDrawerOpen(false);
                  setCurrentScreen("prep-sub");
                } else if (currentScreen === "search" || currentScreen === "routine" || currentScreen === "tests" || currentScreen === "packages" || currentScreen === "profile" || currentScreen === "notice") {
                  setDrawerOpen(false);
                  setCurrentScreen(previousScreen || "home");
                } else {
                  setDrawerOpen(!drawerOpen);
                }
                if (soundEnabled) quizAudio.playClick();
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 active:scale-95 transition-all z-50 relative cursor-pointer"
              id="menu-toggle-button"
            >
              {currentScreen === "course-detail" || currentScreen === "courses" || currentScreen === "prep-all-subjects" || currentScreen === "prep-sub" || currentScreen === "prep-sub-detail" || currentScreen === "quiz" || currentScreen === "search" || currentScreen === "profile" || currentScreen === "notice" ? (
                <ArrowLeft className="w-6 h-6 stroke-[2.2px]" />
              ) : drawerOpen ? (
                <X className="w-6 h-6 stroke-[2.2px] text-orange-600 animate-spin-once" />
              ) : (
                <Menu className="w-6 h-6 stroke-[2.2px]" />
              )}
            </button>
            
            <button 
              onClick={() => {
                attemptExitQuiz(() => setCurrentScreen("home"));
                if (soundEnabled) quizAudio.playClick();
              }}
              className="flex items-center gap-1.5 ml-1 text-left cursor-pointer active:scale-95 transition-all"
              id="header-brand-button"
            >
              {/* Custom icon combining orange graduation cap */}
              <div className="bg-[#FF6A00] p-1.5 rounded-xl shadow-md shadow-orange-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[#1E293B] text-base tracking-tight leading-none">
                  {currentScreen === "course-detail" && selectedCourseDetail ? (
                    <>
                      {selectedCourseDetail.title.split(" ")[0]} <span className="text-[#FF6A00]">{selectedCourseDetail.title.split(" ").slice(1).join(" ")}</span>
                    </>
                  ) : currentScreen === "prep-all-subjects" ? (
                    <>
                      Preparation <span className="text-[#FF6A00]">Hub</span>
                    </>
                  ) : currentScreen === "prep-sub" ? (
                    <>
                      {selectedPrepSubject} <span className="text-[#FF6A00]">Hub</span>
                    </>
                  ) : currentScreen === "prep-sub-detail" && selectedPrepSubSubject ? (
                    <>
                      {selectedPrepSubSubject.name.split(" ")[0]} <span className="text-[#FF6A00]">{selectedPrepSubSubject.name.split(" ").slice(1).join(" ")}</span>
                    </>
                  ) : currentScreen === "quiz" ? (
                    <>
                      Quiz <span className="text-[#FF6A00]">Master</span>
                    </>
                  ) : currentScreen === "all-live-exams" ? (
                    <>
                      Live <span className="text-[#FF6A00]">Exams</span>
                    </>
                  ) : currentScreen === "profile" ? (
                    <>
                      Profile
                    </>
                  ) : currentScreen === "notice" ? (
                    <>
                      Notice <span className="text-[#FF6A00]">Board</span>
                    </>
                  ) : (
                    <>
                      Job <span className="text-[#FF6A00]">Master</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.05em] text-[#94A3B8] uppercase mt-0.5">
                  {currentScreen === "course-detail" && selectedCourseDetail 
                    ? `${selectedCourseDetail.category} Course Details` 
                    : currentScreen === "prep-all-subjects" 
                    ? "সকল বিষয় (ALL SUBJECTS)" 
                    : currentScreen === "prep-sub" 
                    ? `SELECT ${selectedPrepSubject} SUBJECT` 
                    : currentScreen === "prep-sub-detail" && selectedPrepSubSubject 
                    ? `${selectedPrepSubject} • ${selectedPrepSubSubject.sub}` 
                    : currentScreen === "quiz" 
                    ? (activeQuizSubtitle || "Live Exam") 
                    : currentScreen === "all-live-exams"
                    ? "সকল লাইভ পরীক্ষা (ALL LIVE EXAMS)"
                    : currentScreen === "profile"
                    ? "STUDENT ACCOUNT & STATS"
                    : currentScreen === "notice"
                    ? "NOTICES & ANNOUNCEMENTS"
                    : "চাকরি আপনার হাতে"}
                </span>
              </div>
            </button>
          </div>

          {/* Center: Apple UI Navigation Menu for Desktop */}
          <nav className="hidden xl:flex bg-slate-100/90 border border-slate-200/70 p-1 rounded-xl items-center gap-1 shadow-inner">
            <button
              onClick={() => { setCurrentScreen("home"); if (soundEnabled) quizAudio.playClick(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                currentScreen === "home"
                  ? "bg-white text-[#FF6A00] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              Home
            </button>

            <button
              onClick={() => { setCurrentScreen("profile"); if (soundEnabled) quizAudio.playClick(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                currentScreen === "profile"
                  ? "bg-white text-[#FF6A00] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              Profile
            </button>

            <button
              onClick={() => { setCurrentScreen("packages"); if (soundEnabled) quizAudio.playClick(); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                currentScreen === "packages"
                  ? "bg-white text-[#FF6A00] shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              Package
            </button>

            <button
              onClick={() => { setShowContactModal(true); if (soundEnabled) quizAudio.playClick(); }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all cursor-pointer"
            >
              Contact Us
            </button>
          </nav>

          {/* Right side: Search, Notification, and Settings icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => {
                if (currentScreen === "search") {
                  setCurrentScreen(previousScreen || "home");
                } else {
                  setPreviousScreen(currentScreen);
                  setCurrentScreen("search");
                }
                if (soundEnabled) quizAudio.playClick();
              }}
              className={`p-2 rounded-xl active:scale-95 transition-all cursor-pointer ${
                currentScreen === "search" ? "bg-orange-50 text-[#FF6A00]" : "text-slate-600 hover:bg-slate-100"
              }`}
              title="খুঁজুন"
            >
              <Search className="w-[#1E293B] h-5 stroke-[2.2px]" />
            </button>

            <button 
              onClick={() => {
                if (currentScreen === "notice") {
                  setCurrentScreen(previousScreen || "home");
                } else {
                  setPreviousScreen(currentScreen);
                  setCurrentScreen("notice");
                }
                if (soundEnabled) quizAudio.playClick();
              }}
              className={`p-2 rounded-xl relative active:scale-95 transition-all cursor-pointer ${
                currentScreen === "notice" ? "bg-orange-50 text-[#FF6A00]" : "text-slate-600 hover:bg-slate-100"
              }`}
              title="নোটিশ ও বিজ্ঞপ্তি"
            >
              <Bell className="w-5 h-5 stroke-[2.2px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6A00] rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6A00] rounded-full" />
            </button>
          </div>
        </header>

        {/* Scrollable Main Content Frame */}
        <div className="flex-1 overflow-y-auto overscroll-y-auto pb-2 md:pb-0 bg-slate-50/60 relative touch-pan-y md:px-20 lg:px-48 xl:px-72 2xl:px-96">
          
          {/* ========================================================= */}
          {/* 1. SCREEN: HOME                                           */}
          {/* ========================================================= */}
          {currentScreen === "home" && (
            <div className="p-5 space-y-6 animate-fade-in">
              
              {/* ========================================================= */}
              {/* LIVE EXAM SECTION (লাইভ পরীক্ষা)                         */}
              {/* ========================================================= */}
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <h3 className="font-extrabold text-base text-[#1E293B] tracking-tight">
                      Live Exam (লাইভ পরীক্ষা)
                    </h3>
                  </div>
                  <button 
                    onClick={() => {
                      setPreviousScreen("home");
                      setCurrentScreen("all-live-exams");
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="text-xs font-bold text-[#FF6A00] hover:underline active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>সব পরীক্ষা দেখুন</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Live Exam Card / Carousel / Skeleton Loader */}
                {isExamsLoading ? (
                  /* Skeleton Screen animation while checking server */
                  <div className="bg-white border border-slate-100/90 rounded-3xl p-5 shadow-2xs space-y-3.5 animate-pulse">
                    {/* Top badge skeleton */}
                    <div className="h-3.5 bg-slate-200/80 rounded-full w-36" />
                    
                    {/* Title & subtitle skeleton */}
                    <div className="space-y-2 pt-1">
                      <div className="h-4.5 bg-slate-200/80 rounded-lg w-3/4" />
                      <div className="h-3.5 bg-slate-200/80 rounded-md w-1/3" />
                    </div>
                    
                    {/* Bottom info bar skeleton */}
                    <div className="flex items-center gap-2 pt-1.5">
                      <div className="w-4 h-4 bg-slate-200/80 rounded-sm" />
                      <div className="h-3.5 bg-slate-200/80 rounded-md w-28" />
                    </div>
                  </div>
                ) : liveExamsList.length === 0 ? null : (
                  (() => {
                    const displayList = liveExamsList.length > 1 ? [...liveExamsList, liveExamsList[0]] : liveExamsList;
                    const activeIndex = activeLiveExamIndex % liveExamsList.length;

                    return (
                      <div className="space-y-2.5">
                        {/* Smooth Sliding Carousel Container with Tap & Hold Pause */}
                        <div 
                          className="overflow-hidden rounded-3xl w-full"
                          onMouseDown={() => setIsLivePaused(true)}
                          onMouseUp={() => setIsLivePaused(false)}
                          onTouchStart={() => setIsLivePaused(true)}
                          onTouchEnd={() => setIsLivePaused(false)}
                          onMouseEnter={() => setIsLivePaused(true)}
                          onMouseLeave={() => setIsLivePaused(false)}
                        >
                          <div 
                            className="flex w-full"
                            style={{ 
                              transform: `translateX(-${activeLiveExamIndex * 100}%)`,
                              transition: isLiveTransitioning ? 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                            }}
                          >
                            {displayList.map((currentLive, idx) => {
                              const qCount = currentLive.questions?.length || currentLive.questionCount || 10;
                              const mins = Math.ceil((qCount * 36) / 60);
                              const participantCount = ((currentLive.id.length * 17 + qCount * 3) % 150 + 45);

                              return (
                                <div key={(currentLive.id || 'live') + '-' + idx} className="w-full shrink-0">
                                  {/* Live Exam Apple UI Card */}
                                  <div 
                                    onClick={() => {
                                      setSelectedLiveExamModal(currentLive);
                                      if (soundEnabled) quizAudio.playClick();
                                    }}
                                    className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] relative"
                                  >
                                    {/* Top Banner Strip */}
                                    <div className="bg-gradient-to-r from-[#FF6A00] via-[#FF5500] to-[#E54800] px-4 py-2.5 flex items-center justify-between text-white shadow-2xs">
                                      <span className="text-xs font-black tracking-wide flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 stroke-[2.5]" />
                                        For All Job
                                      </span>
                                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1 animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                        Live Now
                                      </span>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4 sm:p-5 space-y-3">
                                      <div>
                                        <h4 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-[#FF6A00] transition-colors leading-snug">
                                          {currentLive.title}
                                        </h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2">
                                          <span>প্রশ্ন {qCount} টি</span>
                                          <span className="text-slate-300">•</span>
                                          <span>{mins} মিনিট</span>
                                        </p>
                                      </div>

                                      {/* Footer Row: Live Timer & Participant Count */}
                                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold">
                                        {/* Live Timer */}
                                        <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/80">
                                          <span className="relative flex h-2 w-2 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                          </span>
                                          <span>{formatLiveElapsed(currentLive.startDateTime, currentLive.createdAt)}</span>
                                        </div>

                                        {/* Participant Count */}
                                        <div className="text-slate-400 text-[11px] font-bold tracking-tight">
                                          {participantCount} Already participated
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Orange Dot Indicators */}
                        {liveExamsList.length > 1 && (
                          <div className="flex items-center justify-center gap-1.5 pt-0.5">
                            {liveExamsList.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsLiveTransitioning(true);
                                  setActiveLiveExamIndex(idx);
                                }}
                                className={`transition-all duration-300 cursor-pointer ${
                                  idx === activeIndex
                                    ? "w-6 h-2 bg-[#FF6A00] rounded-full shadow-2xs"
                                    : "w-2 h-2 bg-orange-200 hover:bg-orange-300 rounded-full"
                                }`}
                                title={`Live Exam ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Our Course Section */}
              <div className="space-y-3.5 -mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#1E293B] tracking-tight">
                      Our Course
                    </h3>
                  </div>
                  <button 
                    onClick={() => {
                      setPreviousScreen("home");
                      setCurrentScreen("courses");
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="text-xs font-bold text-[#FF6A00] hover:underline active:scale-95 transition-all"
                  >
                    সকল কোর্স
                  </button>
                </div>

                {/* Dynamic Course Grid on Home Screen */}
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-2">
                  {allCoursesData.slice(0, appSettings.ourCoursesHomeLimit || 5).map((course) => {
                    const CourseIcon = course.icon || BookOpen;
                    return (
                      <div 
                        key={course.id}
                        onClick={() => {
                          setSelectedCourseDetail(course);
                          setActiveExamSection(null);
                          setPreviousScreen("courses");
                          setCurrentScreen("course-detail");
                          if (soundEnabled) quizAudio.playClick();
                        }}
                        className="bg-white border border-slate-100 rounded-2xl px-3 py-3.5 sm:py-4 flex flex-row items-center gap-2.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer active:scale-95"
                      >
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 ${course.bg || "bg-orange-50"} rounded-xl flex items-center justify-center ${course.iconColor || "text-orange-600"} shrink-0`}>
                          <CourseIcon className="w-5 h-5 stroke-[2.2px]" />
                        </div>
                        <span className="text-sm sm:text-base font-extrabold text-[#334155] tracking-wide truncate">
                          {course.name || course.title}
                        </span>
                      </div>
                    );
                  })}

                  {/* Grid Item: All Job / সকল কোর্স (Orange background, centered icon and text) */}
                  <div 
                    onClick={() => {
                      setPreviousScreen("home");
                      setCurrentScreen("courses");
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="bg-[#FF6A00] hover:bg-[#FF5500] border border-orange-500 rounded-2xl px-3 py-3.5 sm:py-4 flex flex-row items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95 text-white"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
                      <Briefcase className="w-4 h-4 stroke-[2.5px]" />
                    </div>
                    <span className="text-sm sm:text-base font-extrabold text-white tracking-wide">সকল কোর্স</span>
                  </div>
                </div>
              </div>

              {/* General Quiz Game Live Banner - Solid Orange Layout */}
              <div className="bg-[#FF6A00] rounded-2xl p-4 sm:p-4.5 text-white relative overflow-hidden shadow-md shadow-orange-500/15 border border-orange-500/20">
                <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
                  {/* LEFT SIDE: Title and Subtitle */}
                  <div className="flex flex-col items-start space-y-0.5 flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight text-white">
                      Live Quiz Game
                    </h3>
                    <p className="text-white/95 text-xs sm:text-sm font-extrabold tracking-wide truncate max-w-full">
                      খেলতে খেলতে শিখুন
                    </p>
                  </div>

                  {/* RIGHT SIDE: Start Quiz CTA button */}
                  <button 
                    onClick={() => startQuizFlow("Live Quiz Game", "খেলতে খেলতে শিখুন", isUsingFallback ? QUIZ_QUESTIONS : questions)}
                    className="bg-white hover:bg-orange-50 text-[#FF4E00] font-black text-xs px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-white/80 shrink-0"
                  >
                    <Zap className="w-4 h-4 text-[#FF4E00] fill-[#FF4E00]" />
                    <span>Start Quiz</span>
                  </button>
                </div>
              </div>

              {/* Preparation Hub Section */}
              <div className="space-y-3 -mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#1E293B] tracking-tight">
                    Preparation Hub
                  </h3>
                  <button 
                    onClick={() => {
                      setPreviousScreen("home");
                      setCurrentScreen("prep-all-subjects");
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="text-xs font-bold text-[#FF6A00] hover:underline active:scale-95 transition-all"
                  >
                    সকল বিষয়
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {allPrepSubjectsData.slice(0, appSettings.prepHubHomeLimit || 4).map((subject, idx) => {
                    const SubIcon = subject.icon || BookOpen;
                    return (
                      <div 
                        key={subject.id || idx}
                        onClick={() => {
                          setSelectedPrepSubject(subject.name);
                          setPreviousScreen("home");
                          setCurrentScreen("prep-sub");
                          if (soundEnabled) quizAudio.playClick();
                        }}
                        className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-row items-center gap-3 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer active:scale-95"
                      >
                        <div className={`w-11 h-11 ${subject.bg || "bg-orange-50"} rounded-xl flex items-center justify-center ${subject.text || "text-orange-600"} shrink-0`}>
                          <SubIcon className="w-5.5 h-5.5 stroke-[2.2px]" />
                        </div>
                        <span className="text-sm sm:text-base font-extrabold text-[#334155] tracking-wide truncate">
                          {subject.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Database / Sync health card */}
              <div className="bg-slate-100/50 rounded-2xl p-4 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Server Latency: Normal
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Database: Connected {isUsingFallback && "(Fallback)"}
                </span>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* 2. SCREEN: ACTIVE PLAYABLE QUIZ CONTAINER                 */}
          {/* ========================================================= */}
          {currentScreen === "quiz" && (
            <div className="p-5 space-y-6 animate-fade-in">
              {/* Top Subtitle Badge Bar */}
              <div className="flex items-center justify-end">
                <span className="bg-[#FF6A00]/10 text-[#FF6A00] font-extrabold text-[10px] px-3 py-1 rounded-full uppercase">
                  {activeQuizSubtitle}
                </span>
              </div>

              {/* Top Score Circular HUD */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-800">{activeQuizTitle}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active challenge</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative px-3.5 py-1.5 bg-orange-50/80 border-2 border-orange-500/30 rounded-full flex items-center justify-center shadow-xs">
                    <span className="font-mono font-black text-sm text-orange-600 tracking-tight">
                      {score}/{submittedCount === 0 && quizStarted ? 0 : submittedCount}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase hidden xs:block">Score</span>
                </div>
              </div>

              {/* Loader */}
              {loading && (
                <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center flex flex-col items-center gap-5">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-500 tracking-wider">Syncing Questions database...</span>
                </div>
              )}

              {/* Timed out screen */}
              {!loading && quizStarted && isTimedOut && (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 text-center flex flex-col items-center gap-5 shadow-md">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100 animate-bounce">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-xl text-slate-900">সময় শেষ! (Time's Up)</h3>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-[250px] mx-auto">
                      প্রতিটি প্রশ্নের উত্তর ৩০ সেকেন্ডের মধ্যে দিতে হবে। আবার চেষ্টা করে শতভাগ সঠিক করুন!
                    </p>
                  </div>
                  
                  <button
                    onClick={handleRestart}
                    className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5" />
                    আবার খেলুন
                  </button>
                </div>
              )}

              {/* Completed Screen */}
              {!loading && isCompleted && (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 text-center flex flex-col items-center gap-5 shadow-md">
                  <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center border border-orange-100">
                    <Award className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-2xl text-slate-900">অভিনন্দন!</h3>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-[260px] mx-auto">
                      {score === questions.length 
                        ? "চমৎকার! আপনি সব প্রশ্নের সঠিক উত্তর দিয়েছেন। 🏆" 
                        : score >= questions.length / 2 
                        ? "দুর্দান্ত চেষ্টা! আপনার প্রিপারেশন আরও শক্তিশালী করুন। 🎉" 
                        : "ভালো চেষ্টা! নিয়মিত প্রিপারেশন নিয়ে আরও ভালো করুন।"}
                    </p>
                  </div>

                  <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>সঠিক উত্তর হার (Accuracy)</span>
                    <span className="text-orange-600 font-mono font-extrabold text-base">
                      {submittedCount > 0 ? Math.round((score / submittedCount) * 100) : 0}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={handleRestart}
                      className="py-4 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer text-xs"
                    >
                      <RotateCcw className="w-4 h-4" /> আবার খেলুন
                    </button>
                    <button
                      onClick={() => setCurrentScreen("home")}
                      className="py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl active:scale-[0.98] transition-all cursor-pointer text-xs"
                    >
                      হোমে ফিরে যান
                    </button>
                  </div>
                </div>
              )}

              {/* Active Quiz Card */}
              {quizStarted && !isTimedOut && !isCompleted && currentQuestion && (
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
                  
                  {/* Progress indices */}
                  <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-400">
                    <span>প্রশ্ন {currentQuestionIndex + 1} / {questions.length}</span>
                    <span className={`font-mono text-xs ${timeLeft <= 10 ? "text-red-500 animate-pulse font-black" : "text-orange-500"}`}>
                      {timeLeft < 10 ? `00:0${timeLeft}` : `00:${timeLeft}`}
                    </span>
                  </div>

                  {/* Question header */}
                  <h4 className="font-extrabold text-base sm:text-lg md:text-xl text-slate-800 leading-relaxed">
                    <MathRenderer content={(currentQuestion as any).questionText || currentQuestion.question || (currentQuestion as any).title || "Untitled Question"} />
                  </h4>

                  {/* Timer meter */}
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? "bg-red-500" : "bg-orange-500"}`}
                      style={{ width: `${(timeLeft / 30) * 100}%` }}
                    />
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOptionIndex === index;
                      const isCorrectOption = index === currentQuestion.correctIndex;
                      
                      let btnStyle = "border border-slate-100 text-slate-700 bg-slate-50/50 hover:bg-slate-100/50";
                      let indicator = null;

                      if (isSubmitted) {
                        if (isSelected && isCorrectOption) {
                          btnStyle = "bg-green-50 border-green-200 text-green-700 font-extrabold";
                          indicator = <Check className="w-4 h-4 text-green-600 stroke-[3px]" />;
                        } else if (isSelected && !isCorrectOption) {
                          btnStyle = "bg-red-50 border-red-200 text-red-700 font-extrabold";
                          indicator = <X className="w-4 h-4 text-red-600 stroke-[3px]" />;
                        } else if (isCorrectOption) {
                          btnStyle = "bg-green-50 border-green-100 text-green-700 font-semibold";
                          indicator = <Check className="w-4 h-4 text-green-500 stroke-[3px]" />;
                        } else {
                          btnStyle = "bg-slate-50 border-slate-50 text-slate-400 opacity-60";
                        }
                      } else if (isSelected) {
                        btnStyle = "border-[#FF6A00] bg-orange-50/70 text-orange-950 font-bold shadow-sm shadow-orange-50/20";
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleSelectOption(index)}
                          disabled={isSubmitted}
                          className={`w-full text-left py-3.5 px-5 rounded-2xl text-sm sm:text-base flex items-center justify-between gap-3 transition-all ${btnStyle} ${!isSubmitted ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}`}
                        >
                          <span className="leading-normal"><MathRenderer content={option} /></span>
                          {indicator}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation box on submit */}
                  {isSubmitted && currentQuestion && (
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-slate-800 space-y-1.5 animate-fade-in text-left">
                      <div className="font-extrabold text-amber-800 flex items-center gap-1.5">
                        <span>📌</span>
                        <span>ব্যাখ্যা ও সমাধান:</span>
                      </div>
                      <div className="text-slate-700 font-medium leading-relaxed">
                        <MathRenderer content={currentQuestion.explanation || `সঠিক উত্তর: ${currentQuestion.options[currentQuestion.correctIndex]}`} />
                      </div>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="pt-2">
                    <button
                      onClick={handleNext}
                      disabled={!isSubmitted}
                      className={`w-full py-4 px-6 font-extrabold rounded-2xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                        isSubmitted
                          ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
                          : "bg-slate-200/90 text-slate-400 cursor-not-allowed opacity-70"
                      }`}
                    >
                      {currentQuestionIndex + 1 >= questions.length ? "ফলাফল দেখুন" : "পরবর্তী প্রশ্ন"}
                      <ChevronRight className="w-4 h-4 stroke-[3px]" />
                    </button>
                  </div>

                </div>
              )}

              {/* Bottom Info & Sound Controls Row */}
              <div className="flex items-center justify-between px-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-xs font-extrabold text-slate-700 tracking-wide">
                    খেলতে খেলতে শিখুন
                  </span>
                </div>

                <button 
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("job_master_sound", String(!soundEnabled));
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 rounded-full text-slate-600 shadow-xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                  title={soundEnabled ? "Sound On" : "Sound Off"}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-orange-600" />
                      <span className="text-xs font-bold text-slate-700">শব্দ চালু</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-bold text-red-500">শব্দ বন্ধ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: ALL LIVE EXAMS SCREEN                             */}
          {/* ========================================================= */}
          {currentScreen === "all-live-exams" && (
            <div className="p-4 sm:p-5 space-y-4 animate-fade-in pb-12 text-left">
              <div className="pt-1 pb-1">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  সকল লাইভ পরীক্ষা (Live Exams)
                </h3>
                <p className="text-xs font-extrabold text-slate-400">
                  চলমান সকল লাইভ পরীক্ষা এবং নিয়মিত পরীক্ষা প্যানেল
                </p>
              </div>

              {isExamsLoading ? (
                <div className="bg-white border border-slate-100/90 rounded-3xl p-6 shadow-2xs space-y-3.5 animate-pulse">
                  <div className="h-4 bg-slate-200/80 rounded-full w-48" />
                  <div className="h-4 bg-slate-200/80 rounded-lg w-3/4" />
                  <div className="h-3.5 bg-slate-200/80 rounded-md w-1/2" />
                </div>
              ) : liveExamsList.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 sm:p-10 text-center space-y-3 shadow-2xs">
                  <div className="w-14 h-14 bg-orange-50 text-[#FF6A00] rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
                    📢
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    এই মুহূর্তে কোনো লাইভ এক্সাম নেই
                  </h3>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-400 max-w-xs mx-auto">
                    নতুন লাইভ এক্সাম চালু হলে তা আপনার ড্যাশবোর্ডে এবং এখানে নোটিফিকেশনের মাধ্যমে সরাসরি আপডেট দেখাবে।
                  </p>
                  <button
                    onClick={() => {
                      setCurrentScreen("home");
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    হোম স্ক্রিনে ফিরে যান
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {liveExamsList.map((currentLive, idx) => {
                    const qCount = currentLive.questions?.length || currentLive.questionCount || 10;
                    const mins = Math.ceil((qCount * 36) / 60);
                    const participantCount = ((currentLive.id.length * 17 + qCount * 3) % 150 + 45);

                    return (
                      <div 
                        key={currentLive.id || idx}
                        onClick={() => {
                          setSelectedLiveExamModal(currentLive);
                          if (soundEnabled) quizAudio.playClick();
                        }}
                        className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] relative"
                      >
                        {/* Top Banner Strip */}
                        <div className="bg-gradient-to-r from-[#FF6A00] via-[#FF5500] to-[#E54800] px-4 py-2.5 flex items-center justify-between text-white shadow-2xs">
                          <span className="text-xs font-black tracking-wide flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 stroke-[2.5]" />
                            For All Job
                          </span>
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            Live Now
                          </span>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 sm:p-5 space-y-3">
                          <div>
                            <h4 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-[#FF6A00] transition-colors leading-snug">
                              {currentLive.title}
                            </h4>
                            <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2">
                              <span>প্রশ্ন {qCount} টি</span>
                              <span className="text-slate-300">•</span>
                              <span>{mins} মিনিট</span>
                            </p>
                          </div>

                          {/* Footer Row: Live Timer & Participant Count */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold">
                            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/80">
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                              <span>{formatLiveElapsed(currentLive.startDateTime, currentLive.createdAt)}</span>
                            </div>

                            <div className="text-slate-400 text-[11px] font-bold tracking-tight">
                              {participantCount} Already participated
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. SCREEN: COURSES SCREEN                                 */}
          {/* ========================================================= */}
          {currentScreen === "courses" && (
            <div className="p-4 sm:p-5 space-y-4 animate-fade-in pb-12">
              <div className="pt-1 pb-1 text-center">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  আমাদের কোর্সসমূহ (Our Courses)
                </h3>
              </div>

              {/* 8 Course Subjects Grid - Styled exactly like Home Screen & Preparation Hub cards */}
              {filteredCoursesList.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs">
                  কোনো কোর্স পাওয়া যায়নি।
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {filteredCoursesList.map((course) => {
                    const CourseIcon = course.icon;
                    return (
                      <div 
                        key={course.id}
                        onClick={() => {
                          setSelectedCourseDetail(course);
                          setActiveExamSection(null);
                          setPreviousScreen("courses");
                          setCurrentScreen("course-detail");
                          if (soundEnabled) quizAudio.playClick();
                        }}
                        className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-row items-center gap-3 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer active:scale-95"
                      >
                        <div className={`w-11 h-11 ${course.bg} rounded-xl flex items-center justify-center ${course.iconColor} shrink-0`}>
                          <CourseIcon className="w-5.5 h-5.5 stroke-[2.2px]" />
                        </div>
                        <span className="text-sm sm:text-base font-extrabold text-[#334155] tracking-wide truncate">
                          {course.name || course.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PREPARATION HUB ALL SUBJECTS SCREEN                        */}
          {/* ========================================================= */}
          {currentScreen === "prep-all-subjects" && (
            <div className="p-5 space-y-4 animate-fade-in pb-10 text-left">
              
              <div className="pt-1 pb-1">
                <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                  বিষয়সমূহ সিলেক্ট করুন (Select Subject)
                </h3>
                <p className="text-xs font-extrabold text-slate-400">
                  নিচের যেকোনো বিষয় সিলেক্ট করে কুইজ ও প্রশ্নপত্র প্র্যাকটিস করুন
                </p>
              </div>

              {/* Subjects Grid - Apple UI Cards */}
              <div className="grid grid-cols-2 gap-3">
                {allPrepSubjectsData
                .filter(s => s.name.toLowerCase().includes(prepSubjectSearchQuery.toLowerCase()) || (s.bnName && s.bnName.includes(prepSubjectSearchQuery)))
                .map((subject, idx) => {
                  const SubIcon = subject.icon || BookOpen;
                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedPrepSubject(subject.name);
                        setPreviousScreen("prep-all-subjects");
                        setCurrentScreen("prep-sub");
                        if (soundEnabled) quizAudio.playClick();
                      }}
                      className="bg-white border border-slate-100 hover:border-[#FF6A00]/40 rounded-2xl p-3 flex flex-row items-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group text-left"
                    >
                      <div className={`w-11 h-11 ${subject.bg} ${subject.text} rounded-xl flex items-center justify-center shrink-0`}>
                        <SubIcon className="w-5.5 h-5.5 stroke-[2.2px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-extrabold text-[#334155] tracking-wide block truncate group-hover:text-[#FF6A00] transition-colors">
                          {subject.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PREPARATION HUB SUB-SUBJECTS SCREEN                        */}
          {/* ========================================================= */}
          {currentScreen === "prep-sub" && (
            <div className="p-5 space-y-4 animate-fade-in pb-10 text-left">
              
              {/* Sub-subjects grid */}
              <div className="space-y-3 pt-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-800 text-center w-full py-1">
                  বিষয় সিলেক্ট করুন
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {(() => {
                    let subSubjectsList: { name: string; sub: string; questions: Question[]; subCategories2?: any[] }[] = [];

                    const dbMatch = prepSubjectsList.find(s => 
                      s.name.toLowerCase() === selectedPrepSubject.toLowerCase() || 
                      (s.bnName && s.bnName === selectedPrepSubject) || 
                      s.id === selectedPrepSubject
                    );

                    if (dbMatch && dbMatch.subSubjects && dbMatch.subSubjects.length > 0) {
                      subSubjectsList = dbMatch.subSubjects.map(sub => ({
                        name: sub.name,
                        sub: sub.sub || "অধ্যায় ভিত্তিক প্রস্তুতি",
                        questions: QUIZ_QUESTIONS,
                        subCategories2: sub.subCategories2 || []
                      }));
                    }

                    if (subSubjectsList.length === 0) {
                      // Filter exam papers matching this subject directly
                      const matchingPapers = examPapers.filter(p => {
                        const pCat = (p.categoryType || "").toLowerCase();
                        const pCourse = (p.course || "").toLowerCase();
                        const pSubject = (p.subSubject || p.subject || "").toLowerCase();
                        const target = selectedPrepSubject.toLowerCase();
                        return pCat === "prep_hub" && (
                          pCourse === target || pSubject === target ||
                          pCourse.includes(target) || target.includes(pCourse)
                        );
                      });

                      return (
                        <div className="space-y-4 pt-1">
                          {matchingPapers.length > 0 ? (
                            <div className="space-y-3">
                              <p className="text-xs font-extrabold text-slate-500">
                                {selectedPrepSubject} এর প্রশ্নপত্রসমূহ:
                              </p>
                              {matchingPapers.map((paper) => (
                                <div
                                  key={paper.id}
                                  onClick={() => {
                                    setSelectedLiveExamModal(paper);
                                    if (soundEnabled) quizAudio.playClick();
                                  }}
                                  className="bg-white border border-slate-100 hover:border-[#FF6A00]/40 rounded-2xl p-4 flex items-center justify-between shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                                      📝
                                    </div>
                                    <div className="text-left">
                                      <h5 className="text-xs sm:text-sm font-extrabold text-slate-800">
                                        {paper.title}
                                      </h5>
                                      <p className="text-[10px] text-slate-400 font-bold">
                                        {paper.questionCount || 20}টি প্রশ্ন • {paper.topic || "সাধারণ কুইজ"}
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center space-y-2 shadow-2xs">
                              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                                <BookOpen className="w-6 h-6" />
                              </div>
                              <div>
                                <h5 className="text-sm font-extrabold text-slate-800">
                                  কোনো সাবজেক্ট/পরীক্ষা যুক্ত করা হয়নি
                                </h5>
                                <p className="text-xs text-slate-400 mt-1">
                                  এডমিন প্যানেল থেকে পরীক্ষা যুক্ত করা হলে তা এখানে দেখাবে।
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return subSubjectsList.map((sub, idx) => {
                      // Calculate count of specific exam papers for badge
                      const specificPapersCount = examPapers.filter(p => {
                        const pCourse = (p.course || "").toLowerCase();
                        const pSub = (p.subSubject || p.subject || "").toLowerCase();
                        const targetSub = sub.name.toLowerCase();

                        // Exclude general all_courses and all subjects (Requirement 3)
                        if (pCourse === "all_courses" || pCourse === "all") return false;
                        if (pSub === "all subjects" || pSub === "all") return false;

                        const selectedNorm = selectedPrepSubject.toLowerCase();
                        const courseMatch =
                          pCourse === selectedNorm ||
                          (selectedNorm === "mathematics" && (pCourse === "math" || pCourse === "mathematics")) ||
                          (selectedNorm === "general knowledge" && (pCourse === "general_knowledge" || pCourse === "gk")) ||
                          (selectedNorm === "general science" && (pCourse === "general_science" || pCourse === "gen_science")) ||
                          (selectedNorm === "mental ability" && (pCourse === "mental_ability" || pCourse === "mental")) ||
                          (selectedNorm === "good governance" && (pCourse === "good_governance" || pCourse === "governance"));

                        if (!courseMatch) return false;

                        return pSub === targetSub || pSub.includes(targetSub) || targetSub.includes(pSub) ||
                          (pSub.includes("1st") && targetSub.includes("1st")) ||
                          (pSub.includes("2nd") && targetSub.includes("2nd")) ||
                          (pSub.includes("পাটিগণিত") && targetSub.includes("পাটিগণিত")) ||
                          (pSub.includes("বীজগণিত") && targetSub.includes("বীজগণিত")) ||
                          (pSub.includes("জ্যামিতি") && targetSub.includes("জ্যামিতি"));
                      }).length;

                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            setSelectedPrepSubSubject(sub);
                            setSelectedLevel3Topic(null);
                            setPreviousScreen("prep-sub");
                            setCurrentScreen("prep-sub-detail");
                            if (soundEnabled) quizAudio.playClick();
                          }}
                          className="bg-white border border-slate-100 hover:border-[#FF6A00]/40 rounded-[2rem] p-4.5 shadow-xs cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-11 h-11 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#FF6A00] group-hover:text-white transition-colors">
                                <BookOpen className="w-5.5 h-5.5 stroke-[2.2px]" />
                              </div>
                              <div className="text-left space-y-0.5 truncate">
                                <h5 className="text-xs sm:text-sm font-black text-slate-800 leading-snug group-hover:text-[#FF6A00] transition-colors truncate">
                                  {sub.name}
                                </h5>
                                <p className="text-[10px] font-bold text-slate-400 truncate">{sub.sub}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {specificPapersCount > 0 ? (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                  {specificPapersCount}টি প্রশ্নপত্র
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                                  ভেতরে দেখুন
                                </span>
                              )}
                              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 group-hover:text-[#FF6A00] flex items-center justify-center text-slate-400 transition-colors">
                                <ChevronRight className="w-4 h-4 stroke-[2.5px]" />
                              </div>
                            </div>
                          </div>

                          {/* Level 3 Sub-Categories / Topics Badges */}
                          {sub.subCategories2 && sub.subCategories2.length > 0 && (
                            <div className="pt-2 border-t border-slate-100/80 flex flex-wrap items-center gap-1.5 text-left">
                              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-lg shrink-0">
                                🏷️ লেভেল ৩ ({sub.subCategories2.length}টি টপিক):
                              </span>
                              {sub.subCategories2.map((s2: any, s2Idx: number) => (
                                <span key={s2Idx} className="text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg">
                                  🔹 {s2.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Main Subject Quick Tools (Controlled by Admin toggle showQuickTools) */}
              {(() => {
                const currentObj: any = allPrepSubjectsData.find((s: any) => 
                  s.name.toLowerCase() === selectedPrepSubject.toLowerCase() || 
                  (s.bnName && s.bnName.toLowerCase() === selectedPrepSubject.toLowerCase()) || 
                  s.id === selectedPrepSubject
                );
                const shouldShowQT = currentObj ? (currentObj.showQuickTools !== false) : true;
                if (!shouldShowQT) return null;

                return (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                      কুইক টুলস ও আর্কাইভ (Quick Tools)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: "Archive", icon: "📂", color: "bg-purple-50 text-purple-600" },
                        { name: "Result", icon: "🏆", color: "bg-amber-50 text-amber-600" },
                        { name: "Routine", icon: "📅", color: "bg-blue-50 text-blue-600" },
                        { name: "Syllabus", icon: "📜", color: "bg-green-50 text-green-600" },
                        { name: "PDFs", icon: "📄", color: "bg-[#FFF1E6] text-[#FF6A00]" },
                        { name: "Favorite", icon: "🩶", color: "bg-rose-50 text-rose-600" },
                        { name: "Merit List", icon: "🎖️", color: "bg-indigo-50 text-indigo-600" },
                        { name: "Wrong & Unans", icon: "✕", color: "bg-red-50 text-red-600" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.name === "Archive") {
                              setArchiveFilterCourse(selectedPrepSubject);
                              setArchiveModalOpen(true);
                            } else if (item.name === "Routine") {
                              setCurrentScreen("routine");
                            } else if (item.name === "Result" || item.name === "Merit List") {
                              setCurrentScreen("tests");
                            } else {
                              setQuickToolModal({ name: item.name, icon: item.icon });
                            }
                            if (soundEnabled) quizAudio.playClick();
                          }}
                          className="bg-white border border-slate-100 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 text-center hover:border-orange-200 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <span className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center text-sm font-black`}>
                            {item.icon}
                          </span>
                          <span className="text-[11px] font-extrabold text-slate-700 leading-tight block truncate w-full">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================= */}
          {/* PREPARATION HUB SUB-SUBJECT DETAIL SCREEN (Requirement 2, 3, 4) */}
          {/* ========================================================= */}
          {currentScreen === "prep-sub-detail" && selectedPrepSubSubject && (
            <div className="p-5 space-y-5 animate-fade-in pb-10 text-left">
              
              {/* Level 3 Topics / Sub-categories Bar */}
              {selectedPrepSubSubject.subCategories2 && selectedPrepSubSubject.subCategories2.length > 0 && (
                <div className="bg-white border border-slate-200/90 rounded-[2rem] p-4.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>লেভেল ৩ সাব-ক্যাটাগরি ও টপিকসমূহ:</span>
                    </h5>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {selectedPrepSubSubject.subCategories2.length}টি টপিক
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => setSelectedLevel3Topic(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        !selectedLevel3Topic
                          ? "bg-[#FF6A00] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      সকল টপিক ({selectedPrepSubSubject.subCategories2.length})
                    </button>
                    {selectedPrepSubSubject.subCategories2.map((sub2: any, sub2Idx: number) => {
                      const isSelected = selectedLevel3Topic === sub2.name;
                      return (
                        <button
                          key={sub2.id || sub2Idx}
                          onClick={() => setSelectedLevel3Topic(isSelected ? null : sub2.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100"
                          }`}
                        >
                          <span>🔹</span>
                          <span>{sub2.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Exam Types Section Cards & Selector (Identical to Our Course) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>পরীক্ষার সেকশন সিলেক্ট করুন:</span>
                  </h4>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-200">
                    {selectedPrepSubSubject.name}
                  </span>
                </div>

                {/* Section Cards Grid - Identical to Our Course */}
                <div className="flex flex-col gap-3">
                  {(() => {
                    const allPrepSections = [
                      { 
                        id: "daily", 
                        title: "Daily Quick Test", 
                        banglaTitle: "⚡ ডেইলি কুইক টেস্ট",
                        desc: "প্রতিদিনের বিষয়ভিত্তিক শর্ট কুইজ টেস্ট",
                        color: "border-amber-200/90 hover:border-amber-400 bg-white",
                        iconBg: "bg-amber-100 text-amber-700",
                        icon: "⚡"
                      },
                      { 
                        id: "weekly", 
                        title: "Weekly Model Test", 
                        banglaTitle: "📅 সাপ্তাহিক মডেল টেস্ট",
                        desc: "সাপ্তাহিক লাইভ ফুল মডেল টেস্ট",
                        color: "border-purple-200/90 hover:border-purple-400 bg-white",
                        iconBg: "bg-purple-100 text-purple-700",
                        icon: "📅"
                      },
                      { 
                        id: "subject", 
                        title: "Subject Wise Test", 
                        banglaTitle: "📚 বিষয়ভিত্তিক পরীক্ষা",
                        desc: "বিষয় অনুযায়ী নির্দিষ্ট অধ্যায়ের কুইজ",
                        color: "border-blue-200/90 hover:border-blue-400 bg-white",
                        iconBg: "bg-blue-100 text-blue-700",
                        icon: "📚"
                      }
                    ];

                    const dbMatch = prepSubjectsList.find(s => 
                      s.name.toLowerCase() === selectedPrepSubject.toLowerCase() || 
                      (s.bnName && s.bnName === selectedPrepSubject) || 
                      s.id === selectedPrepSubject
                    );

                    return allPrepSections.map((sec) => {
                      const count = examPapers.filter(p => {
                        const status = getExamStatus(p);
                        if (status !== "Live") return false;
                        
                        const pCourse = (p.course || "").toLowerCase();
                        const pSubject = (p.subject || "").toLowerCase();
                        const pSubSubject = (p.subSubject || "").toLowerCase();
                        const pCat = (p.categoryType || "").toLowerCase();

                        if (pCourse === "all_courses" || (pCourse === "all" && pSubSubject === "all" && pSubject === "all")) return false;

                        const selectedNorm = selectedPrepSubject.toLowerCase();
                        const dbMatchId = (dbMatch?.id || "").toLowerCase();
                        const dbMatchName = (dbMatch?.name || "").toLowerCase();

                        const courseMatch =
                          pCat === "prep_hub" ||
                          pCourse === selectedNorm ||
                          pCourse === dbMatchId ||
                          pCourse === dbMatchName ||
                          pSubject === selectedNorm ||
                          pSubject === dbMatchName;

                        if (!courseMatch) return false;

                        const targetSub = selectedPrepSubSubject.name.toLowerCase();
                        const isSubMatch = 
                          pSubSubject === targetSub ||
                          pSubject === targetSub ||
                          pSubSubject.includes(targetSub) ||
                          targetSub.includes(pSubSubject) ||
                          pSubSubject === "all";

                        if (!isSubMatch) return false;

                        if (sec.id === "daily") return p.examType === "daily";
                        if (sec.id === "weekly") return p.examType === "weekly";
                        if (sec.id === "subject") return p.examType === "subject" || !p.examType;
                        return true;
                      }).length;

                      const isSelected = selectedPrepExamTypeFilter === sec.id;

                      return (
                        <div
                          key={sec.id}
                          onClick={() => {
                            setSelectedPrepExamTypeFilter(sec.id as any);
                            if (soundEnabled) quizAudio.playClick();
                          }}
                          className={`w-full ${sec.color} border rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group ${
                            isSelected ? "ring-2 ring-[#FF6A00] bg-orange-50/20" : ""
                          }`}
                        >
                          {/* Left side: Icon + Text */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-11 h-11 rounded-2xl ${sec.iconBg} flex items-center justify-center text-lg font-black shrink-0 shadow-2xs`}>
                              {sec.icon}
                            </div>
                            <div className="space-y-0.5 truncate text-left">
                              <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#FF6A00] transition-colors truncate">
                                {sec.title}
                              </h4>
                              <p className="text-[11px] font-bold text-slate-400 truncate">
                                {sec.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right side: Badge + Arrow */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                              count > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : "bg-slate-100 text-slate-500"
                            }`}>
                              {count} Live
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isSelected ? "bg-[#FF6A00] text-white" : "bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-[#FF6A00]"
                            }`}>
                              <ChevronRight className="w-4 h-4 stroke-[2.5px]" />
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Selected Exam Type Section Papers List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-bold text-slate-800 text-left">
                    {selectedLevel3Topic 
                      ? `"${selectedLevel3Topic}" - প্রশ্নপত্র` 
                      : selectedPrepExamTypeFilter === "daily" 
                        ? "⚡ Daily Quick Test - প্রশ্নপত্র"
                        : selectedPrepExamTypeFilter === "weekly"
                          ? "📅 Weekly Model Test - প্রশ্নপত্র"
                          : "📚 Subject Wise Test - প্রশ্নপত্র"}
                  </h4>
                  <span className="text-xs font-black text-[#FF6A00] bg-orange-50 border border-orange-200/80 px-3 py-1 rounded-full">
                    {selectedPrepExamTypeFilter === "daily" ? "Daily" : selectedPrepExamTypeFilter === "weekly" ? "Weekly" : "Subject"}
                  </span>
                </div>

                {(() => {
                  const dbMatch = prepSubjectsList.find(s => 
                    s.name.toLowerCase() === selectedPrepSubject.toLowerCase() || 
                    (s.bnName && s.bnName === selectedPrepSubject) || 
                    s.id === selectedPrepSubject
                  );

                  let subPapers = examPapers.filter(paper => {
                    const pCourse = (paper.course || "").toLowerCase();
                    const pSubject = (paper.subject || "").toLowerCase();
                    const pSubSubject = (paper.subSubject || "").toLowerCase();
                    const pCat = (paper.categoryType || "").toLowerCase();

                    // Exclude general all_courses or all subjects tests unless specific
                    if (pCourse === "all_courses" || (pCourse === "all" && pSubSubject === "all" && pSubject === "all")) return false;

                    // Match Course / Parent Subject
                    const selectedNorm = selectedPrepSubject.toLowerCase();
                    const dbMatchId = (dbMatch?.id || "").toLowerCase();
                    const dbMatchName = (dbMatch?.name || "").toLowerCase();
                    const dbMatchBn = (dbMatch?.bnName || "").toLowerCase();

                    const courseMatch =
                      pCat === "prep_hub" ||
                      pCourse === selectedNorm ||
                      pCourse === dbMatchId ||
                      pCourse === dbMatchName ||
                      pCourse === dbMatchBn ||
                      pSubject === selectedNorm ||
                      pSubject === dbMatchName ||
                      selectedNorm.includes(pCourse) || (pCourse && selectedNorm.includes(pCourse)) ||
                      (selectedNorm.includes("math") && (pCourse.includes("math") || pSubject.includes("math"))) ||
                      (selectedNorm.includes("bangla") && (pCourse.includes("bangla") || pSubject.includes("bangla"))) ||
                      (selectedNorm.includes("gk") && (pCourse.includes("gk") || pCourse.includes("general_knowledge"))) ||
                      (selectedNorm.includes("bcs") && (pCourse.includes("bcs") || pSubject.includes("bcs")));

                    if (!courseMatch) return false;

                    // Match SubSubject
                    const targetSub = selectedPrepSubSubject.name.toLowerCase();
                    const isSubMatch = 
                      pSubSubject === targetSub ||
                      pSubject === targetSub ||
                      pSubSubject.includes(targetSub) ||
                      targetSub.includes(pSubSubject) ||
                      pSubSubject === "all" ||
                      (targetSub.includes("1st") && (pSubSubject.includes("1st") || pSubject.includes("1st"))) ||
                      (targetSub.includes("2nd") && (pSubSubject.includes("2nd") || pSubject.includes("2nd"))) ||
                      (targetSub.includes("পাটিগণিত") && (pSubSubject.includes("পাটিগণিত") || pSubject.includes("পাটিগণিত") || pSubSubject.includes("arithmetic"))) ||
                      (targetSub.includes("বীজগণিত") && (pSubSubject.includes("বীজগণিত") || pSubject.includes("বীজগণিত") || pSubSubject.includes("algebra"))) ||
                      (targetSub.includes("জ্যামিতি") && (pSubSubject.includes("জ্যামিতি") || pSubject.includes("জ্যামিতি") || pSubSubject.includes("geometry")));

                    return isSubMatch;
                  });

                  // Filter by Exam Type (Daily Quick Test / Weekly Model Test / Subject Wise Test)
                  subPapers = subPapers.filter(paper => {
                    if (selectedPrepExamTypeFilter === "daily") {
                      return (
                        paper.examType === "daily" ||
                        (paper.title && (paper.title.toLowerCase().includes("daily") || paper.title.toLowerCase().includes("ডেইলি")))
                      );
                    }
                    if (selectedPrepExamTypeFilter === "weekly") {
                      return (
                        paper.examType === "weekly" ||
                        (paper.title && (paper.title.toLowerCase().includes("weekly") || paper.title.toLowerCase().includes("সাপ্তাহিক")))
                      );
                    }
                    if (selectedPrepExamTypeFilter === "subject") {
                      return (
                        paper.examType === "subject" ||
                        !paper.examType ||
                        (paper.title && (paper.title.toLowerCase().includes("subject") || paper.title.toLowerCase().includes("বিষয়ভিত্তিক")))
                      );
                    }
                    return true;
                  });

                  if (selectedLevel3Topic) {
                    const normTopic = selectedLevel3Topic.toLowerCase();
                    subPapers = subPapers.filter(paper => {
                      const pTopic = (paper.topic || "").toLowerCase();
                      const pTitle = (paper.title || "").toLowerCase();
                      const pSub = (paper.subSubject || "").toLowerCase();
                      return pTopic.includes(normTopic) || pTitle.includes(normTopic) || pSub.includes(normTopic);
                    });
                  }

                  if (subPapers.length === 0) {
                    return (
                      <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 text-center space-y-3 shadow-2xs">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                          {selectedPrepExamTypeFilter === "daily" ? "⚡" : selectedPrepExamTypeFilter === "weekly" ? "📅" : "📚"}
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-slate-800">
                          বর্তমানে কোনো পরীক্ষা লাইভ বা আসন্ন নেই
                        </h3>
                        <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                          এই সাব-সাবজেক্টের ({selectedPrepSubSubject.name}) জন্য এখনো কোনো {selectedPrepExamTypeFilter === "daily" ? "ডেইলি কুইক" : selectedPrepExamTypeFilter === "weekly" ? "সাপ্তাহিক মডেল" : "বিষয়ভিত্তিক"} পরীক্ষা প্রকাশিত হয়নি। এডমিন প্যানেল থেকে প্রশ্নপত্র প্রকাশিত হলে তা এখানে দেখাবে।
                        </p>
                      </div>
                    );
                  }

                  const examTypeBadgeMap: Record<string, { label: string; bg: string }> = {
                    daily: { label: "⚡ Daily Quick Test", bg: "bg-amber-50 text-amber-700 border-amber-100" },
                    weekly: { label: "📅 Weekly Model Test", bg: "bg-purple-50 text-purple-700 border-purple-100" },
                    special: { label: "🩺 BCS Health Quiz", bg: "bg-rose-50 text-rose-700 border-rose-100" },
                    subject: { label: "📚 Subject Wise Test", bg: "bg-blue-50 text-blue-700 border-blue-100" }
                  };

                  return (
                    <div className="space-y-4">
                      {subPapers.map(paper => {
                        const computedStatus = getExamStatus(paper);
                        const totalSec = paper.totalDurationSeconds || (paper.questions?.length || 10) * 36;
                        const durationMins = Math.floor(totalSec / 60);
                        const typeBadge = examTypeBadgeMap[paper.examType] || { 
                          label: paper.examType === "daily" ? "⚡ Daily Quick Test" : paper.examType === "weekly" ? "📅 Weekly Model Test" : "📚 Subject Wise Test", 
                          bg: paper.examType === "daily" ? "bg-amber-50 text-amber-700 border-amber-100" : paper.examType === "weekly" ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-blue-50 text-blue-700 border-blue-100"
                        };

                        return (
                          <div 
                            key={paper.id} 
                            className="bg-white border border-slate-200/80 hover:border-orange-200 rounded-[2rem] p-5 shadow-2xs space-y-3.5 transition-all"
                          >
                            {/* Header Date & Badges */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-[11px] font-extrabold text-slate-500">
                                📅 {paper.examDate || "Fri, Jul 31, 2026"}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border ${typeBadge.bg}`}>
                                  {typeBadge.label}
                                </span>
                                {computedStatus === "Live" && (
                                  <span className="bg-emerald-50 text-emerald-600 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">
                                    ● Live
                                  </span>
                                )}
                                {computedStatus === "Upcoming" && (
                                  <span className="bg-amber-50 text-amber-700 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                                    ⏳ Upcoming
                                  </span>
                                )}
                                {computedStatus === "Archive" && (
                                  <span className="bg-slate-100 text-slate-600 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-slate-200">
                                    📂 Archive
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Marks & Duration */}
                            <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                              <span>Marks: {paper.totalMarks || paper.questions?.length || 10}</span>
                              <span>•</span>
                              <span>Duration: {durationMins} mins</span>
                            </div>

                            {/* Title & Topic */}
                            <div className="space-y-1">
                              {paper.topic && (
                                <div className="text-xs font-extrabold text-[#FF6A00]">
                                  Topic: <span className="text-slate-800 font-bold">"{paper.topic}"</span>
                                </div>
                              )}
                              <h4 className="text-sm font-black text-slate-800 leading-snug">
                                <MathRenderer content={paper.title} />
                              </h4>
                            </div>

                            {/* Action Buttons: Take Exam & Question Paper */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <button
                                onClick={() => {
                                  setSelectedLiveExamModal(paper);
                                  if (soundEnabled) quizAudio.playClick();
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-3 rounded-2xl active:scale-95 transition-all shadow-md shadow-purple-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>📝 পরীক্ষা দিন</span>
                              </button>

                              <button
                                onClick={() => handleOpenViewPaper(paper)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-2xl active:scale-95 transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>📄 প্রশ্নপত্র</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Sub-Subject Quick Tools (Requirement 2: Below published question papers) */}
              {(() => {
                const currentObj: any = allPrepSubjectsData.find((s: any) => 
                  s.name.toLowerCase() === selectedPrepSubject.toLowerCase() || 
                  (s.bnName && s.bnName.toLowerCase() === selectedPrepSubject.toLowerCase()) || 
                  s.id === selectedPrepSubject
                );
                const shouldShowQT = currentObj ? (currentObj.showQuickTools !== false) : true;
                if (!shouldShowQT) return null;

                return (
                  <div className="space-y-2 pt-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                      কুইক টুলস ও আর্কাইভ (Quick Tools)
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: "Archive", icon: "📂", color: "bg-purple-50 text-purple-600" },
                        { name: "Result", icon: "🏆", color: "bg-amber-50 text-amber-600" },
                        { name: "Routine", icon: "📅", color: "bg-blue-50 text-blue-600" },
                        { name: "Syllabus", icon: "📜", color: "bg-green-50 text-green-600" },
                        { name: "PDFs", icon: "📄", color: "bg-[#FFF1E6] text-[#FF6A00]" },
                        { name: "Favorite", icon: "🩶", color: "bg-rose-50 text-rose-600" },
                        { name: "Merit List", icon: "🎖️", color: "bg-indigo-50 text-indigo-600" },
                        { name: "Wrong & Unans", icon: "✕", color: "bg-red-50 text-red-600" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.name === "Archive") {
                              setArchiveFilterCourse(selectedPrepSubject);
                              setArchiveModalOpen(true);
                            } else if (item.name === "Routine") {
                              setCurrentScreen("routine");
                            } else if (item.name === "Result" || item.name === "Merit List") {
                              setCurrentScreen("tests");
                            } else {
                              setQuickToolModal({ name: item.name, icon: item.icon });
                            }
                            if (soundEnabled) quizAudio.playClick();
                          }}
                          className="bg-white border border-slate-100 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 text-center hover:border-orange-200 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <span className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center text-sm font-black`}>
                            {item.icon}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-700 truncate w-full">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================= */}
          {/* COURSE DETAIL SCREEN                                      */}
          {/* ========================================================= */}
          {currentScreen === "course-detail" && selectedCourseDetail && (
            <div className="p-4 sm:p-5 space-y-4 animate-fade-in pb-10 text-left">
              
              {/* CASE 1: Main Course Screen - Only Stacked Exam Section List (Apple Style) */}
              {!activeExamSection && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3">
                    {(() => {
                      const allSections = [
                        { 
                          id: "daily", 
                          title: "Daily Quick Test", 
                          banglaTitle: "⚡ ডেইলি কুইক টেস্ট",
                          desc: "প্রতিদিনের বিষয়ভিত্তিক শর্ট কুইজ টেস্ট",
                          color: "border-amber-200/90 hover:border-amber-400 bg-white",
                          iconBg: "bg-amber-100 text-amber-700",
                          icon: "⚡"
                        },
                        { 
                          id: "weekly", 
                          title: "Weekly Model Test", 
                          banglaTitle: "📅 সাপ্তাহিক মডেল টেস্ট",
                          desc: "সাপ্তাহিক লাইভ ফুল মডেল টেস্ট",
                          color: "border-purple-200/90 hover:border-purple-400 bg-white",
                          iconBg: "bg-purple-100 text-purple-700",
                          icon: "📅"
                        },
                        { 
                          id: "subject", 
                          title: "Subject Wise Test", 
                          banglaTitle: "📚 বিষয়ভিত্তিক পরীক্ষা",
                          desc: "বিষয় অনুযায়ী নির্দিষ্ট অধ্যায়ের কুইজ",
                          color: "border-blue-200/90 hover:border-blue-400 bg-white",
                          iconBg: "bg-blue-100 text-blue-700",
                          icon: "📚"
                        }
                      ];

                      return allSections.map((sec) => {
                        const count = examPapers.filter(p => {
                          const status = getExamStatus(p);
                          if (status !== "Live") return false;
                          if (p.course && p.course !== "all_courses" && p.course !== "all" && p.course !== selectedCourseDetail.id) return false;
                          return p.examType === sec.id || (sec.id === "subject" && (!p.examType || p.examType === "subject"));
                        }).length;

                        return (
                          <div
                            key={sec.id}
                            onClick={() => {
                              setActiveExamSection(sec.id as any);
                              if (soundEnabled) quizAudio.playClick();
                            }}
                            className={`w-full ${sec.color} border rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group`}
                          >
                            {/* Left side: Icon + Text */}
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-11 h-11 rounded-2xl ${sec.iconBg} flex items-center justify-center text-lg font-black shrink-0 shadow-2xs`}>
                                {sec.icon}
                              </div>
                              <div className="space-y-0.5 truncate">
                                <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#FF6A00] transition-colors truncate">
                                  {sec.title}
                                </h4>
                                <p className="text-[11px] font-bold text-slate-400 truncate">
                                  {sec.desc}
                                </p>
                              </div>
                            </div>

                            {/* Right side: Badge + Arrow */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                count > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : "bg-slate-100 text-slate-500"
                              }`}>
                                {count} Live
                              </span>
                              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 group-hover:text-[#FF6A00] flex items-center justify-center text-slate-400 transition-colors">
                                <ChevronRight className="w-4 h-4 stroke-[2.5px]" />
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Other Courses & Sub-Subjects Section */}
                  {selectedCourseDetail.subSubjects && selectedCourseDetail.subSubjects.length > 0 && (
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🎓</span>
                          <span>অন্যান্য কোর্স</span>
                        </h4>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6A00] border border-orange-200">
                          {selectedCourseDetail.subSubjects.length}টি কোর্স
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {selectedCourseDetail.subSubjects.map((subItem: any, sIdx: number) => {
                          const sub2List = subItem.subCategories2 || [];
                          
                          // Calculate live exams count for this subSubject / subject
                          const liveCount = examPapers.filter(p => {
                            const status = getExamStatus(p);
                            if (status !== "Live") return false;
                            if (p.course && p.course !== "all_courses" && p.course !== "all" && p.course !== selectedCourseDetail.id) return false;
                            const pSub = (p.subSubject || p.subject || "").toLowerCase();
                            const targetSub = (subItem.name || "").toLowerCase();
                            if (!pSub || !targetSub) return false;
                            return pSub === targetSub || pSub.includes(targetSub) || targetSub.includes(pSub) ||
                              (pSub.includes("1st") && targetSub.includes("1st")) ||
                              (pSub.includes("2nd") && targetSub.includes("2nd")) ||
                              (pSub.includes("পাটিগণিত") && targetSub.includes("পাটিগণিত")) ||
                              (pSub.includes("বীজগণিত") && targetSub.includes("বীজগণিত")) ||
                              (pSub.includes("জ্যামিতি") && targetSub.includes("জ্যামিতি"));
                          }).length;

                          return (
                            <div 
                              key={subItem.id || sIdx}
                              onClick={() => {
                                setSelectedPrepSubject(selectedCourseDetail.title || selectedCourseDetail.name || "Course");
                                setSelectedPrepSubSubject(subItem);
                                setSelectedLevel3Topic(null);
                                setPreviousScreen("course-detail");
                                setCurrentScreen("prep-sub-detail");
                                if (soundEnabled) quizAudio.playClick();
                              }}
                              className="w-full bg-white border border-slate-200/90 hover:border-orange-400 rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 flex flex-col gap-3 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
                            >
                              <div className="flex items-center justify-between gap-3 w-full">
                                {/* Left side: Icon + Title + Desc */}
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#FF6A00] group-hover:bg-[#FF6A00] group-hover:text-white transition-colors flex items-center justify-center text-lg font-black shrink-0 shadow-2xs">
                                    📚
                                  </div>
                                  <div className="space-y-0.5 truncate text-left">
                                    <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#FF6A00] transition-colors truncate">
                                      {subItem.name}
                                    </h4>
                                    <p className="text-[11px] font-bold text-slate-400 truncate">
                                      {subItem.sub || "অধ্যায় ও বিষয়ভিত্তিক স্পেশাল কুইজ ও এক্সাম"}
                                    </p>
                                  </div>
                                </div>

                                {/* Right side: Live Exam Count Badge + Arrow */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                    liveCount > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {liveCount} Live
                                  </span>
                                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 group-hover:text-[#FF6A00] flex items-center justify-center text-slate-400 transition-colors">
                                    <ChevronRight className="w-4 h-4 stroke-[2.5px]" />
                                  </div>
                                </div>
                              </div>

                              {/* Level 3 Sub-Topics */}
                              {sub2List.length > 0 && (
                                <div className="pt-2 border-t border-slate-100/80 flex flex-wrap items-center gap-1.5 text-left">
                                  <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-lg shrink-0">
                                    🏷️ লেভেল ৩ ({sub2List.length}টি টপিক):
                                  </span>
                                  {sub2List.map((sub2: any, sub2Idx: number) => (
                                    <span key={sub2Idx} className="text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg">
                                      🔹 {sub2.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CASE 2: Inside Specific Exam Section (e.g. Daily Quick Test / Weekly Model Test / BCS Health Special) */}
              {activeExamSection && (
                <div className="space-y-5">
                  {/* Papers list for this section */}
                  {(() => {
                    const rawSectionPapers = examPapers.filter(p => {
                      const currentStatus = getExamStatus(p);
                      // Show Live and Upcoming exams in section list. Archive papers go to archive tab automatically!
                      if (currentStatus === "Archive") return false;
                      if (p.course && p.course !== "all_courses" && p.course !== "all" && p.course !== selectedCourseDetail.id) {
                        return false;
                      }
                      return p.examType === activeExamSection;
                    });

                    const sectionPapers = sortExamPapersForDisplay(rawSectionPapers);

                    if (sectionPapers.length === 0) {
                      return (
                        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 text-center space-y-3 shadow-2xs">
                          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                            {activeExamSection === "daily" ? "⚡" : activeExamSection === "weekly" ? "📅" : activeExamSection === "special" ? "🩺" : "📚"}
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-slate-800">
                            বর্তমানে কোনো পরীক্ষা লাইভ বা আসন্ন নেই
                          </h3>
                          <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                            এই সেকশনে (কোর্স: {selectedCourseDetail.title}) এখনো কোনো লাইভ বা আসন্ন পরীক্ষা যুক্ত করা হয়নি। আগের সব পরীক্ষা আর্কাইভ (Archive) ট্যাব থেকে পুনঃপরীক্ষা দেওয়া যাবে।
                          </p>
                          <button
                            onClick={() => setActiveExamSection(null)}
                            className="px-4 py-2 bg-[#FF6A00] text-white text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm shadow-orange-500/20 inline-block"
                          >
                            অন্যান্য সেকশন দেখুন
                          </button>
                        </div>
                      );
                    }

                    const examTypeBadgeMap: Record<string, { label: string; bg: string }> = {
                      daily: { label: "⚡ Daily Quick Test", bg: "bg-amber-50 text-amber-700 border-amber-100" },
                      weekly: { label: "📅 Weekly Model Test", bg: "bg-purple-50 text-purple-700 border-purple-100" },
                      special: { label: "🩺 BCS Health Quiz", bg: "bg-rose-50 text-rose-700 border-rose-100" },
                      subject: { label: "📚 Subject Wise Test", bg: "bg-blue-50 text-blue-700 border-blue-100" }
                    };

                    return (
                      <div className="space-y-4">
                        {sectionPapers.map((paper) => {
                          const computedStatus = getExamStatus(paper);
                          const totalSec = paper.totalDurationSeconds || (paper.questions?.length || 10) * 36;
                          const durationMins = Math.floor(totalSec / 60);
                          const typeBadge = examTypeBadgeMap[paper.examType] || { label: paper.examType, bg: "bg-slate-50 text-slate-700 border-slate-100" };

                          return (
                            <div key={paper.id} className="bg-white border border-slate-200/80 hover:border-orange-200 rounded-[2rem] p-5 shadow-2xs space-y-3.5 transition-all">
                              {/* Header Date & Badges */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[11px] font-extrabold text-slate-500">
                                  📅 {paper.examDate || "Fri, Jul 31, 2026"}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border ${typeBadge.bg}`}>
                                    {typeBadge.label}
                                  </span>
                                  {computedStatus === "Live" && (
                                    <span className="bg-emerald-50 text-emerald-600 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">
                                      ● Live
                                    </span>
                                  )}
                                  {computedStatus === "Upcoming" && (
                                    <span className="bg-amber-50 text-amber-700 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-200">
                                      ⏳ Upcoming
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Marks & Duration */}
                              <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                <span>Marks: {paper.totalMarks || paper.questions?.length || 10}</span>
                                <span>•</span>
                                <span>Duration: {durationMins} mins</span>
                              </div>

                              {/* Title & Topic */}
                              <div className="space-y-1">
                                {paper.topic && (
                                  <div className="text-xs font-extrabold text-[#FF6A00]">
                                    Topic: <span className="text-slate-800 font-bold">"{paper.topic}"</span>
                                  </div>
                                )}
                                <h4 className="text-sm font-black text-slate-800 leading-snug">
                                  {paper.title}
                                </h4>
                              </div>

                              {/* Action Buttons: Take Exam & Question Paper */}
                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <button
                                  onClick={() => {
                                    setSelectedLiveExamModal(paper);
                                    if (soundEnabled) quizAudio.playClick();
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-3 rounded-2xl active:scale-95 transition-all shadow-md shadow-purple-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <span>📝 পরীক্ষা দিন</span>
                                </button>

                                <button
                                  onClick={() => handleOpenViewPaper(paper)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-2xl active:scale-95 transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <span>📄 প্রশ্নপত্র</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* 8 Feature Grid Nav Buttons (Quick Tools) inside exam section screen BELOW the live/upcoming exam list */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                      কোর্স টুলস ও আর্কাইভ (Quick Tools)
                    </h4>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: "Archive", icon: "📂", color: "bg-purple-50 text-purple-600" },
                        { name: "Result", icon: "🏆", color: "bg-amber-50 text-amber-600" },
                        { name: "Routine", icon: "📅", color: "bg-blue-50 text-blue-600" },
                        { name: "Syllabus", icon: "📜", color: "bg-green-50 text-green-600" },
                        { name: "PDFs", icon: "📄", color: "bg-[#FFF1E6] text-[#FF6A00]" },
                        { name: "Favorite", icon: "🩶", color: "bg-rose-50 text-rose-600" },
                        { name: "Merit List", icon: "🎖️", color: "bg-indigo-50 text-indigo-600" },
                        { name: "Wrong & Unans", icon: "✕", color: "bg-red-50 text-red-600" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.name === "Archive") {
                              setArchiveFilterCourse(selectedCourseDetail.id);
                              setArchiveFilterCategory(activeExamSection);
                              setArchiveModalOpen(true);
                            } else if (item.name === "Routine") {
                              setCurrentScreen("routine");
                            } else if (item.name === "Result" || item.name === "Merit List") {
                              setCurrentScreen("tests");
                            } else {
                              setQuickToolModal({ name: item.name, icon: item.icon });
                            }
                            if (soundEnabled) quizAudio.playClick();
                          }}
                          className="bg-white border border-slate-100 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 text-center hover:border-orange-200 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <span className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center text-sm font-black`}>
                            {item.icon}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-700 truncate w-full">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* 4. SCREEN: ROUTINE & STUDY PLANNER                        */}
          {/* ========================================================= */}
          {currentScreen === "routine" && (
            <div className="p-5 space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Daily routine</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan your exam success checklist</p>
              </div>

              {/* Progress HUD Ring */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-[2rem] p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold tracking-widest text-orange-400 uppercase">TODAY'S PROGRESS</span>
                  <h4 className="text-xl font-black">{routinePercentage}% Completed</h4>
                  <p className="text-[10px] text-slate-300 font-medium">
                    {completedRoutineCount} of {routineTasks.length} tasks finished
                  </p>
                </div>

                <div className="w-14 h-14 rounded-full border-4 border-slate-700 border-t-orange-500 flex items-center justify-center font-mono font-black text-sm text-orange-400">
                  {completedRoutineCount}/{routineTasks.length}
                </div>
              </div>

              {/* Add Custom Routine Task form */}
              <form onSubmit={handleAddRoutine} className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add custom preparation task</span>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="যেমন: ১০টি গণিত সমাধান করব..."
                    value={newRoutineText}
                    onChange={(e) => setNewRoutineText(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-orange-500/40"
                  />
                  <select 
                    value={newRoutineCategory} 
                    onChange={(e) => setNewRoutineCategory(e.target.value)}
                    className="px-2.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none"
                  >
                    <option value="GK">GK</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Bangla">Bangla</option>
                    <option value="English">English</option>
                    <option value="Primary">Primary</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-[#FF6A00] text-white font-extrabold text-[10px] rounded-xl tracking-wider uppercase hover:bg-orange-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to study routine
                </button>
              </form>

              {/* Routine Checklist List */}
              <div className="space-y-2.5">
                {routineTasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`bg-white border rounded-[1.5rem] p-4 flex items-center justify-between transition-all shadow-sm ${
                      task.completed ? "border-green-100 bg-green-50/10 opacity-75" : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 pr-4">
                      <button 
                        type="button"
                        onClick={() => handleToggleRoutine(task.id)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          task.completed 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "border-slate-300 hover:border-orange-500 bg-white"
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3.5px]" />}
                      </button>

                      <div className="space-y-0.5">
                        <span className="text-[8px] font-extrabold text-[#FF6A00] bg-orange-50 px-2 py-0.5 rounded uppercase">
                          {task.category}
                        </span>
                        <p className={`text-xs font-semibold leading-relaxed ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {task.title}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteRoutine(task.id)}
                      className="p-1 text-slate-300 hover:text-red-500 active:scale-90 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* 5. SCREEN: TEST CENTER / CHOOSE MOCK                      */}
          {/* ========================================================= */}
          {currentScreen === "tests" && (
            <div className="p-5 space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Exam Results & Tests</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your last exam performance & mock test bank</p>
              </div>

              {/* Last Exam Results Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#1E293B] tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-orange-500" />
                    Last Exam Results
                  </h3>
                  {takenTests.length > 0 && (
                    <button 
                      onClick={handleClearTestHistory}
                      className="text-[10px] font-bold text-[#64748B] hover:text-red-500 hover:underline flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Clear History
                    </button>
                  )}
                </div>

                {takenTests.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 text-center text-slate-400 text-xs">
                    No exam results yet. Complete a quiz to see your score here!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {takenTests.map((test) => (
                      <div 
                        key={test.id}
                        className="bg-white border border-slate-100 rounded-3xl p-4 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FFF1E6] rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                            <FileText className="w-5 h-5 stroke-[2px]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-[#334155] leading-snug">
                              {test.name}
                            </h4>
                            <p className="text-[10px] font-bold text-[#94A3B8] mt-0.5">
                              Score: {test.score}/{test.total} • {test.time}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-green-600">
                            {test.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Main test center banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-5 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="space-y-1 relative z-10 max-w-[180px]">
                  <span className="text-[8px] font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full tracking-wider uppercase">FEATURED TEST</span>
                  <h4 className="text-sm font-black leading-snug">45th BCS International Affairs</h4>
                  <p className="text-[10px] text-white/80 leading-snug font-medium">Full set with 31 mock questions from database.</p>
                </div>
                
                <button 
                  onClick={() => startQuizFlow("General Quiz Game", "45th BCS International Affairs", isUsingFallback ? QUIZ_QUESTIONS : questions)}
                  className="bg-white hover:bg-slate-50 text-blue-600 font-extrabold text-[10px] px-4.5 py-3 rounded-xl shadow relative z-10 cursor-pointer"
                >
                  Launch Quiz
                </button>

                <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              </div>

              {/* Grid lists of other subject exams */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Choose Question bank</span>
                
                <div className="space-y-3">
                  
                  {/* Test choice 1: Daily GK Challenge */}
                  <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-snug">General Knowledge Daily Challenge</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">31 Questions • GK & Bangladesh Studies</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => startQuizFlow("General Quiz Game", "Daily Challenge", QUIZ_QUESTIONS)}
                      className="p-1.5 hover:bg-slate-50 text-orange-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Test choice 2: Quantitative Aptitude */}
                  <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-snug">Mathematics Practice Series #12</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">3 Questions • Equations & Geometry</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => startQuizFlow("Mathematics practice #12", "Equations & Geometry", MATH_QUESTIONS)}
                      className="p-1.5 hover:bg-slate-50 text-blue-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Test choice 3: Bangla & English Literature */}
                  <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-snug">Bangla & English Literature Mock</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">6 Questions • Grammar & authors</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => startQuizFlow("Bangla & English Mastery", "Grammar & Authors", [...BANGLA_QUESTIONS, ...ENGLISH_QUESTIONS])}
                      className="p-1.5 hover:bg-slate-50 text-purple-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Test choice 4: General Science */}
                  <div className="bg-white border border-slate-100 rounded-[1.5rem] p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-snug">General Science Mock</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">5 Questions • Anatomy & Environment</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => startQuizFlow("General Science Mock", "Anatomy & Climate", SCIENCE_QUESTIONS)}
                      className="p-1.5 hover:bg-slate-50 text-green-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* NOTICE BOARD / NOTIFICATIONS SCREEN                       */}
          {/* ========================================================= */}
          {currentScreen === "notice" && (
            <div className="p-4 sm:p-5 space-y-4 animate-fade-in pb-12 text-left">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-[#FF6A00] shrink-0">
                    <Bell className="w-5 h-5 stroke-[2.2px]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800">
                      Notice & Notifications
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      সকল নোটিশ, নোটিফিকেশন ও গুরুত্বপূর্ণ আপডেট
                    </p>
                  </div>
                </div>
              </div>

              {/* List of Notices */}
              <div className="space-y-3 pt-1">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2.5 hover:border-orange-200 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#FF6A00] bg-orange-50 px-2.5 py-0.5 rounded-full uppercase border border-orange-200">
                      🔔 স্পেশাল আপডেট
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">আজ, ১০:৩০ AM</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    বিসিএস প্রিলিমিনারি ৪৫তম ও ৪৬তম স্পেশাল মডেল টেস্ট যুক্ত করা হয়েছে!
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    সকল চাকরি প্রত্যাশীদের সুবিধার্থে বিসিএস ক্যাডার পরীক্ষার সিলেবাস ভিত্তিক সম্পূর্ণ নতুন বিষয়ভিত্তিক মক টেস্ট এবং ব্যাখ্যাসহ উত্তরপত্র যুক্ত করা হয়েছে। এখনই প্রস্তুতি নিন।
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2.5 hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase border border-blue-200">
                      🏆 ফল প্রকাশ
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">গতকাল, ৮:০০ PM</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    সাপ্তাহিক লাইভ কুইজ প্রতিযোগিতার মেধা তালিকা ও ফল প্রকাশ
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    গতকালের লাইভ কুইজ প্রতিযোগিতায় অংশগ্রহণকারী সকল পরীক্ষার্থীর মেধা তালিকা এবং সঠিক উত্তরপত্র ‘Result’ ট্যাবে আপডেট করা হয়েছে।
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2.5 hover:border-purple-200 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase border border-purple-200">
                      📅 রুটিন আপডেট
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">২৫ জুলাই, ২০২৬</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    ব্যাংক নিয়োগ ও শিক্ষক নিবন্ধন মক টেস্ট সময়সূচী
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    প্রতিদিনের লাইভ কুইজ সকাল ৯:০০ টা থেকে শুরু হয়ে রাত ১১:০০ টা পর্যন্ত চালু থাকে। আপনার পছন্দের বিষয় নির্বাচন করে অংশ নিন।
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2.5 hover:border-green-200 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full uppercase border border-green-200">
                      ✨ নতুন ফিচার
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">২০ জুলাই, ২০২৬</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    ডেইলি রুটিন ট্র্যাকার ও সাবজেক্ট ওয়াইজ টেস্ট মডিউল
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    পড়ার অভ্যাস বজায় রাখতে এবং নিয়মিত মূল্যায়ন করতে হোম স্ক্রিনের 'Routine' এবং 'Preparation Hub' অপশন ব্যবহার করুন।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. SCREEN: PROFILE / STUDENT DATA (Apple UI Style)         */}
          {/* ========================================================= */}
          {currentScreen === "profile" && (
            <div className="p-4 sm:p-5 space-y-4 animate-fade-in pb-12 text-left">
              
              {/* Avatar identity card (Horizontal Left-to-Right layout, clean white card) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs flex items-center gap-4">
                {/* Avatar image container (Left side) */}
                <div className="relative shrink-0">
                  <div 
                    onClick={() => {
                      profileFileInputRef.current?.click();
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-2 ring-orange-100/80 p-0.5 shadow-2xs overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer group hover:opacity-90 transition-opacity"
                    title="Click to upload profile photo"
                  >
                    {profileAvatarUrl ? (
                      <img 
                        src={profileAvatarUrl} 
                        alt={profileName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                        <svg className="w-9 h-9 sm:w-11 sm:h-11 fill-current" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Upload/Edit Pencil Badge Button */}
                  <button 
                    onClick={() => {
                      profileFileInputRef.current?.click();
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="absolute -bottom-1 -right-1 w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#FF6A00] text-white flex items-center justify-center shadow-md hover:bg-[#e05d00] transition-transform active:scale-90 border-2 border-white cursor-pointer"
                    title="Upload Photo"
                  >
                    <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Hidden File Input for Device Upload */}
                <input 
                  type="file" 
                  ref={profileFileInputRef} 
                  accept="image/*" 
                  onChange={handleProfileImageUpload} 
                  className="hidden" 
                />

                {/* User details (Right side) */}
                <div className="space-y-1 min-w-0 flex-1 text-left">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                    {profileName}
                  </h3>

                  <p className="text-xs font-semibold text-slate-500 truncate leading-tight">
                    {profileEmail}
                  </p>

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="bg-orange-100/90 text-[#FF6A00] font-black text-[9px] sm:text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full border border-orange-200/80 shadow-2xs shrink-0">
                      PRO MEMBER
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-400 truncate">
                      ID: {profileId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Three Stat Cards (Pic 1 & 2 design) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                {/* Card 1: TEST TAKEN */}
                <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center shadow-2xs space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">
                    TEST TAKEN
                  </span>
                  <h4 className="text-lg sm:text-2xl font-black text-[#FF6A00] tracking-tight">
                    {takenTests.length > 0 ? takenTests.length : 128}
                  </h4>
                  <div>
                    <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-200/80 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full">
                      +5%
                    </span>
                  </div>
                </div>

                {/* Card 2: AVG SCORE */}
                <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center shadow-2xs space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">
                    AVG SCORE
                  </span>
                  <h4 className="text-lg sm:text-2xl font-black text-[#FF6A00] tracking-tight">
                    {takenTests.length > 0 
                      ? `${Math.round(takenTests.reduce((acc, t) => acc + t.percentage, 0) / takenTests.length)}%`
                      : "82%"}
                  </h4>
                  <div>
                    <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-200/80 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full">
                      +2%
                    </span>
                  </div>
                </div>

                {/* Card 3: GLOBAL RANK */}
                <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center shadow-2xs space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block truncate">
                    GLOBAL RANK
                  </span>
                  <h4 className="text-lg sm:text-2xl font-black text-[#FF6A00] tracking-tight">
                    15D
                  </h4>
                  <div>
                    <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-200/80 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full">
                      +3%
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Options List ABOVE Personal Information (Ref Pic 2 & Pic 3) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
                {[
                  { title: "Dashboard", icon: LayoutGrid, iconColor: "text-[#FF6A00] bg-orange-50", action: () => {} },
                  { title: "My Courses", icon: BookOpen, iconColor: "text-blue-600 bg-blue-50", action: () => {} },
                  { title: "Study Routine", icon: Calendar, iconColor: "text-emerald-600 bg-emerald-50", action: () => {} },
                  { title: "Downloads", icon: Download, iconColor: "text-purple-600 bg-purple-50", action: () => {} },
                  { title: "Performance Analytics", icon: TrendingUp, iconColor: "text-rose-600 bg-rose-50", action: () => {} },
                ].map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        item.action();
                        if (soundEnabled) quizAudio.playClick();
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer text-left active:bg-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${item.iconColor} flex items-center justify-center shrink-0`}>
                          <IconComp className="w-4.5 h-4.5 stroke-[2.2]" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#FF6A00] transition-colors truncate">
                          {item.title}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#FF6A00] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* PERSONAL INFORMATION Section (Ref Pic 1) */}
              <div className="space-y-2 pt-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">
                  PERSONAL INFORMATION
                </h4>
                <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
                  {/* Edit Profile */}
                  <button
                    onClick={() => {
                      setIsEditProfileOpen(true);
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6A00] flex items-center justify-center shrink-0">
                        <User className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#FF6A00] transition-colors truncate">
                        Edit Profile
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#FF6A00] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  {/* Change Password */}
                  <button
                    onClick={() => {
                      setIsChangePasswordOpen(true);
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Lock className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#FF6A00] transition-colors truncate">
                        Change Password
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#FF6A00] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* 7. SCREEN: PACKAGES (Apple UI Style)                       */}
          {/* ========================================================= */}
          {currentScreen === "packages" && (
            <div className="p-4 sm:p-5 space-y-4 animate-fade-in pb-12">
              {/* Header Banner - reduced top padding & removed "প্যাকেজসমূহ" header */}
              <div className="text-center space-y-1 pt-0 mt-0">
                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#007AFF] bg-[#007AFF]/10 px-3 py-0.5 rounded-full">
                  PRICING & MEMBERSHIP
                </span>
                <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                  সকল প্রস্তুতির সেরা প্ল্যান বেছে নিন
                </p>
              </div>

              {/* Section 1: All Access Packages */}
              <div className="space-y-3">
                {packagesList
                  .filter((p) => (p.category || "all") !== "course")
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPurchasePkg(pkg);
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className={`${pkg.bg || "bg-white"} ${pkg.border || "border-slate-200/80"} border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between relative group`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm sm:text-base text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-snug">
                            {pkg.title}
                          </h4>
                          {pkg.badge && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              pkg.badge === "NEW" 
                                ? "bg-[#007AFF] text-white" 
                                : "bg-amber-100 text-amber-800 border border-amber-200/80"
                            }`}>
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs font-light text-slate-500 leading-relaxed">
                          {pkg.desc}
                        </p>
                      </div>
                      <div className="shrink-0 text-right flex flex-col items-end">
                        <div className="text-base sm:text-lg font-black text-[#1D1D1F] flex items-center gap-1">
                          <span>{pkg.price}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#007AFF] group-hover:translate-x-0.5 transition-all" />
                        </div>
                        {pkg.oldPrice && (
                          <div className="text-[11px] font-bold text-slate-400 line-through">
                            {pkg.oldPrice}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 2: Course Based (কোর্সভিত্তিক) */}
              {packagesList.some((p) => p.category === "course") && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider pl-1">
                    কোর্সভিত্তিক
                  </h4>

                  {packagesList
                    .filter((p) => p.category === "course")
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPurchasePkg(pkg);
                        if (soundEnabled) quizAudio.playClick();
                      }}
                      className={`${pkg.bg || "bg-white"} ${pkg.border || "border-slate-200/80"} border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between relative group`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm sm:text-base text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors leading-snug">
                              {pkg.title}
                            </h4>
                            {pkg.badge && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/80">
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs font-light text-slate-500 leading-relaxed">
                            {pkg.desc}
                          </p>
                        </div>
                        <div className="shrink-0 text-right flex flex-col items-end">
                          <div className="text-base sm:text-lg font-black text-[#1D1D1F] flex items-center gap-1">
                            <span>{pkg.price}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#007AFF] group-hover:translate-x-0.5 transition-all" />
                          </div>
                          {pkg.oldPrice && (
                            <div className="text-[11px] font-bold text-slate-400 line-through">
                              {pkg.oldPrice}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Apple-style Security & Payment Notice */}
              <div className="bg-slate-100/80 border border-slate-200/60 rounded-2xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  🛡️ <span>ইনস্ট্যান্ট এক্সেস ও সেফ পেমেন্ট</span>
                </p>
                <p className="text-[10px] font-semibold text-slate-500">
                  bKash, Nagad বা Rocket এর মাধ্যমে পেমেন্ট সম্পন্ন করে মুহূর্তেই সকল ফিচারের আনলিমিটেড এক্সেস সক্রিয় করুন।
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. SCREEN: FULL SEARCH VIEW                                */}
          {/* ========================================================= */}
          {currentScreen === "search" && (() => {
            const query = desktopSearchQuery.toLowerCase().trim();

            // Filter 1: Exam Papers
            const matchedExams = examPapers.filter(p => 
              !query || 
              p.title.toLowerCase().includes(query) || 
              p.course.toLowerCase().includes(query) || 
              p.examType.toLowerCase().includes(query) ||
              (p.subject && p.subject.toLowerCase().includes(query)) ||
              (p.topic && p.topic.toLowerCase().includes(query))
            );

            // Filter 2: Courses
            const matchedCourses = ALL_COURSES_DATA.filter(c => 
              !query || 
              c.title.toLowerCase().includes(query) || 
              c.desc.toLowerCase().includes(query) ||
              c.category.toLowerCase().includes(query)
            );

            // Filter 3: Subjects
            const allSubjects = [
              { name: "বাংলা ব্যাকরণ ও সাহিত্য", key: "bangla", icon: "📚", color: "text-red-500 bg-red-50" },
              { name: "English Language & Literature", key: "english", icon: "🌐", color: "text-blue-500 bg-blue-50" },
              { name: "গাণিতিক যুক্তি ও মানসিক দক্ষতা", key: "math", icon: "📐", color: "text-emerald-500 bg-emerald-50" },
              { name: "সাধারণ বিজ্ঞান ও তথ্যপ্রযুক্তি", key: "science", icon: "🧪", color: "text-purple-500 bg-purple-50" },
              { name: "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলি", key: "gk", icon: "🗺️", color: "text-orange-500 bg-orange-50" },
              { name: "কম্পিউটার ও তথ্যপ্রযুক্তি", key: "ict", icon: "💻", color: "text-indigo-500 bg-indigo-50" }
            ];
            const matchedSubjects = allSubjects.filter(s => 
              !query || s.name.toLowerCase().includes(query) || s.key.toLowerCase().includes(query)
            );

            // Filter 4: Questions Bank
            const matchedQuestions = QUIZ_QUESTIONS.filter(q => 
              !query || 
              q.question.toLowerCase().includes(query) || 
              q.options.some(opt => opt.toLowerCase().includes(query))
            );

            return (
              <div className="p-4 sm:p-6 space-y-5 animate-fade-in text-left pb-16">
                
                {/* Top Search Input Box */}
                <div className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setCurrentScreen(previousScreen || "home");
                        if (soundEnabled) quizAudio.playClick();
                      }}
                      className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer shrink-0"
                      title="ফিরে যান"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
                    </button>

                    <div className="relative flex-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="পরীক্ষা, কোর্স, বিষয় বা প্রশ্ন খুঁজুন..."
                        value={desktopSearchQuery}
                        onChange={(e) => setDesktopSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-orange-500/20 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-bold text-slate-800 transition-all outline-none"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      {desktopSearchQuery && (
                        <button 
                          onClick={() => setDesktopSearchQuery("")}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
                    {[
                      { id: "all", label: "সকল তথ্য" },
                      { id: "exams", label: `পরীক্ষা (${matchedExams.length})` },
                      { id: "courses", label: `কোর্স (${matchedCourses.length})` },
                      { id: "subjects", label: `বিষয় (${matchedSubjects.length})` },
                      { id: "questions", label: `প্রশ্ন ব্যাংক (${matchedQuestions.length})` }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSearchCategoryFilter(cat.id as any);
                          if (soundEnabled) quizAudio.playClick();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wide shrink-0 transition-all cursor-pointer ${
                          searchCategoryFilter === cat.id
                            ? "bg-[#FF6A00] text-white shadow-md shadow-orange-500/20"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggested Hot Search Keywords if query empty */}
                {!query && (
                  <div className="bg-orange-50/60 border border-orange-100 rounded-3xl p-4 space-y-2.5">
                    <span className="text-[10px] font-black text-[#FF6A00] uppercase tracking-wider block">🔥 জনপ্রিয় বিষয়গুলো খুঁজুন</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "বিসিএস প্রিলি",
                        "ব্যাংক নিয়োগ স্পেশাল",
                        "প্রাথমিক শিক্ষক নিয়োগ",
                        "গণিত স্পেশাল",
                        "বাংলা ব্যাকরণ",
                        "ইংরেজি গ্রামার",
                        "সাধারণ জ্ঞান বাংলাদেশ",
                        "NTRCA শিক্ষক নিবন্ধন"
                      ].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setDesktopSearchQuery(tag);
                            if (soundEnabled) quizAudio.playClick();
                          }}
                          className="bg-white hover:bg-orange-100 border border-orange-200/60 text-slate-700 hover:text-[#FF6A00] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SEARCH RESULTS LISTING */}
                <div className="space-y-6">

                  {/* 1. EXAM PAPERS RESULTS */}
                  {(searchCategoryFilter === "all" || searchCategoryFilter === "exams") && matchedExams.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>📋 প্রশ্নপত্র ও পরীক্ষা ({matchedExams.length})</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matchedExams.slice(0, 6).map((paper) => (
                          <div
                            key={paper.id}
                            onClick={() => {
                              handleOpenTakeExam(paper);
                              if (soundEnabled) quizAudio.playClick();
                            }}
                            className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-[#FF6A00] bg-orange-50 px-2 py-0.5 rounded">
                                {paper.course.toUpperCase()} • {paper.examType}
                              </span>
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 group-hover:text-[#FF6A00] transition-colors leading-snug">
                                <MathRenderer content={paper.title} />
                              </h5>
                              <p className="text-[10px] text-slate-400 font-semibold line-clamp-1">
                                {paper.topic}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-100">
                              <span>{paper.questionCount} টি প্রশ্ন</span>
                              <span className="text-[#FF6A00] font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                পরীক্ষা দিন <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. COURSES RESULTS */}
                  {(searchCategoryFilter === "all" || searchCategoryFilter === "courses") && matchedCourses.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        🎓 কোর্স ও প্রোগ্রাম ({matchedCourses.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matchedCourses.map((course) => (
                          <div
                            key={course.id}
                            onClick={() => {
                              setSelectedCourseDetail(course);
                              setActiveExamSection(null);
                              setPreviousScreen("search");
                              setCurrentScreen("course-detail");
                              if (soundEnabled) quizAudio.playClick();
                            }}
                            className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3 group"
                          >
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shrink-0">
                              🎓
                            </div>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                {course.title}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {course.desc}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. SUBJECTS RESULTS */}
                  {(searchCategoryFilter === "all" || searchCategoryFilter === "subjects") && matchedSubjects.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        📚 প্রস্তুতি বিষয়সমূহ ({matchedSubjects.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matchedSubjects.map((sub) => (
                          <div
                            key={sub.key}
                            onClick={() => {
                              setSelectedPrepSubject(sub.key as any);
                              setPreviousScreen("search");
                              setCurrentScreen("prep-sub");
                              if (soundEnabled) quizAudio.playClick();
                            }}
                            className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl p-2 rounded-xl bg-slate-50">{sub.icon}</span>
                              <span className="font-extrabold text-xs sm:text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">
                                {sub.name}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. QUESTIONS BANK RESULTS */}
                  {(searchCategoryFilter === "all" || searchCategoryFilter === "questions") && matchedQuestions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        ❓ প্রশ্ন ব্যাংক ম্যাচিং ({matchedQuestions.length})
                      </h4>
                      <div className="space-y-3">
                        {matchedQuestions.slice(0, 10).map((q, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                                <span className="font-black text-[#FF6A00] mr-1.5">{idx + 1}.</span>
                                <MathRenderer content={q.question} />
                              </h5>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt, oIdx) => (
                                <div 
                                  key={oIdx} 
                                  className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${
                                    oIdx === q.correctIndex 
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold" 
                                      : "bg-slate-50 border-slate-100 text-slate-600"
                                  }`}
                                >
                                  <span className="w-4 h-4 rounded-full bg-slate-200/80 text-[9px] flex items-center justify-center font-bold text-slate-600 shrink-0">
                                    {String.fromCharCode(2453 + oIdx)}
                                  </span>
                                  <MathRenderer content={opt} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NO RESULTS FOUND STATE */}
                  {query && matchedExams.length === 0 && matchedCourses.length === 0 && matchedSubjects.length === 0 && matchedQuestions.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
                      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                        🔍
                      </div>
                      <h4 className="font-black text-slate-800 text-sm sm:text-base">কোনো ফলাফল পাওয়া যায়নি</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        "{query}" সম্পর্কিত কোনো তথ্য পাওয়া যায়নি। অনুগ্রহ করে অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন।
                      </p>
                    </div>
                  )}

                </div>

              </div>
            );
          })()}

        </div>

        {/* Backdrop overlay for Drawer */}
        <div 
          onClick={() => {
            setDrawerOpen(false);
            if (soundEnabled) quizAudio.playClick();
          }}
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-all duration-300 ease-in-out ${
            drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          id="drawer-backdrop"
        />

        {/* Drawer Panel */}
        <div 
          className={`absolute top-0 left-0 bottom-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out transform ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          } w-[280px] flex flex-col border-r border-slate-100`}
          id="app-drawer-panel"
        >
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-[#FF6A00] to-[#FF4E00] p-5 pt-8 text-white flex flex-col gap-3 relative shrink-0">
            <button 
              onClick={() => {
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className="absolute top-4 right-4 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              id="drawer-close-button"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Avatar inside Drawer */}
            <div className="flex items-center gap-3 mt-2">
              <div className="w-12 h-12 rounded-full bg-white text-[#FF4E00] font-black text-xl flex items-center justify-center shadow-inner">
                {isLoggedIn ? "M" : "G"}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight leading-tight">
                  {isLoggedIn ? "mobileseba247" : "Guest User"}
                </span>
                <span className="text-[10px] text-white/80 font-semibold">
                  {isLoggedIn ? "mobileseba247@gmail.com" : "guest@jobmaster.com"}
                </span>
                <span className={`inline-block text-[8px] font-black w-max px-1.5 py-0.5 rounded uppercase mt-1 ${
                  isLoggedIn ? "bg-white/25 text-white" : "bg-black/20 text-white/70"
                }`}>
                  {isLoggedIn ? "Premium Member" : "Guest Account"}
                </span>
              </div>
            </div>
          </div>

          {/* Drawer Menu Items */}
          <div className="flex-1 overflow-y-auto py-3 px-3.5 space-y-1 bg-slate-50/50">
            {/* 0. Home */}
            <button
              onClick={() => {
                setCurrentScreen("home");
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                currentScreen === "home" 
                  ? "bg-orange-50 text-[#FF6A00] font-bold" 
                  : "text-slate-600 hover:bg-slate-100 font-semibold"
              } text-xs`}
              id="drawer-item-home"
            >
              <HomeIcon className={`w-4 h-4 ${currentScreen === "home" ? "text-[#FF6A00]" : "text-slate-400"}`} />
              <span>Home</span>
            </button>

            {/* 1. Profile */}
            <button
              onClick={() => {
                setCurrentScreen("profile");
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                currentScreen === "profile" 
                  ? "bg-orange-50 text-[#FF6A00] font-bold" 
                  : "text-slate-600 hover:bg-slate-100 font-semibold"
              } text-xs`}
              id="drawer-item-profile"
            >
              <CircleUser className={`w-4 h-4 ${currentScreen === "profile" ? "text-[#FF6A00]" : "text-slate-400"}`} />
              <span>Profile</span>
            </button>

            {/* 2. Package */}
            <button
              onClick={() => {
                attemptExitQuiz(() => {
                  setDrawerOpen(false);
                  setCurrentScreen("packages");
                });
                if (soundEnabled) quizAudio.playClick();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                currentScreen === "packages"
                  ? "bg-orange-50 text-[#FF6A00] font-bold"
                  : "text-slate-600 hover:bg-slate-100 font-semibold"
              } text-xs`}
              id="drawer-item-package"
            >
              <Package className={`w-4 h-4 ${currentScreen === "packages" ? "text-[#FF6A00]" : "text-slate-400"}`} />
              <span>Package</span>
            </button>

            {/* 3. Book Store */}
            <button
              onClick={() => {
                setActiveDrawerModal("bookstore");
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              id="drawer-item-bookstore"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Book Store</span>
            </button>

            {/* 3.1 Install App */}
            <button
              onClick={() => {
                localStorage.removeItem("jobmaster_pwa_dismissed");
                window.location.reload();
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className="w-full md:hidden flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 text-[#FF6A00] font-extrabold text-xs shadow-sm hover:shadow"
              id="drawer-item-install-app"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-[#FF6A00]" />
                <span>Install Job Master App</span>
              </div>
              <span className="text-[9px] bg-[#FF6A00] text-white px-2 py-0.5 rounded-md font-black uppercase">Install</span>
            </button>

            {/* 4. Language */}
            <button
              onClick={() => {
                setActiveDrawerModal("language");
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              id="drawer-item-language"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Language ({selectedLanguage === "BN" ? "বাংলা" : "English"})</span>
            </button>

            {/* 5. Settings */}
            <button
              onClick={() => {
                setActiveDrawerModal("settings");
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              id="drawer-item-settings"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            {/* 6. Our Apps */}
            <button
              onClick={() => {
                setActiveDrawerModal("ourapps");
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              id="drawer-item-ourapps"
            >
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span>Our Apps</span>
            </button>

            {/* 7. Contact Us */}
            <button
              onClick={() => {
                setActiveDrawerModal("contact");
                setDrawerOpen(false);
                if (soundEnabled) quizAudio.playClick();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              id="drawer-item-contact"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Contact Us</span>
            </button>

            {/* 9. Logout/LogIn */}
            <button
              onClick={() => {
                const nextState = !isLoggedIn;
                setIsLoggedIn(nextState);
                setDrawerOpen(false);
                if (soundEnabled) {
                  if (nextState) quizAudio.playSuccess();
                  else quizAudio.playError();
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all font-semibold text-xs mt-1 border-t border-slate-100/50 pt-2.5 ${
                isLoggedIn ? "text-red-600 hover:bg-red-50" : "text-[#FF6A00] hover:bg-orange-50"
              }`}
              id="drawer-item-auth"
            >
              {isLoggedIn ? (
                <>
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Logout</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#FF6A00]" />
                  <span>LogIn</span>
                </>
              )}
            </button>
          </div>

          {/* Drawer Footer copyright */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Job Master App v2.4</span>
            <span className="text-[8px] text-slate-400 mt-0.5 block font-medium">All Rights Reserved © 2026</span>
          </div>
        </div>

        {/* Modal views for Drawer Menus */}
        {activeDrawerModal !== "none" && (
          <div 
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
            id="drawer-modal-overlay"
          >
            <div 
              className="w-full max-w-[320px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80%] animate-scale-up"
              id="drawer-modal-container"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#1E293B] uppercase tracking-wider">
                  {activeDrawerModal === "package" && "Premium Packages"}
                  {activeDrawerModal === "bookstore" && "Job Master Book Store"}
                  {activeDrawerModal === "language" && "Select Language"}
                  {activeDrawerModal === "settings" && "Application Settings"}
                  {activeDrawerModal === "ourapps" && "More Apps by Us"}
                  {activeDrawerModal === "contact" && "Contact Support"}
                </span>
                <button 
                  onClick={() => {
                    setActiveDrawerModal("none");
                    if (soundEnabled) quizAudio.playClick();
                  }}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto space-y-3.5">
                
                {/* 1. PACKAGE MODAL */}
                {activeDrawerModal === "package" && (
                  <div className="space-y-2.5">
                    <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                      Upgrade to unlock advanced model questions, custom schedules, and professional analytical tools.
                    </p>
                    
                    {/* Package 1 */}
                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-2.5 flex items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-800">Basic Starter</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Free Access • Standard MCQs</p>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase">Active</span>
                    </div>

                    {/* Package 2 */}
                    <div className="border-2 border-orange-500 bg-orange-50/10 rounded-xl p-2.5 flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-[7px] font-extrabold px-1.5 py-0.5 rounded-bl-lg uppercase tracking-wider">Pop</div>
                      <div>
                        <h4 className="text-[11px] font-black text-slate-800">BCS Premium Pro</h4>
                        <p className="text-[9px] text-orange-600 font-bold mt-0.5">৳৫০০ / Year • Full Exam Sync</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          alert("Thank you for choosing BCS Premium Pro! Subscriptions are simulated in the preview environment.");
                          setActiveDrawerModal("none");
                        }}
                        className="text-[9px] font-black text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 rounded-lg shadow-sm transition-all active:scale-95"
                      >
                        Buy
                      </button>
                    </div>

                    {/* Package 3 */}
                    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-2.5 flex items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-800">Primary Teacher Special</h4>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">৳৩০০ / Year • Papers Boost</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          alert("Thank you for choosing Primary Teacher Special! Subscriptions are simulated in the preview.");
                          setActiveDrawerModal("none");
                        }}
                        className="text-[9px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. BOOK STORE MODAL */}
                {activeDrawerModal === "bookstore" && (
                  <div className="space-y-2.5">
                    <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                      Buy official physical and digital guide books curated by experts. Free home delivery across Bangladesh!
                    </p>

                    {/* Book 1 */}
                    <div className="flex gap-2.5 items-center border border-slate-100 rounded-xl p-2 bg-slate-50/20">
                      <div className="w-10 h-13 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow">
                        <BookOpen className="w-4 h-4 text-white/90" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-slate-800 truncate">BCS MCQ Booster 2026</h4>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">Author: Job Master Panel</p>
                        <p className="text-[11px] font-black text-orange-500 mt-0.5">৳২৫০</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => alert("Book order placed successfully!")}
                        className="text-[8px] font-black text-white bg-orange-500 px-2 py-1 rounded-md active:scale-95"
                      >
                        Order
                      </button>
                    </div>

                    {/* Book 2 */}
                    <div className="flex gap-2.5 items-center border border-slate-100 rounded-xl p-2 bg-slate-50/20">
                      <div className="w-10 h-13 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow">
                        <BookOpen className="w-4 h-4 text-white/90" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black text-slate-800 truncate">Primary Teacher Guide</h4>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">With last 10-year papers</p>
                        <p className="text-[11px] font-black text-orange-500 mt-0.5">৳১৮০</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => alert("Book order placed successfully!")}
                        className="text-[8px] font-black text-white bg-orange-500 px-2 py-1 rounded-md active:scale-95"
                      >
                        Order
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. LANGUAGE MODAL */}
                {activeDrawerModal === "language" && (
                  <div className="space-y-2">
                    <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                      Choose your default system language for standard displays and navigation headers.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguage("BN");
                        setActiveDrawerModal("none");
                        if (soundEnabled) quizAudio.playSuccess();
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between font-bold text-xs ${
                        selectedLanguage === "BN" 
                          ? "border-[#FF6A00] bg-orange-50/10 text-[#FF6A00]" 
                          : "border-slate-100 bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <span>বাংলা (Bangla)</span>
                      {selectedLanguage === "BN" && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguage("EN");
                        setActiveDrawerModal("none");
                        if (soundEnabled) quizAudio.playSuccess();
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between font-bold text-xs ${
                        selectedLanguage === "EN" 
                          ? "border-[#FF6A00] bg-orange-50/10 text-[#FF6A00]" 
                          : "border-slate-100 bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <span>English (ইংরেজি)</span>
                      {selectedLanguage === "EN" && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* 4. SETTINGS MODAL */}
                {activeDrawerModal === "settings" && (
                  <div className="space-y-2.5">
                    <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                      Manage sounds, mock limits, and general application preferences easily.
                    </p>

                    {/* Sound Effects Toggle */}
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-orange-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="text-[11px] font-bold text-slate-700">Sound Effects</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setSoundEnabled(!soundEnabled);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("job_master_sound", String(!soundEnabled));
                          }
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors ${soundEnabled ? "bg-[#FF6A00]" : "bg-slate-300"}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${soundEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Daily Reminders Toggle */}
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[11px] font-bold text-slate-700">Daily Notifications</span>
                      </div>
                      <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-black">ON</span>
                    </div>

                    {/* Clear storage cache */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you sure you want to clear your study data cache? This resets your study routine & test logs.")) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="w-full text-center bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-[10px] py-2 rounded-xl transition-colors mt-2"
                    >
                      Reset Local Storage Cache
                    </button>
                  </div>
                )}

                {/* 5. OUR APPS MODAL */}
                {activeDrawerModal === "ourapps" && (
                  <div className="space-y-2.5">
                    <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                      Check out other popular educational platforms developed by our team:
                    </p>

                    <div className="p-2 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black text-xs">G</div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-800">GK Master Pro</h4>
                          <p className="text-[8px] text-slate-400 font-bold">General Knowledge Daily</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-[#FF6A00] bg-orange-50 px-1.5 py-0.5 rounded-full">Installed</span>
                    </div>

                    <div className="p-2 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-xs">V</div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-800">Vocabulary builder</h4>
                          <p className="text-[8px] text-slate-400 font-bold">Bangla to English Cards</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => alert("Redirecting to app store placeholder")}
                        className="text-[8px] font-black text-white bg-orange-500 px-2 py-1 rounded-md active:scale-95"
                      >
                        Install
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. CONTACT US MODAL */}
                {activeDrawerModal === "contact" && (
                  <div className="space-y-2.5 text-[11px] text-slate-700">
                    <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                      Need help? Get in touch with our team directly. We are active 24/7!
                    </p>

                    <div className="space-y-1.5 font-bold text-slate-700">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400">Support Email</span>
                        <a href="mailto:support@jobmaster.com" className="text-orange-600 hover:underline">support@jobmaster.com</a>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400">WhatsApp Hotline</span>
                        <span className="text-orange-600">+880 1712-345678</span>
                      </div>
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        alert("Message sent successfully! Our support agents will contact you shortly.");
                        setActiveDrawerModal("none");
                      }}
                      className="space-y-1.5 pt-2 border-t border-slate-100"
                    >
                      <input 
                        type="text" 
                        placeholder="Your Query / Issue" 
                        required 
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 text-[10px] font-semibold"
                      />
                      <button 
                        type="submit"
                        className="w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] py-1.5 rounded-lg shadow transition-all active:scale-95"
                      >
                        Send Message
                      </button>
                    </form>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Android/iOS App-Style Bottom Navigation Bar (Persistent across all screens including Quiz) */}
        <nav 
          className="md:hidden shrink-0 w-full bg-[#FFF5ED] border-t-2 border-[#FF6A00]/30 flex justify-around items-center pt-2.5 pb-2 shadow-[0_-6px_20px_rgba(255,106,0,0.08)] z-50 transition-all duration-300 relative touch-none select-none"
          id="mobile-bottom-nav"
        >
          {/* Home Tab */}
          <button
            onClick={() => {
              attemptExitQuiz(() => setCurrentScreen("home"));
              if (soundEnabled) quizAudio.playClick();
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-95 transition-transform cursor-pointer"
            id="bottom-nav-home"
          >
            <HomeIcon 
              className={`w-5 h-5 transition-colors ${
                currentScreen === "home" ? "text-[#FF6A00]" : "text-slate-400"
              }`} 
            />
            <span 
              className={`text-[9px] mt-1 font-bold transition-colors ${
                currentScreen === "home" ? "text-[#FF6A00]" : "text-slate-500"
              }`}
            >
              Home
            </span>
          </button>

          {/* Results Tab */}
          <button
            onClick={() => {
              attemptExitQuiz(() => setCurrentScreen("tests"));
              if (soundEnabled) quizAudio.playClick();
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-95 transition-transform cursor-pointer"
            id="bottom-nav-results"
          >
            <ClipboardList 
              className={`w-5 h-5 transition-colors ${
                currentScreen === "tests" ? "text-[#FF6A00]" : "text-slate-400"
              }`} 
            />
            <span 
              className={`text-[9px] mt-1 font-bold transition-colors ${
                currentScreen === "tests" ? "text-[#FF6A00]" : "text-slate-500"
              }`}
            >
              Result
            </span>
          </button>

          {/* Packages Tab */}
          <button
            onClick={() => {
              attemptExitQuiz(() => setCurrentScreen("packages"));
              if (soundEnabled) quizAudio.playClick();
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-95 transition-transform cursor-pointer"
            id="bottom-nav-packages"
          >
            <Package 
              className={`w-5 h-5 transition-colors ${
                currentScreen === "packages" ? "text-[#FF6A00]" : "text-slate-400"
              }`} 
            />
            <span 
              className={`text-[9px] mt-1 font-bold transition-colors ${
                currentScreen === "packages" ? "text-[#FF6A00]" : "text-slate-500"
              }`}
            >
              Packages
            </span>
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => {
              attemptExitQuiz(() => setCurrentScreen("profile"));
              if (soundEnabled) quizAudio.playClick();
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-95 transition-transform cursor-pointer"
            id="bottom-nav-profile"
          >
            <CircleUser 
              className={`w-5 h-5 transition-colors ${
                currentScreen === "profile" ? "text-[#FF6A00]" : "text-slate-400"
              }`} 
            />
            <span 
              className={`text-[9px] mt-1 font-bold transition-colors ${
                currentScreen === "profile" ? "text-[#FF6A00]" : "text-slate-500"
              }`}
            >
              Profile
            </span>
          </button>

          {/* Others/Menu Tab */}
          <button
            onClick={() => {
              setDrawerOpen(!drawerOpen);
              if (soundEnabled) quizAudio.playClick();
            }}
            className="flex flex-col items-center justify-center flex-1 py-1 active:scale-95 transition-transform cursor-pointer"
            id="bottom-nav-others"
          >
            <Menu 
              className={`w-5 h-5 transition-colors ${
                drawerOpen ? "text-[#FF6A00]" : "text-slate-400"
              }`} 
            />
            <span 
              className={`text-[9px] mt-1 font-bold transition-colors ${
                drawerOpen ? "text-[#FF6A00]" : "text-slate-500"
              }`}
            >
              Others
            </span>
          </button>
        </nav>

        {/* Exit Confirmation Modal Popup */}
        {showQuitConfirmModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4 border border-slate-100">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 stroke-[2.5px]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-base text-slate-800">
                  কুইজ থেকে বের হতে চান?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  আপনি এখন বের হয়ে গেলে এ পর্যন্ত দেওয়া আপনার উত্তরগুলোর ({submittedCount}/{questions.length}) ওপর ভিত্তি করে ফলাফল দেখানো হবে।
                </p>
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setShowQuitConfirmModal(false);
                    setPendingNavigation(null);
                  }}
                  className="flex-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setShowQuitConfirmModal(false);
                    setPendingNavigation(null);
                    setDrawerOpen(false);
                    finishQuizEarly();
                  }}
                  className="flex-1 py-3 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer active:scale-95"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generic Quick Tool Placeholder Modal */}
        {quickToolModal && (
          <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-white border border-slate-200 rounded-[2rem] max-w-sm w-full p-6 shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{quickToolModal.icon}</span>
                  <h3 className="font-extrabold text-slate-900 text-base">{quickToolModal.name}</h3>
                </div>
                <button 
                  onClick={() => setQuickToolModal(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {quickToolModal.name.toLowerCase().includes("syllabus") || quickToolModal.name.toLowerCase().includes("সিলেবাস") ? (
                <div className="max-h-[60vh] overflow-y-auto space-y-3 py-2 pr-1">
                  {(() => {
                    let subList: any[] = [];
                    if (selectedCourseDetail?.subSubjects?.length > 0) {
                      subList = selectedCourseDetail.subSubjects;
                    } else if (selectedPrepSubject) {
                      const matchObj: any = allPrepSubjectsData.find((s: any) => 
                        s.name.toLowerCase() === selectedPrepSubject.toLowerCase() || 
                        (s.bnName && s.bnName.toLowerCase() === selectedPrepSubject.toLowerCase())
                      );
                      if (matchObj && matchObj.subSubjects) {
                        subList = matchObj.subSubjects;
                      }
                    }

                    if (subList.length === 0) {
                      return (
                        <div className="py-6 text-center text-slate-400 text-xs font-bold">
                          এই বিষয়ের কোনো নির্দিষ্ট সিলেবাস সেট করা নেই।
                        </div>
                      );
                    }

                    return subList.map((sub: any, sIdx: number) => (
                      <div key={sIdx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF6A00] font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            #{sIdx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs sm:text-sm font-black text-slate-800">{sub.name}</h5>
                            {sub.sub && <p className="text-[10px] font-bold text-slate-400">{sub.sub}</p>}
                          </div>
                        </div>

                        {sub.subCategories2 && sub.subCategories2.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                            {sub.subCategories2.map((s2: any, s2Idx: number) => (
                              <span key={s2Idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/70">
                                🔹 {s2.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 mx-auto flex items-center justify-center text-xl text-slate-400">
                    {quickToolModal.icon}
                  </div>
                  <p className="text-xs font-bold text-slate-500">
                    কোন তথ্য পাওয়া যায়নি। শীঘ্রই আপডেট করা হবে।
                  </p>
                </div>
              )}

              <button
                onClick={() => setQuickToolModal(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* QUICK TOOLS ARCHIVE MODAL (আর্কাইভকৃত প্রশ্নপত্র)          */}
        {/* ========================================================= */}
        {archiveModalOpen && (
          <div className="fixed inset-0 z-[110] bg-slate-50 overflow-y-auto animate-fade-in text-left">
            {/* Top Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setArchiveModalOpen(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
                </button>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight flex items-center gap-1.5">
                    <span className="text-lg">📂</span>
                    <span>আর্কাইভড মডেল টেস্ট (Archive)</span>
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400">পূর্বের অনুষ্ঠিত সকল প্রশ্নপত্র</p>
                </div>
              </div>

              <button 
                onClick={() => setArchiveModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5px]" />
              </button>
            </header>

            {/* Body Content */}
            <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
              {/* Informational Banner */}
              <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-4 text-xs font-semibold text-purple-900 flex items-start gap-3 shadow-2xs">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700 shrink-0 font-black">
                  📂
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-purple-950">মডেল টেস্ট আর্কাইভ সেন্টার</h4>
                  <p className="text-purple-800 text-xs">
                    এখানে পূর্বের অনুষ্ঠিত সাপ্তাহিক, ডেইলি ও বিষয়ভিত্তিক সকল মডেল টেস্ট সংরক্ষিত আছে। যেকোনো সময় সিলেক্ট করে অনুশীলন করতে পারবেন।
                  </p>
                </div>
              </div>

              {/* Filter Controls: Course & Exam Category */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                {/* Course Filter Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-[#FF6A00]" />
                    <span>কোর্স ফিল্টার করুন:</span>
                  </label>
                  <select
                    value={archiveFilterCourse}
                    onChange={(e) => setArchiveFilterCourse(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-extrabold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#FF6A00] cursor-pointer"
                  >
                    <option value="all">🌐 সকল কোর্স (All Courses)</option>
                    <option value="bcs">📚 BCS Course (বিসিএস)</option>
                    <option value="bank">🏦 Bank Jobs (ব্যাংক নিয়োগ)</option>
                    <option value="primary">🏫 Primary Teacher (প্রাথমিক শিক্ষক)</option>
                    <option value="ntrca">🎓 NTRCA Exam (এনটিআরসিএ)</option>
                    <option value="psc">📄 PSC Exams (পিএসসি)</option>
                  </select>
                </div>

                {/* Category Filter Tabs */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-500 block">পরীক্ষার ধরন (Exam Section):</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: "all", label: "সকল" },
                      { id: "daily", label: "⚡ ডেইলি" },
                      { id: "weekly", label: "📅 সাপ্তাহিক" },
                      { id: "subject", label: "📚 বিষয়ভিত্তিক" },
                    ].map((tab) => {
                      const isActive = archiveFilterCategory === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setArchiveFilterCategory(tab.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                            isActive
                              ? "bg-purple-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Archived Exam Cards List */}
              {(() => {
                const archivedPapers = examPapers.filter(p => {
                  // 1. Must be calculated as Archive status (or manually marked Archive)
                  const currentStatus = getExamStatus(p);
                  if (currentStatus !== "Archive") return false;

                  // 2. Course filter
                  if (archiveFilterCourse !== "all") {
                    if (p.course && p.course !== "all_courses" && p.course !== "all" && p.course !== archiveFilterCourse) {
                      return false;
                    }
                  }

                  // 3. Category filter
                  if (archiveFilterCategory !== "all") {
                    if (p.examType !== archiveFilterCategory) return false;
                  }

                  return true;
                });

                if (archivedPapers.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 text-center space-y-3 shadow-2xs">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                        📂
                      </div>
                      <h3 className="text-sm font-black text-slate-800">কোনো আর্কাইভড মডেল টেস্ট পাওয়া যায়নি</h3>
                      <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                        এই ফিল্টারে বর্তমানে কোনো প্রশ্নপত্র আর্কাইভ করা নেই। পরীক্ষার সময় শেষ হলে তা স্বয়ংক্রিয়ভাবে এখানে চলে আসবে এবং যেকোনো সময় এক্সাম/রি-এক্সাম দেওয়া যাবে।
                      </p>
                    </div>
                  );
                }

                const typeBadgeMap: Record<string, string> = {
                  daily: "⚡ ডেইলি কুইক টেস্ট",
                  weekly: "📅 সাপ্তাহিক মডেল টেস্ট",
                  subject: "📚 বিষয়ভিত্তিক",
                  special: "🩺 BCS Health Quiz"
                };

                return (
                  <div className="space-y-4">
                    <div className="text-xs font-extrabold text-slate-500 pl-1 flex items-center justify-between">
                      <span>মোট আর্কাইভড প্রশ্নপত্র ({archivedPapers.length} টি)</span>
                    </div>

                    {archivedPapers.map((paper) => {
                      const totalSec = paper.totalDurationSeconds || (paper.questions?.length || 10) * 36;
                      const durationMins = Math.floor(totalSec / 60);

                      return (
                        <div key={paper.id} className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-2xs space-y-3.5 hover:border-purple-300 transition-all">
                          {/* Card Top Row */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold text-slate-500">
                              📅 {paper.examDate || "Archive"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="bg-purple-100 text-purple-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                                {typeBadgeMap[paper.examType] || paper.examType}
                              </span>
                              <span className="bg-slate-100 text-slate-600 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                                📂 ARCHIVED
                              </span>
                            </div>
                          </div>

                          {/* Marks & Duration */}
                          <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            <span>কোর্স: <strong className="text-slate-800 uppercase">{paper.course}</strong></span>
                            <span>•</span>
                            <span>প্রশ্ন: {paper.questionCount || paper.questions?.length || 10} টি</span>
                            <span>•</span>
                            <span>সময়: {durationMins} মি</span>
                          </div>

                          {/* Title & Topic */}
                          <div className="space-y-1">
                            {paper.topic && (
                              <div className="text-xs font-extrabold text-[#FF6A00]">
                                Topic: <span className="text-slate-800 font-bold">"{paper.topic}"</span>
                              </div>
                            )}
                            <h4 className="text-sm font-black text-slate-800 leading-snug">
                              {paper.title}
                            </h4>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                              onClick={() => {
                                setArchiveModalOpen(false);
                                handleOpenTakeExam(paper);
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-3 rounded-2xl active:scale-95 transition-all shadow-md shadow-purple-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>📝 অনুশীলন করুন</span>
                            </button>

                            <button
                              onClick={() => {
                                setArchiveModalOpen(false);
                                handleOpenViewPaper(paper);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-2xl active:scale-95 transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>📄 প্রশ্নপত্র দেখুন</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </main>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW QUESTION PAPER MODAL ("প্রশ্নপত্র")                      */}
        {/* ========================================================= */}
        {viewingPaperModal && (
          <div className="fixed inset-0 z-[110] bg-slate-50 overflow-y-auto animate-fade-in text-left">
            {/* Top Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setViewingPaperModal(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                  title="ফিরে যান"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-[#FF6A00] text-white font-black text-xs rounded-lg flex items-center justify-center">
                    LM
                  </span>
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                    Live <span className="text-[#FF6A00]">MCQ</span> • প্রশ্নপত্র
                  </h2>
                </div>
              </div>

              {/* Subject filter dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={paperFilterSubject}
                  onChange={(e) => setPaperFilterSubject(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-extrabold rounded-xl px-3 py-2 focus:outline-none focus:border-[#FF6A00] cursor-pointer"
                >
                  <option value="All">সকল বিষয়</option>
                  {Array.from(new Set(viewingPaperModal.questions.map(q => q.subject).filter(Boolean))).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </header>

            {/* Paper Content */}
            <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
              {/* Title Banner */}
              <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-2xs space-y-2">
                <span className="text-[10px] font-black uppercase text-[#FF6A00] bg-orange-50 px-2.5 py-1 rounded-full">
                  {viewingPaperModal.course.toUpperCase()} • {viewingPaperModal.examType}
                </span>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {viewingPaperModal.title}
                </h1>
                <p className="text-xs font-extrabold text-slate-500">
                  মোট প্রশ্ন: {viewingPaperModal.questions.length} টি | সময়: {Math.floor((viewingPaperModal.totalDurationSeconds || viewingPaperModal.questions.length * 36) / 60)} মিনিট
                </p>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {viewingPaperModal.questions
                  .filter(q => {
                    const qSub = q.subject || (q as any).subjectName;
                    return paperFilterSubject === "All" || qSub === paperFilterSubject;
                  })
                  .map((q, idx) => {
                    const isAnswerRevealed = revealedAnswers[idx];
                    const isExpRevealed = revealedExplanations[idx];
                    const isFav = bookmarkedQuestions[idx];
                    const qSubject = q.subject || (q as any).subjectName;
                    const qText = q.question || (q as any).questionText || "";
                    const correctIdx = q.correctIndex !== undefined ? q.correctIndex : (q as any).correctOptionIndex;

                    return (
                      <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
                        {/* Question header */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm sm:text-base font-black text-slate-800 leading-relaxed flex items-start gap-1.5">
                            <span className="text-[#FF6A00] shrink-0">{idx + 1})</span>
                            <span><MathRenderer content={qText} /></span>
                          </h3>
                          {qSubject && (
                            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md shrink-0">
                              {qSubject}
                            </span>
                          )}
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt, optIdx) => {
                            const optionLetters = ["ক", "খ", "গ", "ঘ"];
                            const isCorrect = optIdx === correctIdx;
                            const showAsCorrect = isAnswerRevealed && isCorrect;

                            return (
                              <div 
                                key={optIdx}
                                className={`p-2.5 rounded-xl border text-sm font-bold transition-all flex items-center gap-2.5 ${
                                  showAsCorrect 
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-extrabold" 
                                    : "bg-slate-50 border-slate-200/80 text-slate-700"
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                  showAsCorrect ? "bg-emerald-600 text-white" : "bg-white border border-slate-300 text-slate-600"
                                }`}>
                                  {optionLetters[optIdx] || optIdx + 1}
                                </span>
                                <span className="leading-tight"><MathRenderer content={opt} /></span>
                                {showAsCorrect && <Check className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom Control Bar for each question */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setRevealedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                                isAnswerRevealed 
                                  ? "bg-emerald-100 text-emerald-700" 
                                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                              }`}
                            >
                              {isAnswerRevealed ? "উত্তর লুকান" : "উত্তর"}
                            </button>

                            <button
                              onClick={() => setRevealedExplanations(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                                isExpRevealed 
                                  ? "bg-blue-100 text-blue-700" 
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isExpRevealed ? "ব্যাখ্যা লুকান" : "ব্যাখ্যা"}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-slate-400">
                            <button
                              onClick={() => {
                                setBookmarkedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
                                if (soundEnabled) quizAudio.playClick();
                              }}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isFav ? "text-rose-500 bg-rose-50" : "hover:text-slate-600"
                              }`}
                            >
                              <Bookmark className="w-4 h-4 fill-current" />
                            </button>

                            <button
                              onClick={() => {
                                if ('speechSynthesis' in window) {
                                  const utterance = new SpeechSynthesisUtterance(q.question);
                                  utterance.lang = 'bn-BD';
                                  window.speechSynthesis.speak(utterance);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:text-slate-600 transition-all cursor-pointer"
                              title="শুনুন"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Explanation Box */}
                        {isExpRevealed && (
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-semibold space-y-1 animate-fade-in">
                            <div className="font-extrabold text-emerald-700">📌 ব্যাখ্যা ও রেফারেন্স:</div>
                            <MathRenderer content={q.explanation || `সঠিক উত্তর: ${q.options[q.correctIndex]}। এই বিষয়ের আরও বিস্তারিত তথ্য আমাদের প্রশ্ন ব্যাংকে দেওয়া আছে।`} />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </main>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAKE EXAM MODAL ("পরীক্ষা দিন")                            */}
        {/* ========================================================= */}
        {takingExamModal && (
          <div className="fixed inset-0 z-[110] bg-slate-50 overflow-y-auto animate-fade-in text-left">
            {/* Sticky Top Bar (Matching Image 3) */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExamQuestionsDrawerOpen(!examQuestionsDrawerOpen)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline">All Questions</span>
                </button>

                <button 
                  onClick={() => {
                    if (confirm("আপনি কি নিশ্চিত যে পরীক্ষাটি বাতিল করতে চান?")) {
                      setTakingExamModal(null);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Timer Countdown Display */}
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200/80 px-3 py-1.5 rounded-xl">
                <Timer className="w-4 h-4 text-[#FF6A00] animate-pulse" />
                <span className="font-black text-xs sm:text-sm text-slate-800 tracking-wider">
                  {Math.floor(examTimer / 60).toString().padStart(2, '0')}:{(examTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => setShowExamSubmitConfirmModal(true)}
                className="bg-[#FF6A00] hover:bg-orange-600 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
              >
                Submit
              </button>
            </header>

            {/* Yellow Alert Notice (Image 3) */}
            {showExamNoticeAlert && (
              <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>🔔 প্রতি প্রশ্নের মান ১ ও ভুল উত্তরের জন্য ০.৫০ কাটা যাবে।</span>
                </div>
                <button onClick={() => setShowExamNoticeAlert(false)} className="text-amber-800 hover:text-amber-950 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Questions List */}
            <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 pb-28">
              {takingExamModal.questions.map((q, qIdx) => {
                const optionLetters = ["ক", "খ", "গ", "ঘ"];
                const selectedOpt = examUserAnswers[qIdx];

                return (
                  <div key={qIdx} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 text-left">
                    {/* Real Question Text with Answered / Not Answered status on top-right */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm sm:text-base font-black text-slate-800 leading-relaxed flex items-start gap-1.5 flex-1 min-w-0">
                        <span className="text-[#FF6A00] shrink-0 font-extrabold">{qIdx + 1}.</span>
                        <span className="min-w-0 flex-1 break-words"><MathRenderer content={q.question} /></span>
                      </h3>

                      <div className="shrink-0 pt-0.5">
                        {selectedOpt !== undefined ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/90 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Answered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Not Answered
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Choices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isChoiceSelected = selectedOpt === oIdx;

                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleOptionSelectExam(qIdx, oIdx)}
                            className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                              isChoiceSelected
                                ? "bg-sky-100 border-2 border-sky-400 text-sky-950 font-black shadow-2xs"
                                : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              isChoiceSelected ? "bg-sky-500 text-white" : "bg-white border border-slate-300 text-slate-600"
                            }`}>
                              {optionLetters[oIdx] || oIdx + 1}
                            </span>
                            <span className="leading-tight"><MathRenderer content={opt} /></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </main>

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 p-3 flex items-center justify-between px-6 shadow-lg">
              <span className="text-xs font-black text-slate-600">
                Answered: <strong className="text-[#FF6A00]">{Object.keys(examUserAnswers).length}</strong> / {takingExamModal.questions.length}
              </span>

              <button
                onClick={() => setShowExamSubmitConfirmModal(true)}
                className="bg-[#FF6A00] hover:bg-orange-600 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                পরীক্ষা জমা দিন (Submit Exam)
              </button>
            </div>

            {/* Exam Submit Confirmation Popup Modal */}
            {showExamSubmitConfirmModal && (
              <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4 border border-slate-100 relative">
                  <div className="w-12 h-12 bg-orange-100 text-[#FF6A00] rounded-full flex items-center justify-center mx-auto shadow-2xs">
                    <HelpCircle className="w-6 h-6 stroke-[2.5px]" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-base text-slate-800">
                      পরীক্ষার খাতা জমা দিবেন?
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      আপনি কি নিশ্চিত যে আপনার পরীক্ষার খাতা জমা দিবেন? নাকি এখনো পরীক্ষা চালিয়ে যেতে চান?
                    </p>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-600 font-bold flex justify-around mt-2">
                      <span>উত্তর দিয়েছেন: <strong className="text-[#FF6A00]">{Object.keys(examUserAnswers).length}</strong></span>
                      <span>বাকি: <strong className="text-slate-800">{takingExamModal.questions.length - Object.keys(examUserAnswers).length}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => setShowExamSubmitConfirmModal(false)}
                      className="flex-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => {
                        setShowExamSubmitConfirmModal(false);
                        handleFinishExam();
                      }}
                      className="flex-1 py-3 px-3 bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Result Summary Modal */}
            {examSubmitted && examResultSummary && (
              <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl space-y-4 border border-slate-100">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Award className="w-7 h-7 stroke-[2.5px]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-800">
                      পরীক্ষা সফলভাবে সম্পন্ন হয়েছে!
                    </h3>
                    <p className="text-xs font-bold text-slate-400">
                      {takingExamModal.title}
                    </p>
                  </div>

                  {/* Results Grid */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                    <div>মোট প্রশ্ন: <strong className="text-slate-900">{examResultSummary.totalQuestions}</strong></div>
                    <div>উত্তর প্রদান: <strong className="text-purple-600">{examResultSummary.answeredCount}</strong></div>
                    <div>সঠিক: <strong className="text-emerald-600">{examResultSummary.correctCount}</strong></div>
                    <div>ভুল: <strong className="text-rose-600">{examResultSummary.wrongCount}</strong></div>
                    <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between text-sm">
                      <span>প্রাপ্ত নম্বর:</span>
                      <span className="font-black text-[#FF6A00]">{examResultSummary.netMarks}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const paper = takingExamModal;
                        setViewingAnswerSheetData({
                          paper,
                          summary: examResultSummary,
                          userAnswers: { ...examUserAnswers }
                        });
                        setTakingExamModal(null);
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      📄 উত্তরপত্র দেখুন
                    </button>
                    <button
                      onClick={() => setTakingExamModal(null)}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Apple UI Package Purchase Modal */}
        {selectedPurchasePkg && (
          <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl space-y-4 border border-slate-100 relative">
              <button 
                onClick={() => setSelectedPurchasePkg(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 bg-[#007AFF]/10 text-[#007AFF] rounded-2xl flex items-center justify-center mx-auto text-2xl font-black shadow-2xs">
                🛍️
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-[#1D1D1F] leading-snug">
                  {selectedPurchasePkg.title}
                </h3>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-xl font-black text-[#007AFF]">
                    {selectedPurchasePkg.price}
                  </span>
                  {selectedPurchasePkg.oldPrice && (
                    <span className="text-xs text-slate-400 font-bold line-through">
                      {selectedPurchasePkg.oldPrice}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-light leading-relaxed pt-1">
                  {selectedPurchasePkg.desc}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-left space-y-2">
                <p className="text-[11px] font-bold text-slate-700">পেমেন্ট মাধ্যম নির্বাচন করুন:</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white border-2 border-[#007AFF] rounded-xl p-2 text-center text-xs font-bold text-slate-800 shadow-2xs cursor-pointer">
                    bKash
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2 text-center text-xs font-bold text-slate-600 hover:border-[#007AFF] transition-all cursor-pointer">
                    Nagad
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2 text-center text-xs font-bold text-slate-600 hover:border-[#007AFF] transition-all cursor-pointer">
                    Rocket
                  </div>
                </div>
                <div className="text-[10px] text-[#FF6A00] font-bold pt-1">
                  মার্চেন্ট / বিকাশ নম্বর: <span className="font-mono text-slate-900 font-extrabold">01700000000</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setSelectedPurchasePkg(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl active:scale-95 transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={() => {
                    alert(`ধন্যবাদ! ${selectedPurchasePkg.title} এর জন্য আপনার পেমেন্ট অর্ডার গ্রহণ করা হয়েছে।`);
                    setSelectedPurchasePkg(null);
                  }}
                  className="flex-1 py-3 bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs rounded-2xl active:scale-95 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  পেমেন্ট সম্পন্ন করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ANSWER SHEET / DETAILED RESULT CARD MODAL                  */}
        {/* ========================================================= */}
        {viewingAnswerSheetData && (
          <div 
            ref={answerSheetScrollRef}
            onScroll={(e) => setShowAnswerSheetScrollTop(e.currentTarget.scrollTop > 200)}
            className="fixed inset-0 z-[130] bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-fade-in p-4 sm:p-6 text-left"
          >
            <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200/80 rounded-[2.5rem] shadow-2xl overflow-hidden my-4 sm:my-8 space-y-6 pb-12 relative">
              {/* Top Header */}
              <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setViewingAnswerSheetData(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                    title="বন্ধ করুন"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
                  </button>
                  <div>
                    <h2 className="font-black text-base text-slate-900 leading-snug">
                      উত্তরপত্র ও রেজাল্ট কার্ড
                    </h2>
                    <p className="text-xs text-slate-500 font-bold">
                      {viewingAnswerSheetData.paper.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingAnswerSheetData(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <main className="px-5 sm:px-8 space-y-6">
                {/* RESULT CARD SUMMARY */}
                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 text-[#FF6A00] rounded-2xl flex items-center justify-center font-black">
                        <Award className="w-6 h-6 stroke-[2.5px]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6A00] bg-orange-50 px-2.5 py-1 rounded-full">
                          Result Card
                        </span>
                        <h3 className="text-lg font-black text-slate-900 mt-1">
                          আপনার পরীক্ষার ফলাফল
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-bold block">প্রাপ্ত নম্বর</span>
                      <span className="text-2xl font-black text-[#FF6A00]">
                        {viewingAnswerSheetData.summary.netMarks} <span className="text-xs font-extrabold text-slate-400">/ {viewingAnswerSheetData.summary.totalQuestions}</span>
                      </span>
                    </div>
                  </div>

                  {/* Detailed Metric Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                    {/* Score */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                      <span className="text-slate-400 text-[11px]">Score (স্কোর)</span>
                      <p className="text-base font-black text-slate-900">
                        {viewingAnswerSheetData.summary.netMarks}
                      </p>
                    </div>

                    {/* Percentage */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                      <span className="text-slate-400 text-[11px]">Percentage</span>
                      <p className="text-base font-black text-purple-600">
                        {viewingAnswerSheetData.summary.percentage}%
                      </p>
                    </div>

                    {/* Time Taken */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                      <span className="text-slate-400 text-[11px]">Time Taken</span>
                      <p className="text-base font-black text-sky-600">
                        {viewingAnswerSheetData.summary.timeTakenFormatted}
                      </p>
                    </div>

                    {/* Right Answers */}
                    <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-emerald-800">
                        <span className="text-[11px]">সঠিক উত্তর</span>
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      </div>
                      <p className="text-lg font-black text-emerald-800">
                        {viewingAnswerSheetData.summary.correctCount} টি
                      </p>
                    </div>

                    {/* Wrong Answers */}
                    <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-rose-800">
                        <span className="text-[11px]">ভুল উত্তর</span>
                        <X className="w-4 h-4 text-rose-600 stroke-[3]" />
                      </div>
                      <p className="text-lg font-black text-rose-800">
                        {viewingAnswerSheetData.summary.wrongCount} টি
                      </p>
                    </div>

                    {/* Skipped Answers */}
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-[11px]">এড়িয়ে গেছেন</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 stroke-[3]" />
                      </div>
                      <p className="text-lg font-black text-slate-700">
                        {viewingAnswerSheetData.summary.skippedCount} টি
                      </p>
                    </div>
                  </div>

                  {/* Negative Marking Explanation Banner */}
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 font-extrabold flex items-center justify-between">
                    <span>⚠️ ভুল উত্তরের জন্য কাটা মার্ক (Negative Marks):</span>
                    <span className="text-rose-600 font-black text-sm">
                      -{viewingAnswerSheetData.summary.penalty}
                    </span>
                  </div>
                </div>

                {/* QUESTION & ANSWER LIST SECTION */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span>📋 প্রশ্ন ও বিস্তারিত উত্তর সমাধান</span>
                    <span className="text-xs text-slate-400 font-bold">({viewingAnswerSheetData.paper.questions.length} টি)</span>
                  </h3>

                  {viewingAnswerSheetData.paper.questions.map((q, qIdx) => {
                    const userChoice = viewingAnswerSheetData.userAnswers[qIdx];
                    const correctChoice = q.correctIndex;
                    const isCorrect = userChoice === correctChoice;
                    const isSkipped = userChoice === undefined;
                    const isWrong = !isSkipped && !isCorrect;

                    const optionLetters = ["ক", "খ", "গ", "ঘ"];

                    return (
                      <div 
                        key={qIdx} 
                        className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5 ${
                          isCorrect 
                            ? "border-emerald-200/80" 
                            : isWrong 
                            ? "border-rose-200/80" 
                            : "border-slate-200/80"
                        }`}
                      >
                        {/* Header with question & status pill */}
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm sm:text-base font-black text-slate-800 leading-relaxed flex items-start gap-1.5">
                            <span className="text-[#FF6A00] shrink-0">{qIdx + 1})</span>
                            <span><MathRenderer content={q.question} /></span>
                          </h4>

                          {/* Status Badge */}
                          {isCorrect && (
                            <span className="bg-emerald-50 border border-emerald-300 text-emerald-700 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                              <span>সঠিক উত্তর</span>
                            </span>
                          )}
                          {isWrong && (
                            <span className="bg-rose-50 border border-rose-300 text-rose-700 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                              <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                              <span>ভুল উত্তর</span>
                            </span>
                          )}
                          {isSkipped && (
                            <span className="bg-slate-100 border border-slate-300 text-slate-700 font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[3]" />
                              <span>এড়িয়ে গেছেন</span>
                            </span>
                          )}
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt, optIdx) => {
                            const isThisCorrectOpt = optIdx === correctChoice;
                            const isThisUserSelected = userChoice === optIdx;

                            let optBg = "bg-slate-50 border-slate-200/80 text-slate-700";
                            let badgeBg = "bg-white border border-slate-300 text-slate-600";

                            if (isThisCorrectOpt) {
                              // Correct option is ALWAYS GREEN (whether chosen, wrong or skipped)
                              optBg = "bg-emerald-50/90 border-2 border-emerald-500 text-emerald-950 font-black shadow-2xs";
                              badgeBg = "bg-emerald-600 text-white";
                            } else if (isThisUserSelected && !isThisCorrectOpt) {
                              // User selected wrong option is RED
                              optBg = "bg-rose-50/90 border-2 border-rose-500 text-rose-950 font-black shadow-2xs";
                              badgeBg = "bg-rose-600 text-white";
                            }

                            return (
                              <div 
                                key={optIdx}
                                className={`p-2.5 rounded-xl border text-sm font-bold transition-all flex items-center gap-2.5 ${optBg}`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${badgeBg}`}>
                                  {optionLetters[optIdx] || optIdx + 1}
                                </span>
                                <span className="leading-tight flex-1"><MathRenderer content={opt} /></span>
                                {isThisCorrectOpt && <Check className="w-4 h-4 text-emerald-600 ml-auto shrink-0 stroke-[3]" />}
                                {isThisUserSelected && !isThisCorrectOpt && <X className="w-4 h-4 text-rose-600 ml-auto shrink-0 stroke-[3]" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Toggle Button & Collapsible Body */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedExplanations(prev => ({
                                ...prev,
                                [qIdx]: !prev[qIdx]
                              }));
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF6A00] border border-orange-200/80 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95"
                          >
                            <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{expandedExplanations[qIdx] ? "ব্যাখ্যা লুকান" : "ব্যাখ্যা দেখুন"}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedExplanations[qIdx] ? "rotate-180" : ""}`} />
                          </button>

                          {expandedExplanations[qIdx] && (
                            <div className="mt-2.5 p-3.5 bg-slate-50 border border-orange-100 rounded-xl text-xs text-slate-800 space-y-1.5 animate-fade-in">
                              <div className="font-extrabold text-[#FF6A00] flex items-center gap-1">
                                📌 <span>ব্যাখ্যা ও সমাধান:</span>
                              </div>
                              <div className="text-slate-700 font-medium leading-relaxed">
                                <MathRenderer content={q.explanation || `সঠিক উত্তর: ${q.options[q.correctIndex]}। বিসিএস ও পিএসসি স্ট্যান্ডার্ড বিষয়ভিত্তিক পর্যালোচনার ভিত্তিতে সমাধান প্রদান করা হয়েছে।`} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Exit Button */}
                <div className="pt-8 pb-4 flex justify-center border-t border-slate-200/80">
                  <button
                    onClick={() => setViewingAnswerSheetData(null)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>উত্তরপত্র বন্ধ করুন (Exit Answer Sheet)</span>
                  </button>
                </div>
              </main>
            </div>
          </div>
        )}

        {/* DESKTOP MODALS */}
        {/* Contact Us Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-white rounded-[2rem] p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-2xl relative">
              <button 
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-[#FF6A00] rounded-xl flex items-center justify-center font-black">
                  📞
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Contact Us (যোগাযোগ)</h3>
                  <p className="text-xs text-slate-500 font-semibold">Job Master সাপোর্ট সেন্টার</p>
                </div>
              </div>
              <div className="space-y-3 pt-2 text-xs font-bold text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>📧 ইমেইল সাপোর্ট:</span>
                  <span className="font-mono text-[#FF6A00]">support@jobmaster.app</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>📱 হেল্পলাইন:</span>
                  <span className="font-mono text-[#FF6A00]">+880 1700-000000</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>🌐 ফেসবুক পেজ:</span>
                  <span className="text-blue-600">fb.com/jobmasterapp</span>
                </div>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="w-full py-3 bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        )}

        {/* About Us Modal */}
        {showAboutModal && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-white rounded-[2rem] p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-2xl relative">
              <button 
                onClick={() => setShowAboutModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-[#FF6A00] rounded-xl flex items-center justify-center font-black">
                  LM
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">About Us (আমাদের সম্পর্কে)</h3>
                  <p className="text-xs text-slate-500 font-semibold">Job Master Version 2.5.0</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Job Master হলো বাংলাদেশের চাকরি প্রার্থীদের জন্য সবচেয়ে সমৃদ্ধ ও বিশ্বস্ত ডিজিটাল লার্নিং প্ল্যাটফর্ম। বিসিএস, ব্যাংক জব, প্রাইমারি শিক্ষক নিয়োগ ও অন্যান্য সরকারি চাকরির জন্য রিয়েল-টাইম মডেল টেস্ট ও বিষয়ভিত্তিক প্রস্তুতি নিশ্চিত করাই আমাদের মূল লক্ষ্য।
              </p>
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full py-3 bg-[#FF6A00] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-white rounded-[2rem] p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-2xl relative">
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-50 text-[#FF6A00] rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Edit Profile</h3>
                  <p className="text-[10px] font-extrabold text-slate-400">আপডেট করুন আপনার তথ্য</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                {/* Photo Upload Box */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {profileAvatarUrl ? (
                      <img src={profileAvatarUrl} alt={profileName} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-7 h-7 text-slate-300 fill-current" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => profileFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#FF6A00] hover:bg-[#e05d00] text-white font-extrabold rounded-lg text-[11px] cursor-pointer active:scale-95 transition-all text-center"
                    >
                      {profileAvatarUrl ? "Change Photo" : "Upload Photo"}
                    </button>
                    {profileAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileAvatarUrl("");
                          if (typeof window !== "undefined") {
                            localStorage.removeItem("job_master_user_avatar");
                          }
                        }}
                        className="text-[10px] font-extrabold text-red-500 hover:underline text-left cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Student ID</label>
                  <input 
                    type="text" 
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsEditProfileOpen(false);
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="w-full py-3 bg-[#FF6A00] hover:bg-[#e05d00] text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-white rounded-[2rem] p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-2xl relative">
              <button 
                onClick={() => setIsChangePasswordOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Change Password</h3>
                  <p className="text-[10px] font-extrabold text-slate-400">নতুন পাসওয়ার্ড সেটিং</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-600 mb-1">New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      if (soundEnabled) quizAudio.playClick();
                    }}
                    className="w-full py-3 bg-[#FF6A00] hover:bg-[#e05d00] text-white font-extrabold rounded-xl text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-white rounded-[2rem] p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-2xl relative">
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="font-black text-base text-slate-900">বিজ্ঞপ্তি (Notifications)</h3>
              </div>
              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="p-3 bg-orange-50 border border-orange-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-[#FF6A00] font-black uppercase">নতুন আপডেট</span>
                  <p className="text-slate-800">বিসিএস প্রিলিমিনারি ৪৫তম ও ৪৬তম স্পেশাল মডেল টেস্ট যুক্ত করা হয়েছে!</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-black uppercase">গতকাল</span>
                  <p className="text-slate-700">সাপ্তাহিক লাইভ কুইজ প্রতিযোগিতার ফল প্রকাশিত হয়েছে।</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-white rounded-[2rem] p-6 max-w-md w-full space-y-4 border border-slate-100 shadow-2xl relative">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="font-black text-base text-slate-900">সেটিংস (Settings)</h3>
              </div>
              <div className="space-y-3 pt-2 text-xs font-bold">
                <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <span>🔊 সাউন্ড ইফেক্ট:</span>
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-3 py-1.5 rounded-lg font-black ${soundEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                  >
                    {soundEnabled ? "চালু" : "বন্ধ"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Exam Details Apple UI Modal */}
        {selectedLiveExamModal && (
          <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-white rounded-[2rem] max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 relative animate-scale-up">
              
              {/* Top Badge & Close button */}
              <div className="flex items-center justify-between">
                <span className="bg-orange-100 text-[#FF6A00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF6A00] animate-ping"></span>
                  🔴 লাইভ পরীক্ষা বিবরণ
                </span>
                <button 
                  onClick={() => setSelectedLiveExamModal(null)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Exam Title & Course */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {selectedLiveExamModal.title}
                </h3>
                <p className="text-xs font-extrabold text-[#FF6A00]">
                  For All Job Exam
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-extrabold text-slate-700">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>প্রশ্ন: {selectedLiveExamModal.questions?.length || selectedLiveExamModal.questionCount || 10} টি</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>সময়: {Math.ceil(((selectedLiveExamModal.questions?.length || selectedLiveExamModal.questionCount || 10) * 36) / 60)} মিনিট</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>মোট নম্বর: {selectedLiveExamModal.totalMarks || selectedLiveExamModal.questions?.length || 10}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>নেগেটিভ মার্কস: ০.৫০</span>
                </div>
              </div>

              {selectedLiveExamModal.topic && (
                <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-2xl text-xs font-semibold text-slate-700 space-y-0.5">
                  <span className="font-black text-[#FF6A00] block text-[11px]">সিলেবাস / বিষয়বস্তু:</span>
                  <p>{selectedLiveExamModal.topic}</p>
                </div>
              )}

              {/* Live Running Timer Box */}
              <div className="p-3 bg-rose-50/80 border border-rose-100 rounded-2xl flex items-center justify-between text-xs font-bold text-rose-700">
                <span>লাইভ সময়সীমা চলছে:</span>
                <span className="font-black text-rose-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatLiveElapsed(selectedLiveExamModal.startDateTime, selectedLiveExamModal.createdAt)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setSelectedLiveExamModal(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs transition-all active:scale-95 cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={() => {
                    const paperToTake = selectedLiveExamModal;
                    setSelectedLiveExamModal(null);
                    handleOpenTakeExam(paperToTake);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#FF6A00] to-[#FF5500] hover:from-[#FF5500] hover:to-[#E54800] text-white font-extrabold rounded-2xl text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  পরীক্ষা শুরু করুন
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
    </PwaProvider>
  );
}
