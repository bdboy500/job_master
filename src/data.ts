export interface Question {
  id: number | string;
  question: string;
  options: string[];
  correctIndex: number;
  subject?: string;
  explanation?: string;
  questionText?: string;
  subjectName?: string;
  correctOptionIndex?: number;
}

export const LIVE_QUIZ_ALLOWED_SUBJECTS = [
  "General Knowledge(GK)"
];

export const QUIZ_QUESTIONS: Question[] = [
  // Bangladesh Affairs
  {
    id: 1,
    question: "বাংলাদেশের জাতীয় ফল কোনটি?",
    options: ["আম", "কাঁঠাল", "লিচু", "নারকেল"],
    correctIndex: 1,
    subject: "Bangladesh Affairs"
  },
  {
    id: 3,
    question: "মুজিবনগর সরকার কত তারিখে শপথ গ্রহণ করেছিল?",
    options: ["১০ এপ্রিল ১৯৭১", "১৭ এপ্রিল ১৯৭১", "১৬ ডিসেম্বর ১৯৭১", "২৫ মার্চ ১৯৭১"],
    correctIndex: 1,
    subject: "Bangladesh Affairs"
  },
  {
    id: 4,
    question: "বাংলাদেশের দীর্ঘতম নদী কোনটি?",
    options: ["মেঘনা", "পদ্মা", "যমুনা", "সুরমা"],
    correctIndex: 1,
    subject: "Bangladesh Affairs"
  },
  {
    id: 10,
    question: "বাংলাদেশ কত সালে স্বাধীনতা লাভ করে?",
    options: ["১৯৫২", "১৯৬৯", "১৯৭১", "১৯৭৫"],
    correctIndex: 2,
    subject: "Bangladesh Affairs"
  },
  {
    id: 14,
    question: "বাংলাদেশের জাতীয় সংগীত কে লিখেছেন?",
    options: ["কাজী নজরুল ইসলাম", "রবীন্দ্রনাথ ঠাকুর", "জসীমউদ্দীন", "লালন শাহ"],
    correctIndex: 1,
    subject: "Bangladesh Affairs"
  },
  {
    id: 16,
    question: "বাংলাদেশের জাতীয় কবি কে?",
    options: ["রবীন্দ্রনাথ ঠাকুর", "কাজী নজরুল ইসলাম", "জীবনানন্দ দাশ", "জসীমউদ্দীন"],
    correctIndex: 1,
    subject: "Bangladesh Affairs"
  },
  {
    id: 20,
    question: "পদ্মা সেতুর দৈর্ঘ্য কত কিলোমিটার?",
    options: ["৫.১৫ কিমি", "৬.১৫ কিমি", "৭.১৫ কিমি", "৮.১৫ কিমি"],
    correctIndex: 1,
    subject: "Bangladesh Affairs"
  },
  {
    id: 23,
    question: "বিশ্বের সবচেয়ে দীর্ঘতম সমুদ্র সৈকত কোনটি?",
    options: ["কক্সবাজার", "কুয়াকাটা", "পাতায়া", "বালি"],
    correctIndex: 0,
    subject: "Bangladesh Affairs"
  },
  {
    id: 27,
    question: "বাংলাদেশের সবচেয়ে উচুঁ পর্বতশৃঙ্গ কোনটি?",
    options: ["কেওক্রাডং", "তাজিংডং", "সাকা হাফং", "চন্দ্রনাথ পাহাড়"],
    correctIndex: 1,
    subject: "Bangladesh Affairs"
  },
  {
    id: 31,
    question: "ঢাকা বিশ্ববিদ্যালয় কত সালে প্রতিষ্ঠিত হয়?",
    options: ["১৯১১", "১৯২১", "১৯৩১", "১৯৪১"],
    correctIndex: 1,
    subject: "Bangladesh Affairs"
  },

  // International Affairs
  {
    id: 6,
    question: "অস্ট্রেলিয়ার রাজধানী শহর কোনটি?",
    options: ["সিডনি", "মেলবোর্ন", "ক্যানবেরা", "ব্রিসবেন"],
    correctIndex: 2,
    subject: "International Affairs"
  },
  {
    id: 9,
    question: "পৃথিবীর বৃহত্তম মহাসাগর কোনটি?",
    options: ["আটলান্টিক মহাসাগর", "ভারত মহাসাগর", "দক্ষিণ মহাসাগর", "প্রশান্ত মহাসাগর"],
    correctIndex: 3,
    subject: "International Affairs"
  },
  {
    id: 12,
    question: "ক্যাঙ্গারু কোন দেশের জাতীয় প্রতীক?",
    options: ["দক্ষিণ আফ্রিকা", "নিউজিল্যান্ড", "অস্ট্রেলিয়া", "কেনিয়া"],
    correctIndex: 2,
    subject: "International Affairs"
  },
  {
    id: 13,
    question: "বিশ্বের ক্ষুদ্রতম দেশ কোনটি?",
    options: ["মোনাকো", "ভ্যাটিকান সিটি", "সান মারিনো", "লিশটেনস্টাইন"],
    correctIndex: 1,
    subject: "International Affairs"
  },
  {
    id: 18,
    question: "বিশ্বের সবচেয়ে উঁচু পর্বতশৃঙ্গ কোনটি?",
    options: ["কে-টু", "কাঞ্চনজঙ্ঘা", "মাউন্ট এভারেস্ট", "লাহোটসে"],
    correctIndex: 2,
    subject: "International Affairs"
  },
  {
    id: 26,
    question: "জাপানের মুদ্রার নাম কী?",
    options: ["ইউয়ান", "ইয়েন", "ডলার", "টাকা"],
    correctIndex: 1,
    subject: "International Affairs"
  },
  {
    id: 28,
    question: "নোবেল পুরস্কার কয়টি ক্ষেত্রে দেওয়া হয়?",
    options: ["৪টি", "৫টি", "৬টি", "৭টি"],
    correctIndex: 2,
    subject: "International Affairs"
  },

  // Geography
  {
    id: 11,
    question: "পৃথিবীর বায়ুমণ্ডলে কোন গ্যাসটি সবচেয়ে বেশি পরিমাণে থাকে?",
    options: ["অক্সিজেন", "কার্বন ডাই অক্সাইড", "নাইট্রোজেন", "হাইড্রোজেন"],
    correctIndex: 2,
    subject: "Geography"
  },
  {
    id: 25,
    question: "পৃথিবীর একমাত্র প্রাকৃতিক উপগ্রহ কোনটি?",
    options: ["সূর্য", "চাঁদ", "মঙ্গল", "টাইটান"],
    correctIndex: 1,
    subject: "Geography"
  },
  {
    id: 29,
    question: "সূর্যের সবচেয়ে নিকটতম গ্রহ কোনটি?",
    options: ["শুক্র", "বুধ", "পৃথিবী", "মঙ্গল"],
    correctIndex: 1,
    subject: "Geography"
  },
  {
    id: 30,
    question: "সুন্দরবন কয়টি জেলা জুড়ে বিস্তৃত?",
    options: ["৩টি", "৪টি", "৫টি", "৬টি"],
    correctIndex: 2,
    subject: "Geography"
  },
  {
    id: 101,
    question: "গ্রিনউইচ মান সময় (GMT) মান মন্দির কোন দেশে অবস্থিত?",
    options: ["যুক্তরাজ্য", "যুক্তরাষ্ট্র", "ফ্রান্স", "জার্মানি"],
    correctIndex: 0,
    subject: "Geography"
  },

  // General Science
  {
    id: 2,
    question: "সৌরজগতের কোন গ্রহকে লাল গ্রহ বলা হয়?",
    options: ["শুক্র", "মঙ্গল", "বৃহস্পতি", "বুধ"],
    correctIndex: 1,
    subject: "General Science"
  },
  {
    id: 5,
    question: "কোন বিজ্ঞানী আপেক্ষিকতার সাধারণ তত্ত্ব প্রস্তাব করেছিলেন?",
    options: ["আইজ্যাক নিউটন", "অ্যালবার্ট আইনস্টাইন", "নিকোলা টেসলা", "স্টিভেন হকিং"],
    correctIndex: 1,
    subject: "General Science"
  },
  {
    id: 8,
    question: "একজন প্রাপ্তবয়স্ক মানুষের শরীরে কয়টি হাড় থাকে?",
    options: ["১০৬", "২০৬", "৩০৬", "৪০৬"],
    correctIndex: 1,
    subject: "General Science"
  },
  {
    id: 17,
    question: "কোন রঙের আলোতে সালোকসংশ্লেষণ সবচেয়ে ভালো হয়?",
    options: ["সবুজ", "নীল", "লাল", "হলুদ"],
    correctIndex: 2,
    subject: "General Science"
  },
  {
    id: 19,
    question: "রক্তের গ্রুপ কয়টি প্রধান শ্রেণীতে বিভক্ত?",
    options: ["২টি", "৪টি", "৬টি", "৮টি"],
    correctIndex: 1,
    subject: "General Science"
  },
  {
    id: 21,
    question: "কোনটি স্তন্যপায়ী প্রাণী নয়?",
    options: ["তিমি", "ডলফিন", "হাঙ্গর", "বাদুড়"],
    correctIndex: 2,
    subject: "General Science"
  },
  {
    id: 22,
    question: "মানুষের রক্তের লোহিত কণিকার আয়ুষ্কাল কত দিন?",
    options: ["৬০ দিন", "৯০ দিন", "১২০ দিন", "১৫০ দিন"],
    correctIndex: 2,
    subject: "General Science"
  },
  {
    id: 24,
    question: "কোন ভিটামিনের অভাবে রাতকানা রোগ হয়?",
    options: ["ভিটামিন এ", "ভিটামিন বি", "ভিটামিন সি", "ভিটামিন ডি"],
    correctIndex: 0,
    subject: "General Science"
  },

  // Technology
  {
    id: 7,
    question: "কম্পিউটারের কোন অংশকে তার 'মস্তিষ্ক' বলা হয়?",
    options: ["র‍্যাম", "হার্ড ড্রাইভ", "গ্রাফিক্স কার্ড", "সিপিইউ"],
    correctIndex: 3,
    subject: "Technology"
  },
  {
    id: 15,
    question: "শূন্যস্থানে আলোর গতিবেগ কত?",
    options: ["~১,৫০,০০০ কিমি/সেকেন্ড", "~৩,০০,০০০ কিমি/সেকেন্ড", "~৪,৫০,০০০ কিমি/সেকেন্ড", "~৬,০০,০০০ কিমি/সেকেন্ড"],
    correctIndex: 1,
    subject: "Technology"
  },
  {
    id: 201,
    question: "ইন্টারনেটের প্রোটোকল HTTP-এর পূর্ণরূপ কী?",
    options: ["Hypertext Transfer Protocol", "High Text Transfer Path", "Hyper Terminal Tracking Protocol", "Hypertext Translation Program"],
    correctIndex: 0,
    subject: "Technology"
  },
  {
    id: 202,
    question: "কম্পিউটারের অস্থায়ী মেমোরি (RAM)-এর পূর্ণরূপ কী?",
    options: ["Random Access Memory", "Read Access Memory", "Rapid Action Memory", "Real Access Module"],
    correctIndex: 0,
    subject: "Technology"
  },

  // Mental Ability
  {
    id: 301,
    question: "২, ৪, ৮, ১৬, ... ধারাটির পরবর্তী সংখ্যাটি কত?",
    options: ["২৪", "২৮", "৩২", "৩৬"],
    correctIndex: 2,
    subject: "Mental Ability"
  },
  {
    id: 302,
    question: "ঘড়িতে যখন ৩:০০ টা বাজে, তখন ঘণ্টার কাঁটা ও মিনিটের কাঁটার মধ্যবর্তী কোণ কত ডিগ্রি?",
    options: ["৪৫°", "৬০°", "৯০°", "১২০°"],
    correctIndex: 2,
    subject: "Mental Ability"
  },
  {
    id: 303,
    question: "গতকাল যদি বৃহস্পতিবার হয়ে থাকে, তবে আগামীকালের পরের দিন কী বার হবে?",
    options: ["শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার"],
    correctIndex: 2,
    subject: "Mental Ability"
  },
  {
    id: 304,
    question: "পিতা ও পুত্রের বর্তমান বয়সের সমষ্টি ৫০ বছর। ৫ বছর পর তাদের বয়সের সমষ্টি কত হবে?",
    options: ["৫৫ বছর", "৬০ বছর", "৬৫ বছর", "৭০ বছর"],
    correctIndex: 1,
    subject: "Mental Ability"
  },

  // Physics
  {
    id: 401,
    question: "পদার্থের চতুর্থ অবস্থা কোনটি?",
    options: ["কঠিন", "তরল", "প্লাজমা", "গ্যাসীয়"],
    correctIndex: 2,
    subject: "Physics",
    explanation: "পদার্থের চতুর্থ অবস্থা হলো প্লাজমা, যা অতি উচ্চ তাপমাত্রায় আয়নিত গ্যাসীয় অবস্থা।"
  },
  {
    id: 402,
    question: "শব্দ সবচেয়ে দ্রুত চলে কোন মাধ্যমে?",
    options: ["বায়বীয় মাধ্যমে", "তরল মাধ্যমে", "কঠিন মাধ্যমে", "শূন্য মাধ্যমে"],
    correctIndex: 2,
    subject: "Physics",
    explanation: "শব্দ সঞ্চালনের জন্য মাধ্যম প্রয়োজন এবং কঠিন মাধ্যমে অণুগুলো কাছাকাছি থাকায় শব্দের বেগ সবচেয়ে বেশি।"
  },
  {
    id: 403,
    question: "সূর্য থেকে পৃথিবীতে আলো আসতে কত সময় লাগে?",
    options: ["৮ মিনিট ২০ সেকেন্ড", "৬ মিনিট ৩০ সেকেন্ড", "১০ মিনিট ১৫ সেকেন্ড", "৫ মিনিট"],
    correctIndex: 0,
    subject: "Physics",
    explanation: "সূর্য থেকে পৃথিবীতে আলো আসতে গড়ে প্রায় ৮ মিনিট ২০ সেকেন্ড (বা ৫০০ সেকেন্ড) সময় লাগে।"
  },
  {
    id: 404,
    question: "বৈদ্যুতিক বাতির ফিলামেন্ট তৈরিতে কোন ধাতু ব্যবহৃত হয়?",
    options: ["তামা", "টাংস্টেন", "লোহা", "অ্যালুমিনিয়াম"],
    correctIndex: 1,
    subject: "Physics",
    explanation: "টাংস্টেনের গলনাঙ্ক অত্যধিক উচ্চ (প্রায় ৩৪২২°C) হওয়ায় এটি ফিলামেন্ট হিসেবে ব্যবহৃত হয়।"
  },

  // Chemistry
  {
    id: 501,
    question: "সবচেয়ে হালকা গ্যাস কোনটি?",
    options: ["নাইট্রোজেন", "অক্সিজেন", "হাইড্রোজেন", "হিলিয়াম"],
    correctIndex: 2,
    subject: "Chemistry",
    explanation: "পর্যায় সারণির প্রথম মৌল হাইড্রোজেন হলো মহাবিশ্ব ও প্রকৃতির সবচেয়ে হালকা গ্যাস।"
  },
  {
    id: 502,
    question: "লেবুর রসে কোন এসিড থাকে?",
    options: ["অক্সালিক এসিড", "ম্যালিক এসিড", "সাইট্রিক এসিড", "টারটারিক এসিড"],
    correctIndex: 2,
    subject: "Chemistry",
    explanation: "লেবু ও টকজাতীয় ফলে প্রচুর পরিমাণে সাইট্রিক এসিড উপস্থিত থাকে।"
  },
  {
    id: 503,
    question: "খাবার লবণের সঠিক রাসায়নিক সংকেত কোনটি?",
    options: ["NaCl", "KCl", "CaCl2", "MgCl2"],
    correctIndex: 0,
    subject: "Chemistry",
    explanation: "খাবার লবণের রাসায়নিক নাম সোডিয়াম ক্লোরাইড এবং সংকেত NaCl।"
  },
  {
    id: 504,
    question: "কোন ধাতুকে কেরোসিনের নিচে সংরক্ষণ করা হয়?",
    options: ["ম্যাগনেসিয়াম", "সোডিয়াম", "ক্যালসিয়াম", "অ্যালুমিনিয়াম"],
    correctIndex: 1,
    subject: "Chemistry",
    explanation: "সোডিয়াম অত্যন্ত সক্রিয় ক্ষার ধাতু যা খোলা বাতাসে আর্দ্রতার সাথে তীব্র বিক্রিয়া করে, তাই কেরোসিনে রাখা হয়।"
  },

  // Biology
  {
    id: 601,
    question: "উদ্ভিদের খাদ্য তৈরির প্রধান প্রক্রিয়ার নাম কী?",
    options: ["শ্বসন", "সালোকসংশ্লেষণ", "প্রস্বেদন", "অভিস্রবণ"],
    correctIndex: 1,
    subject: "Biology",
    explanation: "সবুজ উদ্ভিদ সূর্যালোক ও ক্লোরোফিলের সহায়তায় সালোকসংশ্লেষণ প্রক্রিয়ায় শর্করা জাতীয় খাদ্য তৈরি করে।"
  },
  {
    id: 602,
    question: "মানুষের হৃৎপিণ্ড কয়টি প্রকোষ্ঠে বিভক্ত?",
    options: ["২টি", "৩টি", "৪টি", "৫টি"],
    correctIndex: 2,
    subject: "Biology",
    explanation: "মানুষের হৃৎপিণ্ডে দুটি অলিন্দ এবং দুটি নিলয় নিয়ে মোট ৪টি প্রকোষ্ঠ রয়েছে।"
  },
  {
    id: 603,
    question: "মানবদেহের বৃহত্তম অভ্যন্তরীণ গ্রন্থি কোনটি?",
    options: ["অগ্ন্যাশয়", "যকৃত (Liver)", "থাইরয়েড", "পিটুইটারি"],
    correctIndex: 1,
    subject: "Biology",
    explanation: "যকৃত (লিভার) মানবদেহের সবচেয়ে বড় অভ্যন্তরীণ অঙ্গ ও প্রধান রাসায়নিক কারখানা বা গ্রন্থি।"
  },
  {
    id: 604,
    question: "কোষের 'পাওয়ার হাউস' বা শক্তিঘর বলা হয় কাকে?",
    options: ["রাইবোসোম", "গলগি বডি", "মাইটোকন্ড্রিয়া", "লাইসোজোম"],
    correctIndex: 2,
    subject: "Biology",
    explanation: "কোষের যাবতীয় জৈবনিক কাজের শক্তি (ATP) মাইটোকন্ড্রিয়ায় উৎপাদিত হয় বলে একে শক্তিঘর বলা হয়।"
  },
  // General Knowledge(GK)
  {
    id: 701,
    question: "জাতিসংঘের বর্তমান সদর দপ্তর কোথায় অবস্থিত?",
    options: ["জেনেভা", "নিউইয়র্ক", "লন্ডন", "প্যারিস"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "জাতিসংঘের মূল সদর দপ্তর মার্কিন যুক্তরাষ্ট্রের নিউইয়র্ক শহরের ম্যানহাটনে অবস্থিত।"
  },
  {
    id: 702,
    question: "বিশ্বের সবচেয়ে দীর্ঘতম নদী কোনটি?",
    options: ["আমাজন", "নীলনদ", "মিসিসিপি", "ইয়াংসি"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "নীলনদ হলো বিশ্বের দীর্ঘতম নদী, যার দৈর্ঘ্য প্রায় ৬,৬৫০ কিলোমিটার।"
  },
  {
    id: 703,
    question: "শান্তিতে নোবেল পুরস্কার কোন দেশ থেকে প্রদান করা হয়?",
    options: ["সুইডেন", "নরওয়ে", "সুইজারল্যান্ড", "যুক্তরাজ্য"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "শান্তিতে নোবেল পুরস্কার নরওয়ের অসলো থেকে এবং বাকি ৫টি পুরস্কার সুইডেনের স্টকহোম থেকে দেওয়া হয়।"
  },
  {
    id: 704,
    question: "আন্তর্জাতিক রেড ক্রস কমিটির (ICRC) সদর দপ্তর কোথায় অবস্থিত?",
    options: ["রোম", "জেনেভা", "ভিয়েনা", "ব্রাসেলস"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "আইসিআরসি-এর সদর দপ্তর সুইজারল্যান্ডের জেনেভা শহরে অবস্থিত।"
  },
  {
    id: 705,
    question: "বিশ্ব স্বাস্থ্য সংস্থা (WHO) কত সালে প্রতিষ্ঠিত হয়?",
    options: ["১৯৪৫", "১৯৪৮", "১৯৫০", "১৯৫২"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "১৯৪৮ সালের ৭ এপ্রিল বিশ্ব স্বাস্থ্য সংস্থা প্রতিষ্ঠিত হয়। প্রতিবছর এই দিনটি বিশ্ব স্বাস্থ্য দিবস হিসেবে পালিত হয়।"
  },
  {
    id: 706,
    question: "বিশ্বের বৃহত্তম মরুভূমি কোনটি?",
    options: ["গোবি মরুভূমি", "সাহারা মরুভূমি", "কালাহারি মরুভূমি", "থর মরুভূমি"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "আফ্রিকা মহাদেশের উত্তরাংশে অবস্থিত সাহারা মরুভূমি হলো পৃথিবীর বৃহত্তম উষ্ণ মরুভূমি।"
  },
  {
    id: 707,
    question: "অলিম্পিক গেমসের প্রতীকে কয়টি বলয় বা রিং থাকে?",
    options: ["৪টি", "৫টি", "৬টি", "৭টি"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "অলিম্পিকের পতাকায় ৫টি মহাদেশকে প্রতিনিধিত্বকারী ৫টি রঙের বলয় যুক্ত থাকে।"
  },
  {
    id: 708,
    question: "পৃথিবীর সবচেয়ে গভীরতম মহাসাগর কোনটি?",
    options: ["আটলান্টিক মহাসাগর", "ভারত মহাসাগর", "প্রশান্ত মহাসাগর", "উত্তর মহাসাগর"],
    correctIndex: 2,
    subject: "General Knowledge(GK)",
    explanation: "প্রশান্ত মহাসাগর বিশ্বের বৃহত্তম ও গভীরতম মহাসাগর, যার মারিয়ানা খাতের গভীরতা প্রায় ১১,০৩৪ মিটার।"
  },
  {
    id: 709,
    question: "আন্তর্জাতিক বিচার আদালত (ICJ) কোথায় অবস্থিত?",
    options: ["প্যারিস", "দ্য হেগ", "জেনেভা", "নিউইয়র্ক"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "আন্তর্জাতিক আদালত নেদারল্যান্ডসের দ্য হেগ শহরের পিস প্যালেসে অবস্থিত।"
  },
  {
    id: 710,
    question: "সূর্যোদয়ের দেশ বলা হয় কোন দেশকে?",
    options: ["নরওয়ে", "জাপান", "চীন", "ফিনল্যান্ড"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "জাপানকে সূর্যোদয়ের দেশ বা Land of the Rising Sun বলা হয়।"
  },
  {
    id: 711,
    question: "আন্তর্জাতিক নারী দিবস প্রতি বছর কত তারিখে উদযাপিত হয়?",
    options: ["২১ ফেব্রুয়ারি", "৮ মার্চ", "১ মে", "৫ জুন"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "প্রতি বছর ৮ মার্চ আন্তর্জাতিক নারী দিবস হিসেবে পালিত হয়।"
  },
  {
    id: 712,
    question: "বিশ্ব পরিবেশ দিবস কোন তারিখে পালিত হয়?",
    options: ["৫ জুন", "৭ এপ্রিল", "১ ডিসেম্বর", "১৬ সেপ্টেম্বর"],
    correctIndex: 0,
    subject: "General Knowledge(GK)",
    explanation: "পরিবেশ সচেতনতা বৃদ্ধির লক্ষ্যে প্রতি বছর ৫ জুন বিশ্ব পরিবেশ দিবস পালিত হয়।"
  },
  {
    id: 713,
    question: "সার্ক (SAARC)-এর স্থায়ী সচিবালয় কোথায় অবস্থিত?",
    options: ["ঢাকা", "কাঠমান্ডু", "নয়াদিল্লি", "কলম্বো"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "সার্কের সচিবালয় নেপালের রাজধানী কাঠমান্ডুতে অবস্থিত।"
  },
  {
    id: 714,
    question: "ইউরোপীয় ইউনিয়নের একক মুদ্রা 'ইউরো' কত সালে চালু হয়?",
    options: ["১৯৯৫", "১৯৯৯", "২০০১", "২০০৪"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "১৯৯৯ সালের ১ জানুয়ারি ইউরোপের দেশগুলোতে ব্যাংক লেনদেনে ইউরো আনুষ্ঠানিকভাবে চালু হয়।"
  },
  {
    id: 715,
    question: "জাতিসংঘের নিরাপত্তা পরিষদের স্থায়ী সদস্য দেশ কয়টি?",
    options: ["৩টি", "৫টি", "১০টি", "১৫টি"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "নিরাপত্তা পরিষদের ৫টি স্থায়ী সদস্য দেশ হলো: যুক্তরাষ্ট্র, যুক্তরাজ্য, ফ্রান্স, রাশিয়া ও চীন।"
  },
  {
    id: 716,
    question: "বিশ্বের বৃহত্তম দ্বীপ কোনটি?",
    options: ["মাদাগাস্কার", "গ্রিনল্যান্ড", "সুমাত্রা", "বোর্নিও"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "উত্তর আটলান্টিক মহাসাগরে অবস্থিত গ্রিনল্যান্ড পৃথিবীর বৃহত্তম দ্বীপ।"
  },
  {
    id: 717,
    question: "মানুষের শরীরে স্বাভাবিক ক্রোমোজোমের সংখ্যা কতটি?",
    options: ["২৩টি", "৪৬টি", "৪৮টি", "৪৪টি"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "মানুষের প্রতিটি কোষে ২৩ জোড়া বা মোট ৪৬টি ক্রোমোজোম থাকে।"
  },
  {
    id: 718,
    question: "আন্তর্জাতিক সাক্ষরতা দিবস কত তারিখে পালিত হয়?",
    options: ["৮ সেপ্টেম্বর", "৫ অক্টোবর", "১০ ডিসেম্বর", "২১ ফেব্রুয়ারি"],
    correctIndex: 0,
    subject: "General Knowledge(GK)",
    explanation: "ইউনেস্কোর উদ্যোগে প্রতি বছর ৮ সেপ্টেম্বর আন্তর্জাতিক সাক্ষরতা দিবস উদযাপিত হয়।"
  },
  {
    id: 719,
    question: "এশিয়ার দীর্ঘতম নদীর নাম কি?",
    options: ["গঙ্গা", "ইয়াংসি", "সিন্ধু", "মেকং"],
    correctIndex: 1,
    subject: "General Knowledge(GK)",
    explanation: "চীনের মধ্য দিয়ে প্রবাহিত ইয়াংসি নদী এশিয়ার দীর্ঘতম এবং বিশ্বের তৃতীয় দীর্ঘতম নদী।"
  },
  {
    id: 720,
    question: "বিশ্বের বৃহত্তম প্রবাল প্রাচীর 'গ্রেট ব্যারিয়ার রিফ' কোথায় অবস্থিত?",
    options: ["মালদ্বীপ", "ইন্দোনেশিয়া", "অস্ট্রেলিয়া", "ফিলিপাইন"],
    correctIndex: 2,
    subject: "General Knowledge(GK)",
    explanation: "অস্ট্রেলিয়ার উত্তর-পূর্ব উপকূলে কোরাল সাগরে অবস্থিত গ্রেট ব্যারিয়ার রিফ পৃথিবীর সর্ববৃহৎ প্রবাল প্রাচীর।"
  },
  // Recent & Updated
  {
    id: 726,
    question: "পদ্মা বহুমুখী সেতুর মূল দৈর্ঘ্য কত কিলোমিটার?",
    options: ["৫.৮০ কিমি", "৬.১৫ কিমি", "৬.৫০ কিমি", "৭.০০ কিমি"],
    correctIndex: 1,
    subject: "Recent & Updated",
    explanation: "পদ্মা সেতুর মূল দৈর্ঘ্য ৬.১৫ কিলোমিটার এবং মোট স্প্যান সংখ্যা ৪১টি।"
  },
  {
    id: 727,
    question: "বঙ্গবন্ধু শেখ মুজিবুর রহমান টানেল কোন নদীর তলদেশে নির্মিত?",
    options: ["পদ্মা", "মেঘনা", "কর্ণফুলী", "যমুনা"],
    correctIndex: 2,
    subject: "Recent & Updated",
    explanation: "কর্ণফুলী নদীর তলদেশে নির্মিত এটি দক্ষিণ এশিয়ার প্রথম নদীগর্ভ টানেল।"
  },
  {
    id: 728,
    question: "বাংলাদেশের প্রথম পারমাণবিক বিদ্যুৎ কেন্দ্র কোথায় অবস্থিত?",
    options: ["রামপাল, বাগেরহাট", "রূপপুর, পাবনা", "মাতারবাড়ী, কক্সবাজার", "পায়রা, পটুয়াখালী"],
    correctIndex: 1,
    subject: "Recent & Updated",
    explanation: "পাবনা জেলার ঈশ্বরদী উপজেলার রূপপুরে বাংলাদেশের প্রথম পারমাণবিক বিদ্যুৎ কেন্দ্র স্থাপিত হচ্ছে।"
  },
  {
    id: 729,
    question: "বাংলাদেশের প্রথম মেট্রোরেলের (MRT-6) বাণিজ্যিক যাত্রা কত তারিখে শুরু হয়?",
    options: ["১৬ ডিসেম্বর ২০২২", "২৮ ডিসেম্বর ২০২২", "২৯ ডিসেম্বর ২০২২", "১ জানুয়ারি ২০২৩"],
    correctIndex: 2,
    subject: "Recent & Updated",
    explanation: "২৮ ডিসেম্বর ২০২২ উদ্বোধন হয় এবং ২৯ ডিসেম্বর ২০২২ থেকে জনসাধারণের জন্য বাণিজ্যিক চলাচল শুরু হয়।"
  }
];
