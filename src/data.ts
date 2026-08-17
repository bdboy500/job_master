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
  "Bangladesh Affairs",
  "International Affairs",
  "Geography",
  "General Science",
  "Technology",
  "Mental Ability",
  "Physics",
  "Chemistry",
  "Biology"
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
  }
];
