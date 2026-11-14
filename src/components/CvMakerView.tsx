"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Camera,
  Trash2,
  Plus,
  Download,
  Eye,
  Edit3,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  FileText,
  Phone,
  Mail,
  MapPin,
  Globe,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader2,
  ImageOff,
  SlidersHorizontal,
  ShieldCheck,
  Laptop,
  FolderGit2,
  Users,
} from "lucide-react";

interface EducationItem {
  id: string;
  degree: string;
  subject: string;
  institution: string;
  board: string;
  result: string;
  passingYear: string;
}

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  duration: string;
  details: string;
}

interface TrainingItem {
  id: string;
  title: string;
  institute: string;
  duration: string;
}

interface ReferenceItem {
  id: string;
  name: string;
  designation: string;
  organization: string;
  phone: string;
  email: string;
}

interface CvData {
  language: "en" | "bn";
  template: "classic" | "modern";
  accentColor: string;
  showPhoto: boolean;
  photoDataUrl: string;
  fullName: string;
  headline: string;
  phone: string;
  email: string;
  presentAddress: string;
  permanentAddress: string;
  website: string;
  careerObjective: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  religion: string;
  maritalStatus: string;
  bloodGroup: string;
  nidNumber: string;
  educations: EducationItem[];
  experiences: ExperienceItem[];
  skills: string;
  computerSkills: string;
  languages: string;
  trainings: TrainingItem[];
  projectsOrAchievements: string;
  hobbies: string;
  references: ReferenceItem[];
  showDeclaration: boolean;
  declarationText: string;
  signatureName: string;
  signatureDate: string;
}

const STORAGE_KEY = "jobmaster_cv_builder_data_v1";

const ACCENT_THEMES = [
  { id: "navy", label: "Classic Navy", color: "#1E293B" },
  { id: "orange", label: "JobMaster Orange", color: "#FF6A00" },
  { id: "teal", label: "Deep Teal", color: "#0F766E" },
  { id: "blue", label: "Corporate Blue", color: "#1D4ED8" },
];

const DEFAULT_DECLARATION_EN =
  "I hereby declare that all the information stated above is true and accurate to the best of my knowledge and belief.";
const DEFAULT_DECLARATION_BN =
  "আমি এই মর্মে অঙ্গীকার করছি যে, উপরে বর্ণিত সকল তথ্য আমার জানামতে সম্পূর্ণ সত্য ও সঠিক।";

const EMPTY_CV_DATA = (initialName = "", initialEmail = ""): CvData => ({
  language: "en",
  template: "classic",
  accentColor: "#1E293B",
  showPhoto: true,
  photoDataUrl: "",
  fullName: initialName,
  headline: "",
  phone: "",
  email: initialEmail,
  presentAddress: "",
  permanentAddress: "",
  website: "",
  careerObjective: "",
  fatherName: "",
  motherName: "",
  dateOfBirth: "",
  gender: "",
  nationality: "",
  religion: "",
  maritalStatus: "",
  bloodGroup: "",
  nidNumber: "",
  educations: [
    {
      id: "edu-1",
      degree: "",
      subject: "",
      institution: "",
      board: "",
      result: "",
      passingYear: "",
    },
  ],
  experiences: [],
  skills: "",
  computerSkills: "",
  languages: "",
  trainings: [],
  projectsOrAchievements: "",
  hobbies: "",
  references: [],
  showDeclaration: true,
  declarationText: DEFAULT_DECLARATION_EN,
  signatureName: initialName,
  signatureDate: "",
});

const SAMPLE_CV_DATA: CvData = {
  language: "en",
  template: "classic",
  accentColor: "#1E293B",
  showPhoto: true,
  photoDataUrl: "",
  fullName: "Md. Tariqul Islam",
  headline: "Officer / Management Trainee Candidate",
  phone: "+880 1711-000000",
  email: "tariqul.example@gmail.com",
  presentAddress: "House 24, Road 6, Mirpur-10, Dhaka-1216",
  permanentAddress: "Village: Shantipur, Post: Sadar, Cumilla",
  website: "linkedin.com/in/tariqul-islam",
  careerObjective:
    "Seeking a challenging and growth-oriented position in a reputed organization where I can utilize my analytical, administrative, and problem-solving skills to contribute to organizational excellence.",
  fatherName: "Md. Abdul Karim",
  motherName: "Mrs. Rahima Begum",
  dateOfBirth: "15 March 1999",
  gender: "Male",
  nationality: "Bangladeshi",
  religion: "Islam",
  maritalStatus: "Unmarried",
  bloodGroup: "O+",
  nidNumber: "19991234567890",
  educations: [
    {
      id: "s-edu-1",
      degree: "MBA / Masters",
      subject: "Finance & Banking",
      institution: "University of Dhaka",
      board: "Dhaka",
      result: "CGPA 3.75 / 4.00",
      passingYear: "2023",
    },
    {
      id: "s-edu-2",
      degree: "BBA / Honours",
      subject: "Finance",
      institution: "University of Dhaka",
      board: "Dhaka",
      result: "CGPA 3.68 / 4.00",
      passingYear: "2022",
    },
    {
      id: "s-edu-3",
      degree: "HSC",
      subject: "Business Studies",
      institution: "Dhaka City College",
      board: "Dhaka",
      result: "GPA 5.00 / 5.00",
      passingYear: "2017",
    },
    {
      id: "s-edu-4",
      degree: "SSC",
      subject: "Business Studies",
      institution: "Cumilla Zilla School",
      board: "Cumilla",
      result: "GPA 5.00 / 5.00",
      passingYear: "2015",
    },
  ],
  experiences: [
    {
      id: "s-exp-1",
      role: "Junior Executive (Intern)",
      company: "ABC Financial Services Ltd.",
      location: "Motijheel, Dhaka",
      duration: "Jan 2024 – Dec 2024",
      details:
        "Assisted in preparing daily financial reports, client documentation verification, and data analysis using MS Excel.",
    },
  ],
  skills:
    "Analytical Thinking, Team Leadership, Report Writing, Time Management, Public Speaking",
  computerSkills:
    "MS Word, MS Excel (Advanced), MS PowerPoint, Google Workspace, Bangla & English Typing",
  languages: "Bengali (Native), English (Fluent in Reading, Writing & Speaking)",
  trainings: [
    {
      id: "s-trn-1",
      title: "Certificate Course on Banking & Financial Modeling",
      institute: "BIBM Training Center",
      duration: "3 Months (2024)",
    },
  ],
  projectsOrAchievements:
    "• Champion in Inter-Department Case Competition 2022\n• Active Member of University Career & Debate Club",
  hobbies: "Reading Non-Fiction, Volunteering, Chess",
  references: [
    {
      id: "s-ref-1",
      name: "Prof. Dr. Kamal Uddin",
      designation: "Professor, Dept. of Finance",
      organization: "University of Dhaka",
      phone: "+880 1811-000000",
      email: "kamal.du@example.edu",
    },
  ],
  showDeclaration: true,
  declarationText: DEFAULT_DECLARATION_EN,
  signatureName: "Md. Tariqul Islam",
  signatureDate: "",
};

const OBJECTIVE_PRESETS = [
  {
    label: "বাংলা অবজেক্টিভ",
    text: "একটি স্বনামধন্য প্রতিষ্ঠানে দায়িত্বশীল পদে কাজ করে আমার শিক্ষাগত যোগ্যতা, দক্ষতা ও নিষ্ঠার মাধ্যমে প্রতিষ্ঠানের উন্নয়নে সক্রিয় ভূমিকা রাখতে চাই।",
    lang: "bn" as const,
  },
  {
    label: "ফ্রেশ গ্র্যাজুয়েট (বাংলা)",
    text: "একটি গতিশীল ও প্রবৃদ্ধিশীল প্রতিষ্ঠানে দীর্ঘমেয়াদী ক্যারিয়ার গড়তে চাই, যেখানে আমার একাডেমিক জ্ঞান, বিশ্লেষণধর্মী চিন্তাভাবনা এবং নিষ্ঠার মাধ্যমে প্রতিষ্ঠানের লক্ষ্য অর্জনে কার্যকর অবদান রাখতে পারব।",
    lang: "bn" as const,
  },
  {
    label: "ব্যাংক ও কর্পোরেট (বাংলা)",
    text: "একজন নিবেদিতপ্রাণ ও দায়িত্বশীল স্নাতক হিসেবে ব্যাংক ও কর্পোরেট প্রতিষ্ঠানে অফিসার পদে যুক্ত হয়ে আমার গাণিতিক, আর্থিক বিশ্লেষণ এবং গ্রাহকসেবা দক্ষতার মাধ্যমে প্রতিষ্ঠানের সাফল্যে অবদান রাখতে চাই।",
    lang: "bn" as const,
  },
  {
    label: "ফ্রেশ গ্র্যাজুয়েট (English)",
    text: "To build a long-term career in a dynamic and growth-oriented organization where my academic knowledge, analytical thinking, and strong work ethic can add measurable value.",
    lang: "en" as const,
  },
  {
    label: "ব্যাংক ও কর্পোরেট (English)",
    text: "Dedicated and detail-oriented graduate seeking an Officer position to leverage strong quantitative, financial analysis, and customer service skills toward institutional success.",
    lang: "en" as const,
  },
];

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

type CvBlock =
  | { id: string; kind: "header"; keepWithNext?: boolean }
  | { id: string; kind: "sectionTitle"; title: string; keepWithNext: true }
  | { id: string; kind: "paragraph"; text: string; justify?: boolean }
  | { id: string; kind: "experienceItem"; exp: ExperienceItem }
  | { id: string; kind: "eduThead"; keepWithNext: true }
  | { id: string; kind: "eduRow"; edu: EducationItem }
  | { id: string; kind: "skillRow"; label: string; value: string }
  | { id: string; kind: "trainingItem"; trn: TrainingItem }
  | { id: string; kind: "personalRow"; label: string; value: string }
  | { id: string; kind: "refPair"; refs: ReferenceItem[]; twoCols: boolean }
  | { id: string; kind: "declarationFooter" };

