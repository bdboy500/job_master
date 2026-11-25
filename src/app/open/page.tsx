import type { Metadata } from "next";
import SmartOpenClient from "./SmartOpenClient";

export const dynamic = "force-dynamic";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

function pickParam(val: string | string[] | undefined): string | undefined {
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  return undefined;
}

const VIEW_TITLES: Record<string, { title: string; description: string }> = {
  exam: {
    title: "Job Master লাইভ পরীক্ষা ও মডেল টেস্ট",
    description: "Job Master অ্যাপে সরাসরি লাইভ পরীক্ষা ও প্রশ্নপত্র সমাধান করুন।",
  },
  "all-live-exams": {
    title: "Job Master সকল লাইভ পরীক্ষা",
    description: "চলমান ও আসন্ন সব লাইভ পরীক্ষার তালিকা দেখুন এবং অংশ নিন।",
  },
  "weekly-model-test": {
    title: "Job Master সাপ্তাহিক মডেল টেস্ট",
    description: "সাপ্তাহিক স্পেশাল মডেল টেস্টে অংশ নিয়ে নিজের প্রস্তুতি যাচাই করুন।",
  },
  "daily-quick-test": {
    title: "Job Master সাপ্তাহিক মডেল টেস্ট",
    description: "সাপ্তাহিক স্পেশাল মডেল টেস্টে অংশ নিয়ে নিজের প্রস্তুতি যাচাই করুন।",
  },
  "live-quiz": {
    title: "Job Master Live Quiz Game",
    description: "লাইভ কুইজ খেলে নিজের মেধা যাচাই করুন ও লিডারবোর্ডে শীর্ষে থাকুন।",
  },
  quiz: {
    title: "Job Master কুইজ অনুশীলন",
    description: "বিষয়ভিত্তিক দ্রুত কুইজ খেলে প্রস্তুতি আরও শাণিত করুন।",
  },
  "job-circulars": {
    title: "Job Master চাকরির বিজ্ঞপ্তি",
    description: "সর্বশেষ সরকারি, ব্যাংক ও বেসরকারি চাকরির বিজ্ঞপ্তি ও আবেদনের তথ্য দেখুন।",
  },
  course: {
    title: "Job Master স্পেশাল কোর্স",
    description: "বিসিএস, ব্যাংক ও প্রাইমারি প্রস্তুতির জন্য সাজানো স্পেশাল কোর্সে যুক্ত হোন।",
  },
  courses: {
    title: "Job Master সকল কোর্সসমূহ",
    description: "সকল চাকরির প্রস্তুতিমূলক কোর্স দেখুন এবং অনুশীলন শুরু করুন।",
  },
  "prep-sub": {
    title: "Job Master বিষয়ভিত্তিক প্রস্তুতি ও প্রশ্ন ব্যাংক",
    description: "বিগত সালের প্রশ্নপত্র ও অধ্যায়ভিত্তিক অনুশীলন করুন Job Master অ্যাপে।",
  },
  package: {
    title: "Job Master প্রিমিয়াম প্যাকেজ",
    description: "সাশ্রয়ী সাবস্ক্রিপশন প্যাকেজ নিয়ে আনলিমিটেড পরীক্ষা ও মডেল টেস্ট দিন।",
  },
  packages: {
    title: "Job Master প্রিমিয়াম প্যাকেজসমূহ",
    description: "সকল প্যাকেজ ও সুবিধাসমূহ দেখুন Job Master অ্যাপে।",
  },
  rankings: {
    title: "Job Master লিডারবোর্ড ও র‍্যাংকিং",
    description: "লাইভ কুইজ ও পরীক্ষার জাতীয় মেধা তালিকা দেখুন।",
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const sp = await searchParams;
  const view = pickParam(sp.view) || "home";
  const meta = VIEW_TITLES[view] || {
    title: "Job Master - চাকরি আপনার হাতে!",
    description:
      "বিসিএস, ব্যাংক, প্রাইমারি শিক্ষক নিয়োগ ও সরকারি চাকরির পূর্ণাঙ্গ অনলাইন প্রস্তুতি প্ল্যাটফর্ম।",
  };

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: "https://jobmaster.com.bd/open",
      siteName: "Job Master",
      type: "website",
      images: [
        {
          url: "/api/icons/icon-192.png",
          width: 192,
          height: 192,
          alt: "Job Master Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/icon-192.png"],
    },
  };
}

export default async function SmartOpenPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const sp = await searchParams;
  const view = pickParam(sp.view);
  const id = pickParam(sp.id);
  const subId = pickParam(sp.subId);
  const q = pickParam(sp.q);

  return <SmartOpenClient view={view} id={id} subId={subId} q={q} />;
}
