export interface FishSymptom {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
}

export interface FishTreatment {
  symptomId: string;
  medicineName: string;
  medicineNameEn: string;
  medicineImage: string;
  description: string;
  dosage: string;
  duration: string;
  precautions: string[];
  externalLink: string;
}

export const fishSymptoms: FishSymptom[] = [
  {
    id: 'fin-rot',
    name: 'ফিন রট (পাখনা পচা)',
    nameEn: 'Fin Rot',
    description: 'পাখনার কিনারা সাদা বা লাল হয়ে যায়, ধীরে ধীরে ক্ষয় হতে থাকে',
    icon: '🩹',
  },
  {
    id: 'white-spot',
    name: 'সাদা দাগ (Ich)',
    nameEn: 'White Spot / Ich',
    description: 'শরীরে ছোট ছোট সাদা দানার মতো দাগ দেখা যায়, মাছ গা চুলকায়',
    icon: '⚪',
  },
  {
    id: 'fungal',
    name: 'ছত্রাক সংক্রমণ',
    nameEn: 'Fungal Infection',
    description: 'শরীরে তুলার মতো সাদা বা ধূসর আবরণ দেখা যায়',
    icon: '🍄',
  },
  {
    id: 'appetite-loss',
    name: 'খাদ্যে অরুচি',
    nameEn: 'Loss of Appetite',
    description: 'মাছ খাবার খেতে চায় না, নিষ্ক্রিয় থাকে',
    icon: '🍽️',
  },
  {
    id: 'swim-bladder',
    name: 'সাঁতার সমস্যা',
    nameEn: 'Swim Bladder Disease',
    description: 'মাছ উল্টো সাঁতার কাটে বা ভাসতে সমস্যা হয়',
    icon: '🔄',
  },
  {
    id: 'dropsy',
    name: 'ড্রপসি (পেট ফোলা)',
    nameEn: 'Dropsy',
    description: 'পেট অস্বাভাবিকভাবে ফুলে যায়, আঁশ উঠে যায়',
    icon: '🎈',
  },
  {
    id: 'gill-disease',
    name: 'ফুলকা রোগ',
    nameEn: 'Gill Disease',
    description: 'মাছ দ্রুত শ্বাস নেয়, ফুলকা লাল বা ফ্যাকাশে হয়ে যায়',
    icon: '🫁',
  },
  {
    id: 'tail-rot',
    name: 'লেজ পচা',
    nameEn: 'Tail Rot',
    description: 'লেজের অংশ ক্ষয় হতে থাকে ও রং ফ্যাকাশে হয়',
    icon: '🐠',
  },
];