function getBlockMarginTop(prevKind: CvBlock["kind"] | null, currKind: CvBlock["kind"]): number {
  if (!prevKind) return 0;
  if (prevKind === "header") return 20;
  if (currKind === "sectionTitle") return 15;
  if (prevKind === "sectionTitle") return 8;
  if (currKind === "declarationFooter") return 16;
  if (currKind === "eduRow" && (prevKind === "eduThead" || prevKind === "eduRow")) return 0;
  if (currKind === "personalRow" && prevKind === "personalRow") return 0;
  if (currKind === "experienceItem" && prevKind === "experienceItem") return 10;
  if (currKind === "trainingItem" && prevKind === "trainingItem") return 6;
  if (currKind === "skillRow" && prevKind === "skillRow") return 5;
  if (currKind === "paragraph" && prevKind === "paragraph") return 4;
  if (currKind === "refPair" && prevKind === "refPair") return 10;
  return 6;
}

interface CvMakerViewProps {
  initialName?: string;
  initialEmail?: string;
  soundEnabled?: boolean;
  quizAudio?: any;
}

const hasText = (v?: string | null): boolean => Boolean(v && v.trim().length > 0);

// Process uploaded image into crisp passport aspect ratio (3.5 : 4.5) DataURL
function processPassportPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ফাইল পড়া যায়নি"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("ছবি লোড করা যায়নি"));
      img.onload = () => {
        const targetRatio = 35 / 45; // Standard passport ratio (35mm x 45mm)
        const targetWidth = 420;
        const targetHeight = 540;

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const imgRatio = img.width / img.height;
        let sx = 0;
        let sy = 0;
        let sWidth = img.width;
        let sHeight = img.height;

        if (imgRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = Math.max(0, (img.height - sHeight) * 0.25); // Bias slightly upward for portrait head framing
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function CvMakerView({
  initialName = "",
  initialEmail = "",
  soundEnabled = false,
  quizAudio,
}: CvMakerViewProps) {
  const [cv, setCv] = useState<CvData>(() => EMPTY_CV_DATA(initialName, initialEmail));
  const [hydrated, setHydrated] = useState(false);
  const [activeMode, setActiveMode] = useState<"edit" | "preview">("edit");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    photo: true,
    basic: true,
    objective: false,
    personal: false,
    education: true,
    experience: false,
    skills: false,
    training: false,
    extras: false,
    references: false,
    declaration: false,
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [pageAssignments, setPageAssignments] = useState<string[][]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewWrapperRef = useRef<HTMLDivElement | null>(null);
  const measureContainerRef = useRef<HTMLDivElement | null>(null);
  const printPageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const applyLanguageChange = (prev: CvData, nextLang: "en" | "bn"): CvData => {
    const currentDecl = (prev.declarationText || "").trim();
    let nextDecl = prev.declarationText;
    if (
      !currentDecl ||
      currentDecl === DEFAULT_DECLARATION_EN ||
      currentDecl === DEFAULT_DECLARATION_BN
    ) {
      nextDecl = nextLang === "bn" ? DEFAULT_DECLARATION_BN : DEFAULT_DECLARATION_EN;
    }
    return {
      ...prev,
      language: nextLang,
      declarationText: nextDecl,
    };
  };

  const playClick = () => {
    if (soundEnabled && quizAudio?.playClick) {
      quizAudio.playClick();
    }
  };

  const showToast = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Load saved CV from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setCv((prev) => {
            const lang: "en" | "bn" = parsed.language === "bn" ? "bn" : "en";
            const rawDecl = typeof parsed.declarationText === "string" ? parsed.declarationText.trim() : "";
            const fixedDecl =
              lang === "bn" && rawDecl === DEFAULT_DECLARATION_EN
                ? DEFAULT_DECLARATION_BN
                : lang === "en" && rawDecl === DEFAULT_DECLARATION_BN
                ? DEFAULT_DECLARATION_EN
                : parsed.declarationText ?? (lang === "bn" ? DEFAULT_DECLARATION_BN : DEFAULT_DECLARATION_EN);
            return {
              ...prev,
              ...parsed,
              declarationText: fixedDecl,
              fullName: parsed.fullName || initialName || prev.fullName,
              email: parsed.email || initialEmail || prev.email,
            };
          });
        }
      }
    } catch (e) {}
    setHydrated(true);
  }, [initialName, initialEmail]);

  // Persist CV changes to localStorage
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
    } catch (e) {
      // Ignore quota exceeded on huge images
    }
  }, [cv, hydrated]);

  // Responsive A4 preview scaling (account for container horizontal padding)
  useEffect(() => {
    const updateScale = () => {
      if (!previewWrapperRef.current) return;
      const horizontalPad = window.innerWidth < 640 ? 18 : 34;
      const availableWidth = Math.max(240, previewWrapperRef.current.clientWidth - horizontalPad);
      if (availableWidth < A4_WIDTH_PX) {
        setPreviewScale(availableWidth / A4_WIDTH_PX);
      } else {
        setPreviewScale(1);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [activeMode]);

  const toggleSection = (key: string) => {
    playClick();
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "অনুগ্রহ করে একটি সঠিক ইমেজ ফাইল (JPG/PNG) সিলেক্ট করুন।");
      return;
    }
    try {
      const cropped = await processPassportPhoto(file);
      setCv((prev) => ({ ...prev, photoDataUrl: cropped, showPhoto: true }));
      showToast("success", "পাসপোর্ট সাইজ ছবি সফলভাবে যুক্ত হয়েছে!");
    } catch (err) {
      showToast("error", "ছবি প্রসেস করতে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।");
    } finally {
      e.target.value = "";
    }
  };

  // Filtered non-empty arrays so empty rows NEVER appear in preview/PDF
  const validEducations = cv.educations.filter(
    (e) =>
      hasText(e.degree) ||
      hasText(e.subject) ||
      hasText(e.institution) ||
      hasText(e.board) ||
      hasText(e.result) ||
      hasText(e.passingYear)
  );

  const validExperiences = cv.experiences.filter(
    (e) =>
      hasText(e.role) ||
      hasText(e.company) ||
      hasText(e.location) ||
      hasText(e.duration) ||
      hasText(e.details)
  );

  const validTrainings = cv.trainings.filter(
    (t) => hasText(t.title) || hasText(t.institute) || hasText(t.duration)
  );

  const validReferences = cv.references.filter(
    (r) =>
      hasText(r.name) ||
      hasText(r.designation) ||
      hasText(r.organization) ||
      hasText(r.phone) ||
      hasText(r.email)
  );

  const personalDetailRows = [
    {
      label: cv.language === "bn" ? "পিতার নাম" : "Father's Name",
      value: cv.fatherName,
    },
    {
      label: cv.language === "bn" ? "মাতার নাম" : "Mother's Name",
      value: cv.motherName,
    },
    {
      label: cv.language === "bn" ? "জন্ম তারিখ" : "Date of Birth",
      value: cv.dateOfBirth,
    },
    {
      label: cv.language === "bn" ? "লিঙ্গ" : "Gender",
      value: cv.gender,
    },
    {
      label: cv.language === "bn" ? "জাতীয়তা" : "Nationality",
      value: cv.nationality,
    },
    {
      label: cv.language === "bn" ? "ধর্ম" : "Religion",
      value: cv.religion,
    },
    {
      label: cv.language === "bn" ? "বৈবাহিক অবস্থা" : "Marital Status",
      value: cv.maritalStatus,
    },
    {
      label: cv.language === "bn" ? "রক্তের গ্রুপ" : "Blood Group",
      value: cv.bloodGroup,
    },
    {
      label: cv.language === "bn" ? "জাতীয় পরিচয়পত্র নং" : "National ID (NID)",
      value: cv.nidNumber,
    },
    {
      label: cv.language === "bn" ? "বর্তমান ঠিকানা" : "Present Address",
      value: cv.presentAddress,
    },
    {
      label: cv.language === "bn" ? "স্থায়ী ঠিকানা" : "Permanent Address",
      value: cv.permanentAddress,
    },
  ].filter((row) => hasText(row.value));

  const hasAnySkillBlock =
    hasText(cv.skills) || hasText(cv.computerSkills) || hasText(cv.languages);

  const hasAnyContentForExport =
    hasText(cv.fullName) ||
    hasText(cv.headline) ||
    hasText(cv.phone) ||
    hasText(cv.email) ||
    hasText(cv.careerObjective) ||
    personalDetailRows.length > 0 ||
    validEducations.length > 0 ||
    validExperiences.length > 0 ||
    hasAnySkillBlock ||
    validTrainings.length > 0 ||
    hasText(cv.projectsOrAchievements) ||
    hasText(cv.hobbies) ||
    validReferences.length > 0 ||
    (cv.showPhoto && hasText(cv.photoDataUrl));

  // Labels helper (English vs Bengali CV headers)
  const L =
    cv.language === "bn"
      ? {
          objective: "ক্যারিয়ার অবজেক্টিভ",
          experience: "কর্মঅভিজ্ঞতা",
          education: "শিক্ষাগত যোগ্যতা",
          degree: "পরীক্ষা / ডিগ্রি",
          subject: "বিষয় / বিভাগ",
          institution: "প্রতিষ্ঠান",
          board: "বোর্ড",
          result: "ফলাফল",
          year: "সাল",
          skills: "দক্ষতা ও ভাষাগত যোগ্যতা",
          proSkills: "প্রফেশনাল দক্ষতা",
          compSkills: "কম্পিউটার দক্ষতা",
          langSkills: "ভাষাগত দক্ষতা",
          training: "প্রশিক্ষণ ও সার্টিফিকেট",
          projects: "প্রজেক্ট ও অর্জনসমূহ",
          hobbies: "সহশিক্ষা ও শখ",
          personalInfo: "ব্যক্তিগত তথ্যাবলী",
          references: "রেফারেন্স",
          declaration: "অঙ্গীকারনামা",
          signature: "স্বাক্ষর",
          date: "তারিখ",
        }
      : {
          objective: "CAREER OBJECTIVE",
          experience: "WORK EXPERIENCE",
          education: "EDUCATIONAL QUALIFICATION",
          degree: "Degree / Exam",
          subject: "Subject / Major",
          institution: "Institution",
          board: "Board",
          result: "Result",
          year: "Year",
          skills: "SKILLS & COMPETENCIES",
          proSkills: "Core Skills",
          compSkills: "Computer Literacy",
          langSkills: "Language Proficiency",
          training: "TRAINING & CERTIFICATIONS",
          projects: "PROJECTS & ACHIEVEMENTS",
          hobbies: "EXTRACURRICULAR & HOBBIES",
          personalInfo: "PERSONAL INFORMATION",
          references: "REFERENCES",
          declaration: "DECLARATION",
          signature: "Signature",
          date: "Date",
        };

  // Completion status for each of the 10 numbered sections (for blue collapsed indicator)
  const sectionFilledMap = {
    basic:
      hasText(cv.fullName) ||
      hasText(cv.headline) ||
      hasText(cv.phone) ||
      hasText(cv.email) ||
      hasText(cv.presentAddress) ||
      hasText(cv.permanentAddress) ||
      hasText(cv.website),
    objective: hasText(cv.careerObjective),
    education: validEducations.length > 0,
    experience: validExperiences.length > 0,
    skills: hasAnySkillBlock,
    training: validTrainings.length > 0,
    personal:
      hasText(cv.fatherName) ||
      hasText(cv.motherName) ||
      hasText(cv.dateOfBirth) ||
      hasText(cv.gender) ||
      hasText(cv.nationality) ||
      hasText(cv.religion) ||
      hasText(cv.maritalStatus) ||
      hasText(cv.bloodGroup) ||
      hasText(cv.nidNumber),
    extras: hasText(cv.projectsOrAchievements) || hasText(cv.hobbies),
    references: validReferences.length > 0,
    declaration:
      cv.showDeclaration &&
      (hasText(cv.signatureName) ||
        hasText(cv.signatureDate) ||
        (hasText(cv.declarationText) &&
          cv.declarationText.trim() !== DEFAULT_DECLARATION_EN &&
          cv.declarationText.trim() !== DEFAULT_DECLARATION_BN)),
  };

  const getSectionCardClass = (key: keyof typeof sectionFilledMap) => {
    const isFilled = sectionFilledMap[key];
    const isOpen = openSections[key];
    if (isFilled && !isOpen) {
      return "bg-blue-50/90 border border-blue-300/90 rounded-3xl overflow-hidden shadow-2xs transition-colors";
    }
    if (isFilled) {
      return "bg-white border border-blue-200/90 rounded-3xl overflow-hidden shadow-2xs transition-colors";
    }
    return "bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs transition-colors";
  };

  const getSectionBtnClass = (key: keyof typeof sectionFilledMap) => {
    const isFilled = sectionFilledMap[key];
    const isOpen = openSections[key];
    if (isFilled && !isOpen) {
      return "w-full px-4 py-3.5 flex items-center justify-between bg-blue-50/95 hover:bg-blue-100/80 transition-colors cursor-pointer";
    }
    return "w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-50 transition-colors cursor-pointer";
  };

  const renderSectionChevron = (key: keyof typeof sectionFilledMap) => {
    const isFilled = sectionFilledMap[key];
    const isOpen = openSections[key];
    return (
      <div className="flex items-center gap-2 shrink-0">
        {isFilled && !isOpen && (
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-black">
            ✓ পূরণকৃত
          </span>
        )}
        {isOpen ? (
          <ChevronUp className={`w-4 h-4 ${isFilled ? "text-blue-500" : "text-slate-400"}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${isFilled ? "text-blue-600" : "text-slate-400"}`} />
        )}
      </div>
    );
  };

  // Deterministic Education table column visibility & widths so split pages align 100%
  const showDegreeCol = validEducations.some((e) => hasText(e.degree));
  const showSubjectCol = validEducations.some((e) => hasText(e.subject));
  const showInstCol = validEducations.some((e) => hasText(e.institution));
  const showBoardCol = validEducations.some((e) => hasText(e.board));
  const showResultCol = validEducations.some((e) => hasText(e.result));
  const showYearCol = validEducations.some((e) => hasText(e.passingYear));

  const activeEduCols = [
    { key: "degree", show: showDegreeCol, weight: 17 },
    { key: "subject", show: showSubjectCol, weight: 18 },
    { key: "institution", show: showInstCol, weight: 29 },
    { key: "board", show: showBoardCol, weight: 14 },
    { key: "result", show: showResultCol, weight: 14 },
    { key: "year", show: showYearCol, weight: 8 },
  ].filter((c) => c.show);
  const totalEduWeight = activeEduCols.reduce((acc, c) => acc + c.weight, 0) || 100;
  const getColWidth = (key: string) => {
    const col = activeEduCols.find((c) => c.key === key);
    return col ? `${((col.weight / totalEduWeight) * 100).toFixed(2)}%` : "auto";
  };

  // Build flat atomic CV blocks for exact row-by-row pagination (no big empty gaps!)
  const cvBlocks: CvBlock[] = (() => {
    const blocks: CvBlock[] = [{ id: "header", kind: "header" }];

    if (hasText(cv.careerObjective)) {
      blocks.push({
        id: "obj-head",
        kind: "sectionTitle",
        title: L.objective,
        keepWithNext: true,
      });
      blocks.push({
        id: "obj-body",
        kind: "paragraph",
        text: cv.careerObjective.trim(),
        justify: true,
      });
    }

    if (validExperiences.length > 0) {
      blocks.push({
        id: "exp-head",
        kind: "sectionTitle",
        title: L.experience,
        keepWithNext: true,
      });
      validExperiences.forEach((exp) => {
        blocks.push({ id: `exp-${exp.id}`, kind: "experienceItem", exp });
      });
    }

    if (validEducations.length > 0) {
      blocks.push({
        id: "edu-head",
        kind: "sectionTitle",
        title: L.education,
        keepWithNext: true,
      });
      blocks.push({ id: "edu-thead", kind: "eduThead", keepWithNext: true });
      validEducations.forEach((edu) => {
        blocks.push({ id: `edu-${edu.id}`, kind: "eduRow", edu });
      });
    }

    if (hasAnySkillBlock) {
      blocks.push({
        id: "skills-head",
        kind: "sectionTitle",
        title: L.skills,
        keepWithNext: true,
      });
      if (hasText(cv.skills)) {
        blocks.push({ id: "skill-pro", kind: "skillRow", label: L.proSkills, value: cv.skills.trim() });
      }
      if (hasText(cv.computerSkills)) {
        blocks.push({
          id: "skill-comp",
          kind: "skillRow",
          label: L.compSkills,
          value: cv.computerSkills.trim(),
        });
      }
      if (hasText(cv.languages)) {
        blocks.push({
          id: "skill-lang",
          kind: "skillRow",
          label: L.langSkills,
          value: cv.languages.trim(),
        });
      }
    }

    if (validTrainings.length > 0) {
      blocks.push({
        id: "trn-head",
        kind: "sectionTitle",
        title: L.training,
        keepWithNext: true,
      });
      validTrainings.forEach((trn) => {
        blocks.push({ id: `trn-${trn.id}`, kind: "trainingItem", trn });
      });
    }

    if (hasText(cv.projectsOrAchievements)) {
      blocks.push({
        id: "proj-head",
        kind: "sectionTitle",
        title: L.projects,
        keepWithNext: true,
      });
      const projLines = cv.projectsOrAchievements
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      projLines.forEach((line, idx) => {
        blocks.push({ id: `proj-line-${idx}`, kind: "paragraph", text: line });
      });
    }

    if (hasText(cv.hobbies)) {
      blocks.push({
        id: "hobby-head",
        kind: "sectionTitle",
        title: L.hobbies,
        keepWithNext: true,
      });
      blocks.push({
        id: "hobby-body",
        kind: "paragraph",
        text: cv.hobbies.trim(),
      });
    }

    if (personalDetailRows.length > 0) {
      blocks.push({
        id: "pers-head",
        kind: "sectionTitle",
        title: L.personalInfo,
        keepWithNext: true,
      });
      personalDetailRows.forEach((row, idx) => {
        blocks.push({
          id: `pers-row-${idx}`,
          kind: "personalRow",
          label: row.label,
          value: row.value.trim(),
        });
      });
    }

    if (validReferences.length > 0) {
      blocks.push({
        id: "ref-head",
        kind: "sectionTitle",
        title: L.references,
        keepWithNext: true,
      });
      const twoCols = validReferences.length > 1;
      for (let idx = 0; idx < validReferences.length; idx += 2) {
        blocks.push({
          id: `ref-pair-${idx}`,
          kind: "refPair",
          refs: validReferences.slice(idx, idx + 2),
          twoCols,
        });
      }
    }

    if (
      cv.showDeclaration &&
      (hasText(cv.declarationText) || hasText(cv.signatureName) || hasText(cv.signatureDate))
    ) {
      blocks.push({ id: "decl-footer", kind: "declarationFooter" });
    }

    return blocks;
  })();

  const blockMap = new Map<string, CvBlock>(cvBlocks.map((b) => [b.id, b]));

  // Measure atomic blocks & calculate clean multi-page A4 assignments automatically
  useEffect(() => {
    if (typeof window === "undefined") return;

    const computePagination = () => {
      const container = measureContainerRef.current;
      if (!container) return;

      const heightMap = new Map<string, number>();
      const measuredEls = container.querySelectorAll<HTMLElement>("[data-measure-id]");
      measuredEls.forEach((el) => {
        const id = el.getAttribute("data-measure-id");
        if (id) {
          heightMap.set(id, el.getBoundingClientRect().height);
        }
      });

      if (heightMap.size === 0) return;

      const pages: string[][] = [];
      let currentPage: string[] = [];
      let usedHeight = 0;

      const getMaxHeight = (pageIdx: number) =>
        pageIdx === 0 && cv.template === "modern"
          ? A4_HEIGHT_PX - 36
          : A4_HEIGHT_PX - 76;

      let i = 0;
      while (i < cvBlocks.length) {
        let groupEnd = i;
        while (
          groupEnd < cvBlocks.length - 1 &&
          "keepWithNext" in cvBlocks[groupEnd] &&
          Boolean((cvBlocks[groupEnd] as { keepWithNext?: boolean }).keepWithNext)
        ) {
          groupEnd++;
        }
        const group = cvBlocks.slice(i, groupEnd + 1);
        const maxH = getMaxHeight(pages.length);

        const prevBlockOnPage: CvBlock | null =
          currentPage.length > 0 ? blockMap.get(currentPage[currentPage.length - 1]) || null : null;

        let groupCost = 0;
        let simPrev = prevBlockOnPage;

        if (
          group[0].kind === "eduRow" &&
          simPrev?.kind !== "eduRow" &&
          simPrev?.kind !== "eduThead"
        ) {
          groupCost += heightMap.get("edu-thead") || 32;
        }

        for (const gb of group) {
          groupCost += getBlockMarginTop(simPrev?.kind || null, gb.kind) + (heightMap.get(gb.id) || 20);
          simPrev = gb;
        }

        if (currentPage.length > 0 && usedHeight + groupCost > maxH) {
          pages.push(currentPage);
          currentPage = [];
          usedHeight = 0;

          let freshCost = 0;
          let freshPrev: CvBlock | null = null;
          if (group[0].kind === "eduRow") {
            freshCost += heightMap.get("edu-thead") || 32;
          }
          for (const gb of group) {
            freshCost += getBlockMarginTop(freshPrev?.kind || null, gb.kind) + (heightMap.get(gb.id) || 20);
            freshPrev = gb;
          }
          group.forEach((gb) => currentPage.push(gb.id));
          usedHeight = freshCost;
        } else {
          group.forEach((gb) => currentPage.push(gb.id));
          usedHeight += groupCost;
        }

        i = groupEnd + 1;
      }

      if (currentPage.length > 0) {
        pages.push(currentPage);
      }

      setPageAssignments((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(pages)) return prev;
        return pages;
      });
    };

    const rafId = requestAnimationFrame(computePagination);
    let cancelled = false;
    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => {
        if (!cancelled) requestAnimationFrame(computePagination);
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  });

  const effectivePages: string[][] =
    pageAssignments.length > 0 &&
    pageAssignments.every((p) => p.every((id) => blockMap.has(id))) &&
    pageAssignments.reduce((acc, p) => acc + p.length, 0) === cvBlocks.length
      ? pageAssignments
      : [cvBlocks.map((b) => b.id)];

  // Real PDF Download Engine (captures each exact A4 page cleanly)
  const handleDownloadPdf = async () => {
    if (!hasAnyContentForExport) {
      showToast("error", "PDF ডাউনলোড করার আগে অন্তত আপনার নাম বা প্রয়োজনীয় তথ্য লিখুন।");
      return;
    }

    const pageNodes = effectivePages
      .map((_, idx) => printPageRefs.current[idx])
      .filter((el): el is HTMLDivElement => Boolean(el));

    if (pageNodes.length === 0) {
      showToast("error", "সিভি টেমপ্লেট প্রস্তুত নয়, অনুগ্রহ করে আবার চেষ্টা করুন।");
      return;
    }

    setIsGeneratingPdf(true);
    playClick();

    try {
      if (typeof document !== "undefined" && (document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidthMm = 210;
      const pageHeightMm = 297;
      let pdfPageCount = 0;

      for (let idx = 0; idx < pageNodes.length; idx++) {
        const pageEl = pageNodes[idx];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: A4_WIDTH_PX,
          windowWidth: A4_WIDTH_PX,
          logging: false,
        });

        const pxPerMm = canvas.width / pageWidthMm;
        const singlePagePx = Math.floor(pageHeightMm * pxPerMm);

        if (canvas.height <= singlePagePx + 10) {
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          if (pdfPageCount > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
          pdfPageCount++;
        } else {
          let yOffsetPx = 0;
          while (yOffsetPx < canvas.height - 8) {
            const sliceHeightPx = Math.min(singlePagePx, canvas.height - yOffsetPx);
            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceHeightPx;
            const ctx = sliceCanvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
              ctx.drawImage(
                canvas,
                0,
                yOffsetPx,
                canvas.width,
                sliceHeightPx,
                0,
                0,
                canvas.width,
                sliceHeightPx
              );
            }
            const imgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
            const sliceHeightMm = sliceHeightPx / pxPerMm;
            if (pdfPageCount > 0) pdf.addPage();
            pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, sliceHeightMm, undefined, "FAST");
            pdfPageCount++;
            yOffsetPx += sliceHeightPx;
          }
        }
      }

      const cleanBaseName = (cv.fullName || "JobMaster_CV")
        .trim()
        .replace(/[^\u0980-\u09FFa-zA-Z0-9\s_-]/g, "")
        .replace(/\s+/g, "_");
      const fileName = `${cleanBaseName || "Resume"}_CV.pdf`;

      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);

      showToast("success", `✅ "${fileName}" (${pdfPageCount} পৃষ্ঠা) PDF আকারে ডাউনলোড হয়েছে!`);
    } catch (err) {
      console.error("PDF generation error:", err);
      showToast("error", "PDF তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Pure-hex UI fragments shared by measurement container, live preview pages & PDF pages
  const accent = cv.accentColor || "#1E293B";
  const isModern = cv.template === "modern";

  const renderHeaderBlock = (measureId?: string) => {
    const contactParts = [
      hasText(cv.phone) ? `📞 ${cv.phone.trim()}` : "",
      hasText(cv.email) ? `✉️ ${cv.email.trim()}` : "",
      hasText(cv.website) ? `🔗 ${cv.website.trim()}` : "",
    ].filter(Boolean);

    const addressLine = hasText(cv.presentAddress)
      ? cv.presentAddress.trim()
      : hasText(cv.permanentAddress)
      ? cv.permanentAddress.trim()
      : "";

    return (
      <div
        data-measure-id={measureId}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "24px",
          backgroundColor: isModern ? accent : "transparent",
          color: isModern ? "#ffffff" : "#0f172a",
          padding: isModern ? "32px 44px 26px 44px" : "0px 0px 16px 0px",
          borderBottom: isModern ? "none" : `2.5px solid ${accent}`,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: "27px",
              fontWeight: 800,
              margin: "0 0 4px 0",
              color: isModern ? "#ffffff" : accent,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              wordBreak: "break-word",
            }}
          >
            {hasText(cv.fullName)
              ? cv.fullName.trim()
              : cv.language === "bn"
              ? "আপনার পূর্ণ নাম"
              : "YOUR FULL NAME"}
          </h1>

          {hasText(cv.headline) && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: isModern ? "#e2e8f0" : "#475569",
                marginBottom: "8px",
              }}
            >
              {cv.headline.trim()}
            </div>
          )}

          {contactParts.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 16px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: isModern ? "#f8fafc" : "#334155",
                marginTop: "6px",
              }}
            >
              {contactParts.map((part, i) => (
                <span key={i}>{part}</span>
              ))}
            </div>
          )}

          {hasText(addressLine) && (
            <div
              style={{
                fontSize: "12.5px",
                fontWeight: 500,
                color: isModern ? "#e2e8f0" : "#475569",
                marginTop: "5px",
              }}
            >
              📍 {addressLine}
            </div>
          )}
        </div>

        {/* PASSPORT SIZE PHOTO (35mm x 45mm ratio -> 108px x 138px) */}
        {cv.showPhoto && (
          <div
            style={{
              width: "108px",
              height: "138px",
              flexShrink: 0,
              borderRadius: "6px",
              border: hasText(cv.photoDataUrl)
                ? `2px solid ${isModern ? "#ffffff" : accent}`
                : isModern
                ? "1.5px dashed #cbd5e1"
                : "1.5px solid #94a3b8",
              backgroundColor: "#ffffff",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasText(cv.photoDataUrl) ? (
              <img
                src={cv.photoDataUrl}
                alt="Passport Photo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#ffffff",
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEduColGroup = () => (
    <colgroup>
      {showDegreeCol && <col style={{ width: getColWidth("degree") }} />}
      {showSubjectCol && <col style={{ width: getColWidth("subject") }} />}
      {showInstCol && <col style={{ width: getColWidth("institution") }} />}
      {showBoardCol && <col style={{ width: getColWidth("board") }} />}
      {showResultCol && <col style={{ width: getColWidth("result") }} />}
      {showYearCol && <col style={{ width: getColWidth("year") }} />}
    </colgroup>
  );

  const renderEduTheadRow = (measureId?: string) => (
    <tr data-measure-id={measureId} style={{ backgroundColor: "#f1f5f9", color: "#0f172a" }}>
      {showDegreeCol && (
        <th
          style={{
            border: "1px solid #cbd5e1",
            padding: "7px 8px",
            textAlign: "left",
            fontWeight: 800,
          }}
        >
          {L.degree}
        </th>
      )}
      {showSubjectCol && (
        <th
          style={{
            border: "1px solid #cbd5e1",
            padding: "7px 8px",
            textAlign: "left",
            fontWeight: 800,
          }}
        >
          {L.subject}
        </th>
      )}
      {showInstCol && (
        <th
          style={{
            border: "1px solid #cbd5e1",
            padding: "7px 8px",
            textAlign: "left",
            fontWeight: 800,
          }}
        >
          {L.institution}
        </th>
      )}
      {showBoardCol && (
        <th
          style={{
            border: "1px solid #cbd5e1",
            padding: "7px 8px",
            textAlign: "left",
            fontWeight: 800,
          }}
        >
          {L.board}
        </th>
      )}
      {showResultCol && (
        <th
          style={{
            border: "1px solid #cbd5e1",
            padding: "7px 8px",
            textAlign: "left",
            fontWeight: 800,
          }}
        >
          {L.result}
        </th>
      )}
      {showYearCol && (
        <th
          style={{
            border: "1px solid #cbd5e1",
            padding: "7px 8px",
            textAlign: "center",
            fontWeight: 800,
          }}
        >
          {L.year}
        </th>
      )}
    </tr>
  );

  const renderEduDataRow = (edu: EducationItem, measureId?: string) => (
    <tr key={edu.id} data-measure-id={measureId}>
      {showDegreeCol && (
        <td style={{ border: "1px solid #cbd5e1", padding: "7px 8px", fontWeight: 700 }}>
          {edu.degree.trim()}
        </td>
      )}
      {showSubjectCol && (
        <td style={{ border: "1px solid #cbd5e1", padding: "7px 8px" }}>{edu.subject.trim()}</td>
      )}
      {showInstCol && (
        <td style={{ border: "1px solid #cbd5e1", padding: "7px 8px" }}>
          {edu.institution.trim()}
        </td>
      )}
      {showBoardCol && (
        <td style={{ border: "1px solid #cbd5e1", padding: "7px 8px" }}>{edu.board.trim()}</td>
      )}
      {showResultCol && (
        <td style={{ border: "1px solid #cbd5e1", padding: "7px 8px", fontWeight: 600 }}>
          {edu.result.trim()}
        </td>
      )}
      {showYearCol && (
        <td style={{ border: "1px solid #cbd5e1", padding: "7px 8px", textAlign: "center" }}>
          {edu.passingYear.trim()}
        </td>
      )}
    </tr>
  );

  const renderSingleNonTableBlock = (
    block: CvBlock,
    marginTop: number,
    isMeasure: boolean
  ): React.ReactNode => {
    const mid = isMeasure ? block.id : undefined;

    switch (block.kind) {
      case "header":
        return <React.Fragment key={block.id}>{renderHeaderBlock(mid)}</React.Fragment>;

      case "sectionTitle":
        return (
          <div
            key={block.id}
            data-measure-id={mid}
            style={{
              marginTop: `${marginTop}px`,
              fontSize: "13.5px",
              fontWeight: 800,
              color: accent,
              borderBottom: "1.5px solid #cbd5e1",
              paddingBottom: "4px",
              letterSpacing: "0.03em",
            }}
          >
            {block.title}
          </div>
        );

      case "paragraph":
        return (
          <p
            key={block.id}
            data-measure-id={mid}
            style={{
              margin: `${marginTop}px 0px 0px 0px`,
              fontSize: "12.5px",
              color: "#334155",
              lineHeight: 1.6,
              textAlign: block.justify ? "justify" : "left",
              whiteSpace: "pre-line",
            }}
          >
            {block.text}
          </p>
        );

      case "experienceItem": {
        const exp = block.exp;
        return (
          <div
            key={block.id}
            data-measure-id={mid}
            style={{ marginTop: `${marginTop}px`, fontSize: "12.5px", color: "#334155" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px" }}>
                {[exp.role.trim(), exp.company.trim()].filter(Boolean).join(" — ")}
              </span>
              {hasText(exp.duration) && (
                <span style={{ fontWeight: 700, color: accent, fontSize: "12px" }}>
                  {exp.duration.trim()}
                </span>
              )}
            </div>
            {hasText(exp.location) && (
              <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>
                {exp.location.trim()}
              </div>
            )}
            {hasText(exp.details) && (
              <div
                style={{
                  marginTop: "3px",
                  fontSize: "12px",
                  color: "#334155",
                  lineHeight: 1.55,
                  whiteSpace: "pre-line",
                }}
              >
                {exp.details.trim()}
              </div>
            )}
          </div>
        );
      }

      case "skillRow":
        return (
          <div
            key={block.id}
            data-measure-id={mid}
            style={{ marginTop: `${marginTop}px`, fontSize: "12.5px", color: "#334155" }}
          >
            <strong style={{ color: "#0f172a" }}>{block.label}: </strong>
            <span>{block.value}</span>
          </div>
        );

      case "trainingItem": {
        const t = block.trn;
        return (
          <div
            key={block.id}
            data-measure-id={mid}
            style={{
              marginTop: `${marginTop}px`,
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "12.5px",
              color: "#334155",
            }}
          >
            <div>
              <strong style={{ color: "#0f172a" }}>{t.title.trim()}</strong>
              {hasText(t.institute) && <span> — {t.institute.trim()}</span>}
            </div>
            {hasText(t.duration) && (
              <span style={{ fontWeight: 700, color: accent, flexShrink: 0 }}>
                {t.duration.trim()}
              </span>
            )}
          </div>
        );
      }

      case "refPair":
        return (
          <div
            key={block.id}
            data-measure-id={mid}
            style={{
              marginTop: `${marginTop}px`,
              display: "grid",
              gridTemplateColumns: block.twoCols ? "repeat(2, minmax(0, 1fr))" : "1fr",
              gap: "16px",
              fontSize: "12px",
              color: "#334155",
            }}
          >
            {block.refs.map((ref) => (
              <div
                key={ref.id}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                }}
              >
                {hasText(ref.name) && (
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "13px" }}>
                    {ref.name.trim()}
                  </div>
                )}
                {hasText(ref.designation) && <div>{ref.designation.trim()}</div>}
                {hasText(ref.organization) && <div>{ref.organization.trim()}</div>}
                {hasText(ref.phone) && <div>Phone: {ref.phone.trim()}</div>}
                {hasText(ref.email) && <div>Email: {ref.email.trim()}</div>}
              </div>
            ))}
          </div>
        );

      case "declarationFooter":
        return (
          <div key={block.id} data-measure-id={mid} style={{ marginTop: `${marginTop}px` }}>
            {hasText(cv.declarationText) && (
              <>
                <div
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 800,
                    color: accent,
                    borderBottom: "1.5px solid #cbd5e1",
                    paddingBottom: "4px",
                    marginBottom: "8px",
                    letterSpacing: "0.03em",
                  }}
                >
                  {L.declaration}
                </div>
                <p
                  style={{
                    margin: "0 0 22px 0",
                    fontSize: "12px",
                    color: "#334155",
                    lineHeight: 1.6,
                  }}
                >
                  {cv.declarationText.trim()}
                </p>
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                paddingTop: "10px",
                fontSize: "12px",
                color: "#0f172a",
              }}
            >
              <div>
                {hasText(cv.signatureDate) && (
                  <div style={{ fontWeight: 600 }}>
                    {L.date}: {cv.signatureDate.trim()}
                  </div>
                )}
              </div>
              {(hasText(cv.signatureName) || hasText(cv.fullName)) && (
                <div style={{ textAlign: "center", minWidth: "170px" }}>
                  <div
                    style={{
                      borderTop: "1.5px solid #334155",
                      paddingTop: "4px",
                      fontWeight: 800,
                    }}
                  >
                    {hasText(cv.signatureName) ? cv.signatureName.trim() : cv.fullName.trim()}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{L.signature}</div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Renders a sequence of blocks onto a page (or measurement sheet), grouping table rows cleanly
  const renderBlockSequence = (blocksToRender: CvBlock[], isMeasure: boolean) => {
    const elements: React.ReactNode[] = [];
    let idx = 0;

    while (idx < blocksToRender.length) {
      const curr = blocksToRender[idx];
      const prev = idx > 0 ? blocksToRender[idx - 1] : null;
      const mt = getBlockMarginTop(prev?.kind || null, curr.kind);

      // Group Education table header + rows together into one <table>
      if (curr.kind === "eduThead" || curr.kind === "eduRow") {
        let includeThead = curr.kind === "eduThead";
        const rows: CvBlock[] = [];
        let j = idx;
        if (curr.kind === "eduThead") {
          j++;
        } else {
          // Education rows continuing onto page 2+ automatically show repeated table header
          includeThead = true;
        }
        while (j < blocksToRender.length && blocksToRender[j].kind === "eduRow") {
          rows.push(blocksToRender[j]);
          j++;
        }
        elements.push(
          <table
            key={`edu-table-${curr.id}`}
            style={{
              width: "100%",
              tableLayout: "fixed",
              borderCollapse: "collapse",
              fontSize: "12px",
              color: "#1e293b",
              marginTop: `${prev ? getBlockMarginTop(prev.kind, curr.kind) : 0}px`,
            }}
          >
            {renderEduColGroup()}
            {includeThead && (
              <thead>{renderEduTheadRow(isMeasure ? "edu-thead" : undefined)}</thead>
            )}
            <tbody>
              {rows.map((r) =>
                r.kind === "eduRow"
                  ? renderEduDataRow(r.edu, isMeasure ? r.id : undefined)
                  : null
              )}
            </tbody>
          </table>
        );
        idx = j;
        continue;
      }

      // Group consecutive Personal Info rows together into one aligned <table>
      if (curr.kind === "personalRow") {
        const rows: CvBlock[] = [];
        let j = idx;
        while (j < blocksToRender.length && blocksToRender[j].kind === "personalRow") {
          rows.push(blocksToRender[j]);
          j++;
        }
        elements.push(
          <table
            key={`pers-table-${curr.id}`}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12.5px",
              marginTop: `${mt}px`,
            }}
          >
            <tbody>
              {rows.map((r) =>
                r.kind === "personalRow" ? (
                  <tr key={r.id} data-measure-id={isMeasure ? r.id : undefined}>
                    <td
                      style={{
                        width: "185px",
                        padding: "3px 8px 3px 0px",
                        fontWeight: 700,
                        color: "#0f172a",
                        verticalAlign: "top",
                      }}
                    >
                      {r.label}
                    </td>
                    <td
                      style={{
                        width: "14px",
                        padding: "3px 4px",
                        fontWeight: 700,
                        color: "#475569",
                        verticalAlign: "top",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        padding: "3px 0px",
                        color: "#334155",
                        verticalAlign: "top",
                      }}
                    >
                      {r.value}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        );
        idx = j;
        continue;
      }

      elements.push(renderSingleNonTableBlock(curr, mt, isMeasure));
      idx++;
    }

    return elements;
  };

  // Renders an exact A4 page (794px x 1123px) for either Live Preview or Offscreen PDF capture
  const renderSingleA4Page = (
    pageBlockIds: string[],
    pageIndex: number,
    isPrintTarget: boolean
  ) => {
    const pageBlocks = pageBlockIds
      .map((id) => blockMap.get(id))
      .filter((b): b is CvBlock => Boolean(b));

    const hasModernHeaderOnThisPage =
      isModern && pageIndex === 0 && pageBlocks[0]?.kind === "header";
    const headerBlock = hasModernHeaderOnThisPage ? pageBlocks[0] : null;
    const bodyBlocks = hasModernHeaderOnThisPage ? pageBlocks.slice(1) : pageBlocks;

    return (
      <div
        key={`a4-page-${pageIndex}-${isPrintTarget ? "print" : "prev"}`}
        ref={
          isPrintTarget
            ? (el) => {
                printPageRefs.current[pageIndex] = el;
              }
            : undefined
        }
        style={{
          width: `${A4_WIDTH_PX}px`,
          minHeight: `${A4_HEIGHT_PX}px`,
          backgroundColor: "#ffffff",
          color: "#1e293b",
          fontFamily:
            "'Anek Bangla', 'Hind Siliguri', 'Poppins', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
          padding: hasModernHeaderOnThisPage ? "0px 0px 36px 0px" : "38px 44px",
          lineHeight: 1.5,
        }}
      >
        {headerBlock && renderHeaderBlock()}
        <div
          style={{
            padding: hasModernHeaderOnThisPage ? "20px 44px 0px 44px" : "0px",
          }}
        >
          {renderBlockSequence(bodyBlocks, false)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3.5 text-left pb-8">
      {/* Status Toast */}
      {statusMessage && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[120] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-black flex items-center gap-2 border animate-fade-in max-w-[92vw] ${
            statusMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-left">
            <h4 className="font-black text-base text-slate-900">
              সব তথ্য মুছে নতুন সিভি শুরু করবেন?
            </h4>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              আপনার পূরণ করা সকল তথ্য ও আপলোড করা ছবি মুছে যাবে। আপনি চাইলে পরে আবার নতুন করে লিখতে পারবেন।
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setCv(EMPTY_CV_DATA(initialName, initialEmail));
                  if (typeof window !== "undefined") {
                    localStorage.removeItem(STORAGE_KEY);
                  }
                  setShowResetConfirm(false);
                  showToast("success", "নতুন সিভির জন্য ফর্ম রিসেট করা হয়েছে।");
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer"
              >
                হ্যাঁ, রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="bg-white border border-purple-100/90 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/70 text-[10px] font-black">
              <Sparkles className="w-3 h-3" />
              <span>PRO CV MAKER</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              প্রফেশনাল সিভি তৈরি ও PDF ডাউনলোড
            </h2>
            <p className="text-[11px] font-bold text-slate-500">
              যেই তথ্যগুলো দিতে চান শুধু সেগুলো পূরণ করুন — খালি ঘর এক্সপোর্টে আসবে না।
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                playClick();
                setCv((prev) => ({
                  ...SAMPLE_CV_DATA,
                  photoDataUrl: prev.photoDataUrl,
                  showPhoto: prev.showPhoto,
                }));
                showToast("success", "স্যাম্পল সিভি তথ্য লোড হয়েছে! এখন এডিট বা PDF ডাউনলোড করুন।");
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-[11px] font-black transition-all active:scale-95 cursor-pointer"
            >
              ✨ স্যাম্পল দিয়ে দেখুন
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[11px] font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              title="সব তথ্য রিসেট করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher + Direct PDF Button */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap sm:flex-nowrap">
          <div className="flex-1 grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl min-w-[200px]">
            <button
              type="button"
              onClick={() => {
                playClick();
                setActiveMode("edit");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "edit"
                  ? "bg-white text-[#FF6A00] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>তথ্য দিন (Edit)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick();
                setActiveMode("preview");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === "preview"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>প্রিভিউ দেখুন</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto py-2.5 px-4 bg-[#FF6A00] hover:bg-[#e55f00] disabled:opacity-60 text-white rounded-2xl text-xs font-black shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>PDF তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>PDF ডাউনলোড করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EDIT FORM MODE                                            */}
      {/* ========================================================= */}
      {activeMode === "edit" && (
        <div className="space-y-3">
          {/* Style, Language & Photo Section */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection("photo")}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6A00] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    পাসপোর্ট ছবি, ভাষা ও সিভি ডিজাইন
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    ছবি আপলোড / অন-অফ এবং টেমপ্লেট সেটিংস
                  </p>
                </div>
              </div>
              {openSections.photo ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.photo && (
              <div className="p-4 space-y-4 border-t border-slate-100">
                {/* Passport Photo Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">
                        সিভিতে পাসপোর্ট সাইজের ছবি (৩৫×৪৫ মিমি)
                      </h4>
                      <p className="text-[10.5px] font-bold text-slate-500">
                        ছবি না দিলে ছবির জায়গা খালি থাকবে; চাইলে অফও রাখতে পারেন
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setCv((prev) => ({ ...prev, showPhoto: !prev.showPhoto }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer shrink-0 border ${
                        cv.showPhoto
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                    >
                      {cv.showPhoto ? "ছবি: চালু (ON)" : "ছবি: বন্ধ (OFF)"}
                    </button>
                  </div>

                  {cv.showPhoto ? (
                    <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
                      {/* Passport Preview Box */}
                      <div className="w-[76px] h-[98px] rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden flex items-center justify-center shrink-0">
                        {hasText(cv.photoDataUrl) ? (
                          <img
                            src={cv.photoDataUrl}
                            alt="Uploaded Passport"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center px-1">
                            <User className="w-5 h-5 text-slate-300 mx-auto" />
                            <span className="text-[9px] font-bold text-slate-400 block leading-tight mt-0.5">
                              খালি বক্স
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 min-w-[180px]">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-2 bg-[#FF6A00] hover:bg-[#e55f00] text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>
                              {hasText(cv.photoDataUrl) ? "ছবি পরিবর্তন করুন" : "ছবি আপলোড করুন"}
                            </span>
                          </button>

                          {hasText(cv.photoDataUrl) && (
                            <button
                              type="button"
                              onClick={() => {
                                playClick();
                                setCv((prev) => ({ ...prev, photoDataUrl: "" }));
                              }}
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ছবি সরান</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400">
                          স্বয়ংক্রিয়ভাবে পাসপোর্ট সাইজে (3.5×4.5) ক্রপ হয়ে সেভ হবে।
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200/80">
                      <ImageOff className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>ছবি অফ করা আছে — PDF ও প্রিভিউতে কোনো ছবির বক্স থাকবে না।</span>
                    </div>
                  )}
                </div>

                {/* Language, Template & Accent Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF6A00]" />
                      <span>হেডিং ভাষা ও টেমপ্লেট</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCv((prev) => applyLanguageChange(prev, "en"))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black border cursor-pointer ${
                          cv.language === "en"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        English CV
                      </button>
                      <button
                        type="button"
                        onClick={() => setCv((prev) => applyLanguageChange(prev, "bn"))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black border cursor-pointer ${
                          cv.language === "bn"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        বাংলা সিভি
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setCv((prev) => ({ ...prev, template: "classic" }))}
                        className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black border cursor-pointer ${
                          cv.template === "classic"
                            ? "bg-orange-50 text-[#FF6A00] border-orange-300"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        Classic (Govt/Bank)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCv((prev) => ({ ...prev, template: "modern" }))}
                        className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black border cursor-pointer ${
                          cv.template === "modern"
                            ? "bg-orange-50 text-[#FF6A00] border-orange-300"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        Modern Header
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">
                      সিভির থিম কালার
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ACCENT_THEMES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCv((prev) => ({ ...prev, accentColor: t.color }))}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-black border flex items-center gap-1.5 cursor-pointer ${
                            cv.accentColor === t.color
                              ? "border-slate-900 bg-slate-50 text-slate-900"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="truncate">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 1. Basic & Contact Info */}
          <div className={getSectionCardClass("basic")}>
            <button
              type="button"
              onClick={() => toggleSection("basic")}
              className={getSectionBtnClass("basic")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ১. প্রাথমিক ও যোগাযোগের তথ্য
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    নাম, পদবি, মোবাইল, ইমেইল, ঠিকানা ও লিংক
                  </p>
                </div>
              </div>
              {renderSectionChevron("basic")}
            </button>

            {openSections.basic && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    পূর্ণ নাম (Full Name)
                  </label>
                  <input
                    type="text"
                    value={cv.fullName}
                    onChange={(e) => setCv((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="যেমন: মোঃ তারিকুল ইসলাম"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    পেশাগত পরিচয় / লক্ষ্য পদ (Headline)
                  </label>
                  <input
                    type="text"
                    value={cv.headline}
                    onChange={(e) => setCv((p) => ({ ...p, headline: e.target.value }))}
                    placeholder="যেমন: Officer / BCS Candidate"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 flex items-center gap-1 mb-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>মোবাইল নম্বর (Phone)</span>
                  </label>
                  <input
                    type="text"
                    value={cv.phone}
                    onChange={(e) => setCv((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="যেমন: +880 17XX-XXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>ইমেইল (Email)</span>
                  </label>
                  <input
                    type="email"
                    value={cv.email}
                    onChange={(e) => setCv((p) => ({ ...p, email: e.target.value }))}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>বর্তমান ঠিকানা (Present Address)</span>
                  </label>
                  <input
                    type="text"
                    value={cv.presentAddress}
                    onChange={(e) => setCv((p) => ({ ...p, presentAddress: e.target.value }))}
                    placeholder="যেমন: মিরপুর-১০, ঢাকা-১২১৬"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    স্থায়ী ঠিকানা (Permanent Address)
                  </label>
                  <input
                    type="text"
                    value={cv.permanentAddress}
                    onChange={(e) => setCv((p) => ({ ...p, permanentAddress: e.target.value }))}
                    placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 flex items-center gap-1 mb-1">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span>লিঙ্কডইন / পোর্টফোলিও / ওয়েবসাইট</span>
                  </label>
                  <input
                    type="text"
                    value={cv.website}
                    onChange={(e) => setCv((p) => ({ ...p, website: e.target.value }))}
                    placeholder="linkedin.com/in/yourname"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Career Objective */}
          <div className={getSectionCardClass("objective")}>
            <button
              type="button"
              onClick={() => toggleSection("objective")}
              className={getSectionBtnClass("objective")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ২. ক্যারিয়ার অবজেক্টিভ (Career Objective)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    রেডি টেমপ্লেট থেকে বেছে নিতে পারেন বা নিজে লিখুন
                  </p>
                </div>
              </div>
              {renderSectionChevron("objective")}
            </button>

            {openSections.objective && (
              <div className="p-4 space-y-2.5 border-t border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-black text-slate-500">দ্রুত ব্যবহার করুন:</span>
                  {OBJECTIVE_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        playClick();
                        setCv((p) =>
                          applyLanguageChange(
                            { ...p, careerObjective: preset.text },
                            preset.lang
                          )
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10.5px] font-black cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={cv.careerObjective}
                  onChange={(e) => setCv((p) => ({ ...p, careerObjective: e.target.value }))}
                  placeholder="আপনার ক্যারিয়ার লক্ষ্য লিখুন (না চাইলে খালি রাখুন)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            )}
          </div>

          {/* 3. Education */}
          <div className={getSectionCardClass("education")}>
            <button
              type="button"
              onClick={() => toggleSection("education")}
              className={getSectionBtnClass("education")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ৩. শিক্ষাগত যোগ্যতা (Education)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    SSC, HSC, Honours, Masters বা অন্যান্য ডিগ্রি যোগ করুন
                  </p>
                </div>
              </div>
              {renderSectionChevron("education")}
            </button>

            {openSections.education && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                {cv.educations.map((edu, idx) => (
                  <div
                    key={edu.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">
                        ডিগ্রি / পরীক্ষা #{idx + 1}
                      </span>
                      {cv.educations.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCv((p) => ({
                              ...p,
                              educations: p.educations.filter((item) => item.id !== edu.id),
                            }))
                          }
                          className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>মুছুন</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            educations: p.educations.map((it) =>
                              it.id === edu.id ? { ...it, degree: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="ডিগ্রির নাম (যেমন: BBA / B.Sc / HSC / SSC)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={edu.subject}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            educations: p.educations.map((it) =>
                              it.id === edu.id ? { ...it, subject: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="বিষয় / বিভাগ (যেমন: Science / Bangla / CSE)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            educations: p.educations.map((it) =>
                              it.id === edu.id ? { ...it, institution: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="শিক্ষাপ্রতিষ্ঠান / বিশ্ববিদ্যালয়"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={edu.board}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            educations: p.educations.map((it) =>
                              it.id === edu.id ? { ...it, board: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="বোর্ড (যেমন: Dhaka / National University)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={edu.result}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            educations: p.educations.map((it) =>
                              it.id === edu.id ? { ...it, result: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="ফলাফল (যেমন: GPA 5.00 / CGPA 3.70)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={edu.passingYear}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            educations: p.educations.map((it) =>
                              it.id === edu.id ? { ...it, passingYear: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="পাশের সাল (যেমন: 2023)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setCv((p) => ({
                      ...p,
                      educations: [
                        ...p.educations,
                        {
                          id: `edu-${Date.now()}`,
                          degree: "",
                          subject: "",
                          institution: "",
                          board: "",
                          result: "",
                          passingYear: "",
                        },
                      ],
                    }));
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>আরও শিক্ষাগত যোগ্যতা যোগ করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Work Experience */}
          <div className={getSectionCardClass("experience")}>
            <button
              type="button"
              onClick={() => toggleSection("experience")}
              className={getSectionBtnClass("experience")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ৪. কর্মঅভিজ্ঞতা (Work Experience - ঐচ্ছিক)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    ফ্রেশার হলে বা যোগ না করলে এই সেকশন সিভিতে দেখাবে না
                  </p>
                </div>
              </div>
              {renderSectionChevron("experience")}
            </button>

            {openSections.experience && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                {cv.experiences.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">অভিজ্ঞতা #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCv((p) => ({
                            ...p,
                            experiences: p.experiences.filter((it) => it.id !== exp.id),
                          }))
                        }
                        className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            experiences: p.experiences.map((it) =>
                              it.id === exp.id ? { ...it, role: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="পদবি (Designation)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            experiences: p.experiences.map((it) =>
                              it.id === exp.id ? { ...it, company: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="প্রতিষ্ঠানের নাম (Company/Organization)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            experiences: p.experiences.map((it) =>
                              it.id === exp.id ? { ...it, location: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="অবস্থান (যেমন: Dhaka)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            experiences: p.experiences.map((it) =>
                              it.id === exp.id ? { ...it, duration: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="সময়কাল (যেমন: Jan 2023 – Present)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={exp.details}
                      onChange={(e) =>
                        setCv((p) => ({
                          ...p,
                          experiences: p.experiences.map((it) =>
                            it.id === exp.id ? { ...it, details: e.target.value } : it
                          ),
                        }))
                      }
                      placeholder="দায়িত্ব ও কাজের সংক্ষিপ্ত বিবরণ..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setCv((p) => ({
                      ...p,
                      experiences: [
                        ...p.experiences,
                        {
                          id: `exp-${Date.now()}`,
                          role: "",
                          company: "",
                          location: "",
                          duration: "",
                          details: "",
                        },
                      ],
                    }));
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>অভিজ্ঞতা যোগ করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Skills, Computer & Language */}
          <div className={getSectionCardClass("skills")}>
            <button
              type="button"
              onClick={() => toggleSection("skills")}
              className={getSectionBtnClass("skills")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ৫. দক্ষতা, কম্পিউটার ও ভাষা (Skills &amp; Languages)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    প্রফেশনাল স্কিল, MS Office ও ভাষাগত দক্ষতা
                  </p>
                </div>
              </div>
              {renderSectionChevron("skills")}
            </button>

            {openSections.skills && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    প্রফেশনাল ও সফট স্কিল (Core Skills)
                  </label>
                  <input
                    type="text"
                    value={cv.skills}
                    onChange={(e) => setCv((p) => ({ ...p, skills: e.target.value }))}
                    placeholder="যেমন: Communication, Leadership, Problem Solving, Report Writing"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    কম্পিউটার দক্ষতা (Computer Literacy)
                  </label>
                  <input
                    type="text"
                    value={cv.computerSkills}
                    onChange={(e) => setCv((p) => ({ ...p, computerSkills: e.target.value }))}
                    placeholder="যেমন: MS Word, MS Excel, PowerPoint, Bangla & English Typing"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 flex items-center gap-1 mb-1">
                    <Languages className="w-3.5 h-3.5 text-slate-400" />
                    <span>ভাষাগত দক্ষতা (Language Proficiency)</span>
                  </label>
                  <input
                    type="text"
                    value={cv.languages}
                    onChange={(e) => setCv((p) => ({ ...p, languages: e.target.value }))}
                    placeholder="যেমন: Bengali (Native), English (Fluent in Reading, Writing & Speaking)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Training & Certifications */}
          <div className={getSectionCardClass("training")}>
            <button
              type="button"
              onClick={() => toggleSection("training")}
              className={getSectionBtnClass("training")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ৬. প্রশিক্ষণ ও সার্টিফিকেট (Training - ঐচ্ছিক)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    কম্পিউটার বা প্রফেশনাল কোর্সের তথ্য যোগ করুন
                  </p>
                </div>
              </div>
              {renderSectionChevron("training")}
            </button>

            {openSections.training && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                {cv.trainings.map((trn, idx) => (
                  <div
                    key={trn.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">প্রশিক্ষণ #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCv((p) => ({
                            ...p,
                            trainings: p.trainings.filter((it) => it.id !== trn.id),
                          }))
                        }
                        className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={trn.title}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            trainings: p.trainings.map((it) =>
                              it.id === trn.id ? { ...it, title: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="কোর্স / প্রশিক্ষণের নাম"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={trn.institute}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            trainings: p.trainings.map((it) =>
                              it.id === trn.id ? { ...it, institute: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="প্রতিষ্ঠানের নাম"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={trn.duration}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            trainings: p.trainings.map((it) =>
                              it.id === trn.id ? { ...it, duration: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="সময়কাল / বছর (যেমন: 3 Months, 2024)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setCv((p) => ({
                      ...p,
                      trainings: [
                        ...p.trainings,
                        { id: `trn-${Date.now()}`, title: "", institute: "", duration: "" },
                      ],
                    }));
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>প্রশিক্ষণ যোগ করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. Personal Information (BD Standard) */}
          <div className={getSectionCardClass("personal")}>
            <button
              type="button"
              onClick={() => toggleSection("personal")}
              className={getSectionBtnClass("personal")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ৭. ব্যক্তিগত তথ্যাবলী (Personal Info - ঐচ্ছিক)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    পিতা/মাতা, জন্ম তারিখ, NID, রক্তের গ্রুপ (খালি রাখলে বাদ যাবে)
                  </p>
                </div>
              </div>
              {renderSectionChevron("personal")}
            </button>

            {openSections.personal && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100">
                <input
                  type="text"
                  value={cv.fatherName}
                  onChange={(e) => setCv((p) => ({ ...p, fatherName: e.target.value }))}
                  placeholder="পিতার নাম (Father's Name)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
                <input
                  type="text"
                  value={cv.motherName}
                  onChange={(e) => setCv((p) => ({ ...p, motherName: e.target.value }))}
                  placeholder="মাতার নাম (Mother's Name)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
                <input
                  type="text"
                  value={cv.dateOfBirth}
                  onChange={(e) => setCv((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  placeholder="জন্ম তারিখ (যেমন: 15 March 1999)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
                <input
                  type="text"
                  value={cv.gender}
                  onChange={(e) => setCv((p) => ({ ...p, gender: e.target.value }))}
                  placeholder="লিঙ্গ (Male / Female)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
                <input
                  type="text"
                  value={cv.nationality}
                  onChange={(e) => setCv((p) => ({ ...p, nationality: e.target.value }))}
                  placeholder="জাতীয়তা (যেমন: Bangladeshi)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
                <input
                  type="text"
                  value={cv.religion}
                  onChange={(e) => setCv((p) => ({ ...p, religion: e.target.value }))}
                  placeholder="ধর্ম (Religion)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
                <input
                  type="text"
                  value={cv.maritalStatus}
                  onChange={(e) => setCv((p) => ({ ...p, maritalStatus: e.target.value }))}
                  placeholder="বৈবাহিক অবস্থা (Unmarried / Married)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
                <input
                  type="text"
                  value={cv.bloodGroup}
                  onChange={(e) => setCv((p) => ({ ...p, bloodGroup: e.target.value }))}
                  placeholder="রক্তের গ্রুপ (যেমন: O+)"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
                <input
                  type="text"
                  value={cv.nidNumber}
                  onChange={(e) => setCv((p) => ({ ...p, nidNumber: e.target.value }))}
                  placeholder="জাতীয় পরিচয়পত্র (NID) নম্বর"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            )}
          </div>

          {/* 8. Projects, Achievements & Hobbies */}
          <div className={getSectionCardClass("extras")}>
            <button
              type="button"
              onClick={() => toggleSection("extras")}
              className={getSectionBtnClass("extras")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ৮. প্রজেক্ট, অর্জন ও শখ (Projects &amp; Hobbies - ঐচ্ছিক)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    বিশেষ অর্জন, প্রজেক্ট বা সহশিক্ষা কার্যক্রম
                  </p>
                </div>
              </div>
              {renderSectionChevron("extras")}
            </button>

            {openSections.extras && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    প্রজেক্ট ও অর্জনসমূহ (Projects &amp; Achievements)
                  </label>
                  <textarea
                    rows={3}
                    value={cv.projectsOrAchievements}
                    onChange={(e) =>
                      setCv((p) => ({ ...p, projectsOrAchievements: e.target.value }))
                    }
                    placeholder="যেমন: • Champion in Debate Competition 2023"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    সহশিক্ষা কার্যক্রম ও শখ (Hobbies / Extracurricular)
                  </label>
                  <input
                    type="text"
                    value={cv.hobbies}
                    onChange={(e) => setCv((p) => ({ ...p, hobbies: e.target.value }))}
                    placeholder="যেমন: Reading Books, Volunteering, Traveling"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 9. References */}
          <div className={getSectionCardClass("references")}>
            <button
              type="button"
              onClick={() => toggleSection("references")}
              className={getSectionBtnClass("references")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ৯. রেফারেন্স (References - ঐচ্ছিক)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    শিক্ষক বা পূর্ববর্তী কর্মকর্তার রেফারেন্স যুক্ত করুন
                  </p>
                </div>
              </div>
              {renderSectionChevron("references")}
            </button>

            {openSections.references && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                {cv.references.map((ref, idx) => (
                  <div
                    key={ref.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">রেফারেন্স #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCv((p) => ({
                            ...p,
                            references: p.references.filter((it) => it.id !== ref.id),
                          }))
                        }
                        className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={ref.name}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            references: p.references.map((it) =>
                              it.id === ref.id ? { ...it, name: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="নাম (Name)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={ref.designation}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            references: p.references.map((it) =>
                              it.id === ref.id ? { ...it, designation: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="পদবি (Designation)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={ref.organization}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            references: p.references.map((it) =>
                              it.id === ref.id ? { ...it, organization: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="প্রতিষ্ঠান (Organization)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={ref.phone}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            references: p.references.map((it) =>
                              it.id === ref.id ? { ...it, phone: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="মোবাইল নম্বর (Phone)"
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="email"
                        value={ref.email}
                        onChange={(e) =>
                          setCv((p) => ({
                            ...p,
                            references: p.references.map((it) =>
                              it.id === ref.id ? { ...it, email: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="ইমেইল (Email)"
                        className="sm:col-span-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setCv((p) => ({
                      ...p,
                      references: [
                        ...p.references,
                        {
                          id: `ref-${Date.now()}`,
                          name: "",
                          designation: "",
                          organization: "",
                          phone: "",
                          email: "",
                        },
                      ],
                    }));
                  }}
                  className="w-full py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>রেফারেন্স যোগ করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* 10. Declaration & Signature */}
          <div className={getSectionCardClass("declaration")}>
            <button
              type="button"
              onClick={() => toggleSection("declaration")}
              className={getSectionBtnClass("declaration")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ১০. অঙ্গীকারনামা ও স্বাক্ষর (Declaration &amp; Signature)
                  </h3>
                  <p className="text-[10.5px] font-bold text-slate-400">
                    চাইলে অঙ্গীকারনামা অন বা অফ করতে পারেন
                  </p>
                </div>
              </div>
              {renderSectionChevron("declaration")}
            </button>

            {openSections.declaration && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-700">
                    সিভির নিচে অঙ্গীকারনামা ও স্বাক্ষর রাখবেন?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCv((p) => ({
                          ...p,
                          declarationText:
                            p.language === "bn" ? DEFAULT_DECLARATION_BN : DEFAULT_DECLARATION_EN,
                        }))
                      }
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-black cursor-pointer"
                    >
                      ডিফল্ট টেক্সট
                    </button>
                    <button
                      type="button"
                      onClick={() => setCv((p) => ({ ...p, showDeclaration: !p.showDeclaration }))}
                      className={`px-3 py-1 rounded-xl text-[11px] font-black cursor-pointer ${
                        cv.showDeclaration
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {cv.showDeclaration ? "হ্যাঁ (ON)" : "না (OFF)"}
                    </button>
                  </div>
                </div>

                {cv.showDeclaration && (
                  <>
                    <textarea
                      rows={2}
                      value={cv.declarationText}
                      onChange={(e) => setCv((p) => ({ ...p, declarationText: e.target.value }))}
                      placeholder={
                        cv.language === "bn"
                          ? "অঙ্গীকারনামা লিখুন (খালি রাখলে দেখাবে না)"
                          : "Write declaration statement (leave empty to hide)"
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#FF6A00]"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={cv.signatureName}
                        onChange={(e) => setCv((p) => ({ ...p, signatureName: e.target.value }))}
                        placeholder="স্বাক্ষরের নিচে নাম (যেমন: মোঃ তারিকুল ইসলাম)"
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                      <input
                        type="text"
                        value={cv.signatureDate}
                        onChange={(e) => setCv((p) => ({ ...p, signatureDate: e.target.value }))}
                        placeholder="তারিখ (ঐচ্ছিক, যেমন: 14 Nov 2026)"
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom Preview & Download Call-to-Action */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                setActiveMode("preview");
              }}
              className="py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>সিভি প্রিভিউ দেখুন</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="py-3 px-4 rounded-2xl bg-[#FF6A00] hover:bg-[#e55f00] disabled:opacity-60 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDF ডাউনলোড</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LIVE MULTI-PAGE A4 PREVIEW MODE                           */}
      {/* ========================================================= */}
      {activeMode === "preview" && (
        <div className="space-y-3">
          <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-purple-900">
                📄 আপনার সিভির লাইভ A4 প্রিভিউ
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black">
                মোট {effectivePages.length}টি পৃষ্ঠা (A4)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveMode("edit")}
              className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-700 text-[11px] font-black cursor-pointer"
            >
              ✏️ তথ্য এডিট করুন
            </button>
          </div>

          <div
            ref={previewWrapperRef}
            className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-200/80 p-2 sm:p-4 flex flex-col items-center gap-5"
          >
            {effectivePages.map((pageIds, pageIdx) => (
              <div key={`preview-sheet-${pageIdx}`} className="flex flex-col items-center gap-1.5">
                {effectivePages.length > 1 && (
                  <div className="px-3 py-1 rounded-full bg-slate-800/90 text-white text-[10.5px] font-black shadow-xs">
                    পৃষ্ঠা {pageIdx + 1} / {effectivePages.length} (A4)
                  </div>
                )}
                <div
                  style={{
                    width: `${A4_WIDTH_PX * previewScale}px`,
                    minHeight: `${A4_HEIGHT_PX * previewScale}px`,
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.16)",
                    backgroundColor: "#ffffff",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                      width: `${A4_WIDTH_PX}px`,
                    }}
                  >
                    {renderSingleA4Page(pageIds, pageIdx, false)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OFFSCREEN BLOCK MEASUREMENT SHEET (FOR EXACT PAGINATION)  */}
      {/* ========================================================= */}
      <div
        aria-hidden="true"
        ref={measureContainerRef}
        style={{
          position: "fixed",
          left: "-12000px",
          top: "0px",
          width: `${A4_WIDTH_PX}px`,
          backgroundColor: "#ffffff",
          color: "#1e293b",
          fontFamily:
            "'Anek Bangla', 'Hind Siliguri', 'Poppins', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
          padding: isModern ? "0px 0px 36px 0px" : "38px 44px",
          lineHeight: 1.5,
          pointerEvents: "none",
          zIndex: -2,
        }}
      >
        {isModern ? (
          <>
            {renderHeaderBlock("header")}
            <div style={{ padding: "20px 44px 0px 44px" }}>
              {renderBlockSequence(cvBlocks.slice(1), true)}
            </div>
          </>
        ) : (
          renderBlockSequence(cvBlocks, true)
        )}
      </div>

      {/* ========================================================= */}
      {/* DEDICATED OFFSCREEN A4 PAGES FOR PDF EXPORT               */}
      {/* ========================================================= */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-12000px",
          top: "0px",
          width: `${A4_WIDTH_PX}px`,
          pointerEvents: "none",
          opacity: 1,
          zIndex: -1,
        }}
      >
        {effectivePages.map((pageIds, pageIdx) =>
          renderSingleA4Page(pageIds, pageIdx, true)
        )}
      </div>
    </div>
  );
}