export const fishTreatments: FishTreatment[] = [
  {
    symptomId: 'fin-rot',
    medicineName: 'ফিন রট কিউর',
    medicineNameEn: 'Fin Rot Cure',
    medicineImage: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=400&h=400&fit=crop',
    description: 'ব্যাকটেরিয়া প্রতিরোধী ঔষধ যা পাখনা পচা রোগ দ্রুত সারিয়ে তোলে। নিয়মিত ব্যবহারে পাখনা পুনরায় বৃদ্ধি পায়।',
    dosage: 'প্রতি ১০ লিটার পানিতে ৫ মিলি',
    duration: '৫-৭ দিন প্রতিদিন',
    precautions: [
      'চিকিৎসার সময় খাবার কম দিন',
      'পানি পরিবর্তনের পর পুনরায় ডোজ দিন',
      'সরাসরি সূর্যালোক থেকে দূরে রাখুন',
    ],
    externalLink: 'https://fishcare.com.bd/fin-rot-cure',
  },
  {
    symptomId: 'white-spot',
    medicineName: 'হোয়াইট স্পট ট্রিটমেন্ট',
    medicineNameEn: 'White Spot Treatment',
    medicineImage: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&h=400&fit=crop',
    description: 'ইচ (Ich) পরজীবী দূর করে এবং পুনরায় সংক্রমণ প্রতিরোধ করে। পানির তাপমাত্রা সামান্য বাড়ালে আরও কার্যকর।',
    dosage: 'প্রতি ২০ লিটার পানিতে ১০ মিলি',
    duration: '১০-১৪ দিন, প্রতি ৩ দিন পর পর',
    precautions: [
      'পানির তাপমাত্রা ২৮-৩০°C রাখুন',
      'এয়ারেশন বাড়ান',
      'কার্বন ফিল্টার বন্ধ রাখুন',
    ],
    externalLink: 'https://fishcare.com.bd/white-spot-treatment',
  },
  {
    symptomId: 'fungal',
    medicineName: 'অ্যান্টি-ফাঙ্গাল সলিউশন',
    medicineNameEn: 'Anti-Fungal Solution',
    medicineImage: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop',
    description: 'ছত্রাক সংক্রমণ দ্রুত নিরাময় করে। ডিম ও পোনা মাছের জন্যও নিরাপদ।',
    dosage: 'প্রতি ১৫ লিটার পানিতে ৫ মিলি',
    duration: '৭ দিন প্রতিদিন',
    precautions: [
      'আক্রান্ত মাছকে আলাদা করুন',
      'পানির গুণমান ভালো রাখুন',
      'অতিরিক্ত খাবার দেবেন না',
    ],
    externalLink: 'https://fishcare.com.bd/anti-fungal',
  },
  {
    symptomId: 'appetite-loss',
    medicineName: 'স্ট্রেস কোট ও ভিটামিন',
    medicineNameEn: 'Stress Coat & Vitamins',
    medicineImage: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=400&fit=crop',
    description: 'মাছের স্ট্রেস কমায় এবং রোগ প্রতিরোধ ক্ষমতা বাড়ায়। ক্ষুধা ফিরিয়ে আনতে সাহায্য করে।',
    dosage: 'প্রতি ১০ লিটার পানিতে ৩ মিলি',
    duration: '৩-৫ দিন',
    precautions: [
      'পানির গুণমান পরীক্ষা করুন',
      'অ্যামোনিয়া ও নাইট্রাইট চেক করুন',
      'বিভিন্ন ধরনের খাবার দিয়ে দেখুন',
    ],
    externalLink: 'https://fishcare.com.bd/stress-coat',
  },
  {
    symptomId: 'swim-bladder',
    medicineName: 'সুইম ব্লাডার ট্রিটমেন্ট',
    medicineNameEn: 'Swim Bladder Treatment',
    medicineImage: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=400&fit=crop',
    description: 'সাঁতার থলির সমস্যা সমাধানে কার্যকর। হজম উন্নত করে এবং ফোলাভাব কমায়।',
    dosage: 'প্রতি ১০ লিটার পানিতে ৫ মিলি',
    duration: '৫-৭ দিন',
    precautions: [
      '২-৩ দিন খাবার বন্ধ রাখুন',
      'মটরশুটি (খোসা ছাড়া) খাওয়ান',
      'পানির তাপমাত্রা সামান্য বাড়ান',
    ],
    externalLink: 'https://fishcare.com.bd/swim-bladder',
  },
  {
    symptomId: 'dropsy',
    medicineName: 'ড্রপসি কিউর অ্যান্টিবায়োটিক',
    medicineNameEn: 'Dropsy Cure Antibiotic',
    medicineImage: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=400&h=400&fit=crop',
    description: 'ব্যাকটেরিয়া সংক্রমণজনিত ড্রপসি চিকিৎসায় শক্তিশালী অ্যান্টিবায়োটিক। প্রাথমিক পর্যায়ে কার্যকর।',
    dosage: 'প্রতি ২০ লিটার পানিতে ১০ মিলি',
    duration: '১০-১৪ দিন',
    precautions: [
      'আক্রান্ত মাছকে অবশ্যই আলাদা করুন',
      'পানি প্রতিদিন ২৫% পরিবর্তন করুন',
      'এপসম সল্ট যোগ করতে পারেন',
    ],
    externalLink: 'https://fishcare.com.bd/dropsy-cure',
  },
  {
    symptomId: 'gill-disease',
    medicineName: 'গিল ট্রিটমেন্ট সলিউশন',
    medicineNameEn: 'Gill Treatment Solution',
    medicineImage: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&h=400&fit=crop',
    description: 'ফুলকার ব্যাকটেরিয়া ও পরজীবী সংক্রমণ দূর করে। শ্বাসকষ্ট দ্রুত কমায়।',
    dosage: 'প্রতি ১৫ লিটার পানিতে ৭ মিলি',
    duration: '৭-১০ দিন',
    precautions: [
      'এয়ারেশন সর্বোচ্চ করুন',
      'পানির অক্সিজেন লেভেল চেক করুন',
      'অ্যামোনিয়া নিয়ন্ত্রণে রাখুন',
    ],
    externalLink: 'https://fishcare.com.bd/gill-treatment',
  },
  {
    symptomId: 'tail-rot',
    medicineName: 'টেইল রট অ্যান্টিব্যাকটেরিয়াল',
    medicineNameEn: 'Tail Rot Antibacterial',
    medicineImage: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop',
    description: 'লেজ পচা রোগের কার্যকর চিকিৎসা। ক্ষয়প্রাপ্ত অংশ পুনরায় বৃদ্ধি পায়।',
    dosage: 'প্রতি ১০ লিটার পানিতে ৫ মিলি',
    duration: '৭-১০ দিন',
    precautions: [
      'পানির গুণমান উন্নত করুন',
      'আক্রমণাত্মক মাছ আলাদা করুন',
      'সংক্রমণ ছড়ানো রোধে সতর্ক থাকুন',
    ],
    externalLink: 'https://fishcare.com.bd/tail-rot',
  },
];
